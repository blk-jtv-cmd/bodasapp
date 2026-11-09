// Emoji que acompaña al nombre de cada categoría (presupuesto, proveedores y checklist).
// Se busca por el nombre en español (sin tildes ni mayúsculas) y, si no hay coincidencia
// exacta, por palabras clave, para que las categorías que creen las parejas también lo tengan.

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const EXACT: Record<string, string> = {
  "lugar y catering": "🏛️",
  "fotografia y video": "📸",
  "musica y dj": "🎶",
  flores: "💐",
  "flores y decoracion": "💐",
  decoracion: "🕯️",
  "vestido y traje": "👗",
  vestido: "👗",
  traje: "🤵",
  belleza: "💄",
  anillos: "💍",
  "invitaciones y papeleria": "💌",
  transporte: "🚗",
  "luna de miel": "🌴",
  otros: "✨",
  // Checklist
  general: "📌",
  "1 semana antes": "⏳",
  "dia antes": "🌙",
  "dia b": "💒",
};

const KEYWORDS: [RegExp, string][] = [
  [/meses? antes/, "🗓️"],
  [/catering|comida|menu|banquete/, "🍽️"],
  [/lugar|finca|salon|venue/, "🏛️"],
  [/foto|video/, "📸"],
  [/musica|dj|banda|orquesta/, "🎶"],
  [/flor/, "💐"],
  [/decora/, "🕯️"],
  [/vestid/, "👗"],
  [/traje/, "🤵"],
  [/belleza|maquillaje|peluquer/, "💄"],
  [/anillo|alianza|joya/, "💍"],
  [/invitaci|papeler/, "💌"],
  [/transporte|coche|autobus/, "🚗"],
  [/luna de miel|viaje/, "🌴"],
  [/tarta|pastel/, "🎂"],
  [/detalle|regalo/, "🎁"],
  [/planner|organiza/, "📋"],
  [/ceremonia|iglesia|oficiante/, "⛪"],
];

export function categoryEmoji(name: string): string {
  const n = norm(name);
  if (EXACT[n]) return EXACT[n];
  for (const [re, emoji] of KEYWORDS) if (re.test(n)) return emoji;
  return "🏷️";
}

/** "💐 Flores": el emoji delante del nombre ya traducido. */
export function catLabel(name: string, translate: (s: string) => string): string {
  return `${categoryEmoji(name)} ${translate(name)}`;
}
