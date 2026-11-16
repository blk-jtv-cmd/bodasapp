import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo, BrandName } from "@/components/brand";
import { LegalLinks } from "@/components/legal-links";
import { GiftCard, type Gift } from "@/components/gift-card";
import { LanguageSwitcher } from "@/i18n/switcher";
import { useI18n } from "@/i18n";
import { PENDING_GIFT_KEY } from "@/lib/gift";

export const Route = createFileRoute("/regalo/$code")({
  head: () => ({
    meta: [
      { title: "Te han regalado Tu Boda en Orden 🎁" },
      { name: "description", content: "Una tarjeta regalo con el plan completo para organizar vuestra boda." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RedeemPage,
});


type Preview = Gift & { status: "valid" | "redeemed" | "expired" | "void" | "not_found" };

function RedeemPage() {
  const { code } = Route.useParams();
  const { t } = useI18n();
  const [gift, setGift] = useState<Preview | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("gift_preview" as never, { p_code: code } as never);
      setGift(error || !data ? ({ status: "not_found" } as Preview) : (data as unknown as Preview));
    })();
  }, [code]);

  async function activate() {
    try {
      localStorage.setItem(PENDING_GIFT_KEY, gift?.code ?? code);
    } catch {
      /* sin almacenamiento: se pasa por la dirección */
    }
    const { data } = await supabase.auth.getSession();
    const c = encodeURIComponent(gift?.code ?? code);
    window.location.href = data.session ? `/panel?regalo=${c}` : `/auth?regalo=${c}`;
  }

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
        {!gift ? (
          <p className="py-24 text-center text-muted-foreground">{t("Cargando…")}</p>
        ) : gift.status === "valid" ? (
          <>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-clay-ink">{t("Tienes un regalo")}</p>
              <h1 className="mt-3 text-balance font-display text-4xl leading-tight sm:text-5xl">
                {t("{from} os regala Tu Boda en Orden", { from: gift.from_name })}
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                {t("Checklist, presupuesto, invitados, mesas, proveedores y el día B, todo en orden. Y la plantilla en Excel.")}
              </p>
            </div>
            <div className="mt-10">
              <GiftCard gift={gift} />
            </div>
            <div className="mt-8 text-center">
              <button
                onClick={activate}
                className="rounded-full bg-clay px-8 py-4 text-base font-medium hover:bg-clay-ink hover:text-background"
              >
                {t("Activar mi regalo")}
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("Crea vuestra cuenta (o entra si ya la tenéis) y el plan completo se activa solo.")}
              </p>
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-4xl">🎁</p>
            <h1 className="mt-4 font-display text-3xl">
              {gift.status === "redeemed"
                ? t("Este regalo ya se ha activado")
                : gift.status === "expired"
                  ? t("Este regalo ha caducado")
                  : t("Este código de regalo no es válido")}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              {gift.status === "redeemed"
                ? t("Si fuiste tú, entra en tu cuenta: el plan completo ya está activo.")
                : t("Revisa que el enlace o el código estén completos, o escríbenos y lo miramos.")}
            </p>
            <Link to="/panel" className="mt-6 inline-block rounded-full bg-clay px-6 py-3 font-medium">
              {t("Ir a mi panel")}
            </Link>
          </div>
        )}
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 pb-10">
        <LegalLinks />
      </footer>
    </div>
  );
}
