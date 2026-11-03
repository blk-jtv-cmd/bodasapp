import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n";
import type { LegalDocKey } from "@/legal/types";

export const LEGAL_LABELS: Record<LegalDocKey, string> = {
  "aviso-legal": "Aviso legal",
  privacidad: "Privacidad",
  cookies: "Cookies",
  condiciones: "Condiciones de venta",
};

/** Enlace a un texto legal. */
export function LegalLink({ doc, children, className = "" }: { doc: LegalDocKey; children?: React.ReactNode; className?: string }) {
  const { t } = useI18n();
  return (
    <Link
      to="/legal/$doc"
      params={{ doc }}
      className={`underline decoration-clay/40 underline-offset-4 hover:text-foreground ${className}`}
    >
      {children ?? t(LEGAL_LABELS[doc])}
    </Link>
  );
}

/** Fila de enlaces legales para pies de página. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-2 sm:gap-x-12 text-xs text-muted-foreground ${className}`}>
      {(Object.keys(LEGAL_LABELS) as LegalDocKey[]).map((doc) => (
        <LegalLink key={doc} doc={doc} className="no-underline hover:underline" />
      ))}
    </nav>
  );
}

/**
 * Sustituye {terms} y {privacy} de un texto traducido por enlaces,
 * para que el orden de la frase sea el correcto en cada idioma.
 */
export function withLegalLinks(text: string, t: (k: string) => string) {
  const parts = text.split(/(\{terms\}|\{privacy\})/);
  return parts.map((part, i) =>
    part === "{terms}" ? (
      <LegalLink key={i} doc="condiciones">
        {t("condiciones de venta")}
      </LegalLink>
    ) : part === "{privacy}" ? (
      <LegalLink key={i} doc="privacidad">
        {t("política de privacidad")}
      </LegalLink>
    ) : (
      part
    ),
  );
}
