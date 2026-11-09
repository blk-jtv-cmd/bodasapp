import { useEffect, useState } from "react";
import { Copy, ExternalLink, Link2, MailCheck, MessageCircle, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { locale, useI18n, t as tr } from "@/i18n";

/** Código aleatorio para los enlaces (sin letras que se confunden, como l/1 u O/0). */
export function newToken(len = 10) {
  const abc = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

export const rsvpUrl = (token: string) => `${window.location.origin}/rsvp/${token}`;

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.prompt("", text);
    return false;
  }
}

/**
 * Enlace personal de un invitado: lo crea si aún no existe y lo comparte
 * (menú de compartir del móvil o, en el ordenador, copiado al portapapeles).
 */
export async function shareGuestLink(guest: { id: string; name: string; rsvp_token?: string | null }, reload: () => Promise<void>) {
  let token = guest.rsvp_token ?? null;
  if (!token) {
    for (let i = 0; i < 3 && !token; i++) {
      const candidate = newToken();
      const { error } = await supabase.from("guests").update({ rsvp_token: candidate } as never).eq("id", guest.id);
      if (!error) token = candidate;
      else if (!String(error.message).includes("duplicate")) break;
    }
    if (!token) {
      toast.error(tr("No se ha podido crear el enlace"));
      return;
    }
    void reload();
  }
  const url = rsvpUrl(token);
  const first = guest.name.split(" ")[0];
  const text = tr("Hola, {name}: ¡nos casamos! Cuéntanos si vienes desde aquí:", { name: first });
  const touch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  if (touch && navigator.share) {
    try {
      await navigator.share({ text, url });
      return;
    } catch {
      /* cancelado: se copia igualmente */
    }
  }
  await copy(`${text} ${url}`);
  toast.success(tr("Enlace de {name} copiado. Pegadlo en WhatsApp o en un email.", { name: guest.name }));
}

type Settings = {
  rsvp_token: string | null;
  rsvp_open: boolean;
  rsvp_deadline: string | null;
  rsvp_allow_plus: boolean;
  rsvp_message: string;
};

const SETTINGS_COLS = "rsvp_token,rsvp_open,rsvp_deadline,rsvp_allow_plus,rsvp_message";

/** Tarjeta de "Confirmaciones online" en la pestaña de invitados. */
export function RsvpLinkCard({
  weddingId,
  online,
  fresh,
  reload,
}: {
  weddingId: string;
  /** Cuántos invitados han respondido por internet. */
  online: number;
  /** Cuántas personas se han apuntado por el enlace sin estar en la lista. */
  fresh: number;
  reload: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [s, setS] = useState<Settings | null>(null);
  const [missing, setMissing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from("weddings").select(SETTINGS_COLS).eq("id", weddingId).maybeSingle();
      if (!alive) return;
      if (error) setMissing(true);
      else setS(data as unknown as Settings);
    })();
    return () => {
      alive = false;
    };
  }, [weddingId]);

  // Las respuestas llegan solas: al volver a la pestaña y cada dos minutos se recarga la lista.
  useEffect(() => {
    if (!s?.rsvp_token) return;
    const refresh = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", refresh);
    const id = window.setInterval(refresh, 120_000);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(id);
    };
  }, [s?.rsvp_token, reload]);

  if (missing || !s) return null;

  async function save(values: Partial<Settings>) {
    const prev = s;
    setS((cur) => (cur ? { ...cur, ...values } : cur));
    const { error } = await supabase.from("weddings").update(values as never).eq("id", weddingId);
    if (error) {
      setS(prev);
      toast.error(t("No se ha podido guardar"));
      return false;
    }
    return true;
  }

  async function create() {
    for (let i = 0; i < 3; i++) {
      if (await save({ rsvp_token: newToken() })) return;
    }
  }

  const url = s.rsvp_token ? rsvpUrl(s.rsvp_token) : "";
  const closedByDate = !!s.rsvp_deadline && s.rsvp_deadline < new Date().toISOString().slice(0, 10);
  const accepting = s.rsvp_open && !closedByDate;
  const invite = t("¡Nos casamos! Contadnos si venís desde aquí:");

  return (
    <section className="mb-8 rounded-2xl bg-panel p-5 ring-1 ring-foreground/5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-clay-soft text-clay-ink">
          <MailCheck className="size-5" />
        </span>
        <div className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold">{t("Confirmaciones online")}</h2>
            {s.rsvp_token && (
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                  accepting ? "bg-clay-soft text-clay-ink" : "bg-muted text-muted-foreground"
                }`}
              >
                {accepting ? t("Abierto") : t("Cerrado")}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Vuestros invitados responden desde el móvil, sin registrarse, y la lista se actualiza sola.")}
          </p>
        </div>
        {!s.rsvp_token && (
          <button
            onClick={create}
            className="w-full rounded-full bg-clay px-5 py-2 text-sm font-medium hover:bg-clay-ink hover:text-background sm:w-auto"
          >
            {t("Crear el enlace")}
          </button>
        )}
      </div>

      {s.rsvp_token && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 basis-full truncate rounded-lg border border-line bg-background px-3 py-2 text-xs sm:basis-0">
              {url}
            </code>
            <button
              onClick={async () => {
                if (await copy(url)) toast.success(t("Enlace copiado"));
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-clay px-4 py-2 text-xs font-medium hover:bg-clay-ink hover:text-background"
            >
              <Copy className="size-3.5" /> {t("Copiar")}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${invite} ${url}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-background px-4 py-2 text-xs ring-1 ring-line hover:ring-clay-ink"
            >
              <MessageCircle className="size-3.5" /> WhatsApp
            </a>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-background px-4 py-2 text-xs ring-1 ring-line hover:ring-clay-ink"
            >
              <ExternalLink className="size-3.5" /> {t("Verlo como invitado")}
            </a>
            <button
              onClick={() => setShowSettings((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs ring-1 ${
                showSettings ? "bg-clay-soft ring-clay" : "bg-background ring-line hover:ring-clay-ink"
              }`}
            >
              <Settings2 className="size-3.5" /> {t("Opciones")}
            </button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {t("{n} respuestas recibidas por internet", { n: online })}
            {fresh > 0 && ` · ${t("{n} personas nuevas que no estaban en la lista", { n: fresh })}`}
            {s.rsvp_deadline &&
              ` · ${t("hasta el {date}", {
                date: new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long" }).format(new Date(`${s.rsvp_deadline}T12:00`)),
              })}`}
          </p>

          {showSettings && (
            <div className="mt-4 grid gap-4 rounded-2xl bg-background/70 p-4 ring-1 ring-line sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {t("Aceptar respuestas")}
                  <span className="block text-xs text-muted-foreground">
                    {t("Apagadlo para cerrar el enlace cuando ya tengáis la lista")}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={s.rsvp_open}
                  onChange={(e) => save({ rsvp_open: e.target.checked })}
                  className="size-5 shrink-0 accent-clay-ink"
                />
              </label>
              <label className="text-sm">
                {t("Fecha límite para responder")}
                <span className="mt-1 flex items-center gap-2">
                  <input
                    type="date"
                    value={s.rsvp_deadline ?? ""}
                    onChange={(e) => save({ rsvp_deadline: e.target.value || null })}
                    className="rounded-lg border border-line bg-background px-3 py-1.5 text-sm outline-none focus:border-clay-ink"
                  />
                  {s.rsvp_deadline && (
                    <button onClick={() => save({ rsvp_deadline: null })} className="text-xs text-muted-foreground underline">
                      {t("Quitar")}
                    </button>
                  )}
                </span>
              </label>
              <label className="flex items-center justify-between gap-3 text-sm sm:col-span-2">
                <span>
                  {t("Dejar que añadan acompañantes que no están en la lista")}
                  <span className="block text-xs text-muted-foreground">
                    {t("Si lo dejáis apagado, solo pueden responder por los acompañantes que vosotros hayáis previsto")}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={s.rsvp_allow_plus}
                  onChange={(e) => save({ rsvp_allow_plus: e.target.checked })}
                  className="size-5 shrink-0 accent-clay-ink"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                {t("Unas palabras para vuestros invitados (opcional)")}
                <textarea
                  defaultValue={s.rsvp_message}
                  maxLength={600}
                  rows={2}
                  placeholder={t("Ej.: Habrá autobús desde la iglesia. ¡Tenemos muchas ganas de veros!")}
                  onBlur={(e) => {
                    if (e.target.value !== s.rsvp_message) void save({ rsvp_message: e.target.value });
                  }}
                  className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-clay-ink"
                />
              </label>
            </div>
          )}

          <p className="mt-4 flex items-start gap-2 border-t border-line pt-3 text-xs text-muted-foreground">
            <Link2 className="mt-0.5 size-3.5 shrink-0" />
            {t(
              "¿Preferís un enlace para cada uno? Pulsad «Enlace» junto a cada invitado: verá su nombre y sus acompañantes ya puestos, y nadie más podrá responder por él.",
            )}
          </p>
        </>
      )}
    </section>
  );
}
