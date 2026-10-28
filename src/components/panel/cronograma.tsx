import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Pencil, Plus, Trash2, X } from "lucide-react";

export type TimelineItem = { id: string; time_label: string; title: string; owner: string | null };

type Wedding = {
  id: string;
  ceremony_time: string | null;
};

const inputClass =
  "rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-clay";

const timeBtn =
  "rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-clay";

/** Ordena "HH:MM" como minutos del día. Devuelve null si no parsea. */
function toMinutes(label: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(label.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function prettyTime(label: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(label.trim());
  if (!m) return label;
  const h = m[1].padStart(2, "0");
  const min = m[2];
  return `${h}:${min}`;
}

function CeremonyPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [local, setLocal] = useState(value ?? "");

  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-clay" />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Hora de la ceremonia
        </span>
      </div>
      <div className="relative">
        <input
          type="time"
          value={local}
          onChange={(e) => {
            const next = e.target.value;
            setLocal(next);
            onChange(next || null);
          }}
          className={`${timeBtn} w-32`}
          aria-label="Hora de la ceremonia"
        />
      </div>
      {value && (
        <span className="font-display text-2xl font-semibold leading-none text-foreground">
          {prettyTime(value)}
        </span>
      )}
    </div>
  );
}

function EventRow({
  item,
  isCeremony,
  isLast,
  onEdit,
  onDelete,
}: {
  item: TimelineItem;
  isCeremony: boolean;
  isLast: boolean;
  onEdit: (patch: Partial<TimelineItem>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [time, setTime] = useState(item.time_label);
  const [title, setTitle] = useState(item.title);
  const [owner, setOwner] = useState(item.owner ?? "");

  useEffect(() => {
    setTime(item.time_label);
    setTitle(item.title);
    setOwner(item.owner ?? "");
  }, [item.time_label, item.title, item.owner]);

  function save() {
    const patch: Partial<TimelineItem> = {};
    const t = time.trim();
    if (toMinutes(t) !== null && t !== item.time_label) patch.time_label = t;
    if (title.trim() && title.trim() !== item.title) patch.title = title.trim();
    const o = owner.trim();
    if ((o || null) !== item.owner) patch.owner = o || null;
    if (Object.keys(patch).length > 0) onEdit(patch);
    setEditing(false);
  }

  return (
    <li className="relative flex gap-5 sm:gap-6">
      {/* Línea conectora */}
      <div className="relative flex flex-col items-center">
        <span
          className={`mt-1 size-3 shrink-0 rounded-full ring-4 ring-background transition-colors ${
            isCeremony ? "bg-clay" : "bg-line"
          }`}
        />
        {!isLast && <span className="mt-1 w-px flex-1 bg-line" />}
      </div>

      {/* Contenido */}
      <div
        className="-mt-0.5 flex-1 pb-8"
      >
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`${inputClass} w-28`}
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputClass} min-w-[140px] flex-1`}
              placeholder="Momento"
            />
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className={`${inputClass} w-36`}
              placeholder="Responsable"
            />
            <button
              onClick={save}
              className="rounded-full bg-clay px-4 py-1.5 text-xs font-medium text-background hover:bg-foreground"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setTime(item.time_label);
                setTitle(item.title);
                setOwner(item.owner ?? "");
                setEditing(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={`font-mono text-xs ${
                isCeremony ? "font-semibold text-clay" : "text-muted-foreground"
              }`}
            >
              {prettyTime(item.time_label)}
            </span>
            <span
              className={`font-display ${
                isCeremony ? "text-base font-semibold text-foreground" : "text-sm font-medium text-foreground"
              }`}
            >
              {item.title}
            </span>
            {item.owner && (
              <span className="text-xs text-muted-foreground">{item.owner}</span>
            )}
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setEditing(true)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Editar momento"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Borrar momento"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        )}
        {isCeremony && !editing && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-clay">
            Ceremonia
          </p>
        )}
      </div>
    </li>
  );
}

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
  const [form, setForm] = useState({ time_label: "12:00", title: "", owner: "" });
  const [adding, setAdding] = useState(false);

  const ceremonyMin = useMemo(
    () => (wedding.ceremony_time ? toMinutes(wedding.ceremony_time) : null),
    [wedding.ceremony_time],
  );

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const ta = toMinutes(a.time_label);
        const tb = toMinutes(b.time_label);
        if (ta === null && tb === null) return 0;
        if (ta === null) return 1;
        if (tb === null) return -1;
        return ta - tb;
      }),
    [items],
  );

  async function saveCeremonyTime(v: string | null) {
    const previousTime = wedding.ceremony_time;
    const ceremonyItem = items.find((item) => /ceremonia/i.test(item.title));

    setWedding({ ...wedding, ceremony_time: v });

    const weddingUpdate = supabase
      .from("weddings")
      .update({ ceremony_time: v })
      .eq("id", wedding.id);
    const itemUpdate =
      ceremonyItem && v
        ? supabase
            .from("timeline_items")
            .update({ time_label: v })
            .eq("id", ceremonyItem.id)
        : Promise.resolve({ error: null });
    const [{ error: weddingError }, { error: itemError }] = await Promise.all([
      weddingUpdate,
      itemUpdate,
    ]);

    if (weddingError || itemError) {
      setWedding({ ...wedding, ceremony_time: previousTime });
      toast.error("No se ha podido actualizar la hora de la ceremonia");
      return;
    }

    await reload();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (toMinutes(form.time_label) === null) {
      toast.error("Introduce una hora válida (HH:MM)");
      return;
    }
    const { error } = await supabase.from("timeline_items").insert({
      time_label: form.time_label,
      title: form.title.trim(),
      owner: form.owner.trim() || null,
      wedding_id: wedding.id,
      user_id: userId,
    });
    if (error) {
      toast.error("No se ha podido guardar");
      return;
    }
    setForm({ time_label: "12:00", title: "", owner: "" });
    setAdding(false);
    await reload();
  }

  async function updateItem(id: string, patch: Partial<TimelineItem>) {
    const { error } = await supabase.from("timeline_items").update(patch).eq("id", id);
    if (error) {
      toast.error("No se ha podido guardar");
      return;
    }
    await reload();
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from("timeline_items").delete().eq("id", id);
    if (error) {
      toast.error("No se ha podido borrar");
      return;
    }
    await reload();
  }

  const isEmpty = sorted.length === 0;

  return (
    <div className="max-w-2xl">
      {/* Cabecera */}
      <div className="mb-6">
        <h2 className="font-display text-3xl tracking-tight">Cronograma</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          El gran día, hora por hora.
        </p>
      </div>

      {/* Selector de ceremonia */}
      <div className="mb-8 rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
        <CeremonyPicker value={wedding.ceremony_time} onChange={saveCeremonyTime} />
      </div>

      {/* Formulario añadir — visible tanto en estado vacío como con eventos */}
      {adding && (
        <form
          onSubmit={add}
          className="mb-8 flex flex-wrap items-end gap-3 rounded-2xl bg-panel p-5 ring-1 ring-foreground/5"
        >
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Hora
            </span>
            <input
              type="time"
              value={form.time_label}
              onChange={(e) => setForm({ ...form, time_label: e.target.value })}
              className={`${inputClass} w-28`}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Momento
            </span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Qué pasa"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Responsable
            </span>
            <input
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="Quién se encarga"
              className={inputClass}
            />
          </label>
          <button className="rounded-full bg-clay px-5 py-2 text-sm font-medium text-background hover:bg-foreground">
            Añadir
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </form>
      )}

      {isEmpty && !adding ? (
        <div className="rounded-2xl bg-panel px-6 py-16 text-center ring-1 ring-foreground/5">
          <Clock className="mx-auto mb-4 size-10 text-muted-foreground/40" />
          <h3 className="font-display text-2xl font-semibold">Tu gran día, hora por hora.</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Añade los momentos importantes de tu boda y crea tu propio cronograma.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-clay px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground"
          >
            <Plus className="size-4" /> Añadir primer momento
          </button>
        </div>
      ) : isEmpty && adding ? null : (
        <>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-clay hover:text-clay"
            >
              <Plus className="size-4" /> Añadir momento
            </button>
          )}

          {/* Línea temporal */}
          <ol className="relative">
            {sorted.map((item, idx) => {
              const itemMin = toMinutes(item.time_label);
              const isCeremony =
                ceremonyMin !== null && itemMin !== null && itemMin === ceremonyMin;
              return (
                <EventRow
                  key={item.id}
                  item={item}
                  isCeremony={isCeremony}
                  isLast={idx === sorted.length - 1}
                  onEdit={(patch) => updateItem(item.id, patch)}
                  onDelete={() => deleteItem(item.id)}
                />
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
