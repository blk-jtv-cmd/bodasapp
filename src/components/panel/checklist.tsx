import { useMemo, useState } from "react";
import { ChevronDown, Copy, Lightbulb, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { locale, useI18n } from "@/i18n";
import { catLabel } from "@/lib/category-emoji";
import { TASK_LIBRARY, guideFor, suggestedDue, type Priority } from "@/lib/task-library";

export type ChecklistTask = {
  id: string;
  title: string;
  category: string;
  due_date: string | null;
  done: boolean;
  owner: string;
  notes: string | null;
  priority?: string | null;
  steps?: { text: string; done: boolean }[] | null;
  not_applicable?: boolean;
};

type ChecklistWedding = {
  id: string;
  partner_one: string;
  partner_two: string;
  wedding_date: string | null;
  venue: string | null;
  guest_target: number;
};

export const TASK_CATEGORIES = [
  "General",
  "12 meses antes",
  "10 meses antes",
  "9 meses antes",
  "8 meses antes",
  "6 meses antes",
  "4 meses antes",
  "3 meses antes",
  "2 meses antes",
  "1 mes antes",
  "1 semana antes",
  "Día antes",
  "Día B",
];

const inputClass =
  "rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-clay-ink";
const labelClass = "font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground";

const PRIORITIES: { key: Priority; label: string; cls: string }[] = [
  { key: "alta", label: "Alta", cls: "bg-clay-ink/10 text-clay-ink ring-clay-ink/30" },
  { key: "media", label: "Media", cls: "bg-clay-soft text-foreground/70 ring-clay/40" },
  { key: "baja", label: "Baja", cls: "bg-background text-muted-foreground ring-line" },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

function effectivePriority(t: ChecklistTask): Priority {
  const p = (t.priority ?? guideFor(t.title)?.priority ?? "media") as Priority;
  return PRIORITIES.some((x) => x.key === p) ? p : "media";
}

function effectiveSteps(t: ChecklistTask) {
  if (t.steps && t.steps.length) return t.steps;
  return (guideFor(t.title)?.steps ?? []).map((text) => ({ text, done: false }));
}

function shortDate(iso: string) {
  return new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short" }).format(new Date(`${iso}T12:00:00`));
}

export function Checklist({
  tasks,
  setTasks,
  wedding,
  userId,
  reload,
}: {
  tasks: ChecklistTask[];
  setTasks: (t: ChecklistTask[]) => void;
  wedding: ChecklistWedding;
  userId: string;
  reload: () => Promise<void>;
}) {
  const { t: tr } = useI18n();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [owner, setOwner] = useState<string | null>(null); // null = todos
  const [status, setStatus] = useState<"todas" | "pendientes" | "completadas">("todas");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [sheet, setSheet] = useState<ChecklistTask | "new" | null>(null);

  const people = [wedding.partner_one || tr("Novia"), wedding.partner_two || tr("Novio"), "Ambos"];
  const due = (t: ChecklistTask) => t.due_date ?? suggestedDue(t.category, wedding.wedding_date);

  async function patchTask(id: string, values: Partial<ChecklistTask>) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...values } : t)));
    const { error } = await supabase.from("tasks").update(values).eq("id", id);
    if (error) toast.error(tr("No se ha podido guardar"));
  }

  const active = tasks.filter((t) => !t.not_applicable);
  const completed = active.filter((t) => t.done).length;
  const percent = active.length ? Math.round((completed / active.length) * 100) : 0;
  const q = query.trim().toLowerCase();

  const visible = tasks.filter((t) => {
    if (owner !== null && (t.owner || "") !== owner) return false;
    if (status === "pendientes" && (t.done || t.not_applicable)) return false;
    if (status === "completadas" && !t.done) return false;
    if (q && !tr(t.title).toLowerCase().includes(q) && !(t.notes ?? "").toLowerCase().includes(q)) return false;
    return true;
  });

  const folders = useMemo(() => {
    const order = Array.from(new Set([...TASK_CATEGORIES, ...tasks.map((t) => t.category)]));
    return order
      .map((cat) => {
        const all = tasks.filter((t) => t.category === cat);
        const shown = visible
          .filter((t) => t.category === cat)
          .sort((a, b) => Number(a.done) - Number(b.done) || (due(a) ?? "9").localeCompare(due(b) ?? "9"));
        const act = all.filter((t) => !t.not_applicable);
        const late = act.filter((t) => !t.done && (due(t) ?? "9") < todayIso()).length;
        return { cat, all, shown, done: act.filter((t) => t.done).length, total: act.length, late };
      })
      .filter((f) => f.shown.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, visible.length, owner, status, q, wedding.wedding_date]);

  const missing = TASK_LIBRARY.filter((g) => !tasks.some((t) => t.title === g.title));

  async function addSuggested() {
    const { error } = await supabase
      .from("tasks")
      .insert(missing.map((g) => ({ title: g.title, category: g.category, wedding_id: wedding.id, user_id: userId })));
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    toast.success(tr("Tareas añadidas"));
    await reload();
  }

  const chip = (activeChip: boolean) =>
    `rounded-full px-3 py-1.5 text-xs ring-1 transition-colors ${
      activeChip ? "bg-clay text-foreground ring-clay" : "bg-panel text-muted-foreground ring-line hover:text-foreground"
    }`;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-tight">{tr("Checklist")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("Todo lo que hay que hacer, mes a mes.")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => {
              setSearching((s) => !s);
              setQuery("");
            }}
            aria-label={tr("Buscar")}
            className="grid size-10 place-items-center rounded-full bg-panel ring-1 ring-line hover:ring-clay-ink"
          >
            <Search className="size-4" />
          </button>
          <button
            onClick={() => setSheet("new")}
            aria-label={tr("Nueva tarea")}
            className="grid size-10 place-items-center rounded-full bg-clay text-foreground hover:bg-clay-ink hover:text-background"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </div>

      {searching && (
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr("Buscar tarea…")}
          className={`${inputClass} mb-4 w-full`}
        />
      )}

      <div className="mb-6 rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-clay-ink">{tr("Progreso")}</span>
          <span className="text-sm text-muted-foreground">
            {tr("{done} de {total} tareas", { done: completed, total: active.length })} ·{" "}
            <span className="font-medium text-foreground">{percent}%</span>
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-clay-soft">
          <div className="h-full rounded-full bg-clay transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setOwner(null)} className={chip(owner === null)}>
            {tr("Todos")}
          </button>
          {people.map((p) => (
            <button key={p} onClick={() => setOwner(p)} className={chip(owner === p)}>
              {tr(p)}
            </button>
          ))}
          <button onClick={() => setOwner("")} className={chip(owner === "")}>
            {tr("Sin asignar")}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["todas", "pendientes", "completadas"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={chip(status === s)}>
              {tr(s === "todas" ? "Todas" : s === "pendientes" ? "Pendientes" : "Completadas")}
            </button>
          ))}
        </div>
      </div>

      {/* Carpetas: se abren al pulsarlas (o solas al buscar) */}
      <div className="space-y-3">
        {folders.map((f) => {
          const isOpen = !!open[f.cat] || !!q;
          const pct = f.total ? Math.round((f.done / f.total) * 100) : 0;
          return (
            <section key={f.cat} className="overflow-hidden rounded-2xl bg-panel ring-1 ring-foreground/5">
              <button
                onClick={() => setOpen({ ...open, [f.cat]: !open[f.cat] })}
                className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-display text-lg font-semibold">{catLabel(f.cat, tr)}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {f.done}/{f.total}
                    </span>
                    {f.late > 0 && (
                      <span className="rounded-full bg-clay-ink/10 px-2 py-0.5 font-mono text-[10px] text-clay-ink">
                        {tr("{n} con retraso", { n: f.late })}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-clay-soft">
                    <div className="h-full rounded-full bg-clay" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <ul className="space-y-2 border-t border-line bg-background/60 p-3 sm:p-4">
                  {f.shown.map((t) => {
                    const d = due(t);
                    const late = !t.done && !t.not_applicable && d !== null && d < todayIso();
                    const steps = effectiveSteps(t);
                    const pr = PRIORITIES.find((p) => p.key === effectivePriority(t))!;
                    return (
                      <li key={t.id} className="flex items-start gap-3 rounded-xl bg-panel px-3 py-3 ring-1 ring-foreground/5">
                        <input
                          type="checkbox"
                          checked={t.done}
                          disabled={t.not_applicable}
                          onChange={() => patchTask(t.id, { done: !t.done })}
                          className="mt-1 size-4 shrink-0 accent-clay-ink"
                          aria-label={tr(t.title)}
                        />
                        <button onClick={() => setSheet(t)} className="min-w-0 flex-1 text-left">
                          <div
                            className={`text-sm ${
                              t.done || t.not_applicable ? "text-muted-foreground line-through" : "font-medium"
                            }`}
                          >
                            {tr(t.title)}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                            {t.not_applicable ? (
                              <span className="rounded-full bg-background px-2 py-0.5 text-muted-foreground ring-1 ring-line">
                                {tr("No aplica")}
                              </span>
                            ) : (
                              <>
                                {d && (
                                  <span className={late ? "font-medium text-clay-ink" : "text-muted-foreground"}>
                                    {tr("Límite: {date}", { date: shortDate(d) })}
                                  </span>
                                )}
                                <span className="rounded-full bg-background px-2 py-0.5 text-muted-foreground ring-1 ring-line">
                                  {t.owner ? tr(t.owner) : tr("Sin asignar")}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 ring-1 ${pr.cls}`}>{tr(pr.label)}</span>
                                {steps.length > 0 && (
                                  <span className="text-muted-foreground">
                                    ✓ {steps.filter((s) => s.done).length}/{steps.length}
                                  </span>
                                )}
                                {guideFor(t.title) && (
                                  <span className="text-muted-foreground">· {tr("Con guía")}</span>
                                )}
                              </>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
        {folders.length === 0 && (
          <p className="rounded-2xl bg-panel p-6 text-center text-sm text-muted-foreground">
            {q ? tr("No hay tareas que coincidan.") : tr("No hay tareas en este filtro.")}
          </p>
        )}
      </div>

      {missing.length > 0 && !q && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-clay/60 px-5 py-4 text-sm">
          <span className="text-muted-foreground">
            {tr("Hay {n} tareas sugeridas que aún no tenéis en vuestra lista.", { n: missing.length })}
          </span>
          <button onClick={addSuggested} className="rounded-full bg-clay px-4 py-2 text-xs font-medium hover:bg-clay-ink hover:text-background">
            {tr("Añadirlas")}
          </button>
        </div>
      )}

      {sheet && (
        <TaskSheet
          task={sheet === "new" ? null : sheet}
          wedding={wedding}
          userId={userId}
          people={people}
          onClose={() => setSheet(null)}
          onSaved={async () => {
            setSheet(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function TaskSheet({
  task,
  wedding,
  userId,
  people,
  onClose,
  onSaved,
}: {
  task: ChecklistTask | null;
  wedding: ChecklistWedding;
  userId: string;
  people: string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t: tr } = useI18n();
  const guide = task ? guideFor(task.title) : undefined;
  const [title, setTitle] = useState(task ? tr(task.title) : "");
  const [category, setCategory] = useState(task?.category ?? "General");
  const [owner, setOwner] = useState(task?.owner ?? "");
  const [priority, setPriority] = useState<Priority>(task ? effectivePriority(task) : "media");
  const [dueDate, setDueDate] = useState<string>(task?.due_date ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [steps, setSteps] = useState(task ? effectiveSteps(task) : []);
  const [newStep, setNewStep] = useState("");
  const [na, setNa] = useState(!!task?.not_applicable);
  const [saving, setSaving] = useState(false);

  const suggested = suggestedDue(category, wedding.wedding_date);
  const categories = Array.from(new Set([...TASK_CATEGORIES, category]));

  const template = guide?.template
    ? tr(guide.template)
        .replaceAll(
          "[FECHA]",
          wedding.wedding_date
            ? new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long", year: "numeric" }).format(
                new Date(`${wedding.wedding_date}T12:00:00`),
              )
            : "[FECHA]",
        )
        .replaceAll("[LUGAR]", wedding.venue || "[LUGAR]")
        .replaceAll("[Nº]", wedding.guest_target ? String(wedding.guest_target) : "[Nº]")
    : null;

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    const values = {
      // Las tareas sugeridas se muestran traducidas: el texto solo se guarda si se ha cambiado.
      title: task && title.trim() === tr(task.title) ? task.title : title.trim(),
      category,
      owner,
      priority,
      due_date: dueDate || null,
      notes,
      steps,
      not_applicable: na,
    };
    const { error } = task
      ? await supabase.from("tasks").update(values).eq("id", task.id)
      : await supabase.from("tasks").insert({ ...values, wedding_id: wedding.id, user_id: userId });
    setSaving(false);
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    await onSaved();
  }

  async function remove() {
    if (!task || !window.confirm(tr("¿Borrar {name}?", { name: tr(task.title) }))) return;
    await supabase.from("tasks").delete().eq("id", task.id);
    await onSaved();
  }

  const pill = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-xs ring-1 ${on ? "bg-clay text-foreground ring-clay" : "bg-background text-muted-foreground ring-line"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-background p-5 shadow-xl sm:rounded-3xl sm:p-7"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl">{task ? tr("Detalle de la tarea") : tr("Nueva tarea")}</h3>
          <div className="flex gap-2">
            {task && (
              <button onClick={remove} aria-label={tr("Borrar")} className="grid size-9 place-items-center rounded-full bg-panel text-muted-foreground hover:text-clay-ink">
                <Trash2 className="size-4" />
              </button>
            )}
            <button onClick={onClose} aria-label={tr("Cerrar")} className="grid size-9 place-items-center rounded-full bg-panel">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {guide && (
          <div className="mb-5 space-y-2">
            {guide.tip && (
              <div className="flex gap-2 rounded-xl bg-clay-soft/70 px-4 py-3 text-sm">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-clay-ink" />
                <span>{tr(guide.tip)}</span>
              </div>
            )}
            <div className="rounded-xl bg-panel px-4 py-3 ring-1 ring-foreground/5">
              <div className={labelClass}>{tr("La daréis por hecha cuando…")}</div>
              <p className="mt-1 text-sm">{tr(guide.done)}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{tr("Tarea")}</span>
            <input autoFocus={!task} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </label>

          <div>
            <div className={labelClass}>{tr("Pasos")}</div>
            <ul className="mt-2 space-y-1.5">
              {steps.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => setSteps(steps.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
                    className="size-4 accent-clay-ink"
                  />
                  <span className={`flex-1 ${s.done ? "text-muted-foreground line-through" : ""}`}>{tr(s.text)}</span>
                  <button
                    onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                    aria-label={tr("Quitar")}
                    className="text-muted-foreground hover:text-clay-ink"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newStep.trim()) return;
                setSteps([...steps, { text: newStep.trim(), done: false }]);
                setNewStep("");
              }}
              className="mt-2 flex gap-2"
            >
              <input value={newStep} onChange={(e) => setNewStep(e.target.value)} placeholder={tr("Añadir paso…")} className={`${inputClass} flex-1`} />
              <button className="grid size-9 place-items-center rounded-full bg-panel ring-1 ring-line" aria-label={tr("Añadir paso…")}>
                <Plus className="size-4" />
              </button>
            </form>
          </div>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>{tr("Carpeta")}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {catLabel(c, tr)}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className={labelClass}>{tr("Responsable")}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...people, ""].map((p) => (
                <button key={p || "-"} type="button" onClick={() => setOwner(p)} className={pill(owner === p)}>
                  {p ? tr(p) : tr("Sin asignar")}
                </button>
              ))}
              {owner && !people.includes(owner) && <span className={pill(true)}>{owner}</span>}
            </div>
          </div>

          <div>
            <div className={labelClass}>{tr("Prioridad")}</div>
            <div className="mt-2 flex gap-2">
              {PRIORITIES.map((p) => (
                <button key={p.key} type="button" onClick={() => setPriority(p.key)} className={pill(priority === p.key)}>
                  {tr(p.label)}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>{tr("Fecha límite")}</span>
            <input
              type="date"
              value={dueDate || suggested || ""}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
            {suggested && dueDate && dueDate !== suggested && (
              <button type="button" onClick={() => setDueDate("")} className="self-start text-xs text-clay-ink underline underline-offset-4">
                {tr("Volver a la fecha sugerida ({date})", { date: shortDate(suggested) })}
              </button>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>{tr("Notas")}</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
          </label>

          {template && (
            <div className="rounded-xl bg-panel px-4 py-3 ring-1 ring-foreground/5">
              <div className="flex items-center justify-between gap-2">
                <span className={labelClass}>{tr("Mensaje listo para enviar")}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(template);
                    toast.success(tr("Copiado"));
                  }}
                  className="flex items-center gap-1 text-xs text-clay-ink"
                >
                  <Copy className="size-3.5" /> {tr("Copiar")}
                </button>
              </div>
              <p className="mt-2 text-sm italic text-muted-foreground">{template}</p>
            </div>
          )}

          {task && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={na} onChange={(e) => setNa(e.target.checked)} className="size-4 accent-clay-ink" />
              {tr("No aplica a nuestra boda")}
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-line px-5 py-2 text-sm">
            {tr("Cancelar")}
          </button>
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className="rounded-full bg-clay px-6 py-2 text-sm font-medium hover:bg-clay-ink hover:text-background disabled:opacity-60"
          >
            {saving ? tr("Un momento…") : tr("Guardar")}
          </button>
        </div>
      </div>
    </div>
  );
}
