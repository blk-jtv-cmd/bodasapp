import { useEffect, useState } from "react";
import { parseAmount } from "./use-rows";

export const fieldClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-clay-ink";

/** Texto que se guarda al salir de la casilla. */
export function TextField({
  value,
  onSave,
  placeholder,
  multiline = false,
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  const commit = () => {
    if (local.trim() !== value) onSave(local.trim());
  };
  return multiline ? (
    <textarea
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      placeholder={placeholder}
      rows={2}
      className={`${fieldClass} resize-y ${className}`}
    />
  ) : (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      placeholder={placeholder}
      className={`${fieldClass} ${className}`}
    />
  );
}

/** Número (importes o cantidades). Vacío = 0, y el 0 se muestra como casilla vacía. */
export function NumberField({
  value,
  onSave,
  placeholder,
  integer = false,
  className = "",
}: {
  value: number;
  onSave: (v: number) => void;
  placeholder?: string;
  integer?: boolean;
  className?: string;
}) {
  const shown = Number(value) ? String(value) : "";
  const [local, setLocal] = useState(shown);
  useEffect(() => setLocal(shown), [shown]);
  const commit = () => {
    const n = integer ? Math.round(parseAmount(local)) : parseAmount(local);
    if (n !== Number(value)) onSave(n);
    else setLocal(shown);
  };
  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      placeholder={placeholder}
      inputMode={integer ? "numeric" : "decimal"}
      className={`${fieldClass} ${className}`}
    />
  );
}
