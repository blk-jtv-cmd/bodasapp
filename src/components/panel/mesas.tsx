import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, GripVertical, Move, Plus, Settings2, Sparkles, Trash2, UserPlus, Users, X } from "lucide-react";

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
  "rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-clay";

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
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-panel/60 ring-1 ring-foreground/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-clay-soft/40"
      >
        <span className="flex items-center gap-2.5">
          <Sparkles className="size-4 text-clay" />
          <span className="font-display text-sm font-semibold">Cómo organizar las mesas</span>
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
                  <span className="flex size-7 items-center justify-center rounded-full bg-clay-soft font-mono text-[10px] font-semibold text-clay">
                    {i + 1}
                  </span>
                  <step.icon className="size-4 text-muted-foreground" />
                </div>
                <h3 className="font-display text-sm font-semibold leading-snug">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
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
}) {
  const seatCount = seated.reduce((s, g) => s + 1 + g.companions, 0);
  const isFull = seatCount >= table.capacity;
  const isRound = table.shape === "round";
  const tableW = isRound ? 110 : 140;
  const tableH = isRound ? 110 : 90;
  const labels = labelPositions(Math.min(seated.length, 12), isRound);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`absolute cursor-move select-none transition-opacity ${
        isDragging ? "opacity-40" : ""
      }`}
      style={{ left: table.pos_x, top: table.pos_y }}
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
            <span className="mt-0.5 font-mono text-[9px] uppercase text-clay">Llena</span>
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
    const name = newTableName.trim() || `Mesa ${tables.length + 1}`;
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
      toast.error("No se ha podido crear la mesa");
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
      toast.error("No se ha podido guardar");
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
      toast.error("No se ha podido borrar la mesa");
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
      toast.error("No se ha podido asignar");
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

  function handleGuestDrop(e: React.DragEvent, tableId: string) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTableId(null);
    const guestId = e.dataTransfer.getData(DRAG_GUEST);
    if (!guestId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const current = guestsByTable.get(tableId) ?? [];
    const totalSeats = current.reduce((s, g) => s + 1 + g.companions, 0);
    const guest = guests.find((g) => g.id === guestId);
    if (guest && totalSeats + 1 + guest.companions > table.capacity) {
      toast.error(`Esta mesa está llena (capacidad ${table.capacity})`);
      return;
    }
    void seatGuest(guestId, tableId);
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
          <h1 className="font-display text-3xl font-semibold">Mesas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tables.length} mesas · {totalSeats} plazas · {seatedCount} invitados sentados
          </p>
        </div>
        <button
          onClick={() => setAddingTable((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-clay px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground"
        >
          <Plus className="size-4" /> Mesa
        </button>
      </div>

      {addingTable && (
        <form
          onSubmit={addTable}
          className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-panel p-5 ring-1 ring-foreground/5"
        >
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Nombre
            </span>
            <input
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder={`Mesa ${tables.length + 1}`}
              className={`${inputClass} w-40`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Plazas
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
              Forma
            </span>
            <select
              value={newTableShape}
              onChange={(e) => setNewTableShape(e.target.value as "round" | "rect")}
              className={inputClass}
            >
              <option value="round">Redonda</option>
              <option value="rect">Rectangular</option>
            </select>
          </label>
          <button className="rounded-full bg-clay px-5 py-2 text-sm font-medium text-background hover:bg-foreground">
            Crear
          </button>
          <button
            type="button"
            onClick={() => setAddingTable(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </form>
      )}

      <MesasGuide />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Salon canvas */}
        <div
          ref={canvasRef}
          onDragOver={(e) => {
            e.preventDefault();
            if (e.dataTransfer.types.includes(DRAG_TABLE)) e.dataTransfer.dropEffect = "move";
          }}
          onDrop={onCanvasDrop}
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
                Cread vuestra primera mesa para empezar a colocar invitados.
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
                onClick={() => setSelectedTableId(table.id)}
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
                    Nombre
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
                    Plazas
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
                    Forma
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
                    <option value="round">Redonda</option>
                    <option value="rect">Rectangular</option>
                  </select>
                </label>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Sentados ({selectedGuests.length})
                  </span>
                  {selectedGuests.length > 1 && (
                    <span className="font-mono text-[9px] text-muted-foreground">
                      Arrastrad para reordenar
                    </span>
                  )}
                </div>
                <ul className="mt-2 space-y-1">
                  {selectedGuests.map((g, idx) => (
                    <li
                      key={g.id}
                      draggable
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
                        onClick={() => seatGuest(g.id, null)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Quitar de la mesa"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                  {selectedGuests.length === 0 && (
                    <li className="rounded-lg bg-background px-3 py-3 text-center text-xs text-muted-foreground">
                      Arrastrad invitados aquí
                    </li>
                  )}
                </ul>
              </div>

              <button
                onClick={() => deleteTable(selectedTable.id)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" /> Borrar mesa
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
            <h3 className="mb-1 font-display text-lg font-semibold">Sin asignar</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Arrastrad a una mesa del salón
            </p>
            <ul className="space-y-1">
              {unseatedGuests.map((g) => (
                <li
                  key={g.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_GUEST, g.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex cursor-grab items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm transition-colors hover:border-clay hover:ring-1 hover:ring-clay/30 active:cursor-grabbing"
                >
                  <span className="flex-1 truncate">{g.name}</span>
                  {g.companions > 0 && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      +{g.companions}
                    </span>
                  )}
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">
                    {RSVP_LABEL[g.rsvp] ?? g.rsvp}
                  </span>
                </li>
              ))}
              {unseatedGuests.length === 0 && (
                <li className="rounded-lg bg-background px-3 py-3 text-center text-xs text-muted-foreground">
                  Todos sentados
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
