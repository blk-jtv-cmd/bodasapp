import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { BrandLogo, BrandName, BRAND_NAME } from "@/components/brand";
import { LanguageSwitcher } from "@/i18n/switcher";
import { LegalLinks } from "@/components/legal-links";
import {
  BudgetCalculator,
  ChecklistDemo,
  Faq,
  MentalLoad,
  SeatingDemo,
  TimelineDemo,
} from "@/components/landing/interactivos";
import { t as tr, useI18n } from "@/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tu Boda en Orden — Organiza tu boda completa por 37€" },
      {
        name: "description",
        content:
          "Checklist, presupuesto, invitados, proveedores y cronograma de tu boda en un solo plan. Un pago único de 37€, sin suscripciones.",
      },
      { property: "og:title", content: "Tu Boda en Orden — Organiza tu boda completa por 37€" },
      {
        property: "og:description",
        content:
          "Todo lo que los novios deben tener en cuenta, ordenado desde el primer día. Pago único de 37€.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// Solo lo que la app hace de verdad.
const features = [
  { num: "01", tag: "Checklist", title: "Checklist por etapas", text: "Desde 12 meses antes hasta el gran día, con responsable y notas en cada tarea." },
  { num: "02", tag: "Presupuesto", title: "Presupuesto claro", text: "Estimado, gasto real, pagado y pendiente por partidas, sin sorpresas." },
  { num: "03", tag: "Fincas", title: "Comparador de fincas", text: "Precio, capacidad, extras, pros y contras de cada lugar, uno al lado del otro." },
  { num: "04", tag: "Invitados", title: "Invitados y mesas", text: "Confirmaciones, acompañantes y un plano de mesas donde sentar a cada invitado." },
  { num: "05", tag: "Menú", title: "Menú y catering", text: "Menús cerrados con sus platos, bebida y barra libre, con el total calculado." },
  { num: "06", tag: "Proveedores", title: "Proveedores", text: "Contacto, precio, señal pagada, contrato y estado de cada proveedor." },
  { num: "07", tag: "Cronograma", title: "El gran día, hora a hora", text: "Desde la peluquería hasta el primer baile, con quién se encarga de qué." },
  { num: "08", tag: "Excel", title: "Plantilla en Excel", text: "Nuestro planificador completo para descargar, por si preferís la hoja de cálculo." },
  { num: "09", tag: "Móvil", title: "En el móvil y el ordenador", text: "Es una web: entráis desde cualquier dispositivo, sin instalar nada." },
];

const included = [
  "Checklist completo por etapas",
  "Presupuesto detallado por partidas",
  "Comparador de fincas",
  "Lista de invitados y plano de mesas",
  "Menú y catering",
  "Fichas de proveedores",
  "Cronograma del gran día",
  "Plantilla en Excel descargable",
];

function Index() {
  const { t: tr } = useI18n();
  // Los enlaces de los correos (confirmar, enlace mágico, contraseña) pueden llegar aquí
  // con la sesión en la dirección (#access_token=...). Los pasamos a /auth, que sabe leerlos.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token") || hash.includes("error_description")) {
      window.location.replace(`/auth${hash}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background font-body text-foreground antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 flex-col justify-self-start">
            <BrandName />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:inline">
              {tr("Plan · 37€")}
            </span>
          </div>
          <BrandLogo />
          <div className="flex items-center gap-3 justify-self-end sm:gap-6">
          <LanguageSwitcher />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            <a href="#funciones" className="transition-colors hover:text-foreground">
              {tr("Funciones")}
            </a>
            <a href="#pruebalo" className="transition-colors hover:text-foreground">
              {tr("Pruébalo")}
            </a>
            <a href="#precio" className="transition-colors hover:text-foreground">
              {tr("Precio")}
            </a>
          </nav>
          <Link
            to="/auth"
            className="rounded-full bg-clay px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-clay-ink hover:text-background"
          >
            {tr("Empezar")}
          </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-10 pt-16 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.28em] text-clay-ink">
              {tr("Para los novios · Todo en un solo plan")}
            </div>
            <h1
              className="text-balance font-display text-6xl leading-[0.95] tracking-tight md:text-7xl"
              style={{ animation: "rise 700ms var(--ease-soft) both" }}
            >
              {tr("La boda,")} <em className="italic text-clay-ink">{tr("ordenada")}</em>
              <br />
              {tr("desde el primer día.")}
            </h1>
            <p
              className="mt-6 max-w-[34ch] text-pretty text-lg text-muted-foreground"
              style={{ animation: "rise 700ms var(--ease-soft) both", animationDelay: "120ms" }}
            >
              {tr("Un solo lugar donde los novios tienen la vista completa: checklist, presupuesto, invitados y proveedores. Sin fórmulas que pierden.")}
            </p>
            <div
              className="mt-8 flex flex-wrap items-center gap-4"
              style={{ animation: "rise 700ms var(--ease-soft) both", animationDelay: "220ms" }}
            >
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-clay px-6 py-3 font-medium text-foreground transition-colors hover:bg-clay-ink hover:text-background"
              >
                {tr("Empezar mi plan · 37€")}
              </Link>
              <a
                href="#pruebalo"
                className="text-sm font-medium text-foreground underline decoration-clay/40 underline-offset-4 transition-colors hover:decoration-clay"
              >
                {tr("Ver cómo funciona")}
              </a>
            </div>
            <div
              className="mt-8 flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              style={{ animation: "rise 700ms var(--ease-soft) both", animationDelay: "320ms" }}
            >
              <span>{tr("Pago único")}</span>
              <span className="h-px w-6 bg-line" />
              <span>{tr("Plantilla Excel incluida")}</span>
            </div>
          </div>

          {/* Product preview */}
          <div
            className="relative"
            style={{ animation: "rise 800ms var(--ease-soft) both", animationDelay: "160ms" }}
          >
            <div className="rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {tr("Panel · Elena & Marcos")}
                </span>
                <span className="font-mono text-[10px] text-clay-ink">{tr("Día −142")}</span>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-clay-soft p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {tr("Presupuesto")}
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold">8.240€</div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-clay/15">
                    <div className="h-full w-[68%] rounded-full bg-clay" />
                  </div>
                </div>
                <div className="rounded-xl bg-clay-soft p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {tr("Invitados")}
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold">
                    128 <span className="text-base text-muted-foreground">/160</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-clay/15">
                    <div className="h-full w-[80%] rounded-full bg-clay" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg bg-background px-3 py-2.5">
                  <span className="size-4 rounded-full bg-clay/80" />
                  <span className="text-sm">{tr("Florista · confirmada")}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {tr("Jun 12")}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-background px-3 py-2.5">
                  <span className="size-4 rounded-full border border-clay/50" />
                  <span className="text-sm">{tr("Sala · por confirmar")}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {tr("Jun 20")}
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl bg-clay-ink px-4 py-3 text-background sm:block">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-60">
                {tr("Este mes")}
              </div>
              <div className="font-display text-xl font-semibold">{tr("3 tareas pendientes")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider index */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span>{tr("(a) La boda en tu cabeza")}</span>
          <span className="hidden sm:inline">{tr("(b) Pruébalo")}</span>
          <span className="hidden sm:inline">{tr("(c) Precio")}</span>
          <span>{tr("(d) Preguntas")}</span>
        </div>
      </div>

      <MentalLoad />

      {/* Features */}
      <section id="funciones" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="mb-12 max-w-xl">
          <h2 className="text-balance font-display text-4xl tracking-tight md:text-5xl">
            {tr("Todo lo que hay que tener en cuenta, en orden.")}
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            {tr("Cada sección pensada para que nada se escape entre la pedida y el gran día.")}
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-foreground/5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.num} className="bg-panel p-7">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-clay-ink">
                {f.num} — {tr(f.tag)}
              </div>
              <h3 className="font-display text-2xl font-semibold">{tr(f.title)}</h3>
              <p className="mt-2 text-pretty text-sm text-muted-foreground">{tr(f.text)}</p>
            </div>
          ))}
        </div>
      </section>

      <BudgetCalculator />
      <ChecklistDemo />
      <TimelineDemo />
      <SeatingDemo />

      {/* Excel */}
      <section className="border-t border-line bg-clay-soft/40">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-clay-ink">
            {tr("¿Te gusta más el Excel?")}
          </div>
          <h2 className="text-balance font-display text-4xl tracking-tight md:text-5xl">
            {tr("También te llevas la plantilla en Excel.")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            {tr("Con el plan descargáis nuestro planificador completo en hoja de cálculo: presupuesto, proveedores, fincas, invitados, mesas, menú, checklist y horario del día. Para usarlo en Excel, Numbers o Google Sheets cuando os apetezca.")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {["Excel", "Numbers", "Google Sheets"].map((t) => (
              <span key={t} className="rounded-full bg-panel px-4 py-2 ring-1 ring-line">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Price */}
      <section id="precio" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <div className="overflow-hidden rounded-3xl bg-foreground text-background">
          <div className="grid lg:grid-cols-[1fr_1.1fr]">
            <div className="p-10 lg:p-14">
              <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.25em] text-background/50">
                {tr("(c) El precio")}
              </div>
              <div className="flex items-end gap-2">
                <span className="font-display text-[6rem] font-semibold leading-none">37</span>
                <span className="mb-3 font-display text-4xl">€</span>
              </div>
              <div className="mt-2 text-sm text-background/70">
                {tr("Un solo pago. Sin suscripciones ni cuotas.")}
              </div>
              <Link
                to="/auth"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-clay px-6 py-3.5 font-medium text-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                {tr("Crear mi plan ahora")}
              </Link>
              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-background/50">
                {tr("Pruébala gratis · paga solo si te convence")}
              </div>
            </div>
            <div className="border-t border-background/15 p-10 lg:border-l lg:border-t-0 lg:p-14">
              <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-background/50">
                {tr("Todo lo incluido")}
              </div>
              <ul className="space-y-3 text-sm">
                {included.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-clay">—</span>
                    {tr(item)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Faq />

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
          <span className="font-brand text-4xl leading-none">{BRAND_NAME}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {tr("Un plan, una boda, 37€")}
          </span>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-8">
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
