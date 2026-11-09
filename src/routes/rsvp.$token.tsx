import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarHeart, Clock, Heart, MapPin, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AllergyPicker } from "@/components/allergy-picker";
import { BRAND_NAME } from "@/components/brand";
import { LegalLink } from "@/components/legal-links";
import { LanguageSwitcher } from "@/i18n/switcher";
import { locale, useI18n } from "@/i18n";

export const Route = createFileRoute("/rsvp/$token")({
  head: () => ({
    meta: [
      { title: "¡Nos casamos! Confirmad vuestra asistencia" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RsvpPage,
});

type Companion = {
  id?: string;
  name: string;
  coming: boolean;
  is_child: boolean;
  allergies: string[];
  /** Plaza prevista por la pareja (no se puede quitar, solo decir que no viene). */
  planned: boolean;
};

type Info = {
  status: "ok" | "not_found";
  kind: "general" | "personal";
  partner_one: string;
  partner_two: string;
  wedding_date: string | null;
  ceremony_time: string | null;
  venue: string | null;
  deadline: string | null;
  open: boolean;
  message: string;
  allow_plus: boolean;
  slots?: number;
  guest?: { name: string; rsvp: string; allergies: string[]; comment: string; responded: boolean };
  companions?: { id: string; name: string; rsvp: string; is_child: boolean; allergies: string[] }[];
};

const MAX_NEW = 5;
const inputCls =
  "w-full rounded-xl border border-line bg-background px-4 py-3 text-base outline-none focus:border-clay-ink";

// Nombre automático que pone la app a los acompañantes ("Acompañante de …", en cualquier idioma).
const isAutoName = (n: string) => /^(Acompañante|Plus-one|Accompagnatore|Accompagnant|Acompanhante)/i.test(n);

function RsvpPage() {
  const { token } = Route.useParams();
  const { t, lang } = useI18n();
  const [info, setInfo] = useState<Info | null>(null);
  const [step, setStep] = useState<"name" | "form" | "done">("form");
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("rsvp_get" as never, { p_token: token } as never);
      const d = (error ? { status: "not_found" } : data) as Info;
      setInfo(d);
      if (d.status !== "ok") return;
      if (d.kind === "general") {
        setStep("name");
        return;
      }
      const g = d.guest!;
      setName(g.name);
      if (g.responded) setAttending(g.rsvp === "confirmado");
      setAllergies(g.allergies ?? []);
      setComment(g.comment ?? "");
      setCompanions(
        (d.companions ?? []).map((c) => ({
          id: c.id,
          name: isAutoName(c.name) ? "" : c.name,
          coming: c.rsvp !== "rechazado",
          is_child: c.is_child,
          allergies: c.allergies ?? [],
          planned: true,
        })),
      );
    })();
  }, [token]);

  async function continueWithName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const { data } = await supabase.rpc("rsvp_get" as never, { p_token: token, p_name: name } as never);
    setBusy(false);
    const slots = Number((data as Info | null)?.slots ?? 0);
    setCompanions(
      Array.from({ length: slots }, () => ({ name: "", coming: true, is_child: false, allergies: [], planned: true })),
    );
    setStep("form");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (attending === null) {
      setError(t("Cuéntanos primero si podrás venir"));
      return;
    }
    setError("");
    setBusy(true);
    const answer = {
      name,
      attending,
      allergies,
      comment,
      companions: companions
        .filter((c) => c.planned || c.name.trim())
        .map((c) => ({ id: c.id, name: c.name, coming: c.coming, is_child: c.is_child, allergies: c.allergies })),
    };
    const { data, error: err } = await supabase.rpc("rsvp_submit" as never, { p_token: token, p_answer: answer } as never);
    setBusy(false);
    const status = (data as { status?: string } | null)?.status;
    if (err || status !== "ok") {
      if (status === "closed") setInfo((i) => (i ? { ...i, open: false } : i));
      else setError(t("No se ha podido enviar. Prueba de nuevo en un momento."));
      return;
    }
    setStep("done");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const couple = info
    ? [info.partner_one, info.partner_two].map((n) => n?.trim()).filter(Boolean).join(" & ")
    : "";
  const who = couple || t("la pareja");
  const fmtDate = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale(), opts).format(new Date(`${d}T12:00`));
  const extra = companions.filter((c) => !c.planned).length;
  const canAdd = !!info?.allow_plus && extra < MAX_NEW;
  const setComp = (i: number, v: Partial<Companion>) =>
    setCompanions((cs) => cs.map((c, j) => (j === i ? { ...c, ...v } : c)));

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground" lang={lang}>
      <header className="mx-auto flex w-full max-w-2xl items-center justify-end px-4 pt-4">
        <LanguageSwitcher />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 sm:px-6">
        {!info ? (
          <p className="py-24 text-center text-muted-foreground">{t("Cargando…")}</p>
        ) : info.status !== "ok" ? (
          <div className="py-24 text-center">
            <p className="font-display text-3xl">{t("Este enlace no funciona")}</p>
            <p className="mt-3 text-muted-foreground">
              {t("Puede que esté mal copiado o que ya no exista. Pide que te lo vuelvan a enviar.")}
            </p>
          </div>
        ) : (
          <>
            {/* Cabecera de la boda */}
            <section className="relative overflow-hidden rounded-[2rem] bg-clay-soft/60 px-6 py-10 text-center ring-1 ring-clay/30 sm:px-10">
              <Heart className="mx-auto size-6 text-clay-ink" />
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.3em] text-clay-ink">{t("¡Nos casamos!")}</p>
              {couple && <h1 className="mt-3 text-balance font-display text-4xl leading-tight sm:text-5xl">{couple}</h1>}
              <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                {info.wedding_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarHeart className="size-4 text-clay-ink" />
                    {fmtDate(info.wedding_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                {info.ceremony_time && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-clay-ink" />
                    {info.ceremony_time.slice(0, 5)}
                  </span>
                )}
                {info.venue && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-clay-ink" />
                    {info.venue}
                  </span>
                )}
              </div>
              {info.message && (
                <p className="mx-auto mt-6 max-w-md whitespace-pre-line text-balance font-display text-lg italic leading-snug">
                  “{info.message}”
                </p>
              )}
            </section>

            {step === "done" ? (
              <section className="mt-8 rounded-3xl bg-panel p-8 text-center ring-1 ring-foreground/5">
                <p className="text-4xl">{attending ? "🥂" : "💌"}</p>
                <h2 className="mt-3 font-display text-3xl">
                  {attending ? t("¡Qué ilusión! Te esperamos") : t("Gracias por avisar")}
                </h2>
                <p className="mt-3 text-muted-foreground">
                  {attending
                    ? t("Tu respuesta ya le ha llegado a {couple}.", { couple: who })
                    : t("Te echaremos de menos. Tu respuesta ya le ha llegado a {couple}.", { couple: who })}
                </p>
                {info.kind === "personal" && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {info.deadline
                      ? t("Si cambia algo, vuelve a este mismo enlace antes del {date}.", {
                          date: fmtDate(info.deadline, { day: "numeric", month: "long" }),
                        })
                      : t("Si cambia algo, vuelve a este mismo enlace.")}
                  </p>
                )}
                <button onClick={() => setStep("form")} className="mt-6 text-sm text-clay-ink underline underline-offset-4">
                  {t("Revisar mi respuesta")}
                </button>
              </section>
            ) : !info.open ? (
              <section className="mt-8 rounded-3xl bg-panel p-8 text-center ring-1 ring-foreground/5">
                <h2 className="font-display text-2xl">{t("Las confirmaciones ya están cerradas")}</h2>
                <p className="mt-3 text-muted-foreground">
                  {t("Si necesitas cambiar algo, escribe directamente a {couple}.", { couple: who })}
                </p>
              </section>
            ) : step === "name" ? (
              <form onSubmit={continueWithName} className="mt-8 rounded-3xl bg-panel p-6 ring-1 ring-foreground/5 sm:p-8">
                <h2 className="font-display text-2xl">{t("¿Quién eres?")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("Escribe tu nombre y apellidos completos.")}
                </p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  placeholder={t("Nombre y apellidos")}
                  className={`${inputCls} mt-4`}
                />
                <button
                  disabled={!name.trim() || busy}
                  className="mt-4 w-full rounded-full bg-clay px-6 py-3 font-medium hover:bg-clay-ink hover:text-background disabled:opacity-50"
                >
                  {t("Continuar")}
                </button>
              </form>
            ) : (
              <form onSubmit={submit} className="mt-8 space-y-6">
                <div className="rounded-3xl bg-panel p-6 ring-1 ring-foreground/5 sm:p-8">
                  <h2 className="font-display text-2xl">
                    {t("¡Hola, {name}!", { name: name.trim().split(" ")[0] })}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {info.deadline
                      ? t("¿Podrás acompañarnos? Contéstanos antes del {date}.", {
                          date: fmtDate(info.deadline, { day: "numeric", month: "long" }),
                        })
                      : t("¿Podrás acompañarnos?")}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      { v: true, emoji: "🥳", label: t("¡Sí, allí estaré!") },
                      { v: false, emoji: "😢", label: t("No podré ir") },
                    ].map((o) => (
                      <button
                        key={String(o.v)}
                        type="button"
                        onClick={() => {
                          setAttending(o.v);
                          setError("");
                        }}
                        className={`rounded-2xl px-3 py-5 text-center ring-1 transition ${
                          attending === o.v ? "bg-clay ring-clay-ink" : "bg-background ring-line hover:ring-clay"
                        }`}
                      >
                        <span className="block text-3xl">{o.emoji}</span>
                        <span className="mt-2 block text-sm font-medium">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {attending && (
                  <>
                    <div className="rounded-3xl bg-panel p-6 ring-1 ring-foreground/5 sm:p-8">
                      <h3 className="font-display text-xl">{t("¿Alguna alergia o dieta especial?")}</h3>
                      <p className="mb-3 mt-1 text-sm text-muted-foreground">{t("Marca lo que necesites, o nada si comes de todo.")}</p>
                      <AllergyPicker value={allergies} onChange={setAllergies} />
                    </div>

                    {(companions.length > 0 || info.allow_plus) && (
                      <div className="rounded-3xl bg-panel p-6 ring-1 ring-foreground/5 sm:p-8">
                        <h3 className="font-display text-xl">{t("Quién viene contigo")}</h3>
                        {companions.length === 0 && (
                          <p className="mt-1 text-sm text-muted-foreground">{t("Si vienes con alguien, añádelo aquí.")}</p>
                        )}
                        <ul className="mt-4 space-y-4">
                          {companions.map((c, i) => (
                            <li key={i} className="rounded-2xl bg-background p-4 ring-1 ring-line">
                              <div className="flex items-center gap-2">
                                <input
                                  value={c.name}
                                  onChange={(e) => setComp(i, { name: e.target.value })}
                                  maxLength={120}
                                  placeholder={t("Nombre del acompañante {n}", { n: i + 1 })}
                                  className={`${inputCls} py-2`}
                                />
                                {!c.planned && (
                                  <button
                                    type="button"
                                    aria-label={t("Quitar")}
                                    onClick={() => setCompanions((cs) => cs.filter((_, j) => j !== i))}
                                    className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-clay-soft"
                                  >
                                    <X className="size-4" />
                                  </button>
                                )}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                                {c.planned && (
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={c.coming}
                                      onChange={(e) => setComp(i, { coming: e.target.checked })}
                                      className="size-4 accent-clay-ink"
                                    />
                                    {t("Viene")}
                                  </label>
                                )}
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={c.is_child}
                                    onChange={(e) => setComp(i, { is_child: e.target.checked })}
                                    className="size-4 accent-clay-ink"
                                  />
                                  {t("Es un niño o una niña")}
                                </label>
                              </div>
                              {c.coming && (
                                <div className="mt-3">
                                  <AllergyPicker value={c.allergies} onChange={(v) => setComp(i, { allergies: v })} />
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                        {canAdd && (
                          <button
                            type="button"
                            onClick={() =>
                              setCompanions((cs) => [
                                ...cs,
                                { name: "", coming: true, is_child: false, allergies: [], planned: false },
                              ])
                            }
                            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm ring-1 ring-line hover:ring-clay-ink"
                          >
                            <Plus className="size-4" /> {t("Añadir acompañante")}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {attending !== null && (
                  <div className="rounded-3xl bg-panel p-6 ring-1 ring-foreground/5 sm:p-8">
                    <h3 className="font-display text-xl">{t("¿Algo que quieras contarnos?")}</h3>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder={t("Opcional")}
                      className={`${inputCls} mt-3`}
                    />
                  </div>
                )}

                {error && <p className="text-center text-sm text-clay-ink">{error}</p>}

                <button
                  disabled={busy}
                  className="w-full rounded-full bg-clay-ink px-6 py-4 text-base font-medium text-background hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? t("Enviando…") : t("Enviar respuesta")}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  {t("Tu respuesta solo se usa para organizar la boda.")}{" "}
                  <LegalLink doc="privacidad">{t("Privacidad")}</LegalLink>
                </p>
              </form>
            )}
          </>
        )}
      </main>

      <footer className="pb-8 text-center text-xs text-muted-foreground">
        {t("Organizado con")}{" "}
        <Link to="/" className="font-brand text-base text-foreground">
          {BRAND_NAME}
        </Link>
      </footer>
    </div>
  );
}
