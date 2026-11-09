import { useState } from "react";
import { useI18n } from "@/i18n";

export const ALLERGIES = ["Gluten", "Lactosa", "Frutos secos", "Marisco", "Huevo", "Vegetariano", "Vegano"];

/** Botones de alergias / dieta + una casilla para escribir otra. */
export function AllergyPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
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

