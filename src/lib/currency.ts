export const CURRENCIES = [
  { code: "EUR", label: "Euro (€)", symbol: "€", locale: "es-ES" },
  { code: "USD", label: "Dólar ($)", symbol: "$", locale: "en-US" },
  { code: "GBP", label: "Libra (£)", symbol: "£", locale: "en-GB" },
  { code: "CHF", label: "Franco suizo (CHF)", symbol: "CHF", locale: "de-CH" },
  { code: "SEK", label: "Corona sueca (kr)", symbol: "kr", locale: "sv-SE" },
  { code: "NOK", label: "Corona noruega (kr)", symbol: "kr", locale: "nb-NO" },
  { code: "DKK", label: "Corona danesa (kr)", symbol: "kr", locale: "da-DK" },
  { code: "PLN", label: "Zloty (zł)", symbol: "zł", locale: "pl-PL" },
  { code: "CZK", label: "Corona checa (Kč)", symbol: "Kč", locale: "cs-CZ" },
  { code: "MXN", label: "Peso mexicano ($)", symbol: "$", locale: "es-MX" },
  { code: "ARS", label: "Peso argentino ($)", symbol: "$", locale: "es-AR" },
  { code: "COP", label: "Peso colombiano ($)", symbol: "$", locale: "es-CO" },
  { code: "CLP", label: "Peso chileno ($)", symbol: "$", locale: "es-CL" },
  { code: "PEN", label: "Sol peruano (S/)", symbol: "S/", locale: "es-PE" },
  { code: "BRL", label: "Real (R$)", symbol: "R$", locale: "pt-BR" },
  { code: "CAD", label: "Dólar canadiense ($)", symbol: "$", locale: "en-CA" },
  { code: "AUD", label: "Dólar australiano ($)", symbol: "$", locale: "en-AU" },
  { code: "JPY", label: "Yen (¥)", symbol: "¥", locale: "ja-JP" },
  { code: "CNY", label: "Yuan (¥)", symbol: "¥", locale: "zh-CN" },
  { code: "INR", label: "Rupia (₹)", symbol: "₹", locale: "en-IN" },
] as const;

const CURRENCY_MAP = new Map(CURRENCIES.map((c) => [c.code, c]));

export function getCurrencyMeta(code: string) {
  return CURRENCY_MAP.get(code) ?? CURRENCY_MAP.get("EUR")!;
}

export function formatMoney(amount: number, currency: string) {
  const meta = getCurrencyMeta(currency);
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function currencySymbol(currency: string) {
  return getCurrencyMeta(currency).symbol;
}
