import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { catLabel } from "@/lib/category-emoji";
import { Checklist, type ChecklistTask } from "@/components/panel/checklist";
import {
  Clock,
  House,
  Landmark,
  LayoutGrid,
  ListChecks,
  Lock,
  Settings,
  Store,
  UtensilsCrossed,
  Users,
  Wallet,
} from "lucide-react";
import { TASK_LIBRARY, suggestedDue } from "@/lib/task-library";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLogo, BrandName } from "@/components/brand";
import {
  Presupuesto,
  DEFAULT_EXPENSE_CATEGORIES,
  type BudgetCategory,
} from "@/components/panel/presupuesto";
import { Mesas, type MesaTable, type MesaGuest } from "@/components/panel/mesas";
import { Cronograma } from "@/components/panel/cronograma";
import { Fincas } from "@/components/panel/fincas";
import { Menu } from "@/components/panel/menu";
import { TextField } from "@/components/panel/fields";
import { CURRENCIES, currencyLabel, formatMoney, currencySymbol } from "@/lib/currency";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { locale, t as tr, useI18n } from "@/i18n";
import { LanguageSwitcher } from "@/i18n/switcher";
import { LegalLinks, withLegalLinks } from "@/components/legal-links";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Vuestro panel de boda — Tu Boda en Orden" },
      {
        name: "description",
        content:
          "Gestiona checklist, presupuesto, invitados, proveedores y cronograma de tu boda desde un único panel.",
      },
      { property: "og:title", content: "Vuestro panel de boda — Tu Boda en Orden" },
      {
        property: "og:description",
        content: "Todo lo que hay que tener en cuenta para la boda, en un solo sitio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PanelPage,
});

type Wedding = {
  id: string;
  partner_one: string;
  partner_two: string;
  wedding_date: string | null;
  venue: string | null;
  guest_target: number;
  total_budget: number;
  plan_active: boolean;
  currency: string;
  ceremony_time: string | null;
};

type Task = ChecklistTask;
type Expense = {
  id: string;
  concept: string;
  category: string;
  planned: number;
  actual_cost: number;
  paid: number;
  notes: string;
};
type Guest = {
  id: string;
  name: string;
  guest_group: string;
  invited_by: string;
  rsvp: string;
  table_number: string | null;
  companions: number;
  notes: string;
  seat_order: number;
  /** Si es acompañante: id del invitado con el que viene. */
  companion_of?: string | null;
  is_child?: boolean;
  allergies?: string[];
};
type Vendor = {
  id: string;
  name: string;
  service: string;
  contact: string | null;
  phone: string;
  email: string;
  price: number;
  status: string;
  website: string;
  deposit_paid: number;
  contract_signed: boolean;
  notes: string | null;
};
export type TimelineItem = { id: string; time_label: string; title: string; owner: string | null };

// Tareas sugeridas para una boda nueva (con su guía en src/lib/task-library.ts).
const DEFAULT_TASKS = TASK_LIBRARY.map(({ title, category }) => ({ title, category }));

const TABS = [
  ["resumen", "Resumen"],
  ["checklist", "Checklist"],
  ["presupuesto", "Presupuesto"],
  ["fincas", "Fincas"],
  ["invitados", "Invitados"],
  ["mesas", "Mesas"],
  ["menu", "Menú"],
  ["proveedores", "Proveedores"],
  ["cronograma", "Cronograma"],
  ["ajustes", "Ajustes"],
] as const;

type TabKey = (typeof TABS)[number][0];

// Secciones que solo se pueden usar después de pagar el plan.
// (La base de datos también las protege: sin pagar no se puede leer ni guardar nada en ellas.)
const PAID_TABS: TabKey[] = [
  "presupuesto",
  "fincas",
  "invitados",
  "mesas",
  "menu",
  "proveedores",
  "cronograma",
];

const TAB_ICONS: Record<TabKey, typeof House> = {
  resumen: House,
  checklist: ListChecks,
  presupuesto: Wallet,
  fincas: Landmark,
  invitados: Users,
  mesas: LayoutGrid,
  menu: UtensilsCrossed,
  proveedores: Store,
  cronograma: Clock,
  ajustes: Settings,
};

const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined;

function paymentUrl(userId: string, email: string | null) {
  if (!STRIPE_PAYMENT_LINK) return null;
  const url = new URL(STRIPE_PAYMENT_LINK);
  url.searchParams.set("client_reference_id", userId);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}

const inputClass =
  "rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-clay-ink";

function money(n: number, currency: string = "EUR") {
  return formatMoney(n, currency);
}

function weddingDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function daysUntilWedding(date: string | null) {
  if (!date) return null;
  const wedding = weddingDay(date);
  if (!wedding) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  wedding.setHours(0, 0, 0, 0);
  return Math.round((wedding.getTime() - today.getTime()) / 86400000);
}

function weddingDateLabel(date: string | null) {
  if (!date) return null;
  const wedding = weddingDay(date);
  if (!wedding) return null;
  return new Intl.DateTimeFormat(locale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(wedding);
}

function PanelPage() {
  const { t: tr } = useI18n();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [mesas, setMesas] = useState<MesaTable[]>([]);
  const [tab, setTab] = useState<TabKey>("resumen");
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async (weddingId: string) => {
    // Si aún no existe la columna companion_of en la base de datos, se cargan igual sin ella.
    const loadGuests = async (id: string) => {
      const cols = "id,name,guest_group,invited_by,rsvp,table_number,companions,notes,seat_order";
      for (const extra of [",companion_of,is_child,allergies", ",companion_of", ""]) {
        const res = await supabase.from("guests").select(`${cols}${extra}`).eq("wedding_id", id).order("created_at");
        if (!res.error || !extra) return res;
      }
      return supabase.from("guests").select(cols).eq("wedding_id", id).order("created_at");
    };
    // Igual con las columnas nuevas del checklist (prioridad, pasos, no aplica).
    const loadTasks = async (id: string) => {
      const cols = "id,title,category,due_date,done,owner,notes,created_at";
      const res = await supabase.from("tasks").select(`${cols},priority,steps,not_applicable`).eq("wedding_id", id).order("created_at");
      if (!res.error) return res;
      return supabase.from("tasks").select(cols).eq("wedding_id", id).order("created_at");
    };
    const [t, e, g, v, tl, c, mt] = await Promise.all([
      loadTasks(weddingId),
      supabase.from("expenses").select("id,concept,category,planned,actual_cost,paid,notes").eq("wedding_id", weddingId).order("created_at"),
      loadGuests(weddingId),
      supabase.from("vendors").select("id,name,service,contact,phone,email,price,status,website,deposit_paid,contract_signed,notes").eq("wedding_id", weddingId).order("created_at"),
      supabase.from("timeline_items").select("id,time_label,title,owner").eq("wedding_id", weddingId).order("time_label"),
      supabase.from("expense_categories").select("id,name,sort_order").eq("wedding_id", weddingId).order("sort_order"),
      supabase.from("wedding_tables").select("id,name,capacity,shape,pos_x,pos_y,sort_order").eq("wedding_id", weddingId).order("sort_order"),
    ]);
    setTasks((t.data as Task[]) ?? []);
    setExpenses((e.data as Expense[]) ?? []);
    setGuests((g.data as Guest[]) ?? []);
    setVendors((v.data as Vendor[]) ?? []);
    setTimeline((tl.data as TimelineItem[]) ?? []);
    setCategories((c.data as BudgetCategory[]) ?? []);
    setMesas((mt.data as MesaTable[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      setUserId(uid);
      setUserEmail(auth.user?.email ?? null);

      const WEDDING_COLUMNS =
        "id,partner_one,partner_two,wedding_date,venue,guest_target,total_budget,plan_active,currency,ceremony_time";

      // Cada cuenta tiene una sola boda. Si por lo que sea hubiera más de una,
      // nos quedamos con la pagada (o la más antigua) en vez de fallar.
      const findWedding = async () => {
        const { data } = await supabase
          .from("weddings")
          .select(WEDDING_COLUMNS)
          .eq("user_id", uid)
          .order("plan_active", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1);
        return (data?.[0] as Wedding | undefined) ?? null;
      };

      let current = await findWedding();
      if (!current) {
        // "ignoreDuplicates" + la regla de una boda por cuenta en la base de datos evitan
        // que se creen dos bodas si esta parte se ejecuta dos veces a la vez.
        const { data: created, error } = await supabase
          .from("weddings")
          .upsert(
            { user_id: uid, partner_one: "", partner_two: "", guest_target: 0, total_budget: 0 },
            { onConflict: "user_id", ignoreDuplicates: true },
          )
          .select(WEDDING_COLUMNS);
        if (error) {
          toast.error(tr("No hemos podido crear vuestro plan"));
          setLoading(false);
          return;
        }
        if (created && created.length > 0) {
          current = created[0] as Wedding;
          await supabase.from("tasks").insert(
            DEFAULT_TASKS.map((task) => ({ ...task, wedding_id: current!.id, user_id: uid })),
          );
        } else {
          current = await findWedding();
        }
        if (!current) {
          toast.error(tr("No hemos podido cargar vuestro plan"));
          setLoading(false);
          return;
        }
      }
      setWedding(current);

      const { count } = await supabase
        .from("expense_categories")
        .select("id", { count: "exact", head: true })
        .eq("wedding_id", current.id);
      if (!count) {
        await supabase.from("expense_categories").insert(
          DEFAULT_EXPENSE_CATEGORIES.map((name, i) => ({
            wedding_id: current!.id,
            user_id: uid,
            name,
            sort_order: i,
          })),
        );
      }

      await loadAll(current.id);
      setLoading(false);
    })();
  }, [loadAll]);

  const budget = useMemo(() => {
    const planned = expenses.reduce((s, e) => s + Number(e.planned), 0);
    const actual = expenses.reduce((s, e) => s + Number(e.actual_cost), 0);
    const paid = expenses.reduce((s, e) => s + Number(e.paid), 0);
    return { planned, actual, paid };
  }, [expenses]);

  const confirmed = useMemo(
    () => guests.filter((g) => g.rsvp === "confirmado").reduce((s, g) => s + 1 + g.companions, 0),
    [guests],
  );

  const daysLeft = useMemo(() => {
    return daysUntilWedding(wedding?.wedding_date ?? null);
  }, [wedding?.wedding_date]);

  // Al volver de Stripe (?pago=ok), esperamos a que llegue la confirmación del pago.
  useEffect(() => {
    if (!wedding || wedding.plan_active) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("pago") !== "ok") return;
    window.history.replaceState(null, "", window.location.pathname);
    toast(tr("Confirmando vuestro pago…"));
    let tries = 0;
    const timer = window.setInterval(async () => {
      tries += 1;
      const { data } = await supabase
        .from("weddings")
        .select("plan_active")
        .eq("id", wedding.id)
        .maybeSingle();
      if (data?.plan_active) {
        window.clearInterval(timer);
        setWedding((w) => (w ? { ...w, plan_active: true } : w));
        await loadAll(wedding.id);
        toast.success(tr("¡Pago recibido! Ya tenéis el plan completo."));
      } else if (tries >= 20) {
        window.clearInterval(timer);
        toast.error(
          tr("Aún no nos ha llegado la confirmación del pago. Recargad la página en un minuto; si sigue igual, escribidnos."),
        );
      }
    }, 2000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding?.id]);

  useEffect(() => {
    document.getElementById(`navbtn-${tab}`)?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [tab]);

  // Si pagan desde la app de la pantalla de inicio, Stripe se abre aparte: al volver, comprobamos el pago.
  useEffect(() => {
    if (!wedding || wedding.plan_active) return;
    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      const { data } = await supabase.from("weddings").select("plan_active").eq("id", wedding.id).maybeSingle();
      if (data?.plan_active) {
        setWedding((w) => (w ? { ...w, plan_active: true } : w));
        await loadAll(wedding.id);
        toast.success(tr("¡Pago recibido! Ya tenéis el plan completo."));
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding?.id, wedding?.plan_active]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (loading || !wedding || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        {tr("Preparando vuestro plan…")}
      </div>
    );
  }

  const ctx = { wedding, userId, reload: () => loadAll(wedding.id) };
  const payUrl = paymentUrl(userId, userEmail);
  const locked = !wedding.plan_active && PAID_TABS.includes(tab);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-30 border-b border-line bg-background/90 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6">
          <BrandName className="justify-self-start" />
          <BrandLogo />
          <div className="flex items-center gap-3 justify-self-end sm:gap-5">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
              {wedding.partner_one || tr("Novia")} &amp; {wedding.partner_two || tr("Novio")}
              {daysLeft !== null &&
                ` · ${tr("Día {n}", { n: daysLeft >= 0 ? `−${daysLeft}` : `+${Math.abs(daysLeft)}` })}`}
            </span>
            <LanguageSwitcher />
            <button
              onClick={signOut}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {tr("Salir")}
            </button>
          </div>
        </div>
        <div className="mx-auto hidden max-w-6xl gap-6 overflow-x-auto px-6 pb-3 text-sm [scrollbar-width:none] sm:flex">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap border-b-2 pb-1 transition-colors ${
                tab === key
                  ? "border-clay text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tr(label)}
              {!wedding.plan_active && PAID_TABS.includes(key) && (
                <span aria-label={tr("Requiere el plan completo")} className="ml-1 text-[10px] opacity-60">
                  🔒
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-6 pt-6 sm:px-6 sm:py-10">
        {!wedding.plan_active && !locked && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-clay-soft px-6 py-5">
            <div>
              <div className="font-display text-lg font-semibold">{tr("Plan gratuito")}</div>
              <p className="text-sm text-muted-foreground">
                {tr("Tenéis el Resumen y el Checklist. Desbloquead presupuesto, fincas, invitados, mesas, menú, proveedores, cronograma y la plantilla en Excel con un pago único de 37€, sin suscripciones.")}
              </p>
            </div>
            <PayButton url={payUrl} />
          </div>
        )}

        {locked && <Paywall url={payUrl} />}

        {tab === "resumen" && wedding.plan_active && <ExcelDownload />}
        {tab === "resumen" && (
          <Resumen
            wedding={wedding}
            tasks={tasks}
            setTasks={setTasks}
            budget={budget}
            confirmed={confirmed}
            guests={guests.length}
            vendors={vendors.length}
            rsvp={{
              confirmado: guests.filter((g) => g.rsvp === "confirmado").reduce((s, g) => s + 1 + (g.companions || 0), 0),
              pendiente: guests.filter((g) => g.rsvp === "pendiente").reduce((s, g) => s + 1 + (g.companions || 0), 0),
              rechazado: guests.filter((g) => g.rsvp === "rechazado").reduce((s, g) => s + 1 + (g.companions || 0), 0),
            }}
            onGo={(t) => {
              setTab(t);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
        {tab === "checklist" && <Checklist tasks={tasks} setTasks={setTasks} {...ctx} />}
        {!locked && tab === "presupuesto" && (
          <Presupuesto
            expenses={expenses}
            categories={categories}
            wedding={wedding}
            userId={userId}
            reload={ctx.reload}
            onBudgetChange={async (n) => {
              const { error } = await supabase
                .from("weddings")
                .update({ total_budget: n })
                .eq("id", wedding.id);
              if (error) {
                toast.error(tr("No se ha podido guardar"));
                return;
              }
              setWedding({ ...wedding, total_budget: n });
            }}
          />
        )}
        {!locked && tab === "fincas" && (
          <Fincas weddingId={wedding.id} userId={userId} currency={wedding.currency} />
        )}
        {!locked && tab === "menu" && (
          <Menu weddingId={wedding.id} userId={userId} currency={wedding.currency} />
        )}
        {!locked && tab === "invitados" && <Invitados guests={guests} tables={mesas} {...ctx} />}
        {!locked && tab === "mesas" && (
          <Mesas
            tables={mesas}
            guests={guests as unknown as MesaGuest[]}
            wedding={wedding}
            userId={userId}
            reload={ctx.reload}
          />
        )}
        {!locked && tab === "proveedores" && (
          <Proveedores vendors={vendors} categories={categories} {...ctx} />
        )}
        {!locked && tab === "cronograma" && (
          <Cronograma
            items={timeline}
            wedding={wedding}
            setWedding={setWedding}
            userId={userId}
            reload={ctx.reload}
          />
        )}
        {tab === "ajustes" && <Ajustes wedding={wedding} setWedding={setWedding} email={userEmail} />}
      </main>
      <footer className="mx-auto max-w-6xl px-6 pb-28 sm:pb-10">
        <LegalLinks />
      </footer>

      {/* Móvil: barra de secciones fija abajo, con iconos */}
      <nav
        aria-label={tr("Secciones")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden"
      >
        <div className="flex overflow-x-auto [scrollbar-width:none]">
          {TABS.map(([key, label]) => {
            const Icon = TAB_ICONS[key];
            const active = tab === key;
            return (
              <button
                key={key}
                id={`navbtn-${key}`}
                onClick={() => {
                  setTab(key);
                  window.scrollTo({ top: 0 });
                }}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-w-[68px] flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[10px] transition-colors ${
                  active ? "text-clay-ink" : "text-muted-foreground"
                }`}
              >
                {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-clay-ink" />}
                <span className="relative">
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.6} />
                  {!wedding.plan_active && PAID_TABS.includes(key) && (
                    <Lock className="absolute -right-2 -top-1 size-2.5 opacity-60" />
                  )}
                </span>
                <span className="whitespace-nowrap">{tr(label)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// Plantilla en Excel: se guarda en Supabase Storage (carpeta privada "descargas")
// y solo pueden descargarla las cuentas con el plan pagado.
const TEMPLATE_BUCKET = "descargas";
const TEMPLATE_FILE = "plantilla-tu-boda-en-orden.xlsx";
// Una copia traducida por idioma: plantilla-tu-boda-en-orden-en.xlsx, -it, -fr, -pt.
const TEMPLATE_NAMES: Record<string, string> = {
  es: "Plantilla Tu Boda en Orden.xlsx",
  en: "Tu Boda en Orden - Wedding Planner.xlsx",
  it: "Tu Boda en Orden - Planner matrimonio.xlsx",
  fr: "Tu Boda en Orden - Planner mariage.xlsx",
  pt: "Tu Boda en Orden - Planeador casamento.xlsx",
};

function ExcelDownload() {
  const { t: tr, lang } = useI18n();
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    const bucket = supabase.storage.from(TEMPLATE_BUCKET);
    const spanish = () =>
      bucket.createSignedUrl(TEMPLATE_FILE, 60, { download: TEMPLATE_NAMES.es });
    let { data, error } =
      lang === "es"
        ? await spanish()
        : await bucket.createSignedUrl(TEMPLATE_FILE.replace(".xlsx", `-${lang}.xlsx`), 60, {
            download: TEMPLATE_NAMES[lang] ?? TEMPLATE_NAMES.es,
          });
    // Si aún no está subida la versión de ese idioma, se baja la española.
    if (error || !data?.signedUrl) ({ data, error } = await spanish());
    setLoading(false);
    if (error || !data?.signedUrl) {
      toast.error(tr("No hemos podido preparar la descarga. Volved a intentarlo en un momento."));
      return;
    }
    window.location.href = data.signedUrl;
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-panel px-6 py-5 ring-1 ring-foreground/5">
      <div>
        <div className="font-display text-lg font-semibold">{tr("¿Preferís trabajar en Excel?")}</div>
        <p className="text-sm text-muted-foreground">
          {tr("Descargad nuestra plantilla completa para usarla en Excel, Numbers o Google Sheets.")}
        </p>
      </div>
      <button
        type="button"
        onClick={download}
        disabled={loading}
        className="whitespace-nowrap rounded-full border border-line bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:border-clay-ink hover:text-clay-ink disabled:opacity-60"
      >
        {loading ? tr("Preparando…") : tr("Descargar plantilla Excel")}
      </button>
    </div>
  );
}

function PayButton({ url }: { url: string | null }) {
  const { t: tr } = useI18n();
  // Renuncia expresa al desistimiento (contenido digital): obligatoria antes de pagar.
  const [accepted, setAccepted] = useState(false);
  if (!url) {
    return (
      <span className="rounded-full bg-foreground/10 px-5 py-2.5 text-sm text-muted-foreground">
        {tr("Pago no disponible todavía")}
      </span>
    );
  }
  const buttonClass =
    "whitespace-nowrap rounded-full bg-clay px-5 py-2.5 text-sm font-medium text-foreground transition-colors";
  return (
    <div className="flex max-w-sm flex-col items-start gap-3">
      <label className="flex cursor-pointer items-start gap-2 text-left text-xs leading-5 text-muted-foreground">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-clay-ink"
        />
        <span>
          {withLegalLinks(
            tr(
              "Quiero acceder al plan completo de inmediato y acepto que, por ello, pierdo el derecho de desistimiento. He leído las {terms}.",
            ),
            tr,
          )}
        </span>
      </label>
      {accepted ? (
        <a href={url} className={`${buttonClass} hover:bg-clay-ink hover:text-background`}>
          {tr("Desbloquear por 37€")}
        </a>
      ) : (
        <button type="button" disabled className={`${buttonClass} cursor-not-allowed opacity-50`}>
          {tr("Desbloquear por 37€")}
        </button>
      )}
    </div>
  );
}

function Paywall({ url }: { url: string | null }) {
  const { t: tr } = useI18n();
  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-panel px-8 py-12 text-center ring-1 ring-foreground/5">
      <div className="text-3xl">🔒</div>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">{tr("Parte del plan completo")}</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        {tr("Con un pago único de 37€ tendréis presupuesto, comparador de fincas, invitados, plano de mesas, menú, proveedores, el cronograma del día y la plantilla en Excel para descargar. Para siempre, sin suscripciones.")}
      </p>
      <div className="mt-8 flex justify-center">
        <PayButton url={url} />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{tr("Pago seguro con tarjeta a través de Stripe.")}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <div className="rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Cuenta atrás en directo (días, horas, minutos y segundos) hasta la ceremonia. */
function LiveCountdown({ date, time }: { date: string; time: string | null }) {
  const { t: tr } = useI18n();
  const target = new Date(`${date}T${(time || "12:00").slice(0, 5)}:00`).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const parts: [number, string][] = [
    [Math.floor(diff / 86400000), tr("días")],
    [Math.floor((diff / 3600000) % 24), tr("horas")],
    [Math.floor((diff / 60000) % 60), tr("min")],
    [Math.floor((diff / 1000) % 60), tr("seg")],
  ];
  return (
    <div className="flex items-end gap-3" aria-label={tr("Faltan {n} días", { n: parts[0][0] })}>
      {parts.map(([n, label], i) => (
        <div key={label} className="text-center">
          <div className={`font-display text-3xl font-semibold tabular-nums leading-none ${i === 3 ? "text-clay-ink" : ""}`}>
            {String(n).padStart(i === 0 ? 1 : 2, "0")}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}

function Resumen({
  wedding,
  tasks,
  setTasks,
  budget,
  confirmed,
  guests,
  vendors,
  rsvp,
  onGo,
}: {
  wedding: Wedding;
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  budget: { planned: number; actual: number; paid: number };
  confirmed: number;
  guests: number;
  vendors: number;
  rsvp: { confirmado: number; pendiente: number; rechazado: number };
  onGo: (tab: TabKey) => void;
}) {
  const { t: tr } = useI18n();
  const activeTasks = tasks.filter((t) => !t.not_applicable);
  const doneCount = activeTasks.filter((t) => t.done).length;
  const dueOf = (t: Task) => t.due_date ?? suggestedDue(t.category, wedding.wedding_date, t.created_at);
  const today = new Date().toISOString().slice(0, 10);
  const pending = activeTasks
    .filter((t) => !t.done)
    .sort((a, b) => (dueOf(a) ?? "9").localeCompare(dueOf(b) ?? "9"))
    .slice(0, 5);
  const overdue = activeTasks.filter((t) => !t.done && (dueOf(t) ?? "9") < today).length;

  // Aviso para instalar la app (solo en móvil, si no está ya instalada y no lo han cerrado).
  const [showInstall, setShowInstall] = useState(false);
  useEffect(() => {
    try {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      setShowInstall(!standalone && localStorage.getItem("hideInstall") !== "1");
    } catch {
      setShowInstall(false);
    }
  }, []);

  // Consejo del día: lo siguiente más útil según lo que falta.
  const tip: { text: string; go: TabKey; cta: string } = !wedding.wedding_date
    ? { text: tr("Empezad por poner la fecha de la boda: con ella calculamos los plazos de cada tarea."), go: "ajustes", cta: tr("Ir a Ajustes") }
    : !Number(wedding.total_budget)
      ? { text: tr("Decidid cuánto queréis gastar como máximo y apuntadlo: todo el presupuesto parte de ahí."), go: "ajustes", cta: tr("Ir a Ajustes") }
      : overdue > 0
        ? { text: tr("Tenéis {n} tareas con la fecha pasada. Echadles un vistazo o marcadlas como «no aplica».", { n: overdue }), go: "checklist", cta: tr("Ver checklist") }
        : vendors === 0
          ? { text: tr("Lo primero que se reserva suele ser la finca y el catering. Guardad ahí sus datos y precios."), go: "proveedores", cta: tr("Ir a Proveedores") }
          : guests === 0
            ? { text: tr("Apuntad a vuestros primeros invitados: aunque la lista cambie, os dará una idea del tamaño de la boda."), go: "invitados", cta: tr("Ir a Invitados") }
            : rsvp.pendiente > 0
              ? { text: tr("Quedan {n} personas por confirmar. Un mensaje a tiempo os ahorra prisas al final.", { n: rsvp.pendiente }), go: "invitados", cta: tr("Ver invitados") }
              : { text: tr("Vais muy bien. Revisad el cronograma del día para que todo fluya."), go: "cronograma", cta: tr("Ver cronograma") };

  async function completar(task: Task) {
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done: true } : t)));
    const { error } = await supabase.from("tasks").update({ done: true }).eq("id", task.id);
    if (error) {
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done: false } : t)));
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    toast.success(tr("Tarea completada"));
  }
  const firstName = wedding.partner_one.trim() || tr("Novia");
  const secondName = wedding.partner_two.trim() || tr("Novio");
  const daysLeft = daysUntilWedding(wedding.wedding_date);
  const dateLabel = weddingDateLabel(wedding.wedding_date);

  let countdownLabel = tr("Indicad la fecha en Ajustes");
  let countdownDetail = tr("Y aquí comenzará vuestra cuenta atrás");
  if (daysLeft === 0) {
    countdownLabel = tr("¡Hoy es vuestro gran día!");
    countdownDetail = dateLabel ?? tr("Disfrutad cada momento");
  } else if (daysLeft === 1) {
    countdownLabel = tr("Falta 1 día");
    countdownDetail = dateLabel ?? tr("Ya casi está aquí");
  } else if (daysLeft !== null && daysLeft > 1) {
    countdownLabel = tr("Faltan {n} días", { n: daysLeft });
    countdownDetail = dateLabel ?? tr("Vuestra cuenta atrás");
  } else if (daysLeft === -1) {
    countdownLabel = tr("Hace 1 día de vuestra boda");
    countdownDetail = dateLabel ?? tr("Un recuerdo para siempre");
  } else if (daysLeft !== null && daysLeft < -1) {
    countdownLabel = tr("Hace {n} días de vuestra boda", { n: Math.abs(daysLeft) });
    countdownDetail = dateLabel ?? tr("Un recuerdo para siempre");
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-8 border-y border-line py-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:py-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-clay-ink">{tr("Vuestro espacio")}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-none sm:text-5xl">
            {tr("Bienvenidos, {a} y {b}", { a: firstName, b: secondName })}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            {tr("Todo lo importante de vuestra boda, reunido para que disfrutéis también del camino.")}
          </p>
        </div>
        <div className="border-l-2 border-clay pl-5 sm:min-w-64">
          {daysLeft !== null && daysLeft > 0 ? (
            <LiveCountdown date={wedding.wedding_date!} time={wedding.ceremony_time} />
          ) : (
            <p className="font-display text-3xl font-semibold leading-tight">{countdownLabel}</p>
          )}
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {countdownDetail}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label={tr("Tareas hechas")}
          value={`${doneCount}/${tasks.length}`}
          hint={tasks.length ? tr("{n}% completado", { n: Math.round((doneCount / tasks.length) * 100) }) : undefined}
        />
        <Stat label={tr("Proveedores")} value={`${vendors}`} hint={tr("Fichas guardadas")} />
      </div>

      {showInstall && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-clay/60 px-4 py-3 text-sm sm:hidden">
          <span aria-hidden>📱</span>
          <a href="/instalar" className="min-w-0 flex-1">
            <span className="font-medium">{tr("Instalad la app")}</span>{" "}
            <span className="text-muted-foreground">{tr("y abridla con un toque")}</span>
          </a>
          <button
            onClick={() => {
              try {
                localStorage.setItem("hideInstall", "1");
              } catch {
                /* sin almacenamiento: solo se oculta ahora */
              }
              setShowInstall(false);
            }}
            aria-label={tr("Cerrar")}
            className="px-1 text-muted-foreground"
          >
            ✕
          </button>
        </div>
      )}

      <section className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-clay-soft/70 p-5 ring-1 ring-clay/30">
        <span className="text-2xl" aria-hidden>
          💡
        </span>
        <div className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-clay-ink">{tr("Vuestro siguiente paso")}</p>
          <p className="mt-1 text-sm leading-6">{tip.text}</p>
        </div>
        <button
          onClick={() => onGo(tip.go)}
          className="w-full rounded-full bg-background px-4 py-2 text-xs font-medium ring-1 ring-clay/40 hover:ring-clay-ink sm:w-auto"
        >
          {tip.cta} →
        </button>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Resumen del presupuesto */}
        <section className="rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold">{tr("Presupuesto")}</h2>
            <button onClick={() => onGo("presupuesto")} className="text-xs text-clay-ink underline underline-offset-4">
              {tr("Ver todo")}
            </button>
          </div>
          {(() => {
            const total = Number(wedding.total_budget) || 0;
            const spentPct = total ? Math.min(100, Math.round((budget.actual / total) * 100)) : 0;
            const paidPct = total ? Math.min(100, Math.round((budget.paid / total) * 100)) : 0;
            return (
              <>
                <p className="mt-3 font-display text-3xl font-semibold">
                  {money(budget.actual, wedding.currency)}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    {tr("de {total}", { total: money(total, wedding.currency) })}
                  </span>
                </p>
                <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-clay-soft">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-clay" style={{ width: `${spentPct}%` }} />
                  <div className="absolute inset-y-0 left-0 rounded-full bg-clay-ink" style={{ width: `${paidPct}%` }} />
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  {[
                    [tr("Pagado"), budget.paid],
                    [tr("Por pagar"), budget.actual - budget.paid],
                    [tr("Disponible"), total - budget.actual],
                  ].map(([label, n]) => (
                    <div key={String(label)}>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 font-medium">{money(Number(n), wedding.currency)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            );
          })()}
        </section>

        {/* Confirmaciones */}
        <section className="rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold">{tr("Confirmaciones")}</h2>
            <button onClick={() => onGo("invitados")} className="text-xs text-clay-ink underline underline-offset-4">
              {tr("Ver todo")}
            </button>
          </div>
          {(() => {
            const all = rsvp.confirmado + rsvp.pendiente + rsvp.rechazado;
            const pct = all ? Math.round((rsvp.confirmado / all) * 100) : 0;
            return (
              <>
                <p className="mt-3 font-display text-3xl font-semibold">
                  {pct}% <span className="text-base font-normal text-muted-foreground">{tr("confirmado")}</span>
                </p>
                <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="bg-clay-ink" style={{ width: `${all ? (rsvp.confirmado / all) * 100 : 0}%` }} />
                  <div className="bg-clay-soft" style={{ width: `${all ? (rsvp.pendiente / all) * 100 : 0}%` }} />
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  {[
                    [tr("Confirmados"), rsvp.confirmado],
                    [tr("Pendientes"), rsvp.pendiente],
                    [tr("No asisten"), rsvp.rechazado],
                  ].map(([label, n]) => (
                    <div key={String(label)}>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 font-medium">{n}</dd>
                    </div>
                  ))}
                </dl>
              </>
            );
          })()}
        </section>
      </div>

      <section className="rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
        <h2 className="font-display text-2xl font-semibold">{tr("Lo siguiente")}</h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{tr("Todo hecho. Disfrutad.")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {pending.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-lg bg-background px-3 py-2.5 text-sm">
                <button
                  type="button"
                  onClick={() => void completar(t)}
                  aria-label={tr("Marcar «{title}» como hecha", { title: tr(t.title) })}
                  className="size-4 shrink-0 rounded-full border border-clay/60 transition hover:border-clay hover:bg-clay/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-ink"
                />
                <span className="min-w-0 flex-1">{tr(t.title)}</span>
                <span
                  className={`ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] ${
                    (dueOf(t) ?? "9") < today ? "text-clay-ink" : "text-muted-foreground"
                  }`}
                >
                  {dueOf(t)
                    ? new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short" }).format(
                        new Date(`${dueOf(t)}T12:00:00`),
                      )
                    : tr(t.category)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-3xl tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

const RSVP = ["pendiente", "confirmado", "rechazado"];
// "Acompañante" ya no se elige: los acompañantes se crean con la casilla «Acompañantes».
const GUEST_GROUPS = ["Familia", "Amigos", "Trabajo", "Otros"];
const ALLERGIES = ["Gluten", "Lactosa", "Frutos secos", "Marisco", "Huevo", "Vegetariano", "Vegano"];

/** Botones de alergias / dieta + una casilla para escribir otra. */
function AllergyPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { t: tr } = useI18n();
  const [other, setOther] = useState("");
  const all = Array.from(new Set([...ALLERGIES, ...value]));
  const toggle = (a: string) => onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-muted-foreground">{tr("Alergias y dieta")}</span>
      {all.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => toggle(a)}
          className={`rounded-full px-2.5 py-1 text-[11px] ring-1 ${
            value.includes(a) ? "bg-clay text-foreground ring-clay" : "bg-background text-muted-foreground ring-line"
          }`}
        >
          {tr(a)}
        </button>
      ))}
      <input
        value={other}
        onChange={(e) => setOther(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && other.trim()) {
            e.preventDefault();
            onChange([...value, other.trim()]);
            setOther("");
          }
        }}
        onBlur={() => {
          if (other.trim()) {
            onChange([...value, other.trim()]);
            setOther("");
          }
        }}
        placeholder={tr("Otra…")}
        className="w-24 rounded-full border border-line bg-background px-2.5 py-1 text-[11px] outline-none focus:border-clay-ink"
      />
      <p className="basis-full text-[11px] text-muted-foreground">
        🔒 {tr("Solo para organizar el menú con el catering.")}{" "}
        <a href="/legal/privacidad" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          {tr("Más info")}
        </a>
      </p>
    </div>
  );
}

const RSVP_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  rechazado: "Rechazado",
};

function Invitados({
  guests,
  tables,
  wedding,
  userId,
  reload,
}: {
  guests: Guest[];
  tables: MesaTable[];
  wedding: Wedding;
  userId: string;
  reload: () => Promise<void>;
}) {
  const { t: tr } = useI18n();
  const hosts = [wedding.partner_one?.trim() || "Novia", wedding.partner_two?.trim() || "Novio"];
  const [form, setForm] = useState({
    name: "",
    invited_by: hosts[0]!,
    guest_group: "Familia",
    notes: "",
    extra: "0",
    is_child: false,
    allergies: [] as string[],
  });
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    invited_by: string;
    guest_group: string;
    extra: string;
    is_child: boolean;
    allergies: string[];
  } | null>(null);
  const [query, setQuery] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState<string | null>(null);
  const [hostFilter, setHostFilter] = useState<string | null>(null);
  const [onlyAllergies, setOnlyAllergies] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const companionName = (host: string, n: number, total: number) =>
    total === 1 ? tr("Acompañante de {name}", { name: host }) : `${tr("Acompañante de {name}", { name: host })} ${n}`;

  /** Crea `count` acompañantes enlazados al invitado, numerados a partir de `from`. */
  async function createCompanions(
    host: { id: string; name: string; invited_by: string; rsvp?: string },
    from: number,
    count: number,
    total: number,
  ) {
    if (count <= 0) return true;
    const rows = Array.from({ length: count }, (_, i) => ({
      name: companionName(host.name, from + i, total),
      guest_group: "Acompañante",
      invited_by: host.invited_by,
      rsvp: host.rsvp ?? "pendiente",
      notes: "",
      companion_of: host.id,
      wedding_id: wedding.id,
      user_id: userId,
    }));
    const { error } = await supabase.from("guests").insert(rows);
    if (error) toast.error(tr("No se han podido añadir los acompañantes"));
    return !error;
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editing.name.trim()) return;
    const original = guests.find((x) => x.id === editing.id);
    const name = editing.name.trim();
    const { error } = await supabase
      .from("guests")
      .update({
        name,
        invited_by: editing.invited_by,
        guest_group: editing.guest_group,
        is_child: editing.is_child,
        allergies: editing.allergies,
      })
      .eq("id", editing.id);
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }

    if (original && !original.companion_of) {
      const current = companionsOf(original.id);
      const wanted = Math.min(Math.max(Math.round(Number(editing.extra) || 0), 0), 20);

      // Si cambia el nombre, los acompañantes que conservan el nombre automático se actualizan.
      if (name !== original.name) {
        const oldPrefix = tr("Acompañante de {name}", { name: original.name });
        await Promise.all(
          current
            .filter((c) => c.name.startsWith(oldPrefix))
            .map((c) =>
              supabase
                .from("guests")
                .update({ name: tr("Acompañante de {name}", { name }) + c.name.slice(oldPrefix.length) })
                .eq("id", c.id),
            ),
        );
      }

      if (wanted > current.length) {
        await createCompanions(
          { id: original.id, name, invited_by: editing.invited_by, rsvp: original.rsvp },
          current.length + 1,
          wanted - current.length,
          wanted,
        );
      } else if (wanted < current.length) {
        const toRemove = current.slice(wanted); // se quitan los últimos añadidos
        const ok = window.confirm(
          tr("Se quitarán estos acompañantes: {names}. ¿Seguir?", { names: toRemove.map((c) => c.name).join(", ") }),
        );
        if (ok) await supabase.from("guests").delete().in("id", toRemove.map((c) => c.id));
      }
    }
    setEditing(null);
    await reload();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const extra = Math.min(Math.max(Math.round(Number(form.extra) || 0), 0), 20);
    const { data: host, error } = await supabase
      .from("guests")
      .insert({
        name,
        guest_group: form.guest_group,
        invited_by: form.invited_by,
        notes: form.notes.trim(),
        ...(form.is_child ? { is_child: true } : {}),
        ...(form.allergies.length ? { allergies: form.allergies } : {}),
        wedding_id: wedding.id,
        user_id: userId,
      })
      .select("id")
      .single();
    if (error || !host) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    // Cada acompañante es un invitado propio (se puede renombrar y sentar donde se quiera).
    await createCompanions({ id: host.id, name, invited_by: form.invited_by }, 1, extra, extra);
    setForm({
      name: "",
      invited_by: form.invited_by,
      guest_group: form.guest_group,
      notes: "",
      extra: "0",
      is_child: false,
      allergies: [],
    });
    await reload();
  }

  const tableName = (id: string | null) => (id ? tables.find((t) => t.id === id)?.name ?? null : null);

  async function addMany() {
    const names = bulkText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean)
      .slice(0, 300);
    if (!names.length) return;
    const { error } = await supabase.from("guests").insert(
      names.map((name) => ({
        name,
        guest_group: form.guest_group,
        invited_by: form.invited_by,
        notes: "",
        wedding_id: wedding.id,
        user_id: userId,
      })),
    );
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    toast.success(tr("{n} invitados añadidos", { n: names.length }));
    setBulkText("");
    setBulkOpen(false);
    await reload();
  }

  function exportExcel() {
    const head = [
      tr("Nombre"),
      tr("Invitado de"),
      tr("Grupo"),
      tr("Viene con"),
      tr("Confirmación"),
      tr("Mesa"),
      tr("Niño/a"),
      tr("Alergias y dieta"),
      tr("Notas"),
    ];
    const rows = orderedGuests.map((g) => [
      g.name,
      tr(g.invited_by),
      tr(g.guest_group),
      g.companion_of ? guests.find((x) => x.id === g.companion_of)?.name ?? "" : "",
      tr(RSVP_LABEL[g.rsvp] ?? g.rsvp),
      tableName(g.table_number) ?? "",
      g.is_child ? tr("Sí") : "",
      (g.allergies ?? []).map((a) => tr(a)).join(", "),
      g.notes ?? "",
    ]);
    // CSV con ";" y BOM: Excel lo abre directamente con tildes y columnas bien separadas.
    const cell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\ufeff" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tr("invitados")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const companionsOf = (id: string) => guests.filter((x) => x.companion_of === id);
  // Cada acompañante va justo debajo del invitado con el que viene, aunque se añada más tarde.
  const orderedGuests = (() => {
    const ids = new Set(guests.map((x) => x.id));
    const out: Guest[] = [];
    for (const x of guests) {
      if (x.companion_of && ids.has(x.companion_of)) continue;
      out.push(x, ...companionsOf(x.id));
    }
    return out;
  })();

  const groupData = Array.from(
    guests.reduce((map, g) => {
      const key = g.guest_group || "Otros";
      map.set(key, (map.get(key) ?? 0) + 1 + (g.companions || 0));
      return map;
    }, new Map<string, number>()),
    ([name, value]) => ({ name: tr(name), value }),
  ).sort((a, b) => b.value - a.value);

  const rsvpData = RSVP.map((r) => ({
    name: tr(RSVP_LABEL[r]!),
    value: guests.filter((g) => g.rsvp === r).length,
  }));
  const rsvpColors = ["var(--color-clay-soft)", "var(--color-clay)", "var(--color-muted)"];
  const totalSeats = guests.reduce((s, g) => s + 1 + (g.companions || 0), 0);
  const seatsWhere = (f: (g: Guest) => boolean) => guests.filter(f).reduce((s, g) => s + 1 + (g.companions || 0), 0);
  const allergyCounts = Array.from(
    guests.reduce((m, g) => {
      for (const a of g.allergies ?? []) m.set(a, (m.get(a) ?? 0) + 1);
      return m;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);

  const q = query.trim().toLowerCase();
  const filtering = !!(q || rsvpFilter || hostFilter || onlyAllergies);
  const listed = orderedGuests.filter((g) => {
    if (rsvpFilter && g.rsvp !== rsvpFilter) return false;
    if (hostFilter && g.invited_by !== hostFilter) return false;
    if (onlyAllergies && !(g.allergies ?? []).length) return false;
    if (q) {
      const hay = [g.name, tableName(g.table_number) ?? "", tr(g.guest_group), g.notes ?? ""].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const chipCls = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-xs ring-1 transition-colors ${
      on ? "bg-clay text-foreground ring-clay" : "bg-panel text-muted-foreground ring-line hover:text-foreground"
    }`;

  return (
    <div>
      <SectionHeader
        title={tr("Invitados")}
        subtitle={`${tr("{n} en la lista", { n: guests.length })} · ${tr("{n} plazas", { n: totalSeats })}${
          Number(wedding.guest_target) ? ` · ${tr("objetivo {n}", { n: wedding.guest_target })}` : ""
        }`}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [tr("Plazas"), totalSeats],
          [tr("Confirmados"), seatsWhere((g) => g.rsvp === "confirmado")],
          [tr("Pendientes"), seatsWhere((g) => g.rsvp === "pendiente")],
          [tr("Niños"), guests.filter((g) => g.is_child).length],
        ].map(([label, n]) => (
          <div key={String(label)} className="rounded-2xl bg-panel px-4 py-3 ring-1 ring-foreground/5">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
            <div className="mt-1 font-display text-2xl font-semibold">{n}</div>
          </div>
        ))}
      </div>
      {allergyCounts.length > 0 && (
        <p className="-mt-3 mb-6 text-xs text-muted-foreground">
          ⚠️ {tr("Alergias y dieta")}: {allergyCounts.map(([a, n]) => `${tr(a)} ${n}`).join(" · ")}
        </p>
      )}
      {guests.length > 0 && (
        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
            <h2 className="font-display text-xl font-semibold">{tr("Invitados por grupo")}</h2>
            <div className="mt-4" style={{ height: Math.max(220, groupData.length * 52) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupData} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-clay-soft)" }}
                    contentStyle={{
                      background: "var(--color-background)",
                      border: "1px solid var(--color-line)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" name="Plazas" fill="var(--color-clay)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
            <h2 className="font-display text-xl font-semibold">{tr("Estado de confirmación")}</h2>
            <div className="relative mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rsvpData}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {rsvpData.map((d, i) => (
                      <Cell key={d.name} fill={rsvpColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip
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
                  {tr("Invitados")}
                </span>
                <span className="font-display text-2xl font-semibold">{guests.length}</span>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {rsvpData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full ring-1 ring-clay/30"
                      style={{ background: rsvpColors[i] }}
                    />
                    {d.name}
                  </span>
                  <span>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <form onSubmit={add} className="mb-8 flex flex-wrap gap-3">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={tr("Nombre")}
          className={`${inputClass} flex-1 min-w-[180px]`}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          {tr("Invitado de")}
          <select
            value={form.invited_by}
            onChange={(e) => setForm({ ...form, invited_by: e.target.value })}
            className={inputClass}
          >
            {hosts.map((h) => (
              <option key={h} value={h}>
                {tr(h)}
              </option>
            ))}
          </select>
        </label>
        <select
          value={form.guest_group}
          onChange={(e) => setForm({ ...form, guest_group: e.target.value })}
          className={inputClass}
        >
          {GUEST_GROUPS.map((g) => (
            <option key={g} value={g}>
              {tr(g)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          {tr("Acompañantes")}
          <input
            type="number"
            min={0}
            max={20}
            value={form.extra}
            onChange={(e) => setForm({ ...form, extra: e.target.value })}
            className={`${inputClass} w-16`}
          />
        </label>
        <input
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder={tr("Notas (opcional)")}
          className={`${inputClass} min-w-[200px] flex-1`}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={form.is_child}
            onChange={(e) => setForm({ ...form, is_child: e.target.checked })}
            className="size-4 accent-clay-ink"
          />
          {tr("Niño/a")}
        </label>
        <div className="basis-full">
          <AllergyPicker value={form.allergies} onChange={(allergies) => setForm({ ...form, allergies })} />
        </div>
        <button className="rounded-full bg-clay px-5 py-2 text-sm font-medium text-foreground hover:bg-clay-ink hover:text-background">
          {tr("Añadir")}
        </button>
      </form>

      {/* Añadir varios de golpe */}
      {bulkOpen && (
        <div className="mb-6 rounded-2xl bg-panel p-4 ring-1 ring-foreground/5">
          <p className="mb-2 text-sm text-muted-foreground">
            {tr("Pegad o escribid un nombre por línea. Se añadirán como «{group}» de {host}.", {
              group: tr(form.guest_group),
              host: tr(form.invited_by),
            })}
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder={"Ana García\nLuis Pérez\n…"}
            className={`${inputClass} w-full`}
          />
          <div className="mt-2 flex justify-end gap-3">
            <button onClick={() => setBulkOpen(false)} className="rounded-full border border-line px-4 py-1.5 text-sm">
              {tr("Cancelar")}
            </button>
            <button
              onClick={addMany}
              className="rounded-full bg-clay px-4 py-1.5 text-sm font-medium hover:bg-clay-ink hover:text-background"
            >
              {tr("Añadir {n}", { n: bulkText.split("\n").filter((x) => x.trim()).length })}
            </button>
          </div>
        </div>
      )}

      {/* Buscar, filtrar, añadir varios y exportar */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr("Buscar por nombre, mesa o grupo…")}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button
            onClick={() => setBulkOpen((o) => !o)}
            className="rounded-full bg-panel px-4 py-2 text-xs ring-1 ring-line hover:ring-clay-ink"
          >
            {tr("Añadir varios")}
          </button>
          <button
            onClick={exportExcel}
            disabled={!guests.length}
            className="rounded-full bg-panel px-4 py-2 text-xs ring-1 ring-line hover:ring-clay-ink disabled:opacity-50"
          >
            {tr("Exportar a Excel")}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRsvpFilter(null)} className={chipCls(rsvpFilter === null)}>
            {tr("Todos")}
          </button>
          {RSVP.map((r) => (
            <button key={r} onClick={() => setRsvpFilter(rsvpFilter === r ? null : r)} className={chipCls(rsvpFilter === r)}>
              {tr(RSVP_LABEL[r]!)}
            </button>
          ))}
          <span className="mx-1 w-px self-stretch bg-line" />
          {hosts.map((h) => (
            <button key={h} onClick={() => setHostFilter(hostFilter === h ? null : h)} className={chipCls(hostFilter === h)}>
              {tr("de {name}", { name: tr(h) })}
            </button>
          ))}
          <button onClick={() => setOnlyAllergies((v) => !v)} className={chipCls(onlyAllergies)}>
            ⚠️ {tr("Con alergias")}
          </button>
        </div>
        {filtering && (
          <p className="text-xs text-muted-foreground">{tr("{n} de {total} invitados", { n: listed.length, total: guests.length })}</p>
        )}
      </div>

      <ul className="space-y-2">
        {listed.map((g) =>
          editing?.id === g.id ? (
            <li key={g.id} className="rounded-lg bg-panel px-4 py-3 text-sm ring-1 ring-clay/60">
              <form onSubmit={saveEdit} className="flex flex-wrap items-center gap-3">
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  autoFocus
                  required
                  placeholder={tr("Nombre")}
                  className={`${inputClass} min-w-[200px] flex-1`}
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  {tr("Invitado de")}
                  <select
                    value={editing.invited_by}
                    onChange={(e) => setEditing({ ...editing, invited_by: e.target.value })}
                    className={inputClass}
                  >
                    {Array.from(new Set([...hosts, editing.invited_by].filter(Boolean))).map((h) => (
                      <option key={h} value={h}>
                        {tr(h)}
                      </option>
                    ))}
                  </select>
                </label>
                {!g.companion_of && (
                  <>
                    <select
                      value={editing.guest_group}
                      onChange={(e) => setEditing({ ...editing, guest_group: e.target.value })}
                      className={inputClass}
                    >
                      {Array.from(new Set([...GUEST_GROUPS, editing.guest_group].filter(Boolean))).map((gr) => (
                        <option key={gr} value={gr}>
                          {tr(gr)}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      {tr("Acompañantes")}
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={editing.extra}
                        onChange={(e) => setEditing({ ...editing, extra: e.target.value })}
                        className={`${inputClass} w-16`}
                      />
                    </label>
                  </>
                )}
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={editing.is_child}
                    onChange={(e) => setEditing({ ...editing, is_child: e.target.checked })}
                    className="size-4 accent-clay-ink"
                  />
                  {tr("Niño/a")}
                </label>
                <div className="basis-full">
                  <AllergyPicker value={editing.allergies} onChange={(allergies) => setEditing({ ...editing, allergies })} />
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {tr("Cancelar")}
                </button>
                <button className="rounded-full bg-clay px-4 py-1.5 text-xs font-medium text-foreground hover:bg-clay-ink hover:text-background">
                  {tr("Guardar")}
                </button>
              </form>
            </li>
          ) : (
          <li
            key={g.id}
            className={`flex flex-wrap items-center gap-3 rounded-lg bg-panel px-4 py-3 text-sm ${
              g.companion_of ? "ml-6 border-l-2 border-clay" : ""
            }`}
          >
            <span className="font-medium">{g.name}</span>
            {(() => {
              const n = companionsOf(g.id).length + (g.companions || 0);
              return n > 0 ? (
                <span className="rounded-full bg-clay-soft px-2 py-0.5 font-mono text-[10px] text-clay-ink">+{n}</span>
              ) : null;
            })()}
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {g.companion_of
                ? tr("Viene con {name}", { name: guests.find((x) => x.id === g.companion_of)?.name ?? "—" })
                : tr(g.guest_group)}
              {g.invited_by && ` · ${tr("de {name}", { name: tr(g.invited_by) })}`}
            </span>
            {tableName(g.table_number) && (
              <span className="rounded-full bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-clay-ink ring-1 ring-clay/40">
                {tableName(g.table_number)}
              </span>
            )}
            {g.is_child && (
              <span className="rounded-full bg-clay-soft px-2 py-0.5 text-[10px] text-foreground/80">🧒 {tr("Niño/a")}</span>
            )}
            {(g.allergies ?? []).map((a) => (
              <span key={a} className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 ring-1 ring-amber-200">
                ⚠️ {tr(a)}
              </span>
            ))}
            {/* En móvil: notas, confirmación y acciones en una segunda línea */}
            <span className="basis-full sm:hidden" />
            <input
              defaultValue={g.notes ?? ""}
              placeholder={tr("Notas")}
              onBlur={async (e) => {
                const next = e.target.value;
                if (next === (g.notes ?? "")) return;
                await supabase.from("guests").update({ notes: next }).eq("id", g.id);
                await reload();
              }}
              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/60 hover:border-line focus:border-clay-ink focus:bg-background sm:w-48 sm:flex-none"
            />
            {/* Confirmación y acciones: siempre juntas en la misma línea */}
            <div className="ml-auto flex shrink-0 items-center gap-3">
            <select
              value={g.rsvp}
              onChange={async (e) => {
                const rsvp = e.target.value;
                await supabase.from("guests").update({ rsvp }).eq("id", g.id);
                // Los acompañantes siguen la respuesta del invitado con el que vienen.
                if (companionsOf(g.id).length) await supabase.from("guests").update({ rsvp }).eq("companion_of", g.id);
                await reload();
              }}
              className="rounded-lg border border-line bg-background px-2 py-1 text-xs"
            >
              {RSVP.map((r) => (
                <option key={r} value={r}>
                  {tr(r)}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                setEditing({
                  id: g.id,
                  name: g.name,
                  invited_by: g.invited_by,
                  guest_group: g.guest_group,
                  extra: String(companionsOf(g.id).length),
                  is_child: !!g.is_child,
                  allergies: g.allergies ?? [],
                })
              }
              className="text-xs text-muted-foreground underline decoration-clay/40 underline-offset-4 hover:text-foreground"
            >
              {tr("Editar")}
            </button>
            <button
              onClick={async () => {
                const comps = companionsOf(g.id).length;
                const msg = comps
                  ? tr("¿Borrar {name} y sus {n} acompañantes?", { name: g.name, n: comps })
                  : tr("¿Borrar {name}?", { name: g.name });
                if (!window.confirm(msg)) return;
                await supabase.from("guests").delete().eq("id", g.id);
                await reload();
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {tr("Borrar")}
            </button>
            </div>
          </li>
          ),
        )}
        {guests.length === 0 && (
          <li className="rounded-lg bg-panel px-4 py-8 text-center text-sm text-muted-foreground">
            {tr("Empezad añadiendo a la familia más cercana.")}
          </li>
        )}
      </ul>


    </div>
  );
}

const VENDOR_STATUS = ["por contactar", "contactado", "presupuesto", "reservado", "pagado"];
const VENDOR_STATUS_LABEL: Record<string, string> = {
  "por contactar": "Por contactar",
  contactado: "Contactado",
  presupuesto: "Presupuesto",
  reservado: "Reservado",
  pagado: "Pagado",
};
const VENDOR_STATUS_COLORS: Record<string, string> = {
  pagado: "var(--color-clay)",
  reservado: "var(--color-clay-soft)",
  presupuesto: "var(--color-muted)",
  contactado: "var(--color-line)",
  "por contactar": "var(--color-muted-foreground)",
};

function Proveedores({
  vendors,
  categories,
  wedding,
  userId,
  reload,
}: {
  vendors: Vendor[];
  categories: BudgetCategory[];
  wedding: Wedding;
  userId: string;
  reload: () => Promise<void>;
}) {
  const { t: tr } = useI18n();
  const services = useMemo(() => {
    const list = categories.length
      ? categories.map((c) => c.name)
      : [...DEFAULT_EXPENSE_CATEGORIES];
    for (const v of vendors) if (v.service && !list.includes(v.service)) list.push(v.service);
    return list;
  }, [categories, vendors]);

  const [form, setForm] = useState({
    name: "",
    service: "",
    contact: "",
    phone: "",
    email: "",
    website: "",
    price: "",
    deposit_paid: "",
    status: "por contactar",
    contract_signed: false,
    notes: "",
  });
  const [newService, setNewService] = useState("");
  // Ficha que se está editando (nombre, categoría, contacto y precio).
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    service: string;
    contact: string;
    phone: string;
    email: string;
    website: string;
    price: string;
  } | null>(null);

  const service = form.service || services[0] || "Otros";

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editing.name.trim()) return;
    await update(editing.id, {
      name: editing.name.trim(),
      service: editing.service,
      contact: editing.contact.trim(),
      phone: editing.phone.trim(),
      email: editing.email.trim(),
      website: editing.website.trim(),
      price: parseAmount(editing.price),
    });
    setEditing(null);
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    const name = newService.trim();
    if (!name) return;
    if (services.some((s) => s.toLowerCase() === name.toLowerCase())) {
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
    setNewService("");
    setForm({ ...form, service: name });
    await reload();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const { error } = await supabase.from("vendors").insert({
      name: form.name,
      service,
      contact: form.contact.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      price: Number(form.price.replace(",", ".")) || 0,
      deposit_paid: Number(form.deposit_paid.replace(",", ".")) || 0,
      status: form.status,
      contract_signed: form.contract_signed,
      notes: form.notes.trim(),
      wedding_id: wedding.id,
      user_id: userId,
    });
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    setForm({
      name: "",
      service,
      contact: "",
      phone: "",
      email: "",
      website: "",
      price: "",
      deposit_paid: "",
      status: "por contactar",
      contract_signed: false,
      notes: "",
    });
    await reload();
  }

  async function update(
    id: string,
    patch: {
      name?: string;
      service?: string;
      contact?: string;
      phone?: string;
      email?: string;
      website?: string;
      price?: number;
      status?: string;
      deposit_paid?: number;
      contract_signed?: boolean;
      notes?: string;
    },
  ) {
    const { error } = await supabase.from("vendors").update(patch).eq("id", id);
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    await reload();
  }

  const statusData = VENDOR_STATUS.map((s) => ({
    name: tr(VENDOR_STATUS_LABEL[s]!),
    value: vendors.filter((v) => v.status === s).length,
    key: s,
  }));

  return (
    <div>
      <SectionHeader title={tr("Proveedores")} subtitle={tr("Contactos, precios y en qué punto está cada uno.")} />

      <form onSubmit={add} className="mb-4 grid gap-3 rounded-2xl bg-panel p-5 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={tr("Nombre")}
          className={inputClass}
        />
        <select
          value={service}
          onChange={(e) => setForm({ ...form, service: e.target.value })}
          className={inputClass}
        >
          {services.map((s) => (
            <option key={s} value={s}>
              {catLabel(s, tr)}
            </option>
          ))}
        </select>
        <input
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          placeholder={tr("Persona de contacto")}
          className={inputClass}
        />
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder={tr("Teléfono")}
          type="tel"
          className={inputClass}
        />
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder={tr("Email")}
          type="email"
          className={inputClass}
        />
        <input
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder={tr("Web o Instagram")}
          className={inputClass}
        />
        <input
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder={`${tr("Precio total")} ${currencySymbol(wedding.currency)}`}
          inputMode="decimal"
          className={inputClass}
        />
        <input
          value={form.deposit_paid}
          onChange={(e) => setForm({ ...form, deposit_paid: e.target.value })}
          placeholder={`${tr("Señal pagada")} ${currencySymbol(wedding.currency)}`}
          inputMode="decimal"
          className={inputClass}
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className={inputClass}
        >
          {VENDOR_STATUS.map((s) => (
            <option key={s} value={s}>
              {tr(VENDOR_STATUS_LABEL[s]!)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={form.contract_signed}
            onChange={(e) => setForm({ ...form, contract_signed: e.target.checked })}
            className="size-4 accent-[var(--color-clay)]"
          />
          {tr("Contrato firmado")}
        </label>
        <input
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder={tr("Notas")}
          className={`${inputClass} sm:col-span-2`}
        />
        <button className="rounded-full bg-clay px-5 py-2 text-sm font-medium text-foreground hover:bg-clay-ink hover:text-background">
          {tr("Añadir proveedor")}
        </button>
      </form>

      <form onSubmit={addService} className="mb-8 flex flex-wrap gap-3">
        <input
          value={newService}
          onChange={(e) => setNewService(e.target.value)}
          placeholder={tr("Nueva categoría")}
          className={`${inputClass} min-w-[220px]`}
        />
        <button className="rounded-full border border-line px-5 py-2 text-sm font-medium hover:border-clay">
          {tr("Añadir categoría")}
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {vendors.map((v) => {
          const pending = Number(v.price) - Number(v.deposit_paid);
          if (editing?.id === v.id) {
            const field = (key: "name" | "contact" | "phone" | "email" | "website" | "price", label: string, extra = {}) => (
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
                <input
                  value={editing[key]}
                  onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                  className={inputClass}
                  {...extra}
                />
              </label>
            );
            return (
              <form
                key={v.id}
                onSubmit={saveEdit}
                className="grid gap-3 rounded-2xl bg-panel p-5 ring-1 ring-clay/60 sm:grid-cols-2"
              >
                {field("name", tr("Nombre"), { required: true, autoFocus: true })}
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {tr("Categoría")}
                  </span>
                  <select
                    value={editing.service}
                    onChange={(e) => setEditing({ ...editing, service: e.target.value })}
                    className={inputClass}
                  >
                    {services.map((s) => (
                      <option key={s} value={s}>
                        {catLabel(s, tr)}
                      </option>
                    ))}
                  </select>
                </label>
                {field("contact", tr("Persona de contacto"))}
                {field("phone", tr("Teléfono"), { type: "tel" })}
                {field("email", tr("Email"), { type: "email" })}
                {field("website", tr("Web o Instagram"))}
                {field("price", `${tr("Precio total")} ${currencySymbol(wedding.currency)}`, { inputMode: "decimal" })}
                <div className="flex items-end justify-end gap-3 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-full border border-line px-5 py-2 text-sm font-medium hover:border-clay"
                  >
                    {tr("Cancelar")}
                  </button>
                  <button className="rounded-full bg-clay px-5 py-2 text-sm font-medium text-foreground hover:bg-clay-ink hover:text-background">
                    {tr("Guardar")}
                  </button>
                </div>
              </form>
            );
          }
          return (
            <div key={v.id} className="rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl font-semibold">{v.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-clay-ink">{catLabel(v.service, tr)}</div>
                </div>
                <div className="font-display text-lg">{money(Number(v.price), wedding.currency)}</div>
              </div>
              {(v.contact || v.phone || v.email) && (
                <div className="mt-3 space-y-0.5 text-sm text-muted-foreground">
                  {v.contact && <div>{v.contact}</div>}
                  {v.phone && (
                    <a href={`tel:${v.phone.replace(/\s/g, "")}`} className="block hover:text-clay-ink">
                      {v.phone}
                    </a>
                  )}
                  {v.email && (
                    <a href={`mailto:${v.email}`} className="block truncate hover:text-clay-ink">
                      {v.email}
                    </a>
                  )}
                </div>
              )}
              {v.website && (
                <div className="mt-1 truncate text-sm text-muted-foreground">{v.website}</div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {tr("Señal pagada")}
                  </span>
                  <input
                    defaultValue={String(Number(v.deposit_paid))}
                    inputMode="decimal"
                    onBlur={async (e) => {
                      const n = Number(e.target.value.replace(",", ".")) || 0;
                      if (n !== Number(v.deposit_paid)) await update(v.id, { deposit_paid: n });
                    }}
                    className="rounded-md border border-line bg-background px-2 py-1 text-sm outline-none focus:border-clay-ink"
                  />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {tr("Saldo pendiente")}
                  </span>
                  <span className={`py-1 ${pending > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {money(pending, wedding.currency)}
                  </span>
                </div>
              </div>

              <input
                defaultValue={v.notes ?? ""}
                placeholder={tr("Notas")}
                onBlur={async (e) => {
                  const next = e.target.value;
                  if (next !== (v.notes ?? "")) await update(v.id, { notes: next });
                }}
                className="mt-3 w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/60 hover:border-line focus:border-clay-ink focus:bg-background"
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <select
                  value={v.status}
                  onChange={(e) => update(v.id, { status: e.target.value })}
                  className="rounded-lg border border-line bg-background px-2 py-1 text-xs"
                >
                  {VENDOR_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {tr(VENDOR_STATUS_LABEL[s]!)}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={v.contract_signed}
                    onChange={(e) => update(v.id, { contract_signed: e.target.checked })}
                    className="size-4 accent-[var(--color-clay)]"
                  />
                  {tr("Contrato firmado")}
                </label>
                <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() =>
                    setEditing({
                      id: v.id,
                      name: v.name,
                      service: v.service,
                      contact: v.contact ?? "",
                      phone: v.phone ?? "",
                      email: v.email ?? "",
                      website: v.website ?? "",
                      price: String(Number(v.price) || ""),
                    })
                  }
                  className="text-xs text-muted-foreground underline decoration-clay/40 underline-offset-4 hover:text-foreground"
                >
                  {tr("Editar")}
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(tr("¿Borrar {name}?", { name: v.name }))) return;
                    await supabase.from("vendors").delete().eq("id", v.id);
                    await reload();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {tr("Borrar")}
                </button>
                </div>
              </div>
            </div>
          );
        })}
        {vendors.length === 0 && (
          <p className="text-sm text-muted-foreground">{tr("Aún no hay proveedores guardados.")}</p>
        )}
      </div>

      {vendors.length > 0 && (
        <section className="mt-10 rounded-2xl bg-panel p-6 ring-1 ring-foreground/5">
          <h2 className="font-display text-xl font-semibold">{tr("Proveedores por estado")}</h2>
          <div className="mt-4" style={{ height: Math.max(240, statusData.length * 48) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 10, right: 16 }}>
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-muted-foreground)"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-muted-foreground)"
                />
                <Tooltip
                  cursor={{ fill: "var(--color-clay-soft)" }}
                  contentStyle={{
                    background: "var(--color-background)",
                    border: "1px solid var(--color-line)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" name="Proveedores" radius={[0, 6, 6, 0]}>
                  {statusData.map((d) => (
                    <Cell key={d.key} fill={VENDOR_STATUS_COLORS[d.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

/** Convierte "1.500,50", "1500.5" o "1 500" en número. Vacío o no válido = 0. */
function parseAmount(value: string): number {
  let v = value.trim().replace(/\s/g, "");
  if (!v) return 0;
  if (v.includes(",")) v = v.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, ""); // "1.500" = mil quinientos
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function Ajustes({
  wedding,
  setWedding,
  email,
}: {
  wedding: Wedding;
  setWedding: (w: Wedding) => void;
  email: string | null;
}) {
  const { t: tr } = useI18n();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const deleteWord = tr("BORRAR");

  async function sendFeedback() {
    if (!feedback.trim()) return;
    setSending(true);
    const { error } = await supabase.from("feedback").insert({ message: feedback.trim().slice(0, 4000), email });
    setSending(false);
    if (error) {
      toast.error(tr("No se ha podido enviar. Escribidnos a hola@tubodaenorden.com"));
      return;
    }
    setFeedback("");
    toast.success(tr("¡Gracias! Lo leeremos con calma."));
  }

  async function exportData() {
    const tables = ["tasks", "expenses", "expense_categories", "guests", "wedding_tables", "vendors", "venues", "menu_items", "timeline_items"];
    const out: Record<string, unknown> = { exported_at: new Date().toISOString(), wedding };
    for (const t of tables) {
      const { data } = await supabase.from(t as "tasks").select("*").eq("wedding_id", wedding.id);
      out[t] = data ?? [];
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "tu-boda-en-orden-datos.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (confirmText.trim().toUpperCase() !== deleteWord.toUpperCase()) return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_my_account" as never);
    if (error) {
      setDeleting(false);
      toast.error(tr("No se ha podido borrar la cuenta. Escribidnos a hola@tubodaenorden.com"));
      return;
    }
    await supabase.auth.signOut();
    toast.success(tr("Cuenta borrada. ¡Os deseamos una boda preciosa!"));
    navigate({ to: "/" });
  }
  const [form, setForm] = useState({
    partner_one: wedding.partner_one,
    partner_two: wedding.partner_two,
    wedding_date: wedding.wedding_date ?? "",
    venue: wedding.venue ?? "",
    // 0 = sin rellenar: se muestra la casilla vacía con su texto de ayuda.
    guest_target: Number(wedding.guest_target) ? String(wedding.guest_target) : "",
    total_budget: Number(wedding.total_budget) ? String(wedding.total_budget) : "",
    currency: wedding.currency,
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      partner_one: form.partner_one,
      partner_two: form.partner_two,
      wedding_date: form.wedding_date || null,
      venue: form.venue,
      guest_target: Math.round(parseAmount(form.guest_target)),
      total_budget: parseAmount(form.total_budget),
      currency: form.currency,
    };
    const { error } = await supabase.from("weddings").update(payload).eq("id", wedding.id);
    setSaving(false);
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    setWedding({ ...wedding, ...payload });
    toast.success(tr("Guardado"));
  }

  return (
    <div className="max-w-xl">
      <SectionHeader title={tr("Ajustes")} subtitle={tr("Los datos básicos de vuestra boda.")} />
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Nombre 1")}</span>
            <input
              value={form.partner_one}
              onChange={(e) => setForm({ ...form, partner_one: e.target.value })}
              placeholder={tr("Nombre 1")}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Nombre 2")}</span>
            <input
              value={form.partner_two}
              onChange={(e) => setForm({ ...form, partner_two: e.target.value })}
              placeholder={tr("Nombre 2")}
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Fecha de la boda")}</span>
          <input
            type="date"
            value={form.wedding_date}
            onChange={(e) => setForm({ ...form, wedding_date: e.target.value })}
            className={`${inputClass} w-full`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Lugar")}</span>
          <input
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder={tr("Lugar")}
            className={`${inputClass} w-full`}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Invitados previstos")}</span>
            <input
              value={form.guest_target}
              onChange={(e) => setForm({ ...form, guest_target: e.target.value })}
              placeholder={tr("Invitados previstos")}
              inputMode="numeric"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{`${tr("Presupuesto total")} ${currencySymbol(form.currency)}`}</span>
            <input
              value={form.total_budget}
              onChange={(e) => setForm({ ...form, total_budget: e.target.value })}
              placeholder={`${tr("Presupuesto total")} ${currencySymbol(form.currency)}`}
              inputMode="decimal"
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {tr("Moneda")}
          </span>
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className={inputClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {currencyLabel(c.code, locale())}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={saving}
          className="rounded-full bg-clay px-6 py-3 font-medium text-foreground hover:bg-clay-ink hover:text-background disabled:opacity-60"
        >
          {saving ? tr("Guardando…") : tr("Guardar")}
        </button>
      </form>

      <div className="mt-12 space-y-4">
        <a
          href="/instalar"
          className="flex items-center gap-4 rounded-2xl bg-panel p-5 ring-1 ring-foreground/5 hover:ring-clay-ink"
        >
          <span className="text-2xl" aria-hidden>
            📱
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-semibold">{tr("Instalar la app")}</span>
            <span className="block text-sm text-muted-foreground">
              {tr("Tenedla en la pantalla de inicio del móvil y abridla con un toque.")}
            </span>
          </span>
          <span className="text-clay-ink">→</span>
        </a>

        <section className="rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
          <h3 className="font-display text-lg font-semibold">{tr("¿Qué echáis de menos?")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("Contadnos qué mejoraríais o qué os falta. Leemos todos los mensajes.")}
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            maxLength={4000}
            className={`${inputClass} mt-3 w-full`}
          />
          <button
            onClick={sendFeedback}
            disabled={sending || !feedback.trim()}
            className="mt-2 rounded-full bg-clay px-5 py-2 text-sm font-medium hover:bg-clay-ink hover:text-background disabled:opacity-60"
          >
            {sending ? tr("Un momento…") : tr("Enviar")}
          </button>
        </section>

        <section className="rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
          <h3 className="font-display text-lg font-semibold">{tr("Vuestros datos")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("Descargad una copia de todo lo que habéis guardado: tareas, presupuesto, invitados, mesas, proveedores…")}
          </p>
          <button onClick={exportData} className="mt-3 rounded-full border border-line px-5 py-2 text-sm hover:border-clay-ink">
            {tr("Descargar mis datos")}
          </button>

          <div className="mt-6 border-t border-line pt-5">
            <h4 className="font-medium text-destructive">{tr("Borrar la cuenta")}</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr("Se borrarán para siempre la cuenta y todos los datos de vuestra boda. No se puede deshacer y el pago no se devuelve.")}
            </p>
            <label className="mt-3 block text-sm">
              {tr("Para confirmar, escribid {word}:", { word: deleteWord })}
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={`${inputClass} mt-1 block w-48`}
              />
            </label>
            <button
              onClick={deleteAccount}
              disabled={deleting || confirmText.trim().toUpperCase() !== deleteWord.toUpperCase()}
              className="mt-3 rounded-full bg-destructive px-5 py-2 text-sm font-medium text-background disabled:opacity-40"
            >
              {deleting ? tr("Un momento…") : tr("Borrar mi cuenta")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
