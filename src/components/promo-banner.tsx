import { Priced, PROMO, usePromo } from "@/lib/promo";
import { useI18n } from "@/i18n";

/** Franja de la oferta encima de todo. Solo aparece mientras dura. */
export function PromoBanner() {
  const { t } = useI18n();
  const active = usePromo();
  if (!active) return null;
  return (
    <div className="bg-foreground px-4 py-2 text-center text-xs text-background sm:text-sm">
      <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.25em] text-clay sm:text-[11px]">
        {PROMO.label}
      </span>
      <Priced text={t("El plan completo a 37€ solo hasta el 27 de noviembre.")} active />{" "}
      <span className="whitespace-nowrap">🎁 {t("Plantilla Excel de regalo")}</span>
    </div>
  );
}
