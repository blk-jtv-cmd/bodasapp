import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { currencySymbol, formatMoney } from "@/lib/currency";
import { useWeddingRows } from "./use-rows";
import { NumberField, TextField, fieldClass } from "./fields";

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
};

const MOMENTS = ["Aperitivo", "Entrante", "Principal", "Postre", "Bebida", "Barra libre", "Otro"];
const RESTRICTIONS = ["Estándar", "Vegetariano", "Vegano", "Sin gluten", "Infantil"];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
      {children}
    </span>
  );
}

export function Menu({
  weddingId,
  userId,
  currency,
}: {
  weddingId: string;
  userId: string;
  currency: string;
}) {
  const { rows, loading, add, patch, remove } = useWeddingRows<MenuItem>("menu_items", weddingId);

  const lineTotal = (r: MenuItem) => Number(r.price_per_person) * Number(r.people);
  const total = useMemo(() => rows.reduce((s, r) => s + lineTotal(r), 0), [rows]);

  // Ordenamos por momento del banquete, como se sirve.
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const ia = MOMENTS.indexOf(a.moment);
        const ib = MOMENTS.indexOf(b.moment);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      }),
    [rows],
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-tight">Menú y catering</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada plato con su precio por persona. El total se calcula solo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => add({ moment: "Principal" }, userId)}
          className="inline-flex items-center gap-2 rounded-full bg-clay px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-clay-ink hover:text-background"
        >
          <Plus className="size-4" /> Añadir plato
        </button>
      </div>

      {loading ? null : rows.length === 0 ? (
        <div className="rounded-2xl bg-panel px-6 py-14 text-center ring-1 ring-foreground/5">
          <h3 className="font-display text-2xl font-semibold">Vuestro menú está vacío</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Añadid el aperitivo, los platos, el postre y las bebidas para tener el coste del catering
            controlado.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {sorted.map((r) => (
              <div key={r.id} className="rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
                <div className="grid gap-3 md:grid-cols-[10rem_1fr_10rem]">
                  <label className="flex flex-col gap-1">
                    <Label>Momento</Label>
                    <select
                      value={r.moment}
                      onChange={(e) => patch(r.id, { moment: e.target.value })}
                      className={fieldClass}
                    >
                      {MOMENTS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <Label>Plato / producto</Label>
                    <TextField value={r.dish} onSave={(dish) => patch(r.id, { dish })} placeholder="Ej.: Solomillo con reducción de Pedro Ximénez" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <Label>Restricciones</Label>
                    <select
                      value={r.restriction}
                      onChange={(e) => patch(r.id, { restriction: e.target.value })}
                      className={fieldClass}
                    >
                      {RESTRICTIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-[1fr_9rem_8rem_9rem]">
                  <label className="flex flex-col gap-1">
                    <Label>Proveedor</Label>
                    <TextField value={r.vendor} onSave={(vendor) => patch(r.id, { vendor })} placeholder="Catering" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <Label>Precio x persona</Label>
                    <NumberField
                      value={r.price_per_person}
                      onSave={(price_per_person) => patch(r.id, { price_per_person })}
                      placeholder={currencySymbol(currency)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <Label>Nº personas</Label>
                    <NumberField value={r.people} onSave={(people) => patch(r.id, { people })} placeholder="0" integer />
                  </label>
                  <div className="flex flex-col gap-1">
                    <Label>Total</Label>
                    <div className="px-1 py-2 font-display text-xl font-semibold">
                      {lineTotal(r) ? formatMoney(lineTotal(r), currency) : "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-start gap-3">
                  <label className="flex items-center gap-2 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={r.covers_restrictions}
                      onChange={(e) => patch(r.id, { covers_restrictions: e.target.checked })}
                      className="size-4 accent-clay-ink"
                    />
                    Cubre restricciones
                  </label>
                  <TextField
                    value={r.notes}
                    onSave={(notes) => patch(r.id, { notes })}
                    placeholder="Notas"
                    className="min-w-[12rem] flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Borrar ${r.dish || "este plato"}?`)) remove(r.id);
                    }}
                    className="py-2 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Borrar plato"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-clay-soft px-6 py-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Total catering
            </span>
            <span className="font-display text-3xl font-semibold">{formatMoney(total, currency)}</span>
          </div>
        </>
      )}
    </div>
  );
}
