import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { BASE_PRICE, OFFER_PRICE, PRODUCTION_HOSTS, parseSimulated, pricingAt, type Pricing } from "./pricing";

/**
 * Precio actual, calculado con la hora del servidor.
 * En la web de pruebas (no en tubodaenorden.com) admite una fecha simulada: ?fecha=2026-11-20T10:00
 * o la cookie tbo_fecha. En producción eso se ignora siempre.
 */
export const getPricing = createServerFn({ method: "GET" })
  .inputValidator((d: { simulate?: string } | undefined) => d ?? {})
  .handler(async ({ data }): Promise<Pricing> => {
    const req = getRequest();
    const host = new URL(req.url).host.toLowerCase();
    if (!PRODUCTION_HOSTS.includes(host) && data.simulate !== "off") {
      const cookie = /(?:^|;\s*)tbo_fecha=([^;]+)/.exec(req.headers.get("cookie") ?? "")?.[1];
      const t = parseSimulated(data.simulate || (cookie ? decodeURIComponent(cookie) : ""));
      if (t !== null) return pricingAt(t, true);
    }
    return pricingAt(Date.now());
  });

type CheckoutResult =
  | { ok: true; url: string; price: number }
  | { ok: false; reason: "unauthorized" | "already_paid" | "not_configured" | "stripe_error" };

/**
 * Crea el pago en Stripe con el precio que toca AHORA según el servidor.
 * El usuario sale del token de la sesión (no de lo que mande el navegador).
 *
 * Variables (Cloudflare → Worker → Settings → Variables and Secrets, todas como "Secret"):
 *   Web real (tubodaenorden.com):   STRIPE_SECRET_KEY, STRIPE_PRICE_ID (37 €), STRIPE_PRICE_ID_OFERTA (27 €)
 *   Web de pruebas (cualquier otra): STRIPE_TEST_SECRET_KEY, STRIPE_TEST_PRICE_ID, STRIPE_TEST_PRICE_ID_OFERTA
 */
export const createCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: { lang?: string } | undefined) => d ?? {})
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const req = getRequest();
    const url = new URL(req.url);
    const host = url.host.toLowerCase();
    const production = PRODUCTION_HOSTS.includes(host);
    const env = (k: string) => (process.env[k] ?? "").trim();

    // 1) Quién paga: se comprueba el token con Supabase.
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;
    const auth = req.headers.get("authorization") ?? "";
    if (!auth.startsWith("Bearer ") || !supabaseUrl || !anonKey) return { ok: false, reason: "unauthorized" };
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: auth } });
    if (!userRes.ok) return { ok: false, reason: "unauthorized" };
    const user = (await userRes.json()) as { id: string; email?: string };

    // Si ya está pagado, no se cobra otra vez.
    const wRes = await fetch(`${supabaseUrl}/rest/v1/weddings?select=plan_active&user_id=eq.${user.id}`, {
      headers: { apikey: anonKey, Authorization: auth },
    });
    const weddings = wRes.ok ? ((await wRes.json()) as { plan_active: boolean }[]) : [];
    if (weddings.some((w) => w.plan_active)) return { ok: false, reason: "already_paid" };

    // 2) Qué precio toca: hora del servidor (o la simulada, solo fuera de producción).
    let pricing = pricingAt(Date.now());
    if (!production) {
      const cookie = /(?:^|;\s*)tbo_fecha=([^;]+)/.exec(req.headers.get("cookie") ?? "")?.[1];
      const t = parseSimulated(cookie ? decodeURIComponent(cookie) : null);
      if (t !== null) pricing = pricingAt(t, true);
    }

    // 3) Claves: las reales solo en la web real; en cualquier otra, las de prueba.
    const key = production ? env("STRIPE_SECRET_KEY") : env("STRIPE_TEST_SECRET_KEY");
    const priceId = production
      ? env(pricing.offer ? "STRIPE_PRICE_ID_OFERTA" : "STRIPE_PRICE_ID")
      : env(pricing.offer ? "STRIPE_TEST_PRICE_ID_OFERTA" : "STRIPE_TEST_PRICE_ID");
    if (!key || !priceId) return { ok: false, reason: "not_configured" };
    if (!production && key.startsWith("sk_live")) return { ok: false, reason: "not_configured" };

    const stripe = (path: string, init?: RequestInit) =>
      fetch(`https://api.stripe.com/v1/${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      });

    // Comprobación de seguridad: el precio configurado tiene que ser exactamente el que toca.
    const priceRes = await stripe(`prices/${encodeURIComponent(priceId)}`);
    if (!priceRes.ok) return { ok: false, reason: "stripe_error" };
    const price = (await priceRes.json()) as { unit_amount: number; currency: string };
    const expected = (pricing.offer ? OFFER_PRICE : BASE_PRICE) * 100;
    if (price.unit_amount !== expected || price.currency !== "eur") {
      console.error("Precio de Stripe mal configurado", priceId, price.unit_amount, "esperado", expected);
      return { ok: false, reason: "not_configured" };
    }

    const locale = ["es", "en", "it", "fr", "pt"].includes(data.lang ?? "") ? data.lang! : "auto";
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      client_reference_id: user.id,
      success_url: `${url.origin}/panel?pago=ok`,
      cancel_url: `${url.origin}/panel`,
      locale,
      "metadata[oferta]": pricing.offer ? "black-friday-2026" : "ninguna",
      "metadata[user_id]": user.id,
      "payment_intent_data[metadata][oferta]": pricing.offer ? "black-friday-2026" : "ninguna",
    });
    if (user.email) {
      body.set("customer_email", user.email);
      // Recibo por email con el importe cobrado.
      body.set("payment_intent_data[receipt_email]", user.email);
    }
    const res = await stripe("checkout/sessions", { method: "POST", body });
    if (!res.ok) {
      console.error("Stripe checkout error", res.status, await res.text());
      return { ok: false, reason: "stripe_error" };
    }
    const session = (await res.json()) as { url: string };
    return { ok: true, url: session.url, price: pricing.price };
  });
