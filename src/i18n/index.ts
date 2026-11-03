import { useSyncExternalStore } from "react";
import en from "./en";
import it from "./it";
import fr from "./fr";

/**
 * Idiomas de la web. Los textos se escriben en español dentro del código y
 * t("texto") devuelve su traducción (o el propio español si falta).
 * Variables: t("{n} mesas", { n: 3 }).
 */
export type Lang = "es" | "en" | "it" | "fr";

export const LANGS: { code: Lang; label: string; name: string }[] = [
  { code: "es", label: "ES", name: "Español" },
  { code: "en", label: "EN", name: "English" },
  { code: "it", label: "IT", name: "Italiano" },
  { code: "fr", label: "FR", name: "Français" },
];

const DICTS: Record<Lang, Record<string, string>> = { es: {}, en, it, fr };
const LOCALES: Record<Lang, string> = { es: "es-ES", en: "en-GB", it: "it-IT", fr: "fr-FR" };
const STORAGE_KEY = "lang";

let current: Lang = "es";
const listeners = new Set<() => void>();

function isLang(v: unknown): v is Lang {
  return v === "es" || v === "en" || v === "it" || v === "fr";
}

/** Idioma guardado por la persona o, si no, el de su navegador. Por defecto, español. */
function detect(): Lang {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* almacenamiento no disponible */
  }
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l?.slice(0, 2).toLowerCase();
    if (isLang(code)) return code;
  }
  return "es";
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang, remember = true) {
  current = lang;
  if (typeof document !== "undefined") document.documentElement.lang = lang;
  if (remember) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* almacenamiento no disponible */
    }
  }
  listeners.forEach((fn) => fn());
}

/** Se llama una vez al cargar la web en el navegador. */
export function initLang() {
  if (typeof window === "undefined") return;
  setLang(detect(), false);
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let text = DICTS[current][key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

/** Formato de fechas y números del idioma actual (es-ES, en-GB…). */
export function locale(): string {
  return LOCALES[current];
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** En cada componente con textos: const { t } = useI18n(); se vuelve a pintar al cambiar de idioma. */
export function useI18n() {
  const lang = useSyncExternalStore(subscribe, getLang, () => "es" as Lang);
  return { lang, t, setLang };
}
