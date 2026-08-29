"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Modal } from "@/components/Modal";
import { usePeriod, type PeriodMode, type PeriodScope } from "@/lib/period";

const MODES: Array<{ value: PeriodMode; label: string }> = [
  { value: "current", label: "Este mes" },
  { value: "previous", label: "Mes anterior" },
  { value: "custom", label: "Rango" },
];

export function PeriodPicker({ compact, scope }: { compact?: boolean; scope: PeriodScope }) {
  const { mode, label } = usePeriod(scope);
  const [open, setOpen] = useState(false);

  if (!compact) {
    return <PeriodFields scope={scope} />;
  }

  const chip =
    mode === "current" ? "Este mes" : mode === "previous" ? "Mes anterior" : "Rango";

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold"
        onClick={() => setOpen(true)}
      >
        <CalendarDays size={14} />
        {chip}
        <ChevronDown size={14} className="muted" />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Selecciona un período"
        variant="sheet"
        hideFooter
      >
        <PeriodFields scope={scope} onApply={() => setOpen(false)} />
        <p className="muted mt-2 text-[11px] capitalize">{label}</p>
      </Modal>
    </>
  );
}

function PeriodFields({ scope, onApply }: { scope: PeriodScope; onApply?: () => void }) {
  const { mode, customFrom, customTo, setMode, setCustomRange } = usePeriod(scope);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {MODES.map((m) => (
          <label
            key={m.value}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold"
          >
            <input
              type="radio"
              name="period-mode"
              checked={mode === m.value}
              onChange={() => setMode(m.value)}
            />
            {m.label}
          </label>
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
      {onApply && (
        <button type="button" className="btn btn-primary w-full" onClick={onApply}>
          Aplicar
        </button>
      )}
    </div>
  );
}
