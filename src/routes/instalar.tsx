import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, MoreVertical, Maximize2, RefreshCw, Share, SquarePlus, Zap } from "lucide-react";
import { BrandLogo, BrandName } from "@/components/brand";
import { LegalLinks } from "@/components/legal-links";
import { LanguageSwitcher } from "@/i18n/switcher";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/instalar")({
  head: () => ({
    meta: [
      { title: "Instalar la app — Tu Boda en Orden" },
      { name: "description", content: "Añadid Tu Boda en Orden a la pantalla de inicio del móvil y abridla con un toque." },
    ],
  }),
  component: InstallPage,
});

type Device = "ios" | "android" | "desktop";
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function detect(): { device: Device; installed: boolean; inAppBrowser: boolean } {
  if (typeof navigator === "undefined") return { device: "desktop", installed: false, inAppBrowser: false };
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const installed =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const inAppBrowser = /Instagram|FBAN|FBAV|WhatsApp|Line\//i.test(ua);
  return { device: ios ? "ios" : android ? "android" : "desktop", installed, inAppBrowser };
}

function InstallPage() {
  const { t: tr } = useI18n();
  const [env, setEnv] = useState<{ device: Device; installed: boolean; inAppBrowser: boolean } | null>(null);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    setEnv(detect());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const device = env?.device ?? "desktop";

  const steps: { icon: React.ReactNode; title: string; text: string }[] =
    device === "ios"
      ? [
          {
            icon: <Share className="size-5" />,
            title: tr("Abrid el menú de compartir"),
            text: tr("Es el cuadrado con una flecha hacia arriba, en la barra de Safari."),
          },
          {
            icon: <SquarePlus className="size-5" />,
            title: tr("Buscad «Añadir a pantalla de inicio»"),
            text: tr("Si no aparece a la primera, bajad un poco en la lista de opciones."),
          },
          {
            icon: <span className="font-display text-base font-semibold">OK</span>,
            title: tr("Confirmad con «Añadir»"),
            text: tr("El logo de Tu Boda en Orden aparecerá junto al resto de vuestras apps."),
          },
        ]
      : [
          {
            icon: <MoreVertical className="size-5" />,
            title: tr("Abrid el menú del navegador"),
            text: tr("Son los tres puntos de arriba a la derecha en Chrome."),
          },
          {
            icon: <Download className="size-5" />,
            title: tr("Pulsad «Instalar app» o «Añadir a pantalla de inicio»"),
            text: tr("El nombre cambia un poco según el móvil, pero es la misma opción."),
          },
          {
            icon: <span className="font-display text-base font-semibold">OK</span>,
            title: tr("Confirmad"),
            text: tr("La tendréis en la pantalla de inicio, lista para abrir con un toque."),
          },
        ];

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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-clay-ink">{tr("La app en vuestro móvil")}</p>
        <h1 className="mt-3 max-w-xl text-balance font-display text-4xl leading-tight sm:text-5xl">
          {tr("Vuestra boda, a un toque de distancia")}
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          {tr("Sin tiendas de apps ni descargas: se añade desde el navegador en menos de un minuto y siempre tiene la última versión.")}
        </p>

        {env?.installed ? (
          <div className="mt-10 rounded-3xl bg-clay-soft/70 p-8 text-center ring-1 ring-clay/30">
            <p className="font-display text-3xl">🎉 {tr("¡Ya la tenéis instalada!")}</p>
            <Link to="/panel" className="mt-6 inline-block rounded-full bg-clay px-6 py-3 font-medium hover:bg-clay-ink hover:text-background">
              {tr("Ir a vuestro panel")}
            </Link>
          </div>
        ) : device === "desktop" ? (
          <div className="mt-10 grid items-center gap-8 rounded-3xl bg-panel p-6 ring-1 ring-foreground/5 sm:grid-cols-[220px_1fr] sm:p-8">
            <div className="mx-auto w-full max-w-[220px] rounded-2xl bg-[#fdf8f0] p-3 ring-1 ring-clay/40">
              <img src="/qr-instalar.svg" alt={tr("Código QR para abrir esta página en el móvil")} className="w-full" />
            </div>
            <div>
              <h2 className="font-display text-2xl">{tr("Abridla en el móvil")}</h2>
              <ol className="mt-4 space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-semibold">1</span>
                  {tr("Apuntad la cámara del móvil a este código.")}
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-semibold">2</span>
                  {tr("Tocad el enlace que aparece: se abrirá esta misma página con los pasos para vuestro móvil.")}
                </li>
              </ol>
              {prompt && (
                <button
                  onClick={async () => {
                    await prompt.prompt();
                    setPrompt(null);
                  }}
                  className="mt-6 rounded-full border border-line px-5 py-2 text-sm hover:border-clay-ink"
                >
                  {tr("O instaladla también en este ordenador")}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-10">
            {env?.inAppBrowser && (
              <div className="mb-6 rounded-2xl border border-clay/50 bg-clay-soft/50 px-5 py-4 text-sm">
                {device === "ios"
                  ? tr("Estáis dentro de otra app (Instagram, WhatsApp…). Tocad «…» y elegid «Abrir en Safari» para poder instalarla.")
                  : tr("Estáis dentro de otra app (Instagram, WhatsApp…). Tocad «⋮» y elegid «Abrir en Chrome» para poder instalarla.")}
              </div>
            )}
            {prompt && (
              <button
                onClick={async () => {
                  await prompt.prompt();
                  setPrompt(null);
                }}
                className="mb-8 w-full rounded-full bg-clay px-6 py-4 text-base font-medium hover:bg-clay-ink hover:text-background"
              >
                {tr("Instalar ahora")}
              </button>
            )}
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {device === "ios" ? tr("En iPhone, desde Safari") : tr("En Android, desde Chrome")}
            </p>
            <ol className="grid gap-3 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={i} className="relative rounded-3xl bg-panel p-5 ring-1 ring-foreground/5">
                  <span className="absolute right-4 top-4 font-display text-4xl text-clay/60">{i + 1}</span>
                  <span className="grid size-11 place-items-center rounded-2xl bg-clay-soft text-clay-ink">{s.icon}</span>
                  <h3 className="mt-4 font-display text-lg leading-snug">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {[
            { icon: <Zap className="size-4" />, text: tr("Se abre al instante, sin buscarla en el navegador") },
            { icon: <Maximize2 className="size-4" />, text: tr("Ocupa toda la pantalla, como una app más") },
            { icon: <RefreshCw className="size-4" />, text: tr("Se actualiza sola: nada que descargar") },
          ].map((b, i) => (
            <div key={i} className="flex items-start gap-3 border-t border-line pt-4 text-sm text-muted-foreground">
              <span className="mt-0.5 text-clay-ink">{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 pb-10">
        <LegalLinks />
      </footer>
    </div>
  );
}
