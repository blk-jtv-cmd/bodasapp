import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BrandLogo, BrandName } from "@/components/brand";
import { LegalLink, LegalLinks } from "@/components/legal-links";
import { OfferBanner } from "@/components/offer-banner";
import { LanguageSwitcher } from "@/i18n/switcher";
import { useI18n } from "@/i18n";
import { BASE_PRICE, OFFER } from "@/lib/pricing";
import { usePricing } from "@/lib/pricing-context";
import { createGiftCheckout } from "@/lib/pricing.functions";

export const Route = createFileRoute("/regalar")({
  head: () => ({
    meta: [
      { title: "Regalar Tu Boda en Orden — una tarjeta regalo para quien se casa" },
      {
        name: "description",
        content: "Regala el plan completo de Tu Boda en Orden a una pareja que se casa. Tarjeta regalo con código, válida 12 meses.",
      },
    ],
  }),
  component: GiftPage,
});

const inputCls =
  "w-full rounded-xl border border-line bg-background px-4 py-3 text-base outline-none focus:border-clay-ink";

function GiftPage() {
  const { t, lang } = useI18n();
  const pricing = usePricing();
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!fromName.trim() || !toName.trim() || !accepted) return;
    setBusy(true);
    try {
      const r = await createGiftCheckout({ data: { fromName, toName, message, lang } });
      if (r.ok) {
        window.location.href = r.url;
        return;
      }
      toast.error(t("No hemos podido abrir el pago. Volved a intentarlo en un momento; si sigue igual, escribidnos."), {
        description: r.detail ? `${r.reason}: ${r.detail}` : undefined,
      });
    } catch (err) {
      console.error(err);
      toast.error(t("No hemos podido abrir el pago. Volved a intentarlo en un momento; si sigue igual, escribidnos."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <OfferBanner />
      <header className="border-b border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6">
          <BrandName className="justify-self-start" />
          <BrandLogo />
          <div className="justify-self-end">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 py-10 sm:px-6 sm:py-16 md:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-clay-ink">🎁 {t("Tarjeta regalo")}</p>
          <h1 className="mt-3 text-balance font-display text-4xl leading-tight sm:text-5xl">
            {t("Regala una boda en orden")}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {t("Para la amiga, la hermana o la pareja que se casa: el plan completo para organizar la boda, sin hojas sueltas ni agobios.")}
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              t("Pagas tú y recibes al momento una tarjeta con un código."),
              t("Se la mandas por WhatsApp, por email o impresa."),
              t("La pareja la activa al crear su cuenta, cuando quiera: vale 12 meses."),
              t("Incluye todo el plan y, de regalo, la plantilla en Excel."),
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-semibold">{i + 1}</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={pay} className="rounded-3xl bg-panel p-6 ring-1 ring-foreground/5 sm:p-8">
          <div className="flex items-end gap-2">
            <span className="font-display text-6xl font-semibold leading-none">{pricing.price}</span>
            <span className="mb-1 font-display text-2xl">€</span>
          </div>
          {pricing.offer && (
            <p className="mt-2 inline-flex rounded-xl bg-clay px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]">
              {t("Oferta {label} · después {price} €", { label: OFFER.label, price: BASE_PRICE })}
            </p>
          )}

          <label className="mt-6 block text-sm">
            {t("Tu nombre (de parte de)")}
            <input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              maxLength={60}
              required
              placeholder={t("Ej.: Marta")}
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="mt-4 block text-sm">
            {t("Para quién es")}
            <input
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              maxLength={60}
              required
              placeholder={t("Ej.: Lucía y Pablo")}
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="mt-4 block text-sm">
            {t("Un mensaje (opcional)")}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder={t("Ej.: ¡Enhorabuena! Que la organización sea la parte fácil 💍")}
              className={`${inputCls} mt-1`}
            />
          </label>

          <label className="mt-5 flex cursor-pointer items-start gap-2 text-xs leading-5 text-muted-foreground">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-clay-ink"
            />
            <span>
              {t("He leído las")} <LegalLink doc="condiciones" className="underline" />.{" "}
              {t("Puedo desistir de la compra en 14 días mientras el código no se haya usado.")}
            </span>
          </label>

          <button
            disabled={busy || !accepted || !fromName.trim() || !toName.trim()}
            className="mt-6 w-full rounded-full bg-clay px-6 py-3.5 font-medium transition-colors enabled:hover:bg-clay-ink enabled:hover:text-background disabled:opacity-50"
          >
            {busy ? t("Un momento…") : t("Regalar por {price} €", { price: pricing.price })}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">{t("Pago seguro con tarjeta a través de Stripe.")}</p>
        </form>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 pb-10">
        <LegalLinks />
      </footer>
    </div>
  );
}
