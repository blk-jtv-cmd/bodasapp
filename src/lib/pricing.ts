/**
 * Precio del plan y oferta temporal.
 *
 * Black Friday 2026: del lunes 16/11 00:00 al lunes 30/11 23:59:59, hora de España (Europe/Madrid, UTC+1
 * en esas fechas). El 1/12 a las 00:00 todo vuelve solo a 37 €.
 *
 * Quién decide si hay oferta es el servidor (src/lib/pricing.functions.ts), nunca el reloj del navegador.
 * Este archivo solo tiene los datos y cálculos, que se usan en los dos lados.
 */
export const BASE_PRICE = 37;
export const OFFER_PRICE = 27;
export const OFFER = {
  label: "Black Friday",
  start: Date.parse("2026-11-16T00:00:00+01:00"),
  end: Date.parse("2026-12-01T00:00:00+01:00"), // exclusivo: hasta el 30/11 a las 23:59:59
};

export type Pricing = {
  /** Precio que se cobra ahora mismo, en euros. */
  price: number;
  /** ¿Estamos dentro de la oferta? */
  offer: boolean;
  /** Fin de la oferta (ms). */
  endsAt: number;
  /** Hora del servidor (ms) en el momento de calcularlo; con simulación, la hora simulada. */
  now: number;
  /** true solo en la web de pruebas cuando se está simulando una fecha. */
  simulated: boolean;
};

export function pricingAt(now: number, simulated = false): Pricing {
  const offer = now >= OFFER.start && now < OFFER.end;
  return { price: offer ? OFFER_PRICE : BASE_PRICE, offer, endsAt: OFFER.end, now, simulated };
}

// Dominios de la web real. En cualquier otro (web de pruebas de Cloudflare, localhost)
// se puede simular la fecha y se usa Stripe en modo de prueba.
export const PRODUCTION_HOSTS = ["tubodaenorden.com", "www.tubodaenorden.com"];

/**
 * Fecha simulada para pruebas. Sin zona horaria se entiende hora de España:
 * "2026-11-20" (a mediodía), "2026-11-20T10:00", o con zona explícita "2026-11-30T23:59:59+01:00".
 */
export function parseSimulated(value: string | undefined | null): number | null {
  if (!value || value === "off") return null;
  let v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) v += "T12:00:00";
  if (/T\d{2}:\d{2}(:\d{2})?$/.test(v)) v += "+01:00";
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

/** Nombre de la cookie con la fecha simulada (solo tiene efecto fuera de producción). */
export const SIMULATE_COOKIE = "tbo_fecha";

// "37€", "€37" o "37 €", según el idioma (sin "lookbehind", que los iPhone antiguos no entienden).
const PRICE_RE = new RegExp(`€\\s?${BASE_PRICE}(?!\\d)|\\b${BASE_PRICE}\\s?€`, "g");

/** Cambia el precio normal por el actual en un texto ya traducido. */
export function withPrice(text: string, p: Pick<Pricing, "price">) {
  if (p.price === BASE_PRICE) return text;
  return text.replace(PRICE_RE, (m) => m.replace(String(BASE_PRICE), String(p.price)));
}
