// Recibe los avisos de Stripe y activa el plan de la pareja cuando el pago se ha completado.
// Secretos necesarios en Supabase (Edge Functions → Secrets):
//   STRIPE_WEBHOOK_SECRET       → el "Signing secret" del webhook en Stripe, modo real (empieza por whsec_)
//   STRIPE_WEBHOOK_SECRET_TEST  → (opcional) el del webhook en modo de prueba, para las compras de prueba
//   RESEND_API_KEY              → (opcional) para mandar por email la tarjeta regalo a quien la compra
//   RESEND_FROM                 → (opcional) remitente, p. ej. "Tu Boda en Orden <hola@tubodaenorden.com>"
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase automáticamente.
import { createClient } from "npm:@supabase/supabase-js@2";

const WEBHOOK_SECRETS = [Deno.env.get("STRIPE_WEBHOOK_SECRET"), Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST")].filter(
  (s): s is string => !!s,
);
// Importes válidos del plan, en céntimos: 37 € normal y 27 € de oferta.
const VALID_AMOUNTS = [3700, 2700];
const TOLERANCE_SECONDS = 300;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Comprueba que el aviso viene de verdad de Stripe (firma HMAC-SHA256).
async function isValidSignature(payload: string, header: string | null) {
  if (!header) return false;
  for (const secret of WEBHOOK_SECRETS) {
    if (await isValidSignatureFor(payload, header, secret)) return true;
  }
  return false;
}

async function isValidSignatureFor(payload: string, header: string, secret: string) {
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const timestamp = parts.find(([k]) => k === "t")?.[1];
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = toHex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)),
  );
  return signatures.some((s) => safeEqual(s, expected));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const payload = await req.text();
  if (!(await isValidSignature(payload, req.headers.get("stripe-signature")))) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(payload);

  // Devolución completa o disputa perdida: se vuelve a bloquear el plan.
  if (event.type === "charge.refunded" || event.type === "charge.dispute.closed") {
    return await lockOnRefund(event);
  }

  const handled = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  if (!handled.includes(event.type)) return Response.json({ received: true });

  const session = event.data.object;
  if (session.payment_status !== "paid") return Response.json({ received: true, pending: true });

  // Solo se activa con un pago completo del plan: 37 € o 27 € (oferta), en euros.
  if (session.currency !== "eur" || !VALID_AMOUNTS.includes(session.amount_total)) {
    console.error("Importe no válido, no se activa", session.id, session.amount_total, session.currency);
    return Response.json({ received: true, warning: "unexpected amount" });
  }

  // Tarjeta regalo: se guarda el código (que viene en los metadatos) y se manda por email.
  if (session.metadata?.tipo === "regalo") return await saveGift(session);

  const userId: string | null = session.client_reference_id ?? null;
  if (!userId) {
    console.error("Pago sin client_reference_id", session.id);
    return Response.json({ received: true, warning: "missing client_reference_id" });
  }

  const { data, error } = await supabase
    .from("weddings")
    .update({
      plan_active: true,
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("id");

  if (error || !data?.length) {
    console.error("No se pudo activar el plan", userId, session.id, error);
    // Respondemos con error para que Stripe vuelva a intentarlo más tarde.
    return new Response("Could not activate plan", { status: 500 });
  }

  console.log("Plan activado", userId, session.id);
  return Response.json({ received: true });
});

// deno-lint-ignore no-explicit-any
async function lockOnRefund(event: any) {
  const obj = event.data.object;
  let paymentIntent: string | null = null;

  if (event.type === "charge.refunded") {
    // Solo devoluciones completas (una parcial no quita el plan).
    const full = obj.refunded === true || (obj.amount_refunded ?? 0) >= (obj.amount ?? Infinity);
    if (!full) return Response.json({ received: true, partial: true });
    paymentIntent = obj.payment_intent ?? null;
  } else {
    // charge.dispute.closed: solo si la disputa se ha perdido.
    if (obj.status !== "lost") return Response.json({ received: true, dispute: obj.status });
    paymentIntent = obj.payment_intent ?? null;
  }
  if (!paymentIntent) return Response.json({ received: true, warning: "missing payment_intent" });

  // Si era una tarjeta regalo, el código deja de valer (y si ya se canjeó, se bloquea esa boda abajo).
  await supabase.from("gift_codes").update({ voided_at: new Date().toISOString() }).eq("stripe_payment_intent", paymentIntent);

  const { data, error } = await supabase
    .from("weddings")
    .update({ plan_active: false, updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent", paymentIntent)
    .select("id");

  if (error) {
    console.error("No se pudo bloquear el plan", paymentIntent, error);
    return new Response("Could not lock plan", { status: 500 });
  }
  console.log("Plan bloqueado por", event.type, paymentIntent, data?.length ?? 0);
  return Response.json({ received: true, locked: data?.length ?? 0 });
}

// deno-lint-ignore no-explicit-any
async function saveGift(session: any) {
  const m = session.metadata ?? {};
  const code = String(m.codigo ?? "");
  if (!/^BODA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    console.error("Regalo sin código válido", session.id);
    return Response.json({ received: true, warning: "missing gift code" });
  }
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 12);
  const buyerEmail: string | null = session.customer_details?.email ?? session.customer_email ?? null;

  const { error } = await supabase.from("gift_codes").upsert(
    {
      code,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent ?? null,
      buyer_email: buyerEmail,
      from_name: String(m.de ?? "").slice(0, 60),
      to_name: String(m.para ?? "").slice(0, 60),
      message: String(m.mensaje ?? "").slice(0, 300),
      amount: session.amount_total,
      expires_at: expires.toISOString(),
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("No se pudo guardar el regalo", session.id, error);
    return new Response("Could not save gift", { status: 500 });
  }
  console.log("Regalo creado", code, session.id);
  if (buyerEmail) await sendGiftEmail(buyerEmail, code, m, expires).catch((e) => console.error("Email regalo", e));
  return Response.json({ received: true, gift: true });
}

const GIFT_EMAIL: Record<string, { subject: string; hi: string; intro: string; link: string; code: string; until: string; tip: string }> = {
  es: {
    subject: "Tu tarjeta regalo de Tu Boda en Orden",
    hi: "¡Gracias por tu regalo!",
    intro: "Aquí tienes la tarjeta para {to}. Pásale este enlace (por WhatsApp, por email o impreso) y podrá activar el plan completo:",
    link: "Abrir el regalo",
    code: "Código",
    until: "Válida hasta el {date}. Se puede usar una sola vez.",
    tip: "Desde el enlace también puedes descargar la tarjeta como imagen para imprimirla.",
  },
  en: {
    subject: "Your Tu Boda en Orden gift card",
    hi: "Thank you for your gift!",
    intro: "Here is the card for {to}. Send them this link (by WhatsApp, email or printed) to activate the full plan:",
    link: "Open the gift",
    code: "Code",
    until: "Valid until {date}. It can be used once.",
    tip: "From the link you can also download the card as an image to print it.",
  },
  it: {
    subject: "La tua carta regalo di Tu Boda en Orden",
    hi: "Grazie per il tuo regalo!",
    intro: "Ecco la carta per {to}. Mandale questo link (su WhatsApp, per email o stampato) per attivare il piano completo:",
    link: "Apri il regalo",
    code: "Codice",
    until: "Valida fino al {date}. Si può usare una sola volta.",
    tip: "Dal link puoi anche scaricare la carta come immagine per stamparla.",
  },
  fr: {
    subject: "Ta carte cadeau Tu Boda en Orden",
    hi: "Merci pour ton cadeau !",
    intro: "Voici la carte pour {to}. Envoie-lui ce lien (par WhatsApp, e-mail ou imprimé) pour activer le plan complet :",
    link: "Ouvrir le cadeau",
    code: "Code",
    until: "Valable jusqu'au {date}. Utilisable une seule fois.",
    tip: "Depuis le lien, tu peux aussi télécharger la carte en image pour l'imprimer.",
  },
  pt: {
    subject: "O teu cartão-oferta Tu Boda en Orden",
    hi: "Obrigado pela tua oferta!",
    intro: "Aqui tens o cartão para {to}. Envia-lhe este link (por WhatsApp, email ou impresso) para ativar o plano completo:",
    link: "Abrir a oferta",
    code: "Código",
    until: "Válido até {date}. Só pode ser usado uma vez.",
    tip: "A partir do link também podes descarregar o cartão como imagem para o imprimir.",
  },
};

// deno-lint-ignore no-explicit-any
async function sendGiftEmail(to: string, code: string, m: any, expires: Date) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;
  const from = Deno.env.get("RESEND_FROM") ?? "Tu Boda en Orden <hola@tubodaenorden.com>";
  const lang = GIFT_EMAIL[m.idioma] ? m.idioma : "es";
  const t = GIFT_EMAIL[lang];
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const link = `https://tubodaenorden.com/regalo/${code}`;
  const date = expires.toLocaleDateString(lang === "pt" ? "pt-PT" : lang, { day: "numeric", month: "long", year: "numeric" });
  const html = `<div style="background:#f8f2e4;padding:32px 16px;font-family:Georgia,serif;color:#2b2420">
  <div style="max-width:520px;margin:0 auto;background:#fffaf1;border:1px solid #e8c9cf;border-radius:20px;padding:32px;text-align:center">
    <div style="font-size:40px">🎁</div>
    <h1 style="font-weight:normal;font-size:28px;margin:12px 0">${esc(t.hi)}</h1>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#5c524c">${esc(t.intro.replace("{to}", String(m.para ?? "")))}</p>
    <p style="margin:28px 0"><a href="${link}" style="background:#e8b7c0;color:#2b2420;text-decoration:none;padding:14px 28px;border-radius:999px;font-family:Arial,sans-serif;font-weight:bold">${esc(t.link)}</a></p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#5c524c;margin:0">${esc(t.code)}: <strong style="font-family:monospace;font-size:15px;color:#2b2420">${code}</strong></p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#5c524c">${esc(t.until.replace("{date}", date))}</p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#8a7f78;margin-top:24px">${esc(t.tip)}</p>
  </div>
</div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: t.subject, html }),
  });
  if (!res.ok) console.error("Resend", res.status, await res.text());
}
