import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type Task = {
  id: string;
  title: string;
  category: string;
  due_date: string | null;
  done: boolean;
  owner: string;
  notes: string | null;
};
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

const DEFAULT_TASKS: { title: string; category: string }[] = [
  { title: "Fijar la fecha y el presupuesto total", category: "12 meses antes" },
  { title: "Elegir y reservar el lugar de la ceremonia", category: "12 meses antes" },
  { title: "Reservar el espacio del banquete", category: "12 meses antes" },
  { title: "Cerrar la lista inicial de invitados", category: "10 meses antes" },
  { title: "Contratar fotógrafo y vídeo", category: "9 meses antes" },
  { title: "Elegir los trajes y vestidos", category: "8 meses antes" },
  { title: "Reservar catering y menú de prueba", category: "6 meses antes" },
  { title: "Enviar las invitaciones", category: "4 meses antes" },
  { title: "Contratar música y flores", category: "4 meses antes" },
  { title: "Cerrar el número final de invitados", category: "1 mes antes" },
  { title: "Repartir el cronograma del día", category: "1 semana antes" },
];

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
    const [t, e, g, v, tl, c, mt] = await Promise.all([
      supabase.from("tasks").select("id,title,category,due_date,done,owner,notes").eq("wedding_id", weddingId).order("created_at"),
      supabase.from("expenses").select("id,concept,category,planned,actual_cost,paid,notes").eq("wedding_id", weddingId).order("created_at"),
      supabase.from("guests").select("id,name,guest_group,invited_by,rsvp,table_number,companions,notes,seat_order").eq("wedding_id", weddingId).order("created_at"),
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
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-2">
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
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-6 pb-3 text-sm">
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

      <main className="mx-auto max-w-6xl px-6 py-10">
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
        {!locked && tab === "invitados" && <Invitados guests={guests} {...ctx} />}
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
        {tab === "ajustes" && <Ajustes wedding={wedding} setWedding={setWedding} />}
      </main>
      <footer className="mx-auto max-w-6xl px-6 pb-10">
        <LegalLinks />
      </footer>
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

function Resumen({
  wedding,
  tasks,
  setTasks,
  budget,
  confirmed,
  guests,
  vendors,
}: {
  wedding: Wedding;
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  budget: { planned: number; actual: number; paid: number };
  confirmed: number;
  guests: number;
  vendors: number;
}) {
  const { t: tr } = useI18n();
  const doneCount = tasks.filter((t) => t.done).length;
  const pending = tasks.filter((t) => !t.done).slice(0, 5);

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
          <p className="font-display text-3xl font-semibold leading-tight">{countdownLabel}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {countdownDetail}
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={tr("Tareas hechas")}
          value={`${doneCount}/${tasks.length}`}
          hint={tasks.length ? tr("{n}% completado", { n: Math.round((doneCount / tasks.length) * 100) }) : undefined}
        />
        <Stat
          label={tr("Presupuesto")}
          value={money(Number(wedding.total_budget) - budget.planned, wedding.currency)}
          hint={tr("Disponible {a} · Estimado {b}", {
            a: money(Number(wedding.total_budget), wedding.currency),
            b: money(budget.planned, wedding.currency),
          })}
        />
        <Stat label={tr("Invitados confirmados")} value={`${confirmed}`} hint={tr("{n} en la lista", { n: guests })} />
        <Stat label={tr("Proveedores")} value={`${vendors}`} hint={tr("Fichas guardadas")} />
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
                {tr(t.title)}
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {tr(t.category)}
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

const TASK_CATEGORIES = [
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

function Checklist({
  tasks,
  setTasks,
  wedding,
  userId,
  reload,
}: {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  wedding: Wedding;
  userId: string;
  reload: () => Promise<void>;
}) {
  const { t: tr } = useI18n();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [filter, setFilter] = useState<"todas" | "pendientes" | "completadas">("todas");

  async function toggle(task: Task) {
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    await supabase.from("tasks").update({ done: !task.done }).eq("id", task.id);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { error } = await supabase
      .from("tasks")
      .insert({ title, category, wedding_id: wedding.id, user_id: userId });
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    setTitle("");
    await reload();
  }

  async function remove(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    await reload();
  }

  async function patchTask(id: string, values: Partial<Task>) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...values } : t)));
    const { error } = await supabase.from("tasks").update(values).eq("id", id);
    if (error) toast.error(tr("No se ha podido guardar"));
  }

  const total = tasks.length;
  const completed = tasks.filter((t) => t.done).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  const visible = tasks.filter((t) =>
    filter === "todas" ? true : filter === "pendientes" ? !t.done : t.done,
  );

  const categoryOptions = Array.from(
    new Set([...TASK_CATEGORIES, ...tasks.map((t) => t.category)]),
  );

  const groups = visible.reduce<Record<string, Task[]>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  const orderedGroups = Object.entries(groups).sort((a, b) => {
    const ia = categoryOptions.indexOf(a[0]);
    const ib = categoryOptions.indexOf(b[0]);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });

  const filters: { key: typeof filter; label: string; count: number }[] = [
    { key: "todas", label: "Todas", count: total },
    { key: "pendientes", label: "Pendientes", count: total - completed },
    { key: "completadas", label: "Completadas", count: completed },
  ];

  return (
    <div>
      <SectionHeader title={tr("Checklist")} subtitle={tr("Todo lo que hay que hacer, mes a mes.")} />

      <div className="mb-8 rounded-2xl bg-panel px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-clay-ink">{tr("Progreso")}</span>
          <span className="text-sm text-muted-foreground">
            {tr("{done} de {total} tareas", { done: completed, total })} ·{" "}
            <span className="font-medium text-foreground">{percent}%</span>
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-clay-soft">
          <div
            className="h-full rounded-full bg-clay transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <form onSubmit={add} className="mb-6 flex flex-wrap gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={tr("Nueva tarea")}
          className={`${inputClass} flex-1 min-w-[220px]`}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {tr(c)}
            </option>
          ))}
        </select>
        <button className="rounded-full bg-clay px-5 py-2 text-sm font-medium text-foreground hover:bg-clay-ink hover:text-background">
          {tr("Añadir")}
        </button>
      </form>

      <div className="mb-8 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
              filter === f.key
                ? "bg-clay text-foreground"
                : "bg-panel text-muted-foreground hover:text-foreground"
            }`}
          >
            {tr(f.label)} ({f.count})
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {orderedGroups.length === 0 && (
          <p className="text-sm text-muted-foreground">{tr("No hay tareas en esta vista.")}</p>
        )}
        {orderedGroups.map(([group, items]) => (
          <div key={group}>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-clay-ink">{tr(group)}</div>
            <ul className="space-y-2">
              {items.map((t) => (
                <li key={t.id} className="rounded-lg bg-panel px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggle(t)}
                      className="size-4 accent-clay-ink"
                    />
                    <span className={t.done ? "text-muted-foreground line-through" : ""}>{tr(t.title)}</span>
                    <button
                      onClick={() => remove(t.id)}
                      className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                    >
                      {tr("Borrar")}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 pl-7">
                    <TextField
                      value={t.owner ?? ""}
                      onSave={(owner) => patchTask(t.id, { owner })}
                      placeholder={tr("Responsable")}
                      className="w-40 py-1.5 text-xs"
                    />
                    <TextField
                      value={t.notes ?? ""}
                      onSave={(notes) => patchTask(t.id, { notes })}
                      placeholder={tr("Notas")}
                      className="min-w-[10rem] flex-1 py-1.5 text-xs"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}


const RSVP = ["pendiente", "confirmado", "rechazado"];
const GUEST_GROUPS = ["Familia", "Amigos", "Acompañante", "Trabajo", "Otros"];
const RSVP_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  rechazado: "Rechazado",
};

function Invitados({
  guests,
  wedding,
  userId,
  reload,
}: {
  guests: Guest[];
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
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const { error } = await supabase.from("guests").insert({
      name: form.name,
      guest_group: form.guest_group,
      invited_by: form.invited_by,
      notes: form.notes.trim(),
      wedding_id: wedding.id,
      user_id: userId,
    });
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    setForm({ name: "", invited_by: hosts[0]!, guest_group: "Familia", notes: "" });
    await reload();
  }

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

  return (
    <div>
      <SectionHeader
        title={tr("Invitados")}
        subtitle={`${tr("{n} en la lista", { n: guests.length })} · ${tr("{n} plazas", { n: totalSeats })}${
          Number(wedding.guest_target) ? ` · ${tr("objetivo {n}", { n: wedding.guest_target })}` : ""
        }`}
      />
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
        <input
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder={tr("Notas (opcional)")}
          className={`${inputClass} min-w-[200px] flex-1`}
        />
        <button className="rounded-full bg-clay px-5 py-2 text-sm font-medium text-foreground hover:bg-clay-ink hover:text-background">
          {tr("Añadir")}
        </button>
      </form>

      <ul className="space-y-2">
        {guests.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-panel px-4 py-3 text-sm">
            <span className="font-medium">{g.name}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {tr(g.guest_group)}
              {g.invited_by && ` · ${tr("de {name}", { name: tr(g.invited_by) })}`}
            </span>
            <input
              defaultValue={g.notes ?? ""}
              placeholder={tr("Notas")}
              onBlur={async (e) => {
                const next = e.target.value;
                if (next === (g.notes ?? "")) return;
                await supabase.from("guests").update({ notes: next }).eq("id", g.id);
                await reload();
              }}
              className="w-48 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/60 hover:border-line focus:border-clay-ink focus:bg-background"
            />
            <select
              value={g.rsvp}
              onChange={async (e) => {
                await supabase.from("guests").update({ rsvp: e.target.value }).eq("id", g.id);
                await reload();
              }}
              className="ml-auto rounded-lg border border-line bg-background px-2 py-1 text-xs"
            >
              {RSVP.map((r) => (
                <option key={r} value={r}>
                  {tr(r)}
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                await supabase.from("guests").delete().eq("id", g.id);
                await reload();
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {tr("Borrar")}
            </button>
          </li>
        ))}
        {guests.length === 0 && (
          <li className="rounded-lg bg-panel px-4 py-8 text-center text-sm text-muted-foreground">
            {tr("Empezad añadiendo a la familia más cercana.")}
          </li>
        )}
      </ul>

      {guests.length > 0 && (
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
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

  const service = form.service || services[0] || "Otros";

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
              {tr(s)}
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
          return (
            <div key={v.id} className="rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl font-semibold">{v.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-clay-ink">{tr(v.service)}</div>
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
                <button
                  onClick={async () => {
                    await supabase.from("vendors").delete().eq("id", v.id);
                    await reload();
                  }}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  {tr("Borrar")}
                </button>
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
}: {
  wedding: Wedding;
  setWedding: (w: Wedding) => void;
}) {
  const { t: tr } = useI18n();
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
          <input
            value={form.partner_one}
            onChange={(e) => setForm({ ...form, partner_one: e.target.value })}
            placeholder={tr("Nombre 1")}
            className={inputClass}
          />
          <input
            value={form.partner_two}
            onChange={(e) => setForm({ ...form, partner_two: e.target.value })}
            placeholder={tr("Nombre 2")}
            className={inputClass}
          />
        </div>
        <input
          type="date"
          value={form.wedding_date}
          onChange={(e) => setForm({ ...form, wedding_date: e.target.value })}
          className={`${inputClass} w-full`}
        />
        <input
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
          placeholder={tr("Lugar")}
          className={`${inputClass} w-full`}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={form.guest_target}
            onChange={(e) => setForm({ ...form, guest_target: e.target.value })}
            placeholder={tr("Invitados previstos")}
            inputMode="numeric"
            className={inputClass}
          />
          <input
            value={form.total_budget}
            onChange={(e) => setForm({ ...form, total_budget: e.target.value })}
            placeholder={`${tr("Presupuesto total")} ${currencySymbol(form.currency)}`}
            inputMode="decimal"
            className={inputClass}
          />
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
    </div>
  );
}
