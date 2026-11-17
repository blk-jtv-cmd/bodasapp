import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Wand2, X } from "lucide-react";
import { useI18n } from "@/i18n";

export type TimelineItem = { id: string; time_label: string; title: string; owner: string | null };

type Wedding = {
  id: string;
  ceremony_time: string | null;
};

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-base outline-none focus:border-clay-ink sm:text-sm";

// ───────────────────────── Horas ─────────────────────────

/** "HH:MM" (o "HH:MM:SS") → minutos del día. null si no es una hora. */
function toMinutes(label: string): number | null {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(label.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function prettyTime(label: string): string {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(label.trim());
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : label;
}

const fromMinutes = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** La fiesta sigue después de medianoche: de 00:00 a 05:59 cuenta como el final del día, no el principio. */
const dayMinutes = (min: number) => (min < 360 ? min + 1440 : min);

function duration(min: number, tr: (k: string, v?: Record<string, string | number>) => string) {
  if (min <= 0) return tr("a la vez");
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return tr("{m} min", { m });
  return m ? tr("{h} h {m}", { h, m: String(m).padStart(2, "0") }) : tr("{h} h", { h });
}

// ───────────────────────── Iconos y fases ─────────────────────────

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const ICONS: [RegExp, string][] = [
  [/ceremonia|iglesia|juzgado|si quiero|votos/, "💒"],
  [/pelu|maquill/, "💄"],
  [/vesti|traje/, "👗"],
  [/foto|video|sesion/, "📸"],
  [/desayuno|cafe/, "☕"],
  [/cocktail|coctel|aperitivo/, "🥂"],
  [/banquete|cena|comida|almuerzo|menu/, "🍽️"],
  [/tarta|pastel/, "🎂"],
  [/baile|vals/, "💃"],
  [/barra|copas/, "🍸"],
  [/discurso|palabras|speech/, "🎤"],
  [/brindis/, "🥂"],
  [/ramo|flores/, "💐"],
  [/regalo|detalle/, "🎁"],
  [/musica|dj|orquesta|concierto/, "🎶"],
  [/autobus|\bbus\b|transporte|coche|salida|traslado/, "🚌"],
  [/llegada|recepcion|invitados/, "🚶"],
  [/fin|cierre|despedida|bengalas|fuegos/, "🎆"],
];
const iconFor = (title: string) => ICONS.find(([re]) => re.test(norm(title)))?.[1] ?? "✨";

type PhaseKey = "prep" | "ceremonia" | "coctel" | "banquete" | "fiesta" | "otros";
const PHASES: { key: PhaseKey; label: string; icon: string; dot: string }[] = [
  { key: "prep", label: "Preparativos", icon: "☀️", dot: "bg-amber-300" },
  { key: "ceremonia", label: "Ceremonia", icon: "💒", dot: "bg-clay-ink" },
  { key: "coctel", label: "Cóctel", icon: "🥂", dot: "bg-clay" },
  { key: "banquete", label: "Banquete", icon: "🍽️", dot: "bg-rose-300" },
  { key: "fiesta", label: "Fiesta", icon: "💃", dot: "bg-violet-300" },
  { key: "otros", label: "Momentos", icon: "✨", dot: "bg-line" },
];

// Colores suaves para las etiquetas de los responsables (siempre el mismo para el mismo nombre).
const OWNER_COLORS = [
  "bg-rose-50 text-rose-800 ring-rose-200",
  "bg-amber-50 text-amber-800 ring-amber-200",
  "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "bg-sky-50 text-sky-800 ring-sky-200",
  "bg-violet-50 text-violet-800 ring-violet-200",
  "bg-orange-50 text-orange-800 ring-orange-200",
];
const ownerColor = (name: string) => {
  let h = 0;
  for (const ch of norm(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return OWNER_COLORS[h % OWNER_COLORS.length];
};

// Día típico, en minutos respecto a la hora de la ceremonia.
const TYPICAL_DAY: { offset: number; title: string; owner?: string }[] = [
  { offset: -300, title: "Peluquería y maquillaje", owner: "Peluquería" },
  { offset: -180, title: "Fotos de los preparativos", owner: "Fotógrafo" },
  { offset: -60, title: "Salida hacia la ceremonia" },
  { offset: -30, title: "Llegada de los invitados" },
  { offset: 45, title: "Fotos con familia y amigos", owner: "Fotógrafo" },
  { offset: 60, title: "Cóctel de bienvenida", owner: "Catering" },
  { offset: 150, title: "Entrada al banquete" },
  { offset: 165, title: "Banquete", owner: "Catering" },
  { offset: 300, title: "Tarta y brindis" },
  { offset: 330, title: "Primer baile", owner: "DJ" },
  { offset: 345, title: "Barra libre y fiesta", owner: "DJ" },
  { offset: 600, title: "Fin de fiesta y autobuses" },
];

type Row = { id: string; time: string; min: number; title: string; owner: string | null; ceremony: boolean; item: TimelineItem | null };

// ───────────────────────── Componente ─────────────────────────

export function Cronograma({
  items,
  wedding,
  setWedding,
  userId,
  reload,
}: {
  items: TimelineItem[];
  wedding: Wedding;
  setWedding: (w: Wedding) => void;
  userId: string;
  reload: () => Promise<void>;
}) {
  const { t: tr } = useI18n();
  const [sheet, setSheet] = useState<TimelineItem | "new" | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [ceremonyLocal, setCeremonyLocal] = useState(wedding.ceremony_time ? prettyTime(wedding.ceremony_time) : "");
  useEffect(() => setCeremonyLocal(wedding.ceremony_time ? prettyTime(wedding.ceremony_time) : ""), [wedding.ceremony_time]);

  const ceremonyMin = wedding.ceremony_time ? toMinutes(wedding.ceremony_time) : null;

  // Todos los momentos (y la ceremonia, si no hay ya uno que se llame así), en orden a lo largo del día.
  const rows = useMemo<Row[]>(() => {
    const list: Row[] = items
      .map((item) => {
        const m = toMinutes(item.time_label);
        return {
          id: item.id,
          time: item.time_label,
          min: m === null ? 99999 : dayMinutes(m),
          title: item.title,
          owner: item.owner,
          ceremony: /ceremonia/i.test(item.title),
          item,
        };
      });
    if (wedding.ceremony_time && ceremonyMin !== null && !list.some((r) => r.ceremony)) {
      list.push({ id: "ceremonia", time: wedding.ceremony_time, min: dayMinutes(ceremonyMin), title: "Ceremonia", owner: null, ceremony: true, item: null });
    }
    return list.sort((a, b) => a.min - b.min || Number(b.ceremony) - Number(a.ceremony));
  }, [items, wedding.ceremony_time, ceremonyMin]);

  // Fases del día: se calculan con la ceremonia y con los momentos que marcan el inicio de cada parte.
  const phaseOf = useMemo(() => {
    const cer = rows.find((r) => r.ceremony)?.min ?? null;
    if (cer === null) return () => "otros" as PhaseKey;
    const first = (re: RegExp, after: number) => rows.find((r) => r.min > after && re.test(norm(r.title)))?.min;
    const coctel = first(/cocktail|coctel|aperitivo/, cer) ?? cer + 60;
    const banquete = first(/banquete|cena|comida|almuerzo/, coctel) ?? coctel + 90;
    const fiesta = first(/baile|barra|fiesta|vals/, banquete) ?? banquete + 180;
    return (r: Row): PhaseKey =>
      r.min >= 99999 ? "otros" : r.ceremony ? "ceremonia" : r.min < cer ? "prep" : r.min < coctel ? "ceremonia" : r.min < banquete ? "coctel" : r.min < fiesta ? "banquete" : "fiesta";
  }, [rows]);

  const owners = useMemo(
    () => Array.from(new Set(items.map((i) => i.owner?.trim()).filter((o): o is string => !!o))).sort(),
    [items],
  );
  const shown = ownerFilter ? rows.filter((r) => r.ceremony || r.owner === ownerFilter) : rows;

  const groups = useMemo(() => {
    const out: { phase: (typeof PHASES)[number]; rows: Row[] }[] = [];
    for (const r of shown) {
      const key = phaseOf(r);
      const last = out[out.length - 1];
      if (last && last.phase.key === key) last.rows.push(r);
      else out.push({ phase: PHASES.find((p) => p.key === key)!, rows: [r] });
    }
    return out;
  }, [shown, phaseOf]);

  async function saveCeremonyTime(v: string | null) {
    const previous = wedding.ceremony_time;
    const ceremonyItem = items.find((i) => /ceremonia/i.test(i.title));
    setWedding({ ...wedding, ceremony_time: v });
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("weddings").update({ ceremony_time: v }).eq("id", wedding.id),
      ceremonyItem && v
        ? supabase.from("timeline_items").update({ time_label: v }).eq("id", ceremonyItem.id)
        : Promise.resolve({ error: null }),
    ]);
    if (e1 || e2) {
      setWedding({ ...wedding, ceremony_time: previous });
      toast.error(tr("No se ha podido actualizar la hora de la ceremonia"));
      return;
    }
    await reload();
  }

  async function loadTypicalDay() {
    const base = ceremonyMin ?? 18 * 60;
    if (items.length > 0 && !window.confirm(tr("Se añadirán los momentos de un día típico a los que ya tenéis. ¿Seguimos?"))) return;
    const existing = new Set(items.map((i) => norm(i.title)));
    const rowsToAdd = TYPICAL_DAY.filter((d) => !existing.has(norm(tr(d.title)))).map((d) => ({
      time_label: fromMinutes(base + d.offset),
      title: tr(d.title),
      owner: d.owner ? tr(d.owner) : null,
      wedding_id: wedding.id,
      user_id: userId,
    }));
    const { error } = await supabase.from("timeline_items").insert(rowsToAdd);
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    if (!wedding.ceremony_time) await saveCeremonyTime(fromMinutes(base));
    toast.success(tr("Día típico cargado. Movedlo y ajustadlo a vuestro gusto."));
    await reload();
  }

  const nextDefaultTime = () => {
    const last = rows.filter((r) => r.min < 99999).at(-1);
    return last ? fromMinutes(last.min + 30) : wedding.ceremony_time ? prettyTime(wedding.ceremony_time) : "12:00";
  };

  return (
    <div className="max-w-3xl">
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-tight">{tr("Cronograma")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("El gran día, hora por hora.")}</p>
        </div>
        <button
          onClick={() => setSheet("new")}
          className="inline-flex items-center gap-2 rounded-full bg-clay px-5 py-2 text-sm font-medium hover:bg-clay-ink hover:text-background"
        >
          <Plus className="size-4" /> {tr("Añadir momento")}
        </button>
      </div>

      {/* Hora de la ceremonia: el centro del día */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-clay-soft/70 p-5 ring-1 ring-clay/40 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-background text-3xl ring-1 ring-clay/40" aria-hidden>
            💒
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-clay-ink">{tr("El sí, quiero")}</p>
            <p className="font-display text-4xl font-semibold leading-none">
              {wedding.ceremony_time ? prettyTime(wedding.ceremony_time) : "—:—"}
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Clock className="size-4 text-clay-ink" />
          <span className="text-muted-foreground">{tr("Hora de la ceremonia")}</span>
          <input
            type="time"
            value={ceremonyLocal}
            onChange={(e) => {
              setCeremonyLocal(e.target.value);
              void saveCeremonyTime(e.target.value || null);
            }}
            className="w-32 rounded-lg border border-line bg-background px-3 py-2 text-base outline-none focus:border-clay-ink sm:text-sm"
            aria-label={tr("Hora de la ceremonia")}
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-panel px-6 py-14 text-center ring-1 ring-foreground/5">
          <p className="text-4xl" aria-hidden>
            🕰️
          </p>
          <h3 className="mt-3 font-display text-2xl font-semibold">{tr("Tu gran día, hora por hora.")}</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {tr("Cargad un día típico ajustado a vuestra hora de ceremonia y luego lo movéis a vuestro gusto.")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={loadTypicalDay}
              className="inline-flex items-center gap-2 rounded-full bg-clay px-5 py-2.5 text-sm font-medium hover:bg-clay-ink hover:text-background"
            >
              <Wand2 className="size-4" /> {tr("Cargar un día típico")}
            </button>
            <button
              onClick={() => setSheet("new")}
              className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm ring-1 ring-line hover:ring-clay-ink"
            >
              <Plus className="size-4" /> {tr("Empezar de cero")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filtro por responsable */}
          {owners.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
              <span className="mr-1 text-muted-foreground">{tr("Ver solo lo de:")}</span>
              <button
                onClick={() => setOwnerFilter(null)}
                className={`rounded-full px-3 py-1.5 ring-1 ${ownerFilter === null ? "bg-clay ring-clay-ink" : "bg-panel ring-line hover:ring-clay-ink"}`}
              >
                {tr("Todos")}
              </button>
              {owners.map((o) => (
                <button
                  key={o}
                  onClick={() => setOwnerFilter(ownerFilter === o ? null : o)}
                  className={`rounded-full px-3 py-1.5 ring-1 ${ownerFilter === o ? "bg-clay ring-clay-ink" : "bg-panel ring-line hover:ring-clay-ink"}`}
                >
                  {o}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-8">
            {groups.map((g, gi) => {
              const timed = g.rows.filter((r) => r.min < 99999);
              const range =
                timed.length > 1
                  ? `${prettyTime(timed[0].time)} – ${prettyTime(timed[timed.length - 1].time)}`
                  : timed[0]
                    ? prettyTime(timed[0].time)
                    : "";
              return (
                <section key={`${g.phase.key}-${gi}`}>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h3 className="flex items-center gap-2 font-display text-2xl">
                      <span aria-hidden>{g.phase.icon}</span> {tr(g.phase.label)}
                    </h3>
                    {range && <span className="font-mono text-xs text-muted-foreground">{range}</span>}
                  </div>

                  <ol>
                    {g.rows.map((r, i) => {
                      const next = g.rows[i + 1] ?? groups[gi + 1]?.rows[0];
                      const gap = next && r.min < 99999 && next.min < 99999 ? next.min - r.min : null;
                      const tight = gap !== null && gap < 15;
                      return (
                        <li key={r.id} className="grid grid-cols-[3.75rem_1.25rem_1fr] gap-x-2 sm:grid-cols-[4.5rem_1.5rem_1fr] sm:gap-x-3">
                          {/* Hora */}
                          <div className="pt-3 text-right">
                            <span className={`font-display text-xl font-semibold leading-none sm:text-2xl ${r.ceremony ? "text-clay-ink" : ""}`}>
                              {r.min < 99999 ? prettyTime(r.time) : "—"}
                            </span>
                          </div>
                          {/* Línea y punto */}
                          <div className="relative flex justify-center">
                            <span className="absolute inset-y-0 w-0.5 bg-clay/40" aria-hidden />
                            <span
                              className={`relative mt-4 size-3.5 rounded-full ring-4 ring-background ${r.ceremony ? "bg-clay-ink" : g.phase.dot}`}
                              aria-hidden
                            />
                          </div>
                          {/* Tarjeta */}
                          <div className="pb-2">
                            {r.ceremony ? (
                              <div className="rounded-2xl bg-clay-soft p-4 ring-1 ring-clay sm:p-5">
                                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-clay-ink">{tr("El gran momento")}</p>
                                <p className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold">
                                  <span aria-hidden>💒</span> {r.item ? r.title : tr("Ceremonia")}
                                </p>
                                {r.item ? (
                                  <button onClick={() => setSheet(r.item)} className="mt-2 text-xs text-clay-ink underline underline-offset-4">
                                    {tr("Editar")}
                                  </button>
                                ) : (
                                  <p className="mt-1 text-xs text-muted-foreground">{tr("La hora se cambia arriba, en «Hora de la ceremonia».")}</p>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => r.item && setSheet(r.item)}
                                className="flex w-full items-center gap-3 rounded-2xl bg-panel p-3.5 text-left ring-1 ring-foreground/5 transition-shadow hover:shadow-[0_10px_24px_-16px_rgba(120,60,70,0.4)] sm:p-4"
                              >
                                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-xl ring-1 ring-foreground/5" aria-hidden>
                                  {iconFor(r.title)}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium leading-snug">{r.title}</span>
                                  {r.owner && (
                                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] ring-1 ${ownerColor(r.owner)}`}>
                                      {r.owner}
                                    </span>
                                  )}
                                </span>
                              </button>
                            )}
                            {gap !== null && (
                              <p className={`py-2 pl-1 font-mono text-[10px] ${tight ? "font-semibold text-orange-600" : "text-muted-foreground"}`}>
                                {tight ? "⚠ " : "↓ "}
                                {duration(gap, tr)}
                                {tight && ` · ${tr("muy justo")}`}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </div>

          {items.length < 4 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-clay/60 px-5 py-4 text-sm">
              <span className="text-muted-foreground">{tr("¿Os ayudamos? Cargad un día típico y ajustadlo.")}</span>
              <button
                onClick={loadTypicalDay}
                className="inline-flex items-center gap-2 rounded-full bg-clay px-4 py-2 text-xs font-medium hover:bg-clay-ink hover:text-background"
              >
                <Wand2 className="size-3.5" /> {tr("Cargar un día típico")}
              </button>
            </div>
          )}
        </>
      )}

      {sheet && (
        <MomentSheet
          item={sheet === "new" ? null : sheet}
          defaultTime={nextDefaultTime()}
          owners={owners}
          onClose={() => setSheet(null)}
          onSave={async (values) => {
            const { error } =
              sheet === "new"
                ? await supabase.from("timeline_items").insert({ ...values, wedding_id: wedding.id, user_id: userId })
                : await supabase.from("timeline_items").update(values).eq("id", sheet.id);
            if (error) {
              toast.error(tr("No se ha podido guardar"));
              return;
            }
            setSheet(null);
            await reload();
          }}
          onDelete={
            sheet === "new"
              ? undefined
              : async () => {
                  if (!window.confirm(tr("¿Borrar {name}?", { name: sheet.title }))) return;
                  const { error } = await supabase.from("timeline_items").delete().eq("id", sheet.id);
                  if (error) {
                    toast.error(tr("No se ha podido borrar"));
                    return;
                  }
                  setSheet(null);
                  await reload();
                }
          }
        />
      )}
    </div>
  );
}

/** Ventana para añadir o editar un momento. */
function MomentSheet({
  item,
  defaultTime,
  owners,
  onClose,
  onSave,
  onDelete,
}: {
  item: TimelineItem | null;
  defaultTime: string;
  owners: string[];
  onClose: () => void;
  onSave: (v: { time_label: string; title: string; owner: string | null }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const { t: tr } = useI18n();
  const [time, setTime] = useState(item ? prettyTime(item.time_label) : defaultTime);
  const [title, setTitle] = useState(item?.title ?? "");
  const [owner, setOwner] = useState(item?.owner ?? "");
  const [busy, setBusy] = useState(false);
  const ideas = ["Fotos", "Cóctel", "Banquete", "Tarta", "Primer baile", "Barra libre", "Autobús"];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (toMinutes(time) === null) {
      toast.error(tr("Introduce una hora válida (HH:MM)"));
      return;
    }
    setBusy(true);
    await onSave({ time_label: time, title: title.trim(), owner: owner.trim() || null });
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-6" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-t-3xl bg-background p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-display text-2xl">
            <span aria-hidden>{iconFor(title)}</span> {item ? tr("Editar momento") : tr("Nuevo momento")}
          </h3>
          <button type="button" onClick={onClose} aria-label={tr("Cerrar")} className="grid size-9 place-items-center rounded-full ring-1 ring-line hover:ring-clay-ink">
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-[7rem_1fr] gap-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Hora")}</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputClass} mt-1`} />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Momento")}</span>
            <input autoFocus={!item} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr("Qué pasa")} className={`${inputClass} mt-1`} />
          </label>
        </div>
        {!item && !title && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ideas.map((i) => (
              <button key={i} type="button" onClick={() => setTitle(tr(i))} className="rounded-full bg-panel px-3 py-1 text-xs ring-1 ring-line hover:ring-clay-ink">
                {iconFor(i)} {tr(i)}
              </button>
            ))}
          </div>
        )}

        <label className="mt-4 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Responsable")}</span>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder={tr("Quién se encarga")} className={`${inputClass} mt-1`} list="tbo-owners" />
          <datalist id="tbo-owners">
            {owners.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </label>

        <div className="mt-6 flex items-center justify-between gap-3">
          {onDelete ? (
            <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" /> {tr("Borrar")}
            </button>
          ) : (
            <span />
          )}
          <button disabled={busy || !title.trim()} className="rounded-full bg-clay px-6 py-2.5 text-sm font-medium hover:bg-clay-ink hover:text-background disabled:opacity-50">
            {item ? tr("Guardar") : tr("Añadir")}
          </button>
        </div>
      </form>
    </div>
  );
}
