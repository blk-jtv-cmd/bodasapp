import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { catLabel } from "@/lib/category-emoji";
import { toast } from "sonner";
import { formatMoney, currencySymbol } from "@/lib/currency";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { t as tr, useI18n } from "@/i18n";
import { parseAmount } from "./use-rows";

export type BudgetExpense = {
  id: string;
  concept: string;
  category: string;
  planned: number;
  actual_cost: number;
  paid: number;
  notes: string;
};

export type BudgetCategory = { id: string; name: string; sort_order: number };

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Lugar y Catering",
  "Fotografía y vídeo",
  "Música y DJ",
  "Flores",
  "Decoración",
  "Vestido y traje",
  "Belleza",
  "Anillos",
  "Invitaciones y papelería",
  "Transporte",
  "Otros",
];

const inputClass =
  "rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-clay-ink";

function euro(n: number, currency: string = "EUR") {
  return formatMoney(n, currency);
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-2 font-display text-3xl font-semibold ${
          tone === "bad" ? "text-destructive" : tone === "good" ? "text-clay-ink" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function AmountCell({
  value,
  onSave,
}: {
  value: number;
  onSave: (n: number) => Promise<void>;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      value={draft ?? String(value ?? 0)}
      inputMode="decimal"
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={async () => {
        if (draft === null) return;
        const n = parseAmount(draft);
        setDraft(null);
        if (n !== Number(value)) await onSave(n);
      }}
      className="w-24 rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-sm outline-none hover:border-line focus:border-clay-ink focus:bg-background"
    />
  );
}

function NoteCell({
  value,
  onSave,
  placeholder = "Añadir nota",
  className = "w-48",
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}) {
  const { t: tr } = useI18n();
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      value={draft ?? value ?? ""}
      placeholder={tr(placeholder)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={async () => {
        if (draft === null) return;
        const next = draft;
        setDraft(null);
        if (next !== (value ?? "")) await onSave(next);
      }}
      className={`${className} rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/60 hover:border-line focus:border-clay-ink focus:bg-background`}
    />
  );
}

export function Presupuesto({
  expenses,
  categories,
  wedding,
  userId,
  reload,
  onBudgetChange,
}: {
  expenses: BudgetExpense[];
  categories: BudgetCategory[];
  wedding: { id: string; total_budget: number; currency: string };
  userId: string;
  reload: () => Promise<void>;
  onBudgetChange: (n: number) => Promise<void>;
}) {
  const { t: tr, lang } = useI18n();
  const [newCategory, setNewCategory] = useState("");
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [budgetDraft, setBudgetDraft] = useState<string | null>(null);

  const categoryNames = useMemo(() => {
    const names = categories.map((c) => c.name);
    for (const e of expenses) if (!names.includes(e.category)) names.push(e.category);
    return names;
  }, [categories, expenses]);

  const totals = useMemo(() => {
    const planned = expenses.reduce((s, e) => s + Number(e.planned), 0);
    const actual = expenses.reduce((s, e) => s + Number(e.actual_cost), 0);
    const paid = expenses.reduce((s, e) => s + Number(e.paid), 0);
    return { planned, actual, paid, pending: actual - paid };
  }, [expenses]);

  const cur = wedding.currency || "EUR";
  const available = Number(wedding.total_budget) || 0;
  const difference = available - totals.planned;
  const shareBase = totals.actual || totals.planned || 1;

  const byCategory = useMemo(
    () =>
      categoryNames.map((name) => {
        const rows = expenses.filter((e) => e.category === name);
        return {
          name,
          rows,
          planned: rows.reduce((s, e) => s + Number(e.planned), 0),
          actual: rows.reduce((s, e) => s + Number(e.actual_cost), 0),
          paid: rows.reduce((s, e) => s + Number(e.paid), 0),
        };
      }),
    [categoryNames, expenses],
  );

  const chartData = useMemo(
    () =>
      byCategory
        .filter((c) => c.actual > 0 || c.paid > 0)
        .map((c) => ({
          name: catLabel(c.name, tr),
          Pagado: c.paid,
          Pendiente: Math.max(c.actual - c.paid, 0),
          total: c.actual,
        }))
        .sort((a, b) => b.total - a.total),
    [byCategory, lang],
  );

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    if (categoryNames.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast.error(tr("Esa categoría ya existe"));
      return;
    }
    const { error } = await supabase.from("expense_categories").insert({
      wedding_id: wedding.id,
      user_id: userId,
      name,
      sort_order: categories.length + 1,
    });
    if (error) {
      toast.error(tr("No se ha podido crear la categoría"));
      return;
    }
    setNewCategory("");
    await reload();
  }

  async function removeCategory(name: string) {
    const cat = categories.find((c) => c.name === name);
    if (!cat) return;
    await supabase.from("expense_categories").delete().eq("id", cat.id);
    await reload();
  }

  async function addRow(
    category: string,
    concept: string,
    notes: string,
    amounts: { planned: number; actual_cost: number; paid: number },
  ) {
    if (!concept.trim()) return false;
    const { error } = await supabase.from("expenses").insert({
      wedding_id: wedding.id,
      user_id: userId,
      concept: concept.trim(),
      category,
      notes: notes.trim(),
      ...amounts,
    });
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return false;
    }
    await reload();
    return true;
  }

  async function updateRow(
    id: string,
    patch: {
      concept?: string;
      planned?: number;
      actual_cost?: number;
      paid?: number;
      category?: string;
      notes?: string;
    },
  ) {
    const { error } = await supabase.from("expenses").update(patch).eq("id", id);
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    await reload();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold">{tr("Presupuesto")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tr("Lo que tenéis, lo que cuesta y lo que queda por pagar.")}
        </p>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {tr("Total disponible")}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <input
              value={budgetDraft ?? String(available)}
              inputMode="decimal"
              onChange={(e) => setBudgetDraft(e.target.value)}
              onBlur={async () => {
                if (budgetDraft === null) return;
                const n = Number(budgetDraft.replace(",", ".")) || 0;
                setBudgetDraft(null);
                if (n !== available) await onBudgetChange(n);
              }}
              className="w-40 rounded-md border border-transparent bg-transparent font-display text-3xl font-semibold outline-none hover:border-line focus:border-clay-ink focus:bg-background"
            />
            <span className="font-display text-2xl font-semibold">{currencySymbol(cur)}</span>
          </div>
        </div>
        <Stat label={tr("Total estimado")} value={euro(totals.planned, cur)} />
        <Stat
          label={tr("Diferencia")}
          value={euro(difference, cur)}
          tone={difference < 0 ? "bad" : "good"}
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label={tr("Gasto real")} value={euro(totals.actual, cur)} />
        <Stat label={tr("Pagado")} value={euro(totals.paid, cur)} />
        <Stat label={tr("Pendiente")} value={euro(totals.pending, cur)} />
      </div>

      <section className="mb-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
          <h2 className="font-display text-xl font-semibold">{tr("Pagado vs pendiente")}</h2>
          <div className="relative mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: tr("Pagado"), value: totals.paid },
                    { name: tr("Pendiente"), value: Math.max(totals.pending, 0) },
                  ]}
                  dataKey="value"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="none"
                >
                  <Cell fill="var(--color-clay)" />
                  <Cell fill="var(--color-clay-soft)" />
                </Pie>
                <Tooltip
                  formatter={(v: number) => euro(Number(v), cur)}
                  contentStyle={{
                    background: "var(--color-panel)",
                    border: "1px solid var(--color-line)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {tr("Gasto real")}
              </span>
              <span className="font-display text-2xl font-semibold">{euro(totals.actual, cur)}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-clay" /> {tr("Pagado")}
              </span>
              <span>{euro(totals.paid, cur)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-clay-soft ring-1 ring-clay/30" /> {tr("Pendiente")}
              </span>
              <span>{euro(Math.max(totals.pending, 0), cur)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
          <h2 className="font-display text-xl font-semibold">{tr("Por categoría")}</h2>
          {chartData.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {tr("Apuntad gastos reales para ver el desglose.")}
            </p>
          ) : (
            <div className="mt-4" style={{ height: Math.max(240, chartData.length * 42) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <XAxis
                    type="number"
                    tickFormatter={(v) => euro(Number(v), cur)}
                    tick={{ fontSize: 11 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 11 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-clay-soft)" }}
                    formatter={(v: number) => euro(Number(v), cur)}
                    contentStyle={{
                      background: "var(--color-background)",
                      border: "1px solid var(--color-line)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Pagado" stackId="a" fill="var(--color-clay)" radius={[0, 0, 0, 0]} />
                  <Bar
                    dataKey="Pendiente"
                    stackId="a"
                    fill="var(--color-clay-soft)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <form onSubmit={addCategory} className="mb-6 flex flex-wrap gap-3">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder={tr("Nueva categoría")}
          className={`${inputClass} min-w-[220px]`}
        />
        <button className="rounded-full bg-clay px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-clay-ink hover:text-background">
          {tr("Añadir categoría")}
        </button>
      </form>

      <div className="space-y-4">
        {byCategory.map((cat) => {
          const isOpen = !collapsed[cat.name];
          return (
            <section
              key={cat.name}
              className="overflow-hidden rounded-2xl bg-panel ring-1 ring-foreground/5"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [cat.name]: isOpen }))}
                  className="flex items-center gap-3 text-left"
                >
                  <span
                    className={`font-mono text-xs text-muted-foreground transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  >
                    ▸
                  </span>
                  <span className="font-display text-xl font-semibold">{catLabel(cat.name, tr)}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {cat.rows.length === 1 ? tr("1 partida") : tr("{n} partidas", { n: cat.rows.length })}
                  </span>
                </button>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{tr("Previsto")} {euro(cat.planned, cur)}</span>
                  <span>{tr("Real")} {euro(cat.actual, cur)}</span>
                  <span>{tr("Pagado")} {euro(cat.paid, cur)}</span>
                  {cat.rows.length === 0 && categories.some((c) => c.name === cat.name) && (
                    <button
                      onClick={() => removeCategory(cat.name)}
                      className="text-xs hover:text-destructive"
                    >
                      {tr("Borrar")}
                    </button>
                  )}
                </div>
              </header>

              {isOpen && (
                <div className="overflow-x-auto border-t border-line bg-background">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead className="bg-panel text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">{tr("Concepto")}</th>
                        <th className="px-4 py-3">{tr("Categoría")}</th>
                        <th className="px-4 py-3 text-right">{tr("Previsto")}</th>
                        <th className="px-4 py-3 text-right">{tr("Gasto real")}</th>
                        <th className="px-4 py-3 text-right">{tr("Pagado")}</th>
                        <th className="px-4 py-3 text-right">{tr("Pendiente")}</th>
                        <th className="px-4 py-3 text-right">{tr("% del total")}</th>
                        <th className="px-4 py-3">{tr("Notas")}</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {cat.rows.map((x) => {
                        const pending = Number(x.actual_cost) - Number(x.paid);
                        return (
                          <tr key={x.id} className="border-t border-line">
                            <td className="px-2 py-2">
                              <NoteCell
                                value={x.concept}
                                placeholder="Concepto"
                                className="w-full min-w-[10rem] font-medium"
                                onSave={async (v) => {
                                  if (v.trim()) await updateRow(x.id, { concept: v.trim() });
                                }}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={x.category}
                                onChange={(e) => updateRow(x.id, { category: e.target.value })}
                                className="rounded-md border border-transparent bg-transparent py-1 text-sm text-muted-foreground outline-none hover:border-line focus:border-clay-ink"
                              >
                                {categoryNames.map((n) => (
                                  <option key={n} value={n}>
                                    {catLabel(n, tr)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <AmountCell
                                value={Number(x.planned)}
                                onSave={(n) => updateRow(x.id, { planned: n })}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <AmountCell
                                value={Number(x.actual_cost)}
                                onSave={(n) => updateRow(x.id, { actual_cost: n })}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <AmountCell
                                value={Number(x.paid)}
                                onSave={(n) => updateRow(x.id, { paid: n })}
                              />
                            </td>
                            <td
                              className={`px-4 py-2 text-right ${
                                pending > 0 ? "text-destructive" : "text-muted-foreground"
                              }`}
                            >
                              {euro(pending, cur)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-xs text-muted-foreground">
                              {Math.round((Number(x.actual_cost) / shareBase) * 100)}%
                            </td>
                            <td className="px-4 py-2">
                              <NoteCell
                                value={x.notes ?? ""}
                                onSave={(v) => updateRow(x.id, { notes: v })}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={async () => {
                                  if (!window.confirm(tr("¿Borrar {name}?", { name: x.concept }))) return;
                                  await supabase.from("expenses").delete().eq("id", x.id);
                                  await reload();
                                }}
                                className="text-xs text-muted-foreground hover:text-destructive"
                              >
                                {tr("Borrar")}
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {cat.rows.length > 0 && (
                        <tr className="border-t border-line bg-panel font-medium">
                          <td className="px-4 py-2" colSpan={2}>
                            {tr("Subtotal")}
                          </td>
                          <td className="px-4 py-2 text-right">{euro(cat.planned, cur)}</td>
                          <td className="px-4 py-2 text-right">{euro(cat.actual, cur)}</td>
                          <td className="px-4 py-2 text-right">{euro(cat.paid, cur)}</td>
                          <td className="px-4 py-2 text-right">{euro(cat.actual - cat.paid, cur)}</td>
                          <td className="px-4 py-2 text-right font-mono text-xs">
                            {Math.round((cat.actual / shareBase) * 100)}%
                          </td>
                          <td />
                          <td />
                        </tr>
                      )}

                      <tr className="border-t border-line">
                        <td className="px-4 py-2" colSpan={9}>
                          {addingIn === cat.name ? (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const field = (n: string) => form.elements.namedItem(n) as HTMLInputElement;
                                const ok = await addRow(cat.name, field("concept").value, field("notes").value, {
                                  planned: parseAmount(field("planned").value),
                                  actual_cost: parseAmount(field("actual_cost").value),
                                  paid: parseAmount(field("paid").value),
                                });
                                if (ok) {
                                  for (const n of ["concept", "notes", "planned", "actual_cost", "paid"]) field(n).value = "";
                                  field("concept").focus();
                                }
                              }}
                              className="flex flex-wrap gap-3"
                            >
                              <input
                                name="concept"
                                autoFocus
                                placeholder={tr("Concepto")}
                                className={`${inputClass} min-w-[220px]`}
                              />
                              {(
                                [
                                  ["planned", "Previsto"],
                                  ["actual_cost", "Gasto real"],
                                  ["paid", "Pagado"],
                                ] as const
                              ).map(([name, label]) => (
                                <input
                                  key={name}
                                  name={name}
                                  inputMode="decimal"
                                  placeholder={`${tr(label)} ${currencySymbol(cur)}`}
                                  className={`${inputClass} w-32 text-right`}
                                />
                              ))}
                              <input
                                name="notes"
                                placeholder={tr("Notas (opcional)")}
                                className={`${inputClass} min-w-[200px]`}
                              />
                              <button className="rounded-full bg-clay px-4 py-2 text-xs font-medium text-foreground hover:bg-clay-ink hover:text-background">
                                {tr("Añadir")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setAddingIn(null)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                {tr("Cerrar")}
                              </button>
                            </form>
                          ) : (
                            <button
                              onClick={() => setAddingIn(cat.name)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              {tr("+ Añadir partida")}
                            </button>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>

      
    </div>
  );
}
