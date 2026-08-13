"use client";

import { usePeriod, type PeriodMode } from "@/lib/period";

const MODES: Array<{ value: PeriodMode; label: string }> = [
  { value: "current", label: "Este mes" },
  { value: "previous", label: "Mes anterior" },
  { value: "custom", label: "Rango" },
];

export function PeriodPicker({ compact }: { compact?: boolean }) {
  const { mode, customFrom, customTo, label, setMode, setCustomRange } = usePeriod();

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            className={`pill text-[11px] ${mode === m.value ? "border-accent text-accent" : ""}`}
            onClick={() => setMode(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
      {mode === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Desde</label>
            <input
              className="input"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomRange(e.target.value, customTo || e.target.value)}
            />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input
              className="input"
              type="date"
              value={customTo}
              onChange={(e) => setCustomRange(customFrom || e.target.value, e.target.value)}
            />
          </div>
        </div>
      )}
      {!compact && <p className="muted text-xs capitalize">{label}</p>}
    </div>
  );
}
