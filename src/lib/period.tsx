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

export type DateRange = {
  from: string;
  to: string;
};

type PeriodContextValue = {
  mode: PeriodMode;
  customFrom: string;
  customTo: string;
  range: DateRange;
  /** Rango del periodo anterior (misma duración), para comparar tendencias. */
  compareRange: DateRange;
  label: string;
  monthTitle: string;
  setMode: (mode: PeriodMode) => void;
  setCustomRange: (from: string, to: string) => void;
  shiftMonth: (delta: number) => void;
};

const STORAGE_KEY = "presupuesto-app:period";
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

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PeriodMode>("current");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        mode?: PeriodMode;
        customFrom?: string;
        customTo?: string;
      };
      if (parsed.mode === "current" || parsed.mode === "previous" || parsed.mode === "custom") {
        setModeState(parsed.mode);
      }
      if (parsed.customFrom) setCustomFrom(parsed.customFrom);
      if (parsed.customTo) setCustomTo(parsed.customTo);
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

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode, customFrom, customTo }),
    );
  }, [mode, customFrom, customTo]);

  const range = useMemo(
    () => resolvePeriodRange(mode, customFrom, customTo, new Date()),
    // tick fuerza recompute cuando el mes cambia con mode=current
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, customFrom, customTo, tick],
  );

  const compareRange = useMemo(() => shiftRangeBack(range), [range]);
  const label = useMemo(() => periodLabel(mode, range), [mode, range]);

  const setMode = useCallback((next: PeriodMode) => {
    setModeState(next);
    if (next === "custom") {
      const r = resolvePeriodRange("current", "", "");
      setCustomFrom((prev) => prev || r.from);
      setCustomTo((prev) => prev || r.to);
    }
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    setCustomFrom(from);
    setCustomTo(to);
    setModeState("custom");
  }, []);

  const shiftMonth = useCallback((delta: number) => {
    const { year, month } = rangeAnchorMonth(range);
    const d = new Date(year, month - 1 + delta, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const now = new Date();
    if (y === now.getFullYear() && m === now.getMonth() + 1) {
      setModeState("current");
      return;
    }
    setCustomFrom(startOfMonth(y, m));
    setCustomTo(endOfMonth(y, m));
    setModeState("custom");
  }, [range]);

  const monthTitle = useMemo(() => {
    const { year, month } = rangeAnchorMonth(range);
    return monthLabel(year, month);
  }, [range]);

  const value = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod debe usarse dentro de PeriodProvider");
  return ctx;
}
