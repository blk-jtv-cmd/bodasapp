import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BrandLogo, BrandName } from "@/components/brand";
import { LegalLinks } from "@/components/legal-links";
import { LanguageSwitcher } from "@/i18n/switcher";
import { locale, useI18n, type Lang } from "@/i18n";
import { LEGAL } from "@/legal/config";
import { LEGAL_DOC_KEYS, type LegalDocKey, type LegalDocs } from "@/legal/types";
import es from "@/legal/es";
import en from "@/legal/en";
import it from "@/legal/it";
import fr from "@/legal/fr";
import pt from "@/legal/pt";

const DOCS: Record<Lang, LegalDocs> = { es, en, it, fr, pt };

const isDoc = (v: string): v is LegalDocKey => (LEGAL_DOC_KEYS as string[]).includes(v);

export const Route = createFileRoute("/legal/$doc")({
  beforeLoad: ({ params }) => {
    if (!isDoc(params.doc)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `${isDoc(params.doc) ? es[params.doc].title : "Legal"} — ${LEGAL.brand}` },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  const { doc } = Route.useParams();
  const { t, lang } = useI18n();
  if (!isDoc(doc)) return null;
  const content = DOCS[lang][doc];

  const fill = (text: string) =>
    text
      .split("{name}").join(LEGAL.name)
      .split("{nif}").join(LEGAL.nif)
      .split("{address}").join(LEGAL.address)
      .split("{email}").join(LEGAL.email || t("(próximamente)"))
      .split("{brand}").join(LEGAL.brand);

  const updated = new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${LEGAL.updated}T12:00:00`),
  );

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <header className="border-b border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-2">
          <BrandName className="justify-self-start" />
          <BrandLogo />
          <div className="justify-self-end">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t("Volver al inicio")}
        </Link>
        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight md:text-5xl">{content.title}</h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("Última actualización: {date}", { date: updated })}
        </p>

        <div className="mt-10 space-y-8">
          {content.sections.map((section) => {
            const bullets = section.p.filter((x) => x.startsWith("• "));
            const paras = section.p.filter((x) => !x.startsWith("• "));
            return (
              <section key={section.h}>
                <h2 className="font-display text-2xl font-semibold">{fill(section.h)}</h2>
                {paras.map((para, i) => (
                  <p key={i} className="mt-3 text-pretty text-[15px] leading-7 text-muted-foreground">
                    {fill(para)}
                  </p>
                ))}
                {bullets.length > 0 && (
                  <ul className="mt-3 space-y-2 text-[15px] leading-7 text-muted-foreground">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-clay-ink">—</span>
                        <span>{fill(b.slice(2))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
