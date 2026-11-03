import { useMemo } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { currencySymbol } from "@/lib/currency";
import { useWeddingRows } from "./use-rows";
import { NumberField, TextField, fieldClass } from "./fields";
import { t as tr, useI18n } from "@/i18n";

type Venue = {
  id: string;
  name: string;
  rating: number;
  location: string;
  contact: string;
  link: string;
  price: number;
  capacity: number;
  available: string;
  includes_catering: boolean;
  outdoor_ceremony: boolean;
  guest_lodging: boolean;
  parking: boolean;
  pros: string;
  cons: string;
  decision: string;
};

const AVAILABLE = ["Por confirmar", "Sí", "No"];
const DECISIONS = ["Pendiente", "Elegido", "Descartado"];
const FEATURES: { key: keyof Venue; label: string }[] = [
  { key: "includes_catering", label: "Incluye catering" },
  { key: "outdoor_ceremony", label: "Ceremonia exterior" },
  { key: "guest_lodging", label: "Alojamiento para invitados" },
  { key: "parking", label: "Parking" },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
      {children}
    </span>
  );
}

export function Fincas({
  weddingId,
  userId,
  currency,
}: {
  weddingId: string;
  userId: string;
  currency: string;
}) {
  const { t: tr } = useI18n();
  const { rows, loading, add, patch, remove } = useWeddingRows<Venue>("venues", weddingId);

  // Como en la plantilla: se resaltan solos el precio más bajo y la capacidad más alta.
  const { minPrice, maxCapacity } = useMemo(() => {
    const prices = rows.map((r) => Number(r.price)).filter((n) => n > 0);
    const caps = rows.map((r) => Number(r.capacity)).filter((n) => n > 0);
    return {
      minPrice: prices.length > 1 ? Math.min(...prices) : null,
      maxCapacity: caps.length > 1 ? Math.max(...caps) : null,
    };
  }, [rows]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-tight">{tr("Fincas")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("Comparad los lugares que estáis valorando. El precio más bajo y la mayor capacidad se resaltan solos.")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => add({ name: "" }, userId)}
          className="inline-flex items-center gap-2 rounded-full bg-clay px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-clay-ink hover:text-background"
        >
          <Plus className="size-4" /> {tr("Añadir lugar")}
        </button>
      </div>

      {loading ? null : rows.length === 0 ? (
        <div className="rounded-2xl bg-panel px-6 py-14 text-center ring-1 ring-foreground/5">
          <h3 className="font-display text-2xl font-semibold">{tr("Aún no habéis añadido ningún lugar")}</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {tr("Añadid las fincas que estéis visitando para compararlas una al lado de la otra.")}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((v, i) => {
            const chosen = v.decision === "Elegido";
            const discarded = v.decision === "Descartado";
            return (
              <div
                key={v.id}
                className={`flex flex-col gap-4 rounded-2xl bg-panel p-5 ring-1 transition-opacity ${
                  chosen ? "ring-2 ring-clay-ink" : "ring-foreground/5"
                } ${discarded ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {tr("Lugar {n}", { n: i + 1 })}
                  </span>
                  <div className="flex items-center gap-1" aria-label={tr("Calificación")}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => patch(v.id, { rating: v.rating === n ? 0 : n })}
                        aria-label={tr("{n} estrellas", { n })}
                      >
                        <Star
                          className={`size-4 ${n <= v.rating ? "fill-clay text-clay-ink" : "text-line"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <TextField
                  value={v.name}
                  onSave={(name) => patch(v.id, { name })}
                  placeholder={tr("Nombre del lugar")}
                  className="font-display text-lg font-semibold"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField value={v.location} onSave={(location) => patch(v.id, { location })} placeholder={tr("Ubicación")} />
                  <TextField value={v.contact} onSave={(contact) => patch(v.id, { contact })} placeholder={tr("Contacto")} />
                </div>
                <TextField
                  value={v.link}
                  onSave={(link) => patch(v.id, { link })}
                  placeholder={tr("Web, Instagram o enlace a fotos")}
                />
                {v.link && /^https?:\/\//i.test(v.link) && (
                  <a
                    href={v.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-mt-2 text-xs text-clay-ink underline underline-offset-4"
                  >
                    {tr("Abrir enlace")}
                  </a>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <Label>{tr("Precio total estimado")}</Label>
                    <NumberField value={v.price} onSave={(price) => patch(v.id, { price })} placeholder={`${tr("Importe")} (${currencySymbol(currency)})`} />
                    {minPrice !== null && Number(v.price) === minPrice && (
                      <span className="text-[11px] font-medium text-clay-ink">{tr("★ Precio más bajo")}</span>
                    )}
                  </label>
                  <label className="flex flex-col gap-1">
                    <Label>{tr("Capacidad máxima")}</Label>
                    <NumberField value={v.capacity} onSave={(capacity) => patch(v.id, { capacity })} placeholder={tr("Invitados")} integer />
                    {maxCapacity !== null && Number(v.capacity) === maxCapacity && (
                      <span className="text-[11px] font-medium text-clay-ink">{tr("★ Mayor capacidad")}</span>
                    )}
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <Label>{tr("Disponible en vuestra fecha")}</Label>
                  <select
                    value={v.available}
                    onChange={(e) => patch(v.id, { available: e.target.value })}
                    className={fieldClass}
                  >
                    {AVAILABLE.map((o) => (
                      <option key={o} value={o}>{tr(o)}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map((f) => (
                    <label key={f.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(v[f.key])}
                        onChange={(e) => patch(v.id, { [f.key]: e.target.checked } as Partial<Venue>)}
                        className="size-4 accent-clay-ink"
                      />
                      {tr(f.label)}
                    </label>
                  ))}
                </div>

                <TextField value={v.pros} onSave={(pros) => patch(v.id, { pros })} placeholder={tr("Pros")} multiline />
                <TextField value={v.cons} onSave={(cons) => patch(v.id, { cons })} placeholder={tr("Contras")} multiline />

                <div className="mt-auto flex items-end justify-between gap-3">
                  <label className="flex flex-1 flex-col gap-1">
                    <Label>{tr("Decisión")}</Label>
                    <select
                      value={v.decision}
                      onChange={(e) => patch(v.id, { decision: e.target.value })}
                      className={fieldClass}
                    >
                      {DECISIONS.map((o) => (
                        <option key={o} value={o}>{tr(o)}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(v.name ? tr("¿Borrar {name}?", { name: v.name }) : tr("¿Borrar este lugar?"))) remove(v.id);
                    }}
                    className="mb-2 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={tr("Borrar lugar")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
