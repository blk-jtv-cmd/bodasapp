import { LANGS, useI18n, type Lang } from "./index";

/** Selector de idioma para la barra superior. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label={t("Idioma")}
      className={`cursor-pointer rounded-full border border-line bg-transparent px-2 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground outline-none hover:text-foreground focus:border-clay-ink ${className}`}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
