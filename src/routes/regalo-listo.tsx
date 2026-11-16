import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Download, ExternalLink, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo, BrandName } from "@/components/brand";
import { LegalLinks } from "@/components/legal-links";
import { downloadGiftCard, GiftCard, giftUrl, type Gift } from "@/components/gift-card";
import { LanguageSwitcher } from "@/i18n/switcher";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/regalo-listo")({
  head: () => ({ meta: [{ title: "Tu tarjeta regalo — Tu Boda en Orden" }, { name: "robots", content: "noindex" }] }),
  component: GiftReadyPage,
});

function GiftReadyPage() {
  const { t } = useI18n();
  const [gift, setGift] = useState<Gift | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "late" | "missing">("loading");

  // El código lo guarda el aviso de Stripe (webhook), que puede tardar unos segundos en llegar.
  useEffect(() => {
    const session = new URLSearchParams(window.location.search).get("session_id");
    if (!session) {
      setState("missing");
      return;
    }
    let tries = 0;
    let stop = false;
    const look = async () => {
      if (stop) return;
      tries += 1;
      const { data } = await supabase.rpc("gift_by_session" as never, { p_session: session } as never);
      if (data) {
        setGift(data as unknown as Gift);
        setState("ready");
        return;
      }
      if (tries >= 30) setState("late");
      else window.setTimeout(look, 2000);
    };
    void look();
    return () => {
      stop = true;
    };
  }, []);

  const url = gift ? giftUrl(gift.code) : "";
  const shareText = gift
    ? t("🎁 {from} te regala Tu Boda en Orden para organizar vuestra boda. Ábrelo aquí:", { from: gift.from_name })
    : "";

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <header className="border-b border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6">
          <BrandName className="justify-self-start" />
          <BrandLogo />
          <div className="justify-self-end">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {state === "loading" && (
          <div className="py-24 text-center">
            <p className="text-4xl">🎁</p>
            <p className="mt-4 font-display text-2xl">{t("Estamos preparando tu tarjeta regalo…")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("Solo tarda unos segundos.")}</p>
          </div>
        )}
        {state === "late" && (
          <div className="py-24 text-center">
            <p className="font-display text-2xl">{t("El pago está hecho, pero la tarjeta está tardando más de lo normal.")}</p>
            <p className="mt-3 text-muted-foreground">
              {t("Recarga esta página en un par de minutos. Si sigue sin aparecer, escríbenos y te la mandamos.")}
            </p>
          </div>
        )}
        {state === "missing" && (
          <div className="py-24 text-center">
            <p className="font-display text-2xl">{t("No encontramos ningún regalo en esta dirección.")}</p>
            <Link to="/regalar" className="mt-6 inline-block rounded-full bg-clay px-6 py-3 font-medium">
              {t("Regalar el plan")}
            </Link>
          </div>
        )}
        {state === "ready" && gift && (
          <>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-clay-ink">{t("¡Pago recibido!")}</p>
              <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{t("Tu regalo está listo")}</h1>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                {t("Mándaselo a {name} como prefieras. Al abrir el enlace podrá activar el plan completo.", { name: gift.to_name })}
              </p>
            </div>

            <div className="mt-10">
              <GiftCard gift={gift} />
            </div>

            <div className="mx-auto mt-8 grid max-w-md gap-2 sm:grid-cols-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-clay px-5 py-3 text-sm font-medium hover:bg-clay-ink hover:text-background"
              >
                <MessageCircle className="size-4" /> {t("Enviar por WhatsApp")}
              </a>
              <button
                onClick={() => downloadGiftCard(gift, t)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-5 py-3 text-sm ring-1 ring-line hover:ring-clay-ink"
              >
                <Download className="size-4" /> {t("Descargar imagen")}
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url);
                    toast.success(t("Enlace copiado"));
                  } catch {
                    toast(url, { duration: 20000 });
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-5 py-3 text-sm ring-1 ring-line hover:ring-clay-ink"
              >
                <Copy className="size-4" /> {t("Copiar enlace")}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-5 py-3 text-sm ring-1 ring-line hover:ring-clay-ink"
              >
                <ExternalLink className="size-4" /> {t("Verlo como lo verá")}
              </a>
            </div>
            <p className="mx-auto mt-6 max-w-md text-center text-xs text-muted-foreground">
              {t("Guarda esta página o el enlace. También te lo mandamos por email junto al recibo del pago.")}
            </p>
          </>
        )}
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 pb-10">
        <LegalLinks />
      </footer>
    </div>
  );
}
