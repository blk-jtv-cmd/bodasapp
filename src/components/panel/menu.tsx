import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { currencySymbol, formatMoney } from "@/lib/currency";
import { useWeddingRows } from "./use-rows";
import { NumberField, TextField, fieldClass } from "./fields";
import { useI18n } from "@/i18n";

type MenuItem = {
  id: string;
  moment: string;
  dish: string;
  restriction: string;
  vendor: string;
  price_per_person: number;
  people: number;
  covers_restrictions: boolean;
  notes: string;
  courses: Course[] | null;
};

type Course = { course: string; dish: string };

/** Cuántas personas hay en la lista (sin contar a quien ha dicho que no). */
export type MenuGuestInfo = { adults: number; kids: number };

const MOMENTS = ["Aperitivo", "Menú", "Bebida", "Barra libre", "Otro"];
const MOMENT_ICON: Record<string, string> = {
  Aperitivo: "🥂",
  Menú: "🍽️",
  Bebida: "🍷",
  "Barra libre": "🍸",
  Otro: "✨",
};
const COURSES = ["Entrante", "Primer plato", "Pescado", "Carne", "Principal", "Sorbete", "Postre", "Otro"];
const RESTRICTIONS = ["Estándar", "Vegetariano", "Vegano", "Sin gluten", "Infantil"];
const RESTRICTION_STYLE: Record<string, string> = {
  Vegetariano: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Vegano: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "Sin gluten": "bg-amber-50 text-amber-800 ring-amber-200",
  Infantil: "bg-sky-50 text-sky-800 ring-sky-200",
};

function Label({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{children}</span>;
}

export function Menu({
  weddingId,
  userId,
  currency,
  guests,
}: {
  weddingId: string;
  userId: string;
  currency: string;
  guests?: MenuGuestInfo;
}) {
  const { t: tr } = useI18n();
  const { rows, loading, add, patch, remove } = useWeddingRows<MenuItem>("menu_items", weddingId);
  const [editing, setEditing] = useState<string | null>(null);

  const lineTotal = (r: MenuItem) => Number(r.price_per_person) * Number(r.people);
  const total = useMemo(() => rows.reduce((s, r) => s + lineTotal(r), 0), [rows]);
  // Lo que cuesta un invitado adulto que lo toma todo: suma de los precios por persona que no son infantiles.
  const perAdult = useMemo(
    () => rows.filter((r) => r.restriction !== "Infantil" && r.moment !== "Menú").reduce((s, r) => s + Number(r.price_per_person), 0) +
      Math.max(0, ...rows.filter((r) => r.moment === "Menú" && r.restriction !== "Infantil").map((r) => Number(r.price_per_person))),
    [rows],
  );

  const groups = useMemo(() => {
    const order = Array.from(new Set([...MOMENTS, ...rows.map((r) => r.moment)]));
    return order
      .map((m) => ({ moment: m, items: rows.filter((r) => r.moment === m) }))
      .filter((g) => g.items.length > 0);
  }, [rows]);

  async function create(moment: string, extra: Partial<MenuItem> = {}) {
    const people = extra.restriction === "Infantil" ? guests?.kids : guests?.adults;
    const row = await add(
      { moment, courses: moment === "Menú" ? [] : null, people: people || 0, ...extra } as Partial<MenuItem>,
      userId,
    );
    if (row) setEditing(row.id);
  }

  const editingRow = rows.find((r) => r.id === editing) ?? null;

  const addButtons = (
    <div className="flex flex-wrap gap-2">
      {MOMENTS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => create(m)}
          className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3.5 py-2 text-sm ring-1 ring-line transition-colors hover:ring-clay-ink"
        >
          <Plus className="size-3.5 text-clay-ink" />
          <span aria-hidden>{MOMENT_ICON[m]}</span> {tr(m)}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-3xl tracking-tight">{tr("Menú y catering")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tr("Aperitivo, menús cerrados con sus platos, bebida y barra libre. El total se calcula solo.")}
        </p>
      </div>

      {loading ? null : rows.length === 0 ? (
        <div className="rounded-3xl bg-panel px-6 py-12 text-center ring-1 ring-foreground/5">
          <p className="text-4xl" aria-hidden>
            🍽️
          </p>
          <h3 className="mt-3 font-display text-2xl font-semibold">{tr("Vuestro menú está vacío")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {tr("Empezad por lo típico y luego lo ajustáis con lo que os pase el catering:")}
          </p>
          <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">
            {[
              { m: "Aperitivo", label: "Aperitivo de bienvenida" },
              { m: "Menú", label: "Menú principal" },
              { m: "Menú", label: "Menú infantil", restriction: "Infantil" },
              { m: "Barra libre", label: "Barra libre" },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => create(s.m, { dish: tr(s.label), restriction: s.restriction ?? "Estándar" })}
                className="inline-flex items-center gap-1.5 rounded-full bg-clay px-4 py-2 text-sm font-medium hover:bg-clay-ink hover:text-background"
              >
                <Plus className="size-3.5" /> {MOMENT_ICON[s.m]} {tr(s.label)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-clay-soft p-5 ring-1 ring-clay/50 sm:col-span-1">
              <Label>{tr("Total catering")}</Label>
              <div className="mt-2 font-display text-4xl font-semibold leading-none">{formatMoney(total, currency)}</div>
            </div>
            <div className="rounded-3xl bg-panel p-5 ring-1 ring-foreground/5">
              <Label>{tr("Por invitado adulto")}</Label>
              <div className="mt-2 font-display text-3xl font-semibold leading-none">
                {perAdult ? formatMoney(perAdult, currency) : "—"}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{tr("Aperitivo + menú + bebida, aprox.")}</p>
            </div>
            <div className="rounded-3xl bg-panel p-5 ring-1 ring-foreground/5">
              <Label>{tr("En la lista")}</Label>
              <div className="mt-2 font-display text-3xl font-semibold leading-none">
                {guests ? guests.adults + guests.kids : "—"}
              </div>
              {guests && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {tr("{adults} adultos · {kids} niños", { adults: guests.adults, kids: guests.kids })}
                </p>
              )}
            </div>
          </div>

          <div className="mb-8">{addButtons}</div>

          {/* Por momentos del banquete, en el orden en que se sirven */}
          <div className="space-y-10">
            {groups.map((g) => {
              const subtotal = g.items.reduce((s, r) => s + lineTotal(r), 0);
              return (
                <section key={g.moment}>
                  <div className="mb-3 flex items-end justify-between gap-3 border-b border-line pb-2">
                    <h3 className="flex items-center gap-2 font-display text-2xl">
                      <span aria-hidden>{MOMENT_ICON[g.moment] ?? "✨"}</span> {tr(g.moment)}
                    </h3>
                    {subtotal > 0 && (
                      <span className="font-mono text-xs text-muted-foreground">{formatMoney(subtotal, currency)}</span>
                    )}
                  </div>
                  <div className={`grid gap-4 ${g.moment === "Menú" ? "md:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
                    {g.items.map((r) =>
                      r.moment === "Menú" ? (
                        <MenuCard key={r.id} r={r} currency={currency} onEdit={() => setEditing(r.id)} />
                      ) : (
                        <ItemCard key={r.id} r={r} currency={currency} onEdit={() => setEditing(r.id)} />
                      ),
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      {editingRow && (
        <EditSheet
          r={editingRow}
          currency={currency}
          onPatch={(values) => patch(editingRow.id, values)}
          onDelete={() => {
            if (window.confirm(editingRow.dish ? tr("¿Borrar {name}?", { name: editingRow.dish }) : tr("¿Borrar esta línea?"))) {
              remove(editingRow.id);
              setEditing(null);
            }
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function PriceLine({ r, currency }: { r: MenuItem; currency: string }) {
  const { t: tr } = useI18n();
  const line = Number(r.price_per_person) * Number(r.people);
  if (!r.price_per_person && !r.people) return <span className="text-xs text-muted-foreground">{tr("Sin precio todavía")}</span>;
  return (
    <span className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-xs text-muted-foreground">
        {formatMoney(Number(r.price_per_person), currency)} × {r.people} {tr("pers.")}
      </span>
      <span className="font-display text-xl font-semibold">{line ? formatMoney(line, currency) : "—"}</span>
    </span>
  );
}

function RestrictionChip({ r }: { r: MenuItem }) {
  const { t: tr } = useI18n();
  if (!r.restriction || r.restriction === "Estándar") return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${RESTRICTION_STYLE[r.restriction] ?? "bg-background ring-line"}`}>
      {tr(r.restriction)}
    </span>
  );
}

/** Un menú cerrado, presentado como la carta impresa de una boda. */
function MenuCard({ r, currency, onEdit }: { r: MenuItem; currency: string; onEdit: () => void }) {
  const { t: tr } = useI18n();
  const courses = (r.courses ?? []).filter((c) => c.dish.trim());
  return (
    <article className="group relative flex flex-col rounded-3xl bg-panel p-1.5 ring-1 ring-foreground/5">
      <button
        type="button"
        onClick={onEdit}
        className="flex flex-1 flex-col rounded-[1.3rem] border border-clay/50 px-6 pb-5 pt-6 text-center transition-colors hover:border-clay-ink"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-clay-ink">{tr("Menú")}</span>
          <RestrictionChip r={r} />
        </span>
        <span className="mt-2 font-display text-2xl font-semibold leading-tight">{r.dish || tr("Menú sin nombre")}</span>
        <span className="my-4 flex items-center justify-center gap-3 text-clay" aria-hidden>
          <span className="h-px w-10 bg-clay/60" />✦<span className="h-px w-10 bg-clay/60" />
        </span>
        {courses.length > 0 ? (
          <span className="space-y-3">
            {courses.map((c, i) => (
              <span key={i} className="block">
                <span className="block font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{tr(c.course)}</span>
                <span className="mt-0.5 block font-display text-lg italic leading-snug">{c.dish}</span>
              </span>
            ))}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{tr("Pulsad para añadir los platos")}</span>
        )}
        <span className="mt-auto block pt-5">
          <span className="block border-t border-dashed border-line pt-3 text-left">
            {r.vendor && <span className="mb-1 block text-xs text-muted-foreground">{r.vendor}</span>}
            <PriceLine r={r} currency={currency} />
          </span>
        </span>
      </button>
      <Pencil className="pointer-events-none absolute right-5 top-5 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </article>
  );
}

function ItemCard({ r, currency, onEdit }: { r: MenuItem; currency: string; onEdit: () => void }) {
  const { t: tr } = useI18n();
  return (
    <button
      type="button"
      onClick={onEdit}
      className="group flex flex-col rounded-3xl bg-panel p-5 text-left ring-1 ring-foreground/5 transition-shadow hover:shadow-[0_12px_30px_-18px_rgba(120,60,70,0.35)]"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-display text-xl font-semibold leading-tight">{r.dish || tr("Sin nombre")}</span>
        <Pencil className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {r.vendor && <span>{r.vendor}</span>}
        <RestrictionChip r={r} />
      </span>
      {r.notes && <span className="mt-2 line-clamp-2 text-xs text-muted-foreground">{r.notes}</span>}
      <span className="mt-auto block pt-4">
        <PriceLine r={r} currency={currency} />
      </span>
    </button>
  );
}

/** Ventana para editar una línea del menú. Cada campo se guarda solo al salir de él. */
function EditSheet({
  r,
  currency,
  onPatch,
  onDelete,
  onClose,
}: {
  r: MenuItem;
  currency: string;
  onPatch: (values: Partial<MenuItem>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t: tr } = useI18n();
  const courses = r.courses ?? [];
  const setCourses = (c: Course[]) => onPatch({ courses: c });
  const nextCourse = () => {
    const used = courses.map((c) => c.course);
    return ["Entrante", "Principal", "Postre"].find((c) => !used.includes(c)) ?? "Otro";
  };
  const line = Number(r.price_per_person) * Number(r.people);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto overflow-x-hidden rounded-t-3xl bg-background p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-display text-2xl">
            <span aria-hidden>{MOMENT_ICON[r.moment] ?? "✨"}</span> {tr(r.moment)}
          </h3>
          <button onClick={onClose} aria-label={tr("Cerrar")} className="grid size-9 place-items-center rounded-full ring-1 ring-line hover:ring-clay-ink">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <Label>{r.moment === "Menú" ? tr("Nombre del menú") : tr("Plato / producto")}</Label>
            <TextField
              value={r.dish}
              onSave={(dish) => onPatch({ dish })}
              placeholder={r.moment === "Menú" ? tr("Ej.: Menú Gran Gala") : tr("Ej.: Jamón ibérico y croquetas")}
              className="mt-1"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label>{tr("Momento")}</Label>
              <select value={r.moment} onChange={(e) => onPatch({ moment: e.target.value })} className={`${fieldClass} mt-1`}>
                {(MOMENTS.includes(r.moment) ? MOMENTS : [r.moment, ...MOMENTS]).map((o) => (
                  <option key={o} value={o}>
                    {MOMENT_ICON[o] ?? ""} {tr(o)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <Label>{tr("Proveedor")}</Label>
              <TextField value={r.vendor} onSave={(vendor) => onPatch({ vendor })} placeholder={tr("Catering")} className="mt-1" />
            </label>
          </div>

          <div>
            <Label>{tr("Restricciones")}</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {RESTRICTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => onPatch({ restriction: o })}
                  className={`rounded-full px-3 py-1.5 text-xs ring-1 transition-colors ${
                    (r.restriction || "Estándar") === o ? "bg-clay ring-clay-ink" : "bg-panel ring-line hover:ring-clay-ink"
                  }`}
                >
                  {tr(o)}
                </button>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={r.covers_restrictions}
                onChange={(e) => onPatch({ covers_restrictions: e.target.checked })}
                className="size-4 accent-clay-ink"
              />
              {tr("Cubre restricciones")}
            </label>
          </div>

          {r.moment === "Menú" && (
            <div className="rounded-2xl bg-panel p-4 ring-1 ring-foreground/5">
              <Label>{tr("Platos incluidos en el menú")}</Label>
              <div className="mt-2 space-y-2">
                {courses.length === 0 && (
                  <p className="text-sm text-muted-foreground">{tr("Añadid los platos que incluye este menú.")}</p>
                )}
                {courses.map((c, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl bg-background p-2 ring-1 ring-line sm:grid-cols-[8.5rem_1fr_auto] sm:bg-transparent sm:p-0 sm:ring-0"
                  >
                    <select
                      value={c.course}
                      onChange={(e) => setCourses(courses.map((x, j) => (j === i ? { ...x, course: e.target.value } : x)))}
                      className="w-full min-w-0 rounded-lg border border-line bg-panel px-3 py-2 text-base outline-none focus:border-clay-ink sm:bg-background sm:text-sm"
                    >
                      {(COURSES.includes(c.course) ? COURSES : [c.course, ...COURSES]).map((o) => (
                        <option key={o} value={o}>
                          {tr(o)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setCourses(courses.filter((_, j) => j !== i))}
                      className="shrink-0 p-1 text-muted-foreground hover:text-destructive sm:order-last"
                      aria-label={tr("Quitar plato")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <TextField
                      value={c.dish}
                      onSave={(dish) => setCourses(courses.map((x, j) => (j === i ? { ...x, dish } : x)))}
                      placeholder={tr("Plato")}
                      className="col-span-2 min-w-0 sm:col-span-1"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCourses([...courses, { course: nextCourse(), dish: "" }])}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-clay-ink hover:underline"
              >
                <Plus className="size-4" /> {tr("Añadir plato al menú")}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <label className="block">
              <Label>{tr("Precio x persona")}</Label>
              <NumberField
                value={r.price_per_person}
                onSave={(price_per_person) => onPatch({ price_per_person })}
                placeholder={currencySymbol(currency)}
                className="mt-1"
              />
            </label>
            <label className="block">
              <Label>{tr("Nº personas")}</Label>
              <NumberField value={r.people} onSave={(people) => onPatch({ people })} placeholder="0" integer className="mt-1" />
            </label>
            <div className="col-span-2 rounded-2xl bg-clay-soft px-4 py-2.5 sm:col-span-1">
              <Label>{tr("Total")}</Label>
              <div className="font-display text-2xl font-semibold">{line ? formatMoney(line, currency) : "—"}</div>
            </div>
          </div>

          <label className="block">
            <Label>{tr("Notas")}</Label>
            <TextField
              value={r.notes}
              onSave={(notes) => onPatch({ notes })}
              placeholder={tr("Ej.: degustación el 12 de marzo, 2 alérgicos al marisco…")}
              multiline
              className="mt-1"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" /> {tr("Borrar")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-clay px-6 py-2.5 text-sm font-medium hover:bg-clay-ink hover:text-background"
          >
            {tr("Hecho")}
          </button>
        </div>
      </div>
    </div>
  );
}
