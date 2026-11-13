import { OFFER } from "@/lib/pricing";
import { useOfferRemaining, usePricing } from "@/lib/pricing-context";
import { useI18n } from "@/i18n";

/** Franja de la oferta encima de las páginas públicas, con cuenta atrás. Solo aparece mientras dura. */
export function OfferBanner() {
  const { t } = useI18n();
  const p = usePricing();
  const ms = useOfferRemaining();
  if (!p.offer || ms <= 0) return null;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="bg-foreground px-4 py-2 text-center text-xs leading-relaxed text-background sm:text-sm" role="note">
      <span className="mr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-clay sm:text-[11px]">
        {OFFER.label}
      </span>
      <span>{t("El plan completo a {price} € hasta el 30 de noviembre", { price: p.price })}</span>
      <span className="ml-2 inline-block whitespace-nowrap font-mono text-[11px] tabular-nums text-background/80 sm:text-xs">
        · {t("Termina en")} {d} d {pad(h)} h {pad(m)} min
      </span>
      {p.simulated && (
        <span className="ml-2 rounded bg-clay px-1.5 py-0.5 font-mono text-[10px] text-foreground">PRUEBA</span>
      )}
    </div>
  );
}

/** Aviso fijo en la web de pruebas cuando se está simulando una fecha (fuera de la oferta también). */
export function SimulationNotice() {
  const p = usePricing();
  if (!p.simulated) return null;
  return (
    <div className="fixed bottom-3 left-3 z-50 rounded-full bg-clay-ink px-3 py-1.5 font-mono text-[11px] text-background shadow-lg">
      PRUEBA · {new Date(p.now).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })} · {p.price} €
    </div>
  );
}
