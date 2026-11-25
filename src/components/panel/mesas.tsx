import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, GripVertical, Minus, Move, Plus, Settings2, Sparkles, Trash2, UserPlus, X } from "lucide-react";
import { t as tr, useI18n } from "@/i18n";

export type MesaTable = {
  id: string;
  name: string;
  capacity: number;
  /** round, rect y head son mesas con sillas; zone-rect y zone-circle son rincones (DJ, pista…), sin sillas. */
  shape: TableShape;
  pos_x: number;
  pos_y: number;
  sort_order: number;
};

export type TableShape = "round" | "rect" | "head" | "zone-rect" | "zone-circle";
export const isZone = (t: { shape: string }) => t.shape.startsWith("zone");

export type MesaGuest = {
  id: string;
  name: string;
  guest_group: string;
  rsvp: string;
  companions: number;
  table_number: string | null;
  seat_order: number;
};

const inputClass =
  "rounded-lg border border-line bg-background px-3 py-2 text-base outline-none focus:border-clay-ink sm:text-sm";

const RSVP_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  rechazado: "Rechazado",
};

// Borde del nombre de cada invitado sentado según su confirmación.
const RSVP_RING: Record<string, string> = {
  confirmado: "ring-2 ring-emerald-500",
  pendiente: "ring-2 ring-amber-500",
  rechazado: "ring-2 ring-red-500",
};
const RSVP_DOT: Record<string, string> = {
  confirmado: "bg-emerald-500",
  pendiente: "bg-amber-500",
  rechazado: "bg-red-500",
};
const rsvpRing = (rsvp: string) => RSVP_RING[rsvp] ?? RSVP_RING.pendiente;

const DRAG_GUEST = "application/x-guest-id";
const DRAG_TABLE = "application/x-table-id";
const DRAG_SEATED = "application/x-seated-guest-id";

const GUIDE_STEPS = [
  {
    icon: Move,
    title: "Moved las mesas a vuestro gusto",
    text: "Arrastrad las mesas por el lienzo para colocarlas como queráis.",
  },
  {
    icon: UserPlus,
    title: "Sentad a los invitados",
    text: "Arrastrad invitados desde «Sin asignar» a una mesa, o de una mesa a otra arrastrando su nombre. Cada mesa muestra sus sillas ocupadas y avisa si está llena.",
  },
  {
    icon: Settings2,
    title: "Editad cada mesa",
    text: "Al hacer clic en una mesa, aparece un panel lateral para editar su nombre, plazas y forma, ver quién está sentado, reordenar invitados, quitarlos o borrar la mesa.",
  },
] as const;

function MesasGuide() {
  const { t: tr } = useI18n();
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-panel/60 ring-1 ring-foreground/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-clay-soft/40"
      >
        <span className="flex items-center gap-2.5">
          <Sparkles className="size-4 text-clay-ink" />
          <span className="font-display text-sm font-semibold">{tr("Cómo organizar las mesas")}</span>
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-4 px-5 pb-5 pt-1 sm:grid-cols-3">
            {GUIDE_STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-xl bg-background p-4 ring-1 ring-foreground/5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-clay-soft font-mono text-[10px] font-semibold text-clay-ink">
                    {i + 1}
                  </span>
                  <step.icon className="size-4 text-muted-foreground" />
                </div>
                <h3 className="font-display text-sm font-semibold leading-snug">{tr(step.title)}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{tr(step.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Medidas en el plano. En los rincones, «capacity» guarda el tamaño: 1 pequeño, 2 mediano, 3 grande. */
function dims(t: { shape: string; capacity: number }) {
  const size = Math.min(3, Math.max(1, t.capacity || 2)) - 1;
  switch (t.shape) {
    case "round":
      return { w: 112, h: 112 };
    case "head":
      return { w: 240, h: 62 };
    case "zone-rect":
      return { w: [150, 220, 300][size], h: [96, 140, 190][size] };
    case "zone-circle":
      return { w: [110, 150, 200][size], h: [110, 150, 200][size] };
    default:
      return { w: 150, h: 84 };
  }
}

/** Icono de un rincón según su nombre. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const ZONE_ICONS: [RegExp, string][] = [
  [/pista|baile|dance|ballo|piste|danse/, "💃"],
  [/dj|musica|music|sonido|sound/, "🎧"],
  [/banda|band|orquesta|orchest|grupo|groupe|concierto|musicos|musicien/, "🎸"],
  [/foto|photo|video/, "📸"],
  [/barra|bar\b|copas|cocktail|coctel/, "🍸"],
  [/tarta|pastel|cake|torta|gateau|bolo/, "🎂"],
  [/candy|dulce|chuche|doce|bonbon|dolci/, "🍬"],
  [/altar|ceremon/, "💒"],
  [/regalo|sobres|gift|cadeau|presente/, "🎁"],
  [/niño|nino|infantil|kids|bambini|enfant|criança|crianca/, "🧸"],
  [/flor|flower|fleur|fiori/, "💐"],
  [/entrada|puerta|entrance|entree|ingresso/, "🚪"],
  [/buffet|comida|quesos|jamon|food/, "🧀"],
];
const zoneIcon = (name: string) => ZONE_ICONS.find(([re]) => re.test(norm(name)))?.[1] ?? "✨";

/** Puntos alrededor de la mesa (sillas o nombres); `spread` = distancia extra desde el borde. */
function seatPoints(count: number, isRound: boolean, w: number, h: number, spread: number, oneSide = false) {
  const points: { x: number; y: number }[] = [];
  if (count === 0) return points;
  if (oneSide) {
    // Mesa presidencial: todas las sillas en el mismo lado, mirando al salón.
    const halfW = w / 2 - 16;
    for (let i = 0; i < count; i++) {
      points.push({ x: count > 1 ? (i / (count - 1)) * 2 * halfW - halfW : 0, y: -(h / 2 + spread) });
    }
    return points;
  }
  if (isRound) {
    const radius = w / 2 + spread;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    return points;
  }
  // Mesa rectangular: sillas repartidas por el lado de arriba y el de abajo.
  const top = Math.ceil(count / 2);
  const bottom = count - top;
  const halfW = w / 2 - 14;
  const along = (i: number, n: number) => (n > 1 ? (i / (n - 1)) * 2 - 1 : 0) * halfW;
  for (let i = 0; i < count; i++) {
    const onTop = i % 2 === 0;
    const k = Math.floor(i / 2);
    points.push({ x: along(k, onTop ? top : bottom), y: (onTop ? -1 : 1) * (h / 2 + spread) });
  }
  return points;
}

/** Suelo del salón: cuadros rosa y crema muy suaves, para que destaquen las mesas. */
const CHECKER_BG = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='112' height='112'>" +
    "<rect width='112' height='112' fill='#FDF9F1'/>" +
    "<rect x='2' y='2' width='52' height='52' rx='4' fill='#F9E8E6'/>" +
    "<rect x='58' y='58' width='52' height='52' rx='4' fill='#F9E8E6'/>" +
    "</svg>",
)}")`;

/** true en móviles y tablets (dedo), false con ratón. */
function useTouchDevice() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setTouch(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return touch;
}

function TableView({
  table,
  seated,
  isDragging,
  isDragOver,
  isSelected,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  touchMode,
  position,
  onTouchDragStart,
  pickedGuestId,
  onGuestDragStart,
  onGuestTap,
}: {
  table: MesaTable;
  seated: MesaGuest[];
  isDragging: boolean;
  isDragOver: boolean;
  isSelected: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  /** En móvil se arrastra con eventos de puntero (dedo) en vez de arrastrar HTML5. */
  touchMode: boolean;
  position: { x: number; y: number };
  onTouchDragStart: (e: React.PointerEvent) => void;
  pickedGuestId: string | null;
  onGuestDragStart: (e: React.DragEvent, guestId: string) => void;
  onGuestTap: (guestId: string) => void;
}) {
  const { t: tr } = useI18n();
  const seatCount = seated.reduce((s, g) => s + 1 + g.companions, 0);
  const isFull = seatCount >= table.capacity;
  const isRound = table.shape === "round";
  const isHead = table.shape === "head";
  const { w: tableW, h: tableH } = dims(table);
  const chairs = Math.min(Math.max(table.capacity, seatCount), 20);
  const chairPts = seatPoints(chairs, isRound, tableW, tableH, 13, isHead);
  // En las rectangulares y la presidencial los nombres se escalonan para que no se pisen.
  const labelPts = seatPoints(chairs, isRound, tableW, tableH, isRound ? 44 : 32, isHead).map((pt, i) =>
    isRound || (isHead ? i % 2 === 0 : Math.floor(i / 2) % 2 === 0) ? pt : { x: pt.x, y: pt.y + Math.sign(pt.y) * 20 },
  );

  // Cada invitado ocupa una silla, y sus acompañantes las siguientes.
  let next = 0;
  const firstChair = new Map<string, number>();
  for (const g of seated) {
    firstChair.set(g.id, next);
    next += 1 + g.companions;
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      onPointerDown={onTouchDragStart}
      className={`absolute touch-none cursor-move select-none transition-opacity ${isDragging ? "opacity-40" : ""}`}
      style={{ left: position.x, top: position.y }}
    >
      <div className="relative" style={{ width: tableW, height: tableH }}>
        {/* Sillas */}
        {chairPts.map((pt, i) => (
          <span
            key={`c${i}`}
            className={`pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm ${
              i < seatCount ? "border-clay-ink bg-clay" : "border-clay/50 bg-white"
            }`}
            style={{ left: tableW / 2 + pt.x, top: tableH / 2 + pt.y }}
          />
        ))}

        {/* La mesa */}
        <div
          className={`relative flex h-full w-full flex-col items-center justify-center border-2 p-2 text-center shadow-[0_10px_24px_-12px_rgba(120,60,70,0.45)] transition-colors ${
            isRound ? "rounded-full" : isHead ? "rounded-xl" : "rounded-2xl"
          } ${
            isDragOver
              ? "border-clay-ink bg-clay-soft"
              : isSelected
                ? "border-clay-ink bg-white ring-4 ring-clay/30"
                : "border-clay/70 bg-white hover:border-clay-ink"
          }`}
        >
          {isHead && (
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-clay-ink">{tr("Presidencial")}</span>
          )}
          <span className="max-w-full truncate font-display text-base font-semibold leading-tight">{table.name}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {seatCount}/{table.capacity}
          </span>
          {isFull && (
            <span className="mt-0.5 font-mono text-[9px] uppercase text-clay-ink">{tr("Llena")}</span>
          )}
        </div>

        {/* Nombres: se pueden arrastrar (o tocar) para cambiar de mesa */}
        {seated.map((g) => {
          const pt = labelPts[firstChair.get(g.id) ?? 0];
          if (!pt) return null;
          const picked = pickedGuestId === g.id;
          return (
            <span
              key={g.id}
              draggable={!touchMode}
              onDragStart={(e) => {
                e.stopPropagation();
                onGuestDragStart(e, g.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onGuestTap(g.id);
              }}
              className={`absolute z-10 max-w-[84px] -translate-x-1/2 -translate-y-1/2 cursor-grab truncate rounded-full px-2 py-0.5 text-center text-[10px] font-medium shadow-sm transition-colors active:cursor-grabbing ${
                picked ? "bg-clay-ink text-background ring-1 ring-clay-ink" : `bg-white text-foreground ${rsvpRing(g.rsvp)}`
              }`}
              style={{ left: tableW / 2 + pt.x, top: tableH / 2 + pt.y }}
              title={g.companions > 0 ? `${g.name} (+${g.companions})` : g.name}
            >
              {g.name.split(" ")[0]}
              {g.companions > 0 && <span className="text-muted-foreground"> +{g.companions}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Un rincón del salón (pista de baile, DJ, banda…): sin sillas, solo forma y nombre. */
function ZoneView({
  zone,
  isSelected,
  isDragging,
  position,
  onClick,
  onPointerDown,
}: {
  zone: MesaTable;
  isSelected: boolean;
  isDragging: boolean;
  position: { x: number; y: number };
  onClick: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const { w, h } = dims(zone);
  const round = zone.shape === "zone-circle";
  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`absolute touch-none cursor-move select-none transition-opacity ${isDragging ? "opacity-40" : ""}`}
      style={{ left: position.x, top: position.y, width: w, height: h }}
    >
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-1 border-2 border-dashed p-2 text-center transition-colors ${
          round ? "rounded-full" : "rounded-2xl"
        } ${isSelected ? "border-clay-ink bg-clay-soft ring-4 ring-clay/30" : "border-amber-400/70 bg-amber-50/90 hover:border-clay-ink"}`}
      >
        <span className="text-2xl leading-none" aria-hidden>
          {zoneIcon(zone.name)}
        </span>
        <span className="max-w-full truncate font-display text-sm font-semibold leading-tight">{zone.name}</span>
      </div>
    </div>
  );
}

/** Dibujo pequeño de cada pieza para la barra de herramientas. */
/** Mini plano de cada distribución inicial. */
function LayoutPreview({ kind }: { kind: "pista" | "cuadricula" | "largas" }) {
  const t = "fill-white stroke-clay-ink";
  return (
    <svg viewBox="0 0 80 56" className="h-14 w-20" aria-hidden>
      <rect x="25" y="3" width="30" height="6" rx="2" className={t} strokeWidth="1.2" />
      {kind === "pista" && (
        <>
          <rect x="28" y="22" width="24" height="16" rx="2" className="fill-amber-50 stroke-amber-400" strokeDasharray="2 2" strokeWidth="1.2" />
          {[
            [12, 18],
            [68, 18],
            [10, 34],
            [70, 34],
            [22, 48],
            [40, 50],
            [58, 48],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" className={t} strokeWidth="1.2" />
          ))}
        </>
      )}
      {kind === "cuadricula" &&
        [0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => <circle key={`${r}${c}`} cx={13 + c * 18} cy={20 + r * 14} r="5" className={t} strokeWidth="1.2" />))}
      {kind === "largas" &&
        [0, 1].flatMap((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={6 + c * 25} y={18 + r * 18} width="19" height="9" rx="1.5" className={t} strokeWidth="1.2" />))}
    </svg>
  );
}

function ShapeIcon({ shape }: { shape: TableShape }) {
  const zone = shape.startsWith("zone");
  const cls = zone ? "border-2 border-dashed border-amber-400 bg-amber-50" : "border-2 border-clay bg-white";
  if (shape === "round" || shape === "zone-circle") return <span className={`block size-8 rounded-full ${cls}`} />;
  if (shape === "head") return <span className={`block h-4 w-12 rounded-md ${cls}`} />;
  return <span className={`block h-7 w-11 rounded-lg ${cls}`} />;
}

export function Mesas({
  tables,
  guests,
  wedding,
  userId,
  reload,
}: {
  tables: MesaTable[];
  guests: MesaGuest[];
  wedding: { id: string };
  userId: string;
  reload: () => Promise<void>;
}) {
  const { t: tr } = useI18n();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);
  // Plazas con las que se crean las mesas desde la barra de herramientas.
  const [caps, setCaps] = useState<Record<"round" | "rect" | "head", number>>({ round: 8, rect: 10, head: 6 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [tableDragOffset, setTableDragOffset] = useState({ x: 0, y: 0 });
  const [dragOverGuestId, setDragOverGuestId] = useState<string | null>(null);
  const touchMode = useTouchDevice();
  // Tocar un invitado y luego una mesa (funciona con dedo y con ratón).
  const [pickedGuestId, setPickedGuestId] = useState<string | null>(null);
  // Arrastre de mesas con el dedo.
  const [livePos, setLivePos] = useState<{ id: string; x: number; y: number } | null>(null);
  const touchDrag = useRef<{ id: string; dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(
    null,
  );
  // Tras un toque con el dedo, ignorar el "click" que algunos navegadores envían después.
  const lastTouchEnd = useRef(0);

  const guestsByTable = useMemo(() => {
    const map = new Map<string, MesaGuest[]>();
    for (const g of guests) {
      if (g.table_number) {
        const arr = map.get(g.table_number) ?? [];
        arr.push(g);
        map.set(g.table_number, arr);
      }
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.seat_order ?? 0) - (b.seat_order ?? 0));
    }
    return map;
  }, [guests]);

  const unseatedGuests = useMemo(
    () => guests.filter((g) => !g.table_number && g.rsvp !== "rechazado"),
    [guests],
  );

  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;
  const selectedGuests = selectedTableId ? guestsByTable.get(selectedTableId) ?? [] : [];

  const seatingTables = tables.filter((t) => !isZone(t));

  /** Añade una mesa o un rincón en la parte del salón que se está viendo, sin pisar lo que ya hay. */
  async function addPiece(shape: TableShape, opts: { name?: string; capacity?: number } = {}) {
    const zone = shape.startsWith("zone");
    const capacity = opts.capacity ?? (zone ? 2 : caps[shape as "round" | "rect" | "head"] ?? 8);
    const name = opts.name ?? (zone ? tr("Rincón") : tr("Mesa {n}", { n: seatingTables.length + 1 }));
    const view = scrollRef.current;
    const ox = (view?.scrollLeft ?? 0) + 70;
    const oy = (view?.scrollTop ?? 0) + 70;
    const { w, h } = dims({ shape, capacity });
    // Busca el primer hueco libre en una cuadrícula desde la esquina visible.
    const taken = tables.map((t) => ({ ...(moved[t.id] ?? { x: t.pos_x, y: t.pos_y }), ...dims(t) }));
    let pos = { x: ox, y: oy };
    search: for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 6; col++) {
        const c = { x: ox + col * 240, y: oy + row * 230 };
        const free = taken.every((t) => c.x + w + 60 < t.x || t.x + t.w + 60 < c.x || c.y + h + 60 < t.y || t.y + t.h + 60 < c.y);
        if (free) {
          pos = c;
          break search;
        }
      }
    }
    const { data, error } = await supabase
      .from("wedding_tables")
      .insert({
        wedding_id: wedding.id,
        user_id: userId,
        name,
        capacity,
        shape,
        sort_order: tables.length,
        pos_x: Math.round(pos.x),
        pos_y: Math.round(pos.y),
      })
      .select("id")
      .single();
    if (error) {
      toast.error(tr("No se ha podido crear la mesa"));
      return;
    }
    await reload();
    if (data?.id) setSelectedTableId(data.id);
  }

  /** Plazas que hacen falta: invitados que no han dicho que no, con sus acompañantes. */
  const seatsNeeded = guests.filter((g) => g.rsvp !== "rechazado").reduce((n, g) => n + 1 + g.companions, 0);

  /** Distribuciones para empezar (solo con el salón vacío). */
  const LAYOUTS = [
    { key: "pista", title: "Redondas alrededor de la pista", sub: (n: number) => tr("{n} mesas redondas de 8", { n }) },
    { key: "cuadricula", title: "Cuadrícula de redondas", sub: (n: number) => tr("{n} mesas redondas de 8", { n }) },
    { key: "largas", title: "Mesas largas en filas", sub: (n: number) => tr("{n} mesas rectangulares de 10", { n }) },
  ] as const;
  const roundsNeeded = Math.max(4, Math.ceil(seatsNeeded / 8));
  const longNeeded = Math.max(3, Math.ceil(seatsNeeded / 10));

  async function applyLayout(key: (typeof LAYOUTS)[number]["key"]) {
    type New = { name: string; capacity: number; shape: TableShape; pos_x: number; pos_y: number };
    const rows: New[] = [{ name: tr("Presidencial"), capacity: 6, shape: "head", pos_x: 0, pos_y: 70 }];
    let n = 0;
    const mesa = () => tr("Mesa {n}", { n: ++n });
    if (key === "pista") {
      const R = Math.max(380, (roundsNeeded * 230) / (2 * Math.PI));
      const cx = 160 + R;
      const cy = 300 + R;
      rows[0].pos_x = cx - 120;
      rows.push({ name: tr("Pista de baile"), capacity: 3, shape: "zone-rect", pos_x: cx - 150, pos_y: cy - 95 });
      for (let i = 0; i < roundsNeeded; i++) {
        // Repartidas en círculo, dejando libre el lado de arriba (donde está la presidencial).
        const ang = -Math.PI / 2 + Math.PI * 0.35 + (Math.PI * 1.3 * i) / Math.max(1, roundsNeeded - 1);
        rows.push({ name: mesa(), capacity: 8, shape: "round", pos_x: Math.round(cx + Math.cos(ang) * R - 56), pos_y: Math.round(cy + Math.sin(ang) * R - 56) });
      }
    } else if (key === "cuadricula") {
      const cols = 5;
      rows[0].pos_x = 120 + ((cols - 1) * 250) / 2 - 64;
      for (let i = 0; i < roundsNeeded; i++) {
        rows.push({ name: mesa(), capacity: 8, shape: "round", pos_x: 120 + (i % cols) * 250, pos_y: 300 + Math.floor(i / cols) * 250 });
      }
    } else {
      const cols = 3;
      rows[0].pos_x = 120 + ((cols - 1) * 300) / 2 - 45;
      for (let i = 0; i < longNeeded; i++) {
        rows.push({ name: mesa(), capacity: 10, shape: "rect", pos_x: 120 + (i % cols) * 300, pos_y: 300 + Math.floor(i / cols) * 260 });
      }
    }
    const { error } = await supabase.from("wedding_tables").insert(
      rows.map((r, i) => ({ ...r, pos_x: Math.max(40, Math.round(r.pos_x)), pos_y: Math.max(40, Math.round(r.pos_y)), sort_order: i, wedding_id: wedding.id, user_id: userId })),
    );
    if (error) {
      toast.error(tr("No se ha podido crear la mesa"));
      return;
    }
    toast.success(tr("Distribución creada. Ahora podéis mover, añadir o quitar lo que queráis."));
    await reload();
  }

  async function updateTable(id: string, patch: Partial<MesaTable>) {
    const { error } = await supabase.from("wedding_tables").update(patch).eq("id", id);
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      return;
    }
    await reload();
  }

  async function deleteTable(id: string) {
    const seated = guestsByTable.get(id) ?? [];
    if (seated.length > 0) {
      await supabase.from("guests").update({ table_number: null }).eq("table_number", id);
    }
    const { error } = await supabase.from("wedding_tables").delete().eq("id", id);
    if (error) {
      toast.error(tr("No se ha podido borrar la mesa"));
      return;
    }
    setSelectedTableId(null);
    await reload();
  }

  async function seatGuest(guestId: string, tableId: string | null) {
    let seatOrder = 0;
    if (tableId) {
      const current = guestsByTable.get(tableId) ?? [];
      seatOrder = current.length;
    }
    const { error } = await supabase
      .from("guests")
      .update({ table_number: tableId, seat_order: seatOrder })
      .eq("id", guestId);
    if (error) {
      toast.error(tr("No se ha podido asignar"));
      return;
    }
    await reload();
  }

  async function reorderGuests(tableId: string, reordered: MesaGuest[]) {
    const updates = reordered.map((g, i) =>
      supabase.from("guests").update({ seat_order: i }).eq("id", g.id),
    );
    await Promise.all(updates);
    await reload();
  }

  /** Sienta a un invitado si cabe en la mesa; avisa si está llena. */
  function trySeat(guestId: string, tableId: string) {
    const table = tables.find((t) => t.id === tableId);
    if (!table || isZone(table)) return;
    const guest = guests.find((g) => g.id === guestId);
    if (guest?.table_number === tableId) return; // ya está en esa mesa
    const current = (guestsByTable.get(tableId) ?? []).filter((g) => g.id !== guestId);
    const totalSeats = current.reduce((s, g) => s + 1 + g.companions, 0);
    if (guest && totalSeats + 1 + guest.companions > table.capacity) {
      toast.error(tr("Esta mesa está llena (capacidad {n})", { n: table.capacity }));
      return;
    }
    void seatGuest(guestId, tableId);
  }

  function onTableTap(tableId: string) {
    const target = tables.find((t) => t.id === tableId);
    if (pickedGuestId && target && !isZone(target)) {
      trySeat(pickedGuestId, tableId);
      setPickedGuestId(null);
      return;
    }
    setSelectedTableId(tableId);
  }

  // Mesas movidas que aún no han vuelto de la base de datos: se quedan donde se soltaron.
  const [moved, setMoved] = useState<Record<string, { x: number; y: number }>>({});
  useEffect(() => {
    setMoved((m) => {
      const next = { ...m };
      for (const t of tables) if (next[t.id] && next[t.id].x === t.pos_x && next[t.id].y === t.pos_y) delete next[t.id];
      return Object.keys(next).length === Object.keys(m).length ? m : next;
    });
  }, [tables]);

  // Arrastre de mesas con ratón y con dedo (eventos de puntero: la mesa sigue al cursor).
  function startTouchDrag(e: React.PointerEvent, table: MesaTable) {
    if (!canvasRef.current || e.button !== 0) return;
    const start = moved[table.id] ?? { x: table.pos_x, y: table.pos_y };
    const rect = canvasRef.current.getBoundingClientRect();
    touchDrag.current = {
      id: table.id,
      dx: e.clientX - rect.left - start.x,
      dy: e.clientY - rect.top - start.y,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
    canvasRef.current.setPointerCapture?.(e.pointerId);
  }

  function moveTouchDrag(e: React.PointerEvent) {
    const d = touchDrag.current;
    if (!d || !canvasRef.current) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return;
    d.moved = true;
    const rect = canvasRef.current.getBoundingClientRect();
    setLivePos({
      id: d.id,
      x: Math.max(40, Math.round(e.clientX - rect.left - d.dx)),
      y: Math.max(40, Math.round(e.clientY - rect.top - d.dy)),
    });
  }

  function endTouchDrag() {
    const d = touchDrag.current;
    touchDrag.current = null;
    if (!d) return;
    lastTouchEnd.current = Date.now();
    if (d.moved && livePos && livePos.id === d.id) {
      setMoved((m) => ({ ...m, [d.id]: { x: livePos.x, y: livePos.y } }));
      void updateTable(d.id, { pos_x: livePos.x, pos_y: livePos.y });
    } else if (!d.moved) {
      // Toque sin mover: igual que hacer clic en la mesa.
      onTableTap(d.id);
    }
    setLivePos(null);
  }

  function moveSeated(idx: number, dir: -1 | 1) {
    const to = idx + dir;
    if (!selectedTableId || to < 0 || to >= selectedGuests.length) return;
    const reordered = [...selectedGuests];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(to, 0, moved);
    void reorderGuests(selectedTableId, reordered);
  }

  function handleGuestDrop(e: React.DragEvent, tableId: string) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTableId(null);
    const guestId = e.dataTransfer.getData(DRAG_GUEST);
    if (!guestId) return;
    trySeat(guestId, tableId);
  }

  function handleGuestDropToUnseated(e: React.DragEvent) {
    e.preventDefault();
    setDragOverTableId(null);
    const guestId = e.dataTransfer.getData(DRAG_GUEST);
    if (!guestId) return;
    void seatGuest(guestId, null);
  }

  function handleSeatedGuestDrop(targetId: string) {
    const draggedId = dragOverGuestId;
    setDragOverGuestId(null);
    if (!draggedId || draggedId === targetId) return;
    const reordered = [...selectedGuests];
    const fromIdx = reordered.findIndex((g) => g.id === draggedId);
    const toIdx = reordered.findIndex((g) => g.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    void reorderGuests(selectedTableId!, reordered);
  }



  const onCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const tableId = e.dataTransfer.getData(DRAG_TABLE);
      if (!tableId || !canvasRef.current) {
        setDraggingTableId(null);
        return;
      }
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left - tableDragOffset.x;
      const y = e.clientY - canvasRect.top - tableDragOffset.y;
      void updateTable(tableId, {
        pos_x: Math.max(40, Math.round(x)),
        pos_y: Math.max(40, Math.round(y)),
      });
      setDraggingTableId(null);
    },
    [tableDragOffset],
  );

  useEffect(() => {
    function handleDragEnd() {
      setDraggingTableId(null);
      setDragOverTableId(null);
      setDragOverGuestId(null);
    }
    window.addEventListener("dragend", handleDragEnd);
    return () => window.removeEventListener("dragend", handleDragEnd);
  }, []);

  const totalSeats = seatingTables.reduce((s, t) => s + t.capacity, 0);
  // El salón crece si las mesas se colocan más lejos; siempre deja sitio para añadir más.
  const canvasSize = {
    w: Math.max(1500, ...tables.map((t) => t.pos_x + dims(t).w + 260)),
    h: Math.max(1100, ...tables.map((t) => t.pos_y + dims(t).h + 260)),
  };
  const seatedCount = guests.filter((g) => g.table_number).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">{tr("Mesas")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tr("{a} mesas · {b} plazas · {c} invitados sentados", { a: seatingTables.length, b: totalSeats, c: seatedCount })}
        </p>
      </div>

      {/* Barra de herramientas: mesas para invitados y rincones a vuestro aire */}
      <div className="mb-6 overflow-x-auto rounded-3xl bg-panel p-4 ring-1 ring-foreground/5">
        <div className="flex min-w-max gap-6">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-clay-ink">{tr("Mesas para invitados")}</p>
            <div className="flex gap-2">
              {(
                [
                  { shape: "round", label: "Redonda" },
                  { shape: "rect", label: "Rectangular" },
                  { shape: "head", label: "Presidencial" },
                ] as const
              ).map((it) => (
                <div key={it.shape} className="flex items-center gap-2 rounded-2xl bg-background px-3 py-2 ring-1 ring-line">
                  <button
                    type="button"
                    onClick={() => addPiece(it.shape)}
                    className="flex flex-col items-center gap-1 rounded-xl px-1 py-0.5 hover:bg-clay-soft/60"
                    title={tr("Añadir")}
                  >
                    <span className="grid h-8 place-items-center">
                      <ShapeIcon shape={it.shape} />
                    </span>
                    <span className="text-[11px]">{tr(it.label)}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCaps((c) => ({ ...c, [it.shape]: Math.max(1, c[it.shape] - 1) }))}
                      className="grid size-6 place-items-center rounded-full ring-1 ring-line hover:ring-clay-ink"
                      aria-label={tr("Menos plazas")}
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-5 text-center font-mono text-xs font-semibold">{caps[it.shape]}</span>
                    <button
                      type="button"
                      onClick={() => setCaps((c) => ({ ...c, [it.shape]: Math.min(20, c[it.shape] + 1) }))}
                      className="grid size-6 place-items-center rounded-full ring-1 ring-line hover:ring-clay-ink"
                      aria-label={tr("Más plazas")}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-clay-ink">✨ {tr("Rincones a vuestro aire")}</p>
            <div className="flex gap-2">
              {(
                [
                  { shape: "zone-rect", label: "Rectángulo" },
                  { shape: "zone-circle", label: "Círculo" },
                ] as const
              ).map((it) => (
                <button
                  key={it.shape}
                  type="button"
                  onClick={() => addPiece(it.shape)}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-background px-3 py-2 ring-1 ring-line hover:ring-clay-ink"
                >
                  <span className="grid h-8 place-items-center">
                    <ShapeIcon shape={it.shape} />
                  </span>
                  <span className="text-[11px]">{tr(it.label)}</span>
                </button>
              ))}
              {(
                [
                  { name: "Pista de baile", shape: "zone-rect", size: 3 },
                  { name: "DJ", shape: "zone-rect", size: 1 },
                  { name: "Banda", shape: "zone-rect", size: 2 },
                  { name: "Photocall", shape: "zone-rect", size: 1 },
                  { name: "Barra", shape: "zone-rect", size: 2 },
                  { name: "Tarta", shape: "zone-circle", size: 1 },
                  { name: "Candy bar", shape: "zone-rect", size: 1 },
                ] as const
              ).map((it) => (
                <button
                  key={it.name}
                  type="button"
                  onClick={() => addPiece(it.shape, { name: tr(it.name), capacity: it.size })}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-background px-3 py-2 ring-1 ring-line hover:ring-clay-ink"
                >
                  <span className="grid h-8 place-items-center text-2xl leading-none" aria-hidden>
                    {zoneIcon(it.name)}
                  </span>
                  <span className="whitespace-nowrap text-[11px]">{tr(it.name)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <MesasGuide />

      {pickedGuestId && (
        <div className="sticky top-24 z-20 mb-4 flex items-center justify-between gap-3 rounded-xl bg-clay px-4 py-3 text-sm">
          <span>
            {tr("Tocad una mesa para sentar a {name}", {
              name: guests.find((g) => g.id === pickedGuestId)?.name ?? "",
            })}
          </span>
          <button type="button" onClick={() => setPickedGuestId(null)} className="font-medium underline">
            {tr("Cancelar")}
          </button>
        </div>
      )}

      {/* Leyenda de colores de los nombres sentados */}
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {(["confirmado", "pendiente", "rechazado"] as const).map((r) => (
          <span key={r} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${RSVP_DOT[r]}`} aria-hidden />
            {tr(RSVP_LABEL[r] ?? r)}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Salón: lienzo grande con scroll para que quepan muchas mesas */}
        <div ref={scrollRef} className="relative max-h-[78vh] min-h-[520px] overflow-auto rounded-2xl ring-1 ring-foreground/10">
        <div
          ref={canvasRef}
          onDragOver={(e) => {
            e.preventDefault();
            if (e.dataTransfer.types.includes(DRAG_TABLE)) e.dataTransfer.dropEffect = "move";
          }}
          onDrop={onCanvasDrop}
          onPointerMove={moveTouchDrag}
          onPointerUp={endTouchDrag}
          onPointerCancel={endTouchDrag}
          className="relative"
          style={{
            width: canvasSize.w,
            height: canvasSize.h,
            backgroundImage: CHECKER_BG,
            backgroundSize: "112px 112px",
          }}
        >
          {tables.length === 0 && (
            <div className="sticky left-0 top-0 w-full max-w-[min(100vw-3rem,56rem)] p-4 sm:p-8">
              <div className="rounded-3xl bg-white/95 p-5 text-center shadow-md sm:p-7">
                <h3 className="font-display text-2xl font-semibold">{tr("Empezad con una distribución")}</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  {tr("Pensada para vuestros {n} invitados. Luego podéis mover, añadir o quitar lo que queráis.", { n: seatsNeeded })}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => addPiece("round")}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-clay/60 bg-background p-4 hover:border-clay-ink"
                  >
                    <Plus className="size-6 text-clay-ink" />
                    <span className="font-display text-base font-semibold">{tr("Desde cero")}</span>
                    <span className="text-[11px] text-muted-foreground">{tr("Salón vacío")}</span>
                  </button>
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.key}
                      type="button"
                      onClick={() => applyLayout(l.key)}
                      className="flex flex-col items-center gap-2 rounded-2xl bg-background p-4 text-center ring-1 ring-line hover:ring-clay-ink"
                    >
                      <LayoutPreview kind={l.key} />
                      <span className="font-display text-base font-semibold leading-tight">{tr(l.title)}</span>
                      <span className="text-[11px] text-muted-foreground">{l.sub(l.key === "largas" ? longNeeded : roundsNeeded)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rincones (debajo de las mesas) */}
          {tables.filter(isZone).map((zone) => (
            <ZoneView
              key={zone.id}
              zone={zone}
              isSelected={selectedTableId === zone.id}
              isDragging={draggingTableId === zone.id}
              position={livePos?.id === zone.id ? { x: livePos.x, y: livePos.y } : moved[zone.id] ?? { x: zone.pos_x, y: zone.pos_y }}
              onPointerDown={(e) => startTouchDrag(e, zone)}
              onClick={() => {
                if (Date.now() - lastTouchEnd.current < 600) return;
                setSelectedTableId(zone.id);
              }}
            />
          ))}

          {seatingTables.map((table) => {
            const seated = guestsByTable.get(table.id) ?? [];
            const isDragging = draggingTableId === table.id;
            const isDragOver = dragOverTableId === table.id;
            const isSelected = selectedTableId === table.id;

            return (
              <TableView
                key={table.id}
                table={table}
                seated={seated}
                isDragging={isDragging}
                isDragOver={isDragOver}
                isSelected={isSelected}
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes(DRAG_GUEST)) {
                    e.preventDefault();
                    setDragOverTableId(table.id);
                  }
                }}
                onDragLeave={() => setDragOverTableId((id) => (id === table.id ? null : id))}
                onDrop={(e) => handleGuestDrop(e, table.id)}
                onClick={() => {
                  if (Date.now() - lastTouchEnd.current < 600) return;
                  onTableTap(table.id);
                }}
                touchMode={touchMode}
                position={
                  livePos?.id === table.id
                    ? { x: livePos.x, y: livePos.y }
                    : moved[table.id] ?? { x: table.pos_x, y: table.pos_y }
                }
                onTouchDragStart={(e) => startTouchDrag(e, table)}
                pickedGuestId={pickedGuestId}
                onGuestDragStart={(e, guestId) => {
                  e.dataTransfer.setData(DRAG_GUEST, guestId);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onGuestTap={(guestId) => {
                  if (Date.now() - lastTouchEnd.current < 600) return;
                  setPickedGuestId((id) => (id === guestId ? null : guestId));
                }}
              />
            );
          })}
        </div>
        </div>

        {/* Sidebar: unseated guests + selected table detail */}
        <div className="space-y-6">
          {/* Selected table detail */}
          {selectedTable && isZone(selectedTable) && (
            <div key={selectedTable.id} className="rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <span aria-hidden>{zoneIcon(selectedTable.name)}</span> {selectedTable.name}
                </h3>
                <button onClick={() => setSelectedTableId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <label className="mb-4 flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Nombre")}</span>
                <input
                  defaultValue={selectedTable.name}
                  placeholder={tr("DJ, fotógrafo, banda, barra…")}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== selectedTable.name) void updateTable(selectedTable.id, { name: v });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  className={inputClass}
                />
              </label>
              <div className="mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Forma")}</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {(
                    [
                      { v: "zone-rect", label: "Rectángulo" },
                      { v: "zone-circle", label: "Círculo" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => selectedTable.shape !== o.v && void updateTable(selectedTable.id, { shape: o.v })}
                      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ${
                        selectedTable.shape === o.v ? "bg-clay-soft ring-clay-ink" : "bg-background ring-line hover:ring-clay-ink"
                      }`}
                    >
                      <ShapeIcon shape={o.v} /> {tr(o.label)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{tr("Tamaño")}</span>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(["Pequeño", "Mediano", "Grande"] as const).map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => selectedTable.capacity !== i + 1 && void updateTable(selectedTable.id, { capacity: i + 1 })}
                      className={`rounded-xl px-2 py-2 text-sm ring-1 ${
                        selectedTable.capacity === i + 1 ? "bg-clay-soft ring-clay-ink" : "bg-background ring-line hover:ring-clay-ink"
                      }`}
                    >
                      {tr(label)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">{tr("Arrastradlo por el salón para colocarlo donde vaya a estar.")}</p>
              <button
                onClick={() => deleteTable(selectedTable.id)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" /> {tr("Quitar del salón")}
              </button>
            </div>
          )}

          {selectedTable && !isZone(selectedTable) && (
            <div key={selectedTable.id} className="rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">{selectedTable.name}</h3>
                <button
                  onClick={() => setSelectedTableId(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mb-4 flex gap-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {tr("Nombre")}
                  </span>
                  <input
                    defaultValue={selectedTable.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== selectedTable.name)
                        void updateTable(selectedTable.id, { name: v });
                    }}
                    className={inputClass}
                  />
                </label>
                <label className="flex w-20 flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {tr("Plazas")}
                  </span>
                  <input
                    type="number"
                    min={1}
                    defaultValue={selectedTable.capacity}
                    onBlur={(e) => {
                      const n = Number(e.target.value) || 1;
                      if (n !== selectedTable.capacity)
                        void updateTable(selectedTable.id, { capacity: n });
                    }}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="mb-4">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {tr("Forma")}
                  </span>
                  <select
                    defaultValue={selectedTable.shape}
                    onChange={(e) => {
                      const v = e.target.value as TableShape;
                      if (v !== selectedTable.shape)
                        void updateTable(selectedTable.id, { shape: v });
                    }}
                    className={inputClass}
                  >
                    <option value="round">{tr("Redonda")}</option>
                    <option value="rect">{tr("Rectangular")}</option>
                    <option value="head">{tr("Presidencial (un solo lado)")}</option>
                  </select>
                </label>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {tr("Sentados ({n})", { n: selectedGuests.length })}
                  </span>
                  {selectedGuests.length > 1 && (
                    <span className="font-mono text-[9px] text-muted-foreground">
                      {tr("Arrastrad para reordenar")}
                    </span>
                  )}
                </div>
                <ul className="mt-2 space-y-1">
                  {selectedGuests.map((g, idx) => (
                    <li
                      key={g.id}
                      draggable={!touchMode}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(DRAG_SEATED, g.id);
                        e.dataTransfer.setData(DRAG_GUEST, g.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragOverGuestId(g.id);
                      }}
                      onDragOver={(e) => {
                        if (e.dataTransfer.types.includes(DRAG_SEATED)) {
                          e.preventDefault();
                          setDragOverGuestId(g.id);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSeatedGuestDrop(g.id);
                      }}
                      className={`flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm transition-colors ${
                        dragOverGuestId === g.id ? "ring-2 ring-clay/50" : rsvpRing(g.rsvp)
                      }`}
                      title={tr(RSVP_LABEL[g.rsvp] ?? g.rsvp)}
                    >
                      <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground/60" />
                      <span className="font-mono text-[9px] text-muted-foreground/50">{idx + 1}</span>
                      <span className="flex-1 truncate">{g.name}</span>
                      {g.companions > 0 && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          +{g.companions}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => moveSeated(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label={tr("Subir")}
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSeated(idx, 1)}
                        disabled={idx === selectedGuests.length - 1}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label={tr("Bajar")}
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                      <button
                        onClick={() => seatGuest(g.id, null)}
                        className="text-muted-foreground hover:text-foreground"
                        title={tr("Quitar de la mesa")}
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                  {selectedGuests.length === 0 && (
                    <li className="rounded-lg bg-background px-3 py-3 text-center text-xs text-muted-foreground">
                      {tr("Arrastrad invitados aquí")}
                    </li>
                  )}
                </ul>
              </div>

              <button
                onClick={() => deleteTable(selectedTable.id)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" /> {tr("Borrar mesa")}
              </button>
            </div>
          )}

          {/* Unseated guests */}
          <div
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(DRAG_GUEST)) e.preventDefault();
            }}
            onDrop={handleGuestDropToUnseated}
            className="rounded-2xl bg-panel p-5 ring-1 ring-foreground/5"
          >
            <h3 className="mb-1 font-display text-lg font-semibold">{tr("Sin asignar")}</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              {touchMode
                ? tr("Tocad un invitado y después una mesa")
                : tr("Arrastrad a una mesa del salón o haced clic en un invitado y después en una mesa")}
            </p>
            <ul className="space-y-1">
              {unseatedGuests.map((g) => (
                <li
                  key={g.id}
                  draggable={!touchMode}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_GUEST, g.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => setPickedGuestId((id) => (id === g.id ? null : g.id))}
                  className={`flex cursor-grab items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:ring-1 hover:ring-clay/30 active:cursor-grabbing ${
                    pickedGuestId === g.id ? "bg-clay ring-2 ring-clay-ink" : "bg-background"
                  }`}
                >
                  <span className="flex-1 truncate">{g.name}</span>
                  {g.companions > 0 && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      +{g.companions}
                    </span>
                  )}
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">
                    {tr(RSVP_LABEL[g.rsvp] ?? g.rsvp)}
                  </span>
                </li>
              ))}
              {unseatedGuests.length === 0 && (
                <li className="rounded-lg bg-background px-3 py-3 text-center text-xs text-muted-foreground">
                  {tr("Todos sentados")}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
