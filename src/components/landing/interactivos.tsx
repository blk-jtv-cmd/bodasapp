import { useMemo, useRef, useState } from "react";

const eyebrow = "mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-clay-ink";
const h2 = "text-balance font-display text-4xl tracking-tight md:text-5xl";
const card = "rounded-2xl bg-panel p-6 ring-1 ring-foreground/5 sm:p-8";
const chip = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm transition-colors ${
    active ? "bg-clay text-foreground" : "bg-background text-muted-foreground ring-1 ring-line hover:text-foreground"
  }`;

const euros = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    Math.round(n / 10) * 10,
  );

/* ---------------------------------------------------------------- */
/* 1 · La boda en tu cabeza                                          */
/* ---------------------------------------------------------------- */
const QUESTIONS = [
  "¿Cuánto llevamos gastado de verdad?",
  "¿Pagamos ya la señal del fotógrafo?",
  "¿Dónde guardé el presupuesto de la finca?",
  "¿Cuántos han confirmado ya?",
  "¿Quién falta por contestar?",
  "¿Quién se ha quedado sin mesa?",
  "¿Qué toca hacer esta semana?",
  "¿A qué hora llega la florista?",
  "¿Alguien más sabe todo esto aparte de mí?",
];

export function MentalLoad() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <div className={eyebrow}>(a) La boda en tu cabeza</div>
          <h2 className={h2}>Organizar una boda no es solo hacer cosas. Es acordarte de todo.</h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Presupuestos en el WhatsApp, pagos en una libreta, invitados sin confirmar… y cada respuesta
            abre una pregunta nueva.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTIONS.map((q) => (
            <div key={q} className="rounded-xl bg-panel px-5 py-4 font-display text-lg italic ring-1 ring-foreground/5">
              {q}
            </div>
          ))}
        </div>
        <div className="mt-10 max-w-2xl rounded-2xl bg-clay-soft px-6 py-5">
          <p className="font-display text-2xl leading-snug">
            No eres desorganizada. Es que la boda está repartida en mil sitios que no se hablan entre sí.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu Boda en Orden lo junta todo en un solo lugar, para que veas qué está hecho, qué falta y qué
            toca ahora.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 3 · Calculadora de presupuesto                                    */
/* ---------------------------------------------------------------- */
const STYLES = [
  { key: "sencilla", label: "Sencilla", perGuest: 130 },
  { key: "clasica", label: "Clásica", perGuest: 200 },
  { key: "premium", label: "Premium", perGuest: 320 },
] as const;

const SPLIT: [string, number][] = [
  ["Lugar y catering", 0.48],
  ["Vestido, traje y belleza", 0.11],
  ["Fotografía y vídeo", 0.1],
  ["Flores y decoración", 0.08],
  ["Música y DJ", 0.06],
  ["Anillos", 0.05],
  ["Transporte", 0.03],
  ["Invitaciones y papelería", 0.02],
  ["Otros e imprevistos", 0.07],
];

export function BudgetCalculator() {
  const [guests, setGuests] = useState(100);
  const [style, setStyle] = useState<(typeof STYLES)[number]["key"]>("clasica");
  const perGuest = STYLES.find((s) => s.key === style)!.perGuest;
  const total = guests * perGuest;

  return (
    <section id="pruebalo" className="scroll-mt-24 border-t border-line bg-clay-soft/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <div className={eyebrow}>(b) Pruébalo · Presupuesto</div>
          <h2 className={h2}>¿Cuánto puede costar vuestra boda?</h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Mueve el número de invitados y elige el estilo. Te damos una primera idea y cómo suele
            repartirse.
          </p>
          <div className="mt-8 space-y-6">
            <label className="block">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-medium">Invitados</span>
                <span className="font-display text-3xl font-semibold">{guests}</span>
              </div>
              <input
                type="range"
                min={20}
                max={300}
                step={5}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full accent-clay-ink"
              />
            </label>
            <div>
              <div className="mb-2 text-sm font-medium">Estilo de boda</div>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button key={s.key} type="button" onClick={() => setStyle(s.key)} className={chip(style === s.key)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={card}>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Presupuesto orientativo
              </div>
              <div className="mt-1 font-display text-5xl font-semibold">{euros(total)}</div>
            </div>
            <div className="text-sm text-muted-foreground">≈ {euros(perGuest)} por invitado</div>
          </div>
          <ul className="mt-6 space-y-2.5">
            {SPLIT.map(([name, pct]) => (
              <li key={name}>
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-medium">{euros(total * pct)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-clay-soft">
                  <div className="h-full rounded-full bg-clay" style={{ width: `${(pct / 0.48) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">
            Cifras orientativas: cambian mucho según la ciudad, la fecha y vuestras prioridades. Dentro de la
            app llevaréis el presupuesto real, partida a partida.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 4 · Mini checklist                                                */
/* ---------------------------------------------------------------- */
const SAMPLE_TASKS = [
  ["12 meses antes", "Fijar fecha y presupuesto"],
  ["12-9 meses", "Reservar la finca"],
  ["9-6 meses", "Contratar fotógrafo y vídeo"],
  ["6-4 meses", "Enviar el save the date"],
  ["1 mes antes", "Cerrar invitados y mesas"],
  ["Última semana", "Repartir el horario del día"],
] as const;

export function ChecklistDemo() {
  const [done, setDone] = useState<boolean[]>(SAMPLE_TASKS.map(() => false));
  const count = done.filter(Boolean).length;
  const pct = Math.round((count / SAMPLE_TASKS.length) * 100);

  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
        <div className="lg:order-2">
          <div className={eyebrow}>Pruébalo · Checklist</div>
          <h2 className={h2}>¿Cuántas de estas tenéis ya?</h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Marca las que ya estén hechas y mira cómo avanza. Dentro tenéis el checklist completo por etapas,
            con responsable y notas en cada tarea.
          </p>
        </div>
        <div className={card}>
          <div className="mb-5 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-clay-ink">Progreso</span>
            <span className="text-sm text-muted-foreground">
              {count} de {SAMPLE_TASKS.length} · <span className="font-medium text-foreground">{pct}%</span>
            </span>
          </div>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-clay-soft">
            <div className="h-full rounded-full bg-clay transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <ul className="space-y-2">
            {SAMPLE_TASKS.map(([when, task], i) => (
              <li key={task}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-background px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={done[i]}
                    onChange={() => setDone(done.map((d, j) => (j === i ? !d : d)))}
                    className="size-4 accent-clay-ink"
                  />
                  <span className={done[i] ? "text-muted-foreground line-through" : ""}>{task}</span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {when}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {count === SAMPLE_TASKS.length && (
            <p className="mt-4 text-center font-display text-lg text-clay-ink">¡Qué bien vais! 🎉</p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 5 · Cronograma según la hora de la ceremonia                      */
/* ---------------------------------------------------------------- */
const CEREMONY_TIMES = ["12:00", "18:00", "19:00"];
const DAY_PLAN: [number, string, string][] = [
  [-240, "Peluquería y maquillaje", "Novia y acompañantes"],
  [-150, "Vestirse y fotos de preparativos", "Novios · fotógrafo"],
  [-60, "Fotógrafo y música listos en la ceremonia", "Proveedores"],
  [-30, "Llegada y recibimiento de invitados", "Familia · padrinos"],
  [0, "Ceremonia", "Todos"],
  [60, "Fotos de familia y grupos", "Fotógrafo"],
  [90, "Cóctel de bienvenida", "Catering"],
  [210, "__BANQUETE__", "Catering · DJ"],
  [360, "Primer baile y barra libre", "Novios · DJ"],
];

function shift(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const t = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function TimelineDemo() {
  const [time, setTime] = useState("18:00");
  const meal = Number(time.split(":")[0]) < 15 ? "Comida" : "Cena";

  return (
    <section className="border-t border-line bg-clay-soft/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <div className={eyebrow}>Pruébalo · El gran día</div>
          <h2 className={h2}>La ceremonia es a las {time}. ¿Y todo lo demás?</h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Elige la hora y mira cómo se reorganiza el día. En la app lo ajustáis a vuestra boda, con
            responsables para cada momento.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {CEREMONY_TIMES.map((t) => (
              <button key={t} type="button" onClick={() => setTime(t)} className={chip(time === t)}>
                Ceremonia {t}
              </button>
            ))}
          </div>
        </div>
        <ol className={card}>
          {DAY_PLAN.map(([offset, title, who], i) => {
            const isCeremony = offset === 0;
            return (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className={`mt-1.5 size-3 rounded-full ${isCeremony ? "bg-clay-ink" : "bg-clay"}`} />
                  {i < DAY_PLAN.length - 1 && <span className="w-px flex-1 bg-line" />}
                </div>
                <div className="pb-5">
                  <div className="flex items-baseline gap-3">
                    <span className={`font-mono text-xs ${isCeremony ? "font-semibold text-clay-ink" : "text-muted-foreground"}`}>
                      {shift(time, offset)}
                    </span>
                    <span className={`font-display ${isCeremony ? "text-lg font-semibold" : "text-base"}`}>
                      {title === "__BANQUETE__" ? `${meal} y discursos` : title}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{who}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 6 · Mini plano de mesas (arrastrar con el dedo o el ratón)        */
/* ---------------------------------------------------------------- */
type Pos = { x: number; y: number };
const INITIAL_TABLES: Pos[] = [
  { x: 18, y: 55 },
  { x: 38, y: 78 },
  { x: 62, y: 78 },
  { x: 82, y: 55 },
  { x: 25, y: 30 },
  { x: 75, y: 30 },
];

export function SeatingDemo() {
  const [tables, setTables] = useState<Pos[]>(INITIAL_TABLES);
  const area = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);

  const moveTo = (clientX: number, clientY: number) => {
    const i = dragging.current;
    const rect = area.current?.getBoundingClientRect();
    if (i === null || !rect) return;
    const x = Math.min(94, Math.max(6, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(92, Math.max(22, ((clientY - rect.top) / rect.height) * 100));
    setTables((t) => t.map((p, j) => (j === i ? { x, y } : p)));
  };

  const hint = useMemo(() => "Arrastra las mesas para colocarlas", []);

  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.15fr_1fr]">
        <div
          ref={area}
          className="relative aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-2xl bg-panel ring-1 ring-foreground/5"
          onPointerMove={(e) => moveTo(e.clientX, e.clientY)}
          onPointerUp={() => (dragging.current = null)}
          onPointerLeave={() => (dragging.current = null)}
        >
          <div className="absolute left-1/2 top-[5%] -translate-x-1/2 rounded-full bg-clay px-6 py-2 text-xs font-medium">
            Mesa presidencial
          </div>
          <div className="absolute left-1/2 top-[52%] flex size-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-dashed border-clay-ink/40 font-mono text-[10px] uppercase tracking-[0.2em] text-clay-ink">
            Pista
          </div>
          {tables.map((p, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Mesa ${i + 1}`}
              onPointerDown={(e) => {
                dragging.current = i;
                (e.currentTarget.parentElement as HTMLElement).setPointerCapture?.(e.pointerId);
              }}
              className="absolute flex size-[13%] min-h-10 min-w-10 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full bg-background font-display text-lg font-semibold shadow-sm ring-2 ring-clay active:cursor-grabbing"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {i + 1}
            </button>
          ))}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">☝️ {hint}</div>
        </div>
        <div>
          <div className={eyebrow}>Pruébalo · Plano de mesas</div>
          <h2 className={h2}>¿Dónde iría cada mesa?</h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Mueve las mesas como si fuera vuestro salón. En la app colocáis las mesas reales, sentáis a cada
            invitado y veis quién se ha quedado sin sitio.
          </p>
          <button
            type="button"
            onClick={() => setTables(INITIAL_TABLES)}
            className="mt-6 text-sm font-medium text-clay-ink underline underline-offset-4"
          >
            Volver a colocar
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 10 · Preguntas frecuentes                                         */
/* ---------------------------------------------------------------- */
const FAQ: [string, string][] = [
  ["¿Es un pago único?", "Sí. Pagas 37 € una sola vez. No hay suscripciones ni cuotas mensuales."],
  [
    "¿Puedo probarla antes de pagar?",
    "Sí. Al crear la cuenta tenéis gratis el Resumen y el Checklist. El resto se desbloquea al pagar.",
  ],
  [
    "¿Funciona en el móvil?",
    "Sí. Es una web, así que la usáis desde el navegador del móvil, la tablet o el ordenador, sin instalar nada.",
  ],
  [
    "¿Podemos usarla los dos novios?",
    "Sí: la cuenta es de la pareja, así que podéis entrar los dos con el mismo email y contraseña y veréis los mismos datos.",
  ],
  [
    "¿Qué es la plantilla en Excel?",
    "Es nuestro planificador completo en una hoja de cálculo, por si alguna vez preferís trabajar en Excel, Numbers o Google Sheets. Se descarga desde la app una vez pagado el plan.",
  ],
  ["¿Sirve si tenemos wedding planner?", "Sí. Os ayuda a tener vuestra propia visión de todo y a compartir datos claros con ella."],
  ["¿Quién puede ver mis datos?", "Solo vosotros. Cada pareja ve únicamente su propia boda."],
];

export function Faq() {
  return (
    <section id="preguntas" className="scroll-mt-24 border-t border-line">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className={eyebrow}>(d) Preguntas frecuentes</div>
        <h2 className={h2}>Lo que suelen preguntarnos</h2>
        <div className="mt-10 divide-y divide-line rounded-2xl bg-panel ring-1 ring-foreground/5">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold">
                {q}
                <span className="text-clay-ink transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
