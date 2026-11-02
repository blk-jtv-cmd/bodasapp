// Recibe los avisos de Stripe y activa el plan de la pareja cuando el pago se ha completado.
// Secretos necesarios en Supabase (Edge Functions → Secrets):
//   STRIPE_WEBHOOK_SECRET  → el "Signing secret" del webhook en Stripe (empieza por whsec_)
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase automáticamente.
import { createClient } from "npm:@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
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
  if (!header || !WEBHOOK_SECRET) return false;
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const timestamp = parts.find(([k]) => k === "t")?.[1];
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(WEBHOOK_SECRET),
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
  const handled = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  if (!handled.includes(event.type)) return Response.json({ received: true });

  const session = event.data.object;
  if (session.payment_status !== "paid") return Response.json({ received: true, pending: true });

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
