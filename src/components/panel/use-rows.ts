import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { t as tr } from "@/i18n";

type Row = { id: string };

/**
 * Carga y guarda las filas de una tabla de la boda (fincas, menú…).
 * Los cambios se ven al instante y se guardan en segundo plano.
 */
export function useWeddingRows<T extends Row>(table: "venues" | "menu_items", weddingId: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at");
    if (error) toast.error(tr("No hemos podido cargar los datos"));
    setRows((data as unknown as T[]) ?? []);
    setLoading(false);
  }, [table, weddingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(values: Partial<T>, userId: string) {
    const { data, error } = await supabase
      .from(table)
      .insert({ ...values, wedding_id: weddingId, user_id: userId } as never)
      .select("*")
      .single();
    if (error || !data) {
      toast.error(tr("No se ha podido añadir"));
      return;
    }
    setRows((r) => [...r, data as unknown as T]);
  }

  async function patch(id: string, values: Partial<T>) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...values } : row)));
    const { error } = await supabase.from(table).update(values as never).eq("id", id);
    if (error) {
      toast.error(tr("No se ha podido guardar"));
      load();
    }
  }

  async function remove(id: string) {
    const previous = rows;
    setRows((r) => r.filter((row) => row.id !== id));
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error(tr("No se ha podido borrar"));
      setRows(previous);
    }
  }

  return { rows, loading, add, patch, remove };
}

/** Convierte "1.500,50", "1500.5" o "1 500" en número. Vacío o no válido = 0. */
export function parseAmount(value: string): number {
  let v = value.trim().replace(/\s/g, "");
  if (!v) return 0;
  if (v.includes(",")) v = v.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, "");
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
