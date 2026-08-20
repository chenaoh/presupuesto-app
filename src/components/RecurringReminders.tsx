"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Modal } from "@/components/Modal";
import { currentPeriod, formatMoney } from "@/lib/format";
import {
  dueRecurringThisMonth,
  readDismissedReminders,
  subscribeReminders,
  writeDismissedReminders,
} from "@/lib/reminders";
import { useApp } from "@/lib/store";
import type { TransactionType } from "@/lib/types";

const TYPE_LABELS: Partial<Record<TransactionType, string>> = {
  expense: "Gasto",
  income: "Ingreso",
  transfer: "Transferencia",
  debt_payment: "Pago deuda",
  savings_contribution: "Aporte ahorro",
  savings_withdrawal: "Retiro",
  space_contribution: "Aporte espacio",
};

let lastAutoOpenStamp = "";

export function RecurringReminders() {
  const { ready, user, data, repeatTransaction } = useApp();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissTick, setDismissTick] = useState(0);
  const { year, month } = currentPeriod();

  const due = useMemo(() => {
    if (!user) return [];
    return dueRecurringThisMonth(data.transactions, user.id, data.categories);
  }, [data.categories, data.transactions, user]);

  const remaining = useMemo(() => {
    if (!user) return [];
    const dismissed = readDismissedReminders(user.id, year, month);
    if (dismissed.has("*")) return [];
    return due.filter((item) => !dismissed.has(item.key));
  }, [due, month, user, year, dismissTick]);

  useEffect(() => subscribeReminders(() => setDismissTick((n) => n + 1)), []);

  useEffect(() => {
    if (!ready || !user || remaining.length === 0) return;
    const stamp = `${user.id}:${year}-${month}`;
    if (lastAutoOpenStamp === stamp) return;
    lastAutoOpenStamp = stamp;
    setOpen(true);
  }, [month, ready, remaining.length, user, year]);

  useEffect(() => {
    function onOpen() {
      setError(null);
      setOpen(true);
    }
    window.addEventListener("presupuesto:open-reminders", onOpen);
    return () => window.removeEventListener("presupuesto:open-reminders", onOpen);
  }, []);

  const persistDismiss = useCallback(
    (keys: string[], all = false) => {
      if (!user) return;
      writeDismissedReminders(user.id, year, month, keys, all);
      setDismissTick((n) => n + 1);
    },
    [month, user, year],
  );

  async function repeatOne(sourceId: string) {
    setBusyId(sourceId);
    setError(null);
    const err = repeatTransaction(sourceId);
    setBusyId(null);
    if (err) {
      setError(err);
    }
  }

  function skipOne(key: string) {
    if (!user) return;
    const prev = [...readDismissedReminders(user.id, year, month)].filter((k) => k !== "*");
    persistDismiss([...prev, key]);
  }

  function skipAll() {
    persistDismiss(
      remaining.map((item) => item.key),
      true,
    );
    setOpen(false);
  }

  if (!user) return null;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Pagos de este mes"
      variant="sheet"
    >
      {remaining.length === 0 ? (
        <p className="muted text-sm">
          No hay movimientos recurrentes pendientes de repetir este mes.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="muted text-sm">
            Marcaste estos movimientos como recurrentes y aún no hay uno en este mes.
          </p>
          <ul className="space-y-2">
            {remaining.map((item) => (
              <li
                key={item.key}
                className="rounded-2xl border border-border px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" title={item.note}>
                      {item.note}
                    </p>
                    <p className="muted text-[11px]">
                      {TYPE_LABELS[item.type] ?? item.type}
                      {item.categoryName ? ` · ${item.categoryName}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums">
                    {formatMoney(item.amount, user.currency)}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary text-xs"
                    disabled={busyId === item.sourceId}
                    onClick={() => void repeatOne(item.sourceId)}
                  >
                    {busyId === item.sourceId ? "Registrando…" : "Registrar ahora"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost text-xs"
                    onClick={() => skipOne(item.key)}
                  >
                    Ya lo pagué
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button type="button" className="btn btn-ghost w-full text-sm" onClick={skipAll}>
            Recordar el próximo mes
          </button>
        </div>
      )}
    </Modal>
  );
}

export function RemindersBellButton({ className }: { className?: string }) {
  const { user, data } = useApp();
  const { year, month } = currentPeriod();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeReminders(() => setTick((n) => n + 1)), []);
  const count = useMemo(() => {
    if (!user) return 0;
    const due = dueRecurringThisMonth(data.transactions, user.id, data.categories);
    const dismissed = readDismissedReminders(user.id, year, month);
    if (dismissed.has("*")) return 0;
    return due.filter((item) => !dismissed.has(item.key)).length;
  }, [data.categories, data.transactions, month, tick, user, year]);

  return (
    <button
      type="button"
      className={className}
      aria-label={
        count > 0 ? `${count} recordatorios de pagos` : "Recordatorios de pagos"
      }
      onClick={() => window.dispatchEvent(new Event("presupuesto:open-reminders"))}
    >
      <span className="relative grid place-items-center">
        <Bell size={16} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-danger px-0.5 text-[9px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </span>
    </button>
  );
}
