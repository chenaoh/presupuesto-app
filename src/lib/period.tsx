"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { monthLabel } from "./format";

export type PeriodMode = "current" | "previous" | "custom";

export type PeriodScope = "dashboard" | "transactions" | "accounts" | "consejos";

export type DateRange = {
  from: string;
  to: string;
};

type PeriodState = {
  mode: PeriodMode;
  customFrom: string;
  customTo: string;
};

type PeriodScopeValue = {
  mode: PeriodMode;
  customFrom: string;
  customTo: string;
  range: DateRange;
  compareRange: DateRange;
  label: string;
  monthTitle: string;
  setMode: (mode: PeriodMode) => void;
  setCustomRange: (from: string, to: string) => void;
  shiftMonth: (delta: number) => void;
};

type PeriodContextValue = {
  scopes: Record<PeriodScope, PeriodScopeValue>;
};

const LEGACY_STORAGE_KEY = "presupuesto-app:period";

const PERIOD_SCOPES: PeriodScope[] = ["dashboard", "transactions", "accounts", "consejos"];

const DEFAULT_PERIOD: PeriodState = {
  mode: "current",
  customFrom: "",
  customTo: "",
};

const PeriodContext = createContext<PeriodContextValue | null>(null);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfMonth(year: number, month: number) {
  return `${year}-${pad(month)}-01`;
}

function endOfMonth(year: number, month: number) {
  const last = new Date(year, month, 0).getDate();
  return `${year}-${pad(month)}-${pad(last)}`;
}

export function resolvePeriodRange(
  mode: PeriodMode,
  customFrom: string,
  customTo: string,
  now = new Date(),
): DateRange {
  if (mode === "custom" && customFrom && customTo) {
    const from = customFrom <= customTo ? customFrom : customTo;
    const to = customFrom <= customTo ? customTo : customFrom;
    return { from, to };
  }
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (mode === "previous") {
    const d = new Date(y, m - 2, 1);
    return {
      from: startOfMonth(d.getFullYear(), d.getMonth() + 1),
      to: endOfMonth(d.getFullYear(), d.getMonth() + 1),
    };
  }
  return {
    from: startOfMonth(y, m),
    to: endOfMonth(y, m),
  };
}

export function shiftRangeBack(range: DateRange): DateRange {
  const from = new Date(`${range.from}T12:00:00`);
  const to = new Date(`${range.to}T12:00:00`);
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (days - 1));
  return { from: toIso(prevFrom), to: toIso(prevTo) };
}

export function inDateRange(isoDate: string, range: DateRange) {
  const day = isoDate.slice(0, 10);
  return day >= range.from && day <= range.to;
}

export function periodLabel(mode: PeriodMode, range: DateRange) {
  if (mode === "current") {
    const [y, m] = range.from.split("-").map(Number);
    return `Este mes · ${monthLabel(y, m)}`;
  }
  if (mode === "previous") {
    const [y, m] = range.from.split("-").map(Number);
    return `Mes anterior · ${monthLabel(y, m)}`;
  }
  return `Del ${range.from} al ${range.to}`;
}

/** Año/mes del final del rango (para presupuestos). */
export function rangeAnchorMonth(range: DateRange) {
  const [y, m] = range.to.split("-").map(Number);
  return { year: y, month: m };
}

export type ChartSpan = "week" | "month" | "year";

function startOfWeekMonday(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function chartRangeFor(span: ChartSpan, anchor: Date): DateRange {
  const y = anchor.getFullYear();
  const m = anchor.getMonth() + 1;
  if (span === "year") {
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
  if (span === "month") {
    return { from: startOfMonth(y, m), to: endOfMonth(y, m) };
  }
  const start = startOfWeekMonday(anchor);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { from: toIso(start), to: toIso(end) };
}

export function shiftChartAnchor(span: ChartSpan, anchor: Date, delta: number) {
  const next = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  if (span === "year") next.setFullYear(next.getFullYear() + delta);
  else if (span === "month") next.setMonth(next.getMonth() + delta);
  else next.setDate(next.getDate() + delta * 7);
  return next;
}

export function chartSpanTitle(span: ChartSpan) {
  if (span === "week") return "Gastos de la semana";
  if (span === "year") return "Gastos del año";
  return "Gastos del mes";
}

export function chartRangeCaption(span: ChartSpan, range: DateRange, locale = "es-CO") {
  const from = new Date(`${range.from}T12:00:00`);
  const to = new Date(`${range.to}T12:00:00`);
  if (span === "year") return String(from.getFullYear());
  if (span === "month") {
    return monthLabel(from.getFullYear(), from.getMonth() + 1, locale);
  }
  const fromText = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(from);
  const toText = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(to);
  return `${fromText} – ${toText}`;
}

function createDefaultPeriods(): Record<PeriodScope, PeriodState> {
  return {
    dashboard: { ...DEFAULT_PERIOD },
    transactions: { ...DEFAULT_PERIOD },
    accounts: { ...DEFAULT_PERIOD },
    consejos: { ...DEFAULT_PERIOD },
  };
}

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [periods, setPeriods] = useState<Record<PeriodScope, PeriodState>>(createDefaultPeriods);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Recalcular “este mes” si el día cambia (medianoche / pestaña abierta).
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const updateScope = useCallback((scope: PeriodScope, patch: Partial<PeriodState>) => {
    setPeriods((prev) => ({
      ...prev,
      [scope]: { ...prev[scope], ...patch },
    }));
  }, []);

  const scopes = useMemo(() => {
    const now = new Date();
    const result = {} as Record<PeriodScope, PeriodScopeValue>;

    for (const scope of PERIOD_SCOPES) {
      const { mode, customFrom, customTo } = periods[scope];
      const range = resolvePeriodRange(mode, customFrom, customTo, now);
      const compareRange = shiftRangeBack(range);
      const label = periodLabel(mode, range);
      const { year, month } = rangeAnchorMonth(range);
      const monthTitle = monthLabel(year, month);

      const setMode = (next: PeriodMode) => {
        if (next === "custom") {
          const r = resolvePeriodRange("current", "", "", now);
          updateScope(scope, {
            mode: next,
            customFrom: customFrom || r.from,
            customTo: customTo || r.to,
          });
          return;
        }
        updateScope(scope, { mode: next });
      };

      const setCustomRange = (from: string, to: string) => {
        updateScope(scope, { mode: "custom", customFrom: from, customTo: to });
      };

      const shiftMonth = (delta: number) => {
        const { year: y, month: m } = rangeAnchorMonth(range);
        const d = new Date(y, m - 1 + delta, 1);
        const ny = d.getFullYear();
        const nm = d.getMonth() + 1;
        if (ny === now.getFullYear() && nm === now.getMonth() + 1) {
          updateScope(scope, { mode: "current", customFrom: "", customTo: "" });
          return;
        }
        updateScope(scope, {
          mode: "custom",
          customFrom: startOfMonth(ny, nm),
          customTo: endOfMonth(ny, nm),
        });
      };

      result[scope] = {
        mode,
        customFrom,
        customTo,
        range,
        compareRange,
        label,
        monthTitle,
        setMode,
        setCustomRange,
        shiftMonth,
      };
    }

    return result;
    // tick fuerza recompute cuando el mes cambia con mode=current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods, tick, updateScope]);

  const value = useMemo(() => ({ scopes }), [scopes]);

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod(scope: PeriodScope) {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod debe usarse dentro de PeriodProvider");
  return ctx.scopes[scope];
}
