import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { initLang } from "@/i18n";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getPricing } from "@/lib/pricing.functions";
import { PRODUCTION_HOSTS, SIMULATE_COOKIE, withPrice, type Pricing } from "@/lib/pricing";
import { PricingProvider } from "@/lib/pricing-context";
import { SimulationNotice } from "@/components/offer-banner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // El precio (y si hay oferta) lo decide el servidor con su hora. En la web de pruebas
  // se puede simular la fecha con ?fecha=2026-11-20T10:00 (y ?fecha=off para quitarla).
  loader: async ({ location }): Promise<Pricing | undefined> => {
    const fecha = (location.search as Record<string, unknown> | undefined)?.fecha;
    try {
      return await getPricing({ data: { simulate: typeof fecha === "string" ? fecha : undefined } });
    } catch (e) {
      console.error("No se pudo obtener el precio", e);
      return undefined;
    }
  },
  staleTime: 60_000,
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      // App instalable en la pantalla de inicio (Android e iPhone)
      { name: "theme-color", content: "#F8F2E4" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Boda en Orden" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "application-name", content: "Tu Boda en Orden" },
      { title: withPrice("Tu Boda en Orden — Organiza tu boda completa por 37€", { price: loaderData?.price ?? 37 }) },
      {
        name: "description",
        content: withPrice(
          "Checklist, presupuesto, invitados, proveedores y cronograma de tu boda en un solo plan. Pago único de 37€.",
          { price: loaderData?.price ?? 37 },
        ),
      },
      { name: "author", content: "Tu Boda en Orden" },
      {
        property: "og:title",
        content: withPrice("Tu Boda en Orden — Organiza tu boda completa por 37€", { price: loaderData?.price ?? 37 }),
      },
      {
        property: "og:description",
        content:
          "Todo lo que los novios deben tener en cuenta, ordenado desde el primer día.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preload", href: "/fonts/inter.woff", as: "font", type: "font/woff", crossOrigin: "anonymous" },
      { rel: "preload", href: "/fonts/hurricane.woff", as: "font", type: "font/woff", crossOrigin: "anonymous" },
      { rel: "icon", href: "/icon-192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pricing = Route.useLoaderData();
  useEffect(() => {
    initLang();
    // Web de pruebas: ?fecha=... se guarda en una cookie para que la simulación siga al navegar
    // y al pagar. En la web real no se hace nada (y el servidor la ignoraría igualmente).
    if (PRODUCTION_HOSTS.includes(window.location.host)) return;
    const fecha = new URLSearchParams(window.location.search).get("fecha");
    if (fecha === "off") document.cookie = `${SIMULATE_COOKIE}=; path=/; max-age=0`;
    else if (fecha) document.cookie = `${SIMULATE_COOKIE}=${encodeURIComponent(fecha)}; path=/; max-age=86400`;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PricingProvider value={pricing}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <SimulationNotice />
      </PricingProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
