import { currentPeriod, inPeriod } from "./format";
import type { Category, Transaction, TransactionType } from "./types";

export type RecurringDue = {
  key: string;
  sourceId: string;
  type: TransactionType;
  amount: number;
  note: string;
  categoryName: string;
};

export function recurringTemplateKey(t: Transaction): string {
  return [t.type, t.categoryId ?? "", t.accountId ?? "", t.note.trim().toLowerCase()].join("|");
}

export function remindersStorageKey(userId: string, year: number, month: number) {
  return `presupuesto-app:reminders:${userId}:${year}-${String(month).padStart(2, "0")}`;
}

export function readDismissedReminders(userId: string, year: number, month: number): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(remindersStorageKey(userId, year, month));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { keys?: string[]; all?: boolean };
    if (parsed.all) return new Set(["*"]);
    return new Set(parsed.keys ?? []);
  } catch {
    return new Set();
  }
}

const reminderListeners = new Set<() => void>();

export function subscribeReminders(listener: () => void) {
  reminderListeners.add(listener);
  return () => {
    reminderListeners.delete(listener);
  };
}

function notifyRemindersChanged() {
  reminderListeners.forEach((fn) => fn());
}

export function writeDismissedReminders(
  userId: string,
  year: number,
  month: number,
  keys: string[],
  all = false,
) {
  localStorage.setItem(
    remindersStorageKey(userId, year, month),
    JSON.stringify(all ? { all: true, keys } : { keys }),
  );
  notifyRemindersChanged();
}

/** Plantillas recurrentes del usuario que aún no tienen movimiento en el mes actual. */
export function dueRecurringThisMonth(
  txs: Transaction[],
  userId: string,
  categories: Category[],
  now = new Date(),
): RecurringDue[] {
  const { year, month } = currentPeriod(now);
  const mine = txs.filter((t) => t.createdBy === userId && t.recurring);
  const latest = new Map<string, Transaction>();
  for (const t of mine) {
    const key = recurringTemplateKey(t);
    const prev = latest.get(key);
    if (!prev || t.date > prev.date || (t.date === prev.date && t.createdAt > prev.createdAt)) {
      latest.set(key, t);
    }
  }

  const due: RecurringDue[] = [];
  for (const [key, source] of latest) {
    const paid = txs.some(
      (t) =>
        t.createdBy === userId &&
        inPeriod(t.date, year, month) &&
        recurringTemplateKey(t) === key,
    );
    if (paid) continue;
    const cat = categories.find((c) => c.id === source.categoryId);
    due.push({
      key,
      sourceId: source.id,
      type: source.type,
      amount: source.amount,
      note: source.note || cat?.name || "Movimiento recurrente",
      categoryName: cat?.name ?? "",
    });
  }
  return due;
}
