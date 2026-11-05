import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, GripVertical, Move, Plus, Settings2, Sparkles, Trash2, UserPlus, Users, X } from "lucide-react";
import { t as tr, useI18n } from "@/i18n";

export type MesaTable = {
  id: string;
  name: string;
  capacity: number;
  shape: "round" | "rect";
  pos_x: number;
  pos_y: number;
  sort_order: number;
};

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
  "rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-clay-ink";

const RSVP_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  rechazado: "Rechazado",
};

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
    text: "Arrastrad invitados desde la lista «Sin asignar» directamente a una mesa. Cada mesa muestra cuántos invitados tiene sentados y su capacidad, y avisa si está llena.",
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

/** Position labels around a table using polar coordinates. */
function labelPositions(count: number, isRound: boolean) {
  const positions: { x: number; y: number }[] = [];
  if (count === 0) return positions;
  if (isRound) {
    const radius = 72;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      positions.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }
  } else {
    // Distribute along top and bottom edges of rectangular table
    const halfW = 82;
    const halfH = 52;
    for (let i = 0; i < count; i++) {
      if (i % 2 === 0) {
        const t = Math.floor(i / 2);
        const total = Math.ceil(count / 2);
        const x = total > 1 ? (t / (total - 1)) * 2 - 1 : 0;
        positions.push({ x: x * halfW, y: -halfH - 14 });
      } else {
        const t = Math.floor(i / 2);
        const total = Math.floor(count / 2);
        const x = total > 1 ? (t / (total - 1)) * 2 - 1 : 0;
        positions.push({ x: x * halfW, y: halfH + 14 });
      }
    }
  }
  return positions;
}

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
}: {
  table: MesaTable;
  seated: MesaGuest[];
  isDragging: boolean;
  isDragOver: boolean;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  /** En móvil se arrastra con eventos de puntero (dedo) en vez de arrastrar HTML5. */
  touchMode: boolean;
  position: { x: number; y: number };
  onTouchDragStart: (e: React.PointerEvent) => void;
}) {
  const { t: tr } = useI18n();
  const seatCount = seated.reduce((s, g) => s + 1 + g.companions, 0);
  const isFull = seatCount >= table.capacity;
  const isRound = table.shape === "round";
  const tableW = isRound ? 110 : 140;
  const tableH = isRound ? 110 : 90;
  const labels = labelPositions(Math.min(seated.length, 12), isRound);

  return (
    <div
      draggable={!touchMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      onPointerDown={touchMode ? onTouchDragStart : undefined}
      className={`absolute cursor-move select-none transition-opacity ${
        isDragging ? "opacity-40" : ""
      } ${touchMode ? "touch-none" : ""}`}
      style={{ left: position.x, top: position.y }}
    >
      <div className="relative" style={{ width: tableW, height: tableH }}>
        {/* Guest name labels around the table */}
        {seated.slice(0, 12).map((g, i) => {
          const pos = labels[i];
          if (!pos) return null;
          const cx = tableW / 2 + pos.x;
          const cy = tableH / 2 + pos.y;
          return (
            <span
              key={g.id}
              className="pointer-events-none absolute max-w-[80px] -translate-x-1/2 -translate-y-1/2 truncate rounded-full bg-background/90 px-1.5 py-0.5 text-center text-[9px] font-medium text-foreground ring-1 ring-foreground/10"
              style={{ left: cx, top: cy }}
              title={g.name}
            >
              {g.name.split(" ")[0]}
            </span>
          );
        })}

        {/* The table itself */}
        <div
          className={`flex h-full w-full flex-col items-center justify-center border-2 p-2 text-center transition-colors ${
            isRound ? "rounded-full" : "rounded-lg"
          } ${
            isDragOver
              ? "border-clay bg-clay/15"
              : isSelected
                ? "border-clay bg-clay/10"
                : "border-line bg-background hover:border-clay/50"
          }`}
        >
          <span className="font-display text-sm font-semibold">{table.name}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {seatCount}/{table.capacity}
          </span>
          {isFull && (
            <span className="mt-0.5 font-mono text-[9px] uppercase text-clay-ink">{tr("Llena")}</span>
          )}
        </div>
      </div>
    </div>
  );
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
  const [addingTable, setAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("8");
  const [newTableShape, setNewTableShape] = useState<"round" | "rect">("round");
  const canvasRef = useRef<HTMLDivElement>(null);
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

  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    const name = newTableName.trim() || tr("Mesa {n}", { n: tables.length + 1 });
    const capacity = Math.max(1, Number(newTableCapacity) || 8);
    const { error } = await supabase.from("wedding_tables").insert({
      wedding_id: wedding.id,
      user_id: userId,
      name,
      capacity,
      shape: newTableShape,
      sort_order: tables.length,
      pos_x: 50 + tables.length * 20,
      pos_y: 50 + (tables.length % 3) * 60,
    });
    if (error) {
      toast.error(tr("No se ha podido crear la mesa"));
      return;
    }
    setNewTableName("");
    setNewTableCapacity("8");
    setAddingTable(false);
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
    if (!table) return;
    const current = guestsByTable.get(tableId) ?? [];
    const totalSeats = current.reduce((s, g) => s + 1 + g.companions, 0);
    const guest = guests.find((g) => g.id === guestId);
    if (guest && totalSeats + 1 + guest.companions > table.capacity) {
      toast.error(tr("Esta mesa está llena (capacidad {n})", { n: table.capacity }));
      return;
    }
    void seatGuest(guestId, tableId);
  }

  function onTableTap(tableId: string) {
    if (pickedGuestId) {
      trySeat(pickedGuestId, tableId);
      setPickedGuestId(null);
      return;
    }
    setSelectedTableId(tableId);
  }

  function startTouchDrag(e: React.PointerEvent, table: MesaTable) {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    touchDrag.current = {
      id: table.id,
      dx: e.clientX - rect.left - table.pos_x,
      dy: e.clientY - rect.top - table.pos_y,
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
      x: Math.max(0, Math.round(e.clientX - rect.left - d.dx)),
      y: Math.max(0, Math.round(e.clientY - rect.top - d.dy)),
    });
  }

  function endTouchDrag() {
    const d = touchDrag.current;
    touchDrag.current = null;
    if (!d) return;
    lastTouchEnd.current = Date.now();
    if (d.moved && livePos && livePos.id === d.id) {
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

  const onTableDragStart = useCallback(
    (e: React.DragEvent, table: MesaTable) => {
      e.dataTransfer.setData(DRAG_TABLE, table.id);
      e.dataTransfer.effectAllowed = "move";
      setDraggingTableId(table.id);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTableDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [],
  );

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
        pos_x: Math.max(0, Math.round(x)),
        pos_y: Math.max(0, Math.round(y)),
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

  const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
  const seatedCount = guests.filter((g) => g.table_number).length;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{tr("Mesas")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("{a} mesas · {b} plazas · {c} invitados sentados", { a: tables.length, b: totalSeats, c: seatedCount })}
          </p>
        </div>
        <button
          onClick={() => setAddingTable((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-clay px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-clay-ink hover:text-background"
        >
          <Plus className="size-4" /> {tr("Mesa")}
        </button>
      </div>

      {addingTable && (
        <form
          onSubmit={addTable}
          className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-panel p-5 ring-1 ring-foreground/5"
        >
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {tr("Nombre")}
            </span>
            <input
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder={tr("Mesa {n}", { n: tables.length + 1 })}
              className={`${inputClass} w-40`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {tr("Plazas")}
            </span>
            <input
              type="number"
              min={1}
              value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(e.target.value)}
              className={`${inputClass} w-20`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {tr("Forma")}
            </span>
            <select
              value={newTableShape}
              onChange={(e) => setNewTableShape(e.target.value as "round" | "rect")}
              className={inputClass}
            >
              <option value="round">{tr("Redonda")}</option>
              <option value="rect">{tr("Rectangular")}</option>
            </select>
          </label>
          <button className="rounded-full bg-clay px-5 py-2 text-sm font-medium text-foreground hover:bg-clay-ink hover:text-background">
            {tr("Crear")}
          </button>
          <button
            type="button"
            onClick={() => setAddingTable(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {tr("Cancelar")}
          </button>
        </form>
      )}

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

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Salon canvas */}
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
          className="relative min-h-[480px] overflow-hidden rounded-2xl bg-panel ring-1 ring-foreground/5"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--color-line) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          {tables.length === 0 && (
            <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-center">
              <Users className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {tr("Cread vuestra primera mesa para empezar a colocar invitados.")}
              </p>
            </div>
          )}

          {tables.map((table) => {
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
                onDragStart={(e) => onTableDragStart(e, table)}
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
                    : { x: table.pos_x, y: table.pos_y }
                }
                onTouchDragStart={(e) => startTouchDrag(e, table)}
              />
            );
          })}
        </div>

        {/* Sidebar: unseated guests + selected table detail */}
        <div className="space-y-6">
          {/* Selected table detail */}
          {selectedTable && (
            <div className="rounded-2xl bg-panel p-5 ring-1 ring-foreground/5">
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
                      const v = e.target.value as "round" | "rect";
                      if (v !== selectedTable.shape)
                        void updateTable(selectedTable.id, { shape: v });
                    }}
                    className={inputClass}
                  >
                    <option value="round">{tr("Redonda")}</option>
                    <option value="rect">{tr("Rectangular")}</option>
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
                        dragOverGuestId === g.id ? "ring-2 ring-clay/50" : ""
                      }`}
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
