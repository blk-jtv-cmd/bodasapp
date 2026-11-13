import { Fragment, useEffect, useState, type ReactNode } from "react";

/**
 * Oferta temporal (Black Friday 2026).
 * Del lunes 16 de noviembre 00:00 al viernes 27 de noviembre 23:59, hora de España.
 * Fuera de esas fechas la web enseña el precio normal y no manda ningún código a Stripe.
 *
 * En Stripe tiene que existir el código de promoción PROMO.code (cupón de 10 € de descuento)
 * y el enlace de pago debe tener activado «Permitir códigos de promoción».
 *
 * Para ver cómo queda antes de que empiece: abrir cualquier página con ?promo=ver
 * (se recuerda en esa pestaña; ?promo=no lo quita).
 */
export const BASE_PRICE = 37;
export const PROMO = {
  code: "BLACKORDEN",
  label: "Black Friday",
  price: 27,
  start: Date.parse("2026-11-16T00:00:00+01:00"),
  end: Date.parse("2026-11-28T00:00:00+01:00"),
};

const PREVIEW_KEY = "promo-preview";

export function promoActive(now = Date.now()) {
  return now >= PROMO.start && now < PROMO.end;
}

function previewOn() {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("promo");
    if (q === "ver") sessionStorage.setItem(PREVIEW_KEY, "1");
    if (q === "no") sessionStorage.removeItem(PREVIEW_KEY);
    return sessionStorage.getItem(PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

/** ¿Hay oferta ahora? (en el primer render coincide con el servidor; la vista previa se aplica después). */
export function usePromo() {
  const [active, setActive] = useState(() => promoActive());
  useEffect(() => {
    if (!active && previewOn()) setActive(true);
  }, [active]);
  return active;
}

/** Código que se manda a Stripe para que el descuento salga ya aplicado. */
export function promoCodeForCheckout() {
  return promoActive() || previewOn() ? PROMO.code : null;
}

// "37€", "€37" o "37 €", según el idioma.
// (sin "lookbehind", que los iPhone antiguos no entienden)
const PRICE_RE = new RegExp(`(€\\s?${BASE_PRICE}(?!\\d)|\\b${BASE_PRICE}\\s?€)`);

/**
 * Pinta un texto ya traducido que lleva el precio normal.
 * Con oferta: el precio normal tachado y, al lado, el de la oferta con el mismo formato.
 */
export function Priced({ text, active }: { text: string; active: boolean }): ReactNode {
  if (!active) return text;
  const parts = text.split(PRICE_RE);
  if (parts.length === 1) return text;
  return parts.map((p, i) =>
    PRICE_RE.test(p) ? (
      <Fragment key={i}>
        <s className="opacity-60">{p}</s> <strong>{p.replace(String(BASE_PRICE), String(PROMO.price))}</strong>
      </Fragment>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}

/** Igual que Priced pero sin tachar: para frases largas. */
export function pricedText(text: string, active: boolean) {
  return active ? text.replace(PRICE_RE, (m) => m.replace(String(BASE_PRICE), String(PROMO.price))) : text;
}
