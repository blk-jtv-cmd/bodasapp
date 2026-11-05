import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";

/**
 * Botón oficial de Google (Google Identity Services).
 * El inicio de sesión se hace desde nuestra propia web y luego se entrega a Supabase,
 * así Google muestra "continuar a tubodaenorden.com" en lugar de la dirección de Supabase.
 * Si no hay ID de cliente configurado o el script de Google no carga, se usa el
 * inicio con Google de siempre (a través de Supabase).
 */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GSI_SRC = "https://accounts.google.com/gsi/client";

type GoogleId = {
  initialize: (opts: Record<string, unknown>) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

function loadScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("gsi")));
    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function GoogleButton({
  onSuccess,
  onError,
  onFallback,
}: {
  onSuccess: () => void;
  onError: () => void;
  /** Inicio con Google "clásico" a través de Supabase. */
  onFallback: () => void;
}) {
  const { lang, t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!CLIENT_ID);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    (async () => {
      try {
        await loadScript();
        if (cancelled || !box.current || !window.google) return;
        // Nonce: el original va a Supabase y su huella SHA-256 a Google.
        const rawNonce = crypto.randomUUID() + crypto.randomUUID();
        const hashedNonce = await sha256Hex(rawNonce);
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return onError();
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce: rawNonce,
            });
            if (error) onError();
            else onSuccess();
          },
        });
        box.current.innerHTML = "";
        window.google.accounts.id.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          locale: lang,
          width: Math.min(box.current.offsetWidth || 400, 400),
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Se vuelve a pintar al cambiar de idioma para que el texto del botón coincida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (failed) {
    return (
      <button
        type="button"
        onClick={onFallback}
        className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm font-medium transition-colors hover:bg-clay-soft"
      >
        {t("Continuar con Google")}
      </button>
    );
  }
  return <div ref={box} className="flex min-h-11 w-full justify-center" />;
}
