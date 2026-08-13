import { formatMoney } from "./format";
import { inDateRange, type DateRange } from "./period";
import type { Budget, Category, Transaction } from "./types";

export type TipTone = "info" | "warning" | "danger" | "success";

export type Tip = {
  id: string;
  title: string;
  body: string;
  tone: TipTone;
  priority: number;
};

type Input = {
  currency: string;
  range: DateRange;
  compareRange: DateRange;
  transactions: Transaction[];
  compareTransactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  spentInCategory: (categoryId: string) => number;
  workspaceName?: string;
};

export function buildTips(input: Input): Tip[] {
  const {
    currency,
    transactions,
    compareTransactions,
    categories,
    budgets,
    spentInCategory,
    workspaceName,
  } = input;

  const tips: Tip[] = [];
  const scope = workspaceName ? ` en ${workspaceName}` : "";

  const income = sumBy(transactions, "income");
  const expense = sumBy(transactions, "expense");
  const prevExpense = sumBy(compareTransactions, "expense");
  const margin = income - expense;

  if (transactions.length < 3) {
    tips.push({
      id: "need-data",
      title: "Registra más movimientos",
      body: `Con más ingresos y gastos${scope} podremos darte consejos más precisos sobre tus tendencias.`,
      tone: "info",
      priority: 10,
    });
  }

  if (income > 0 && expense > income) {
    tips.push({
      id: "overspend",
      title: "Gastas más de lo que entra",
      body: `En este periodo los gastos (${formatMoney(expense, currency)}) superan los ingresos (${formatMoney(income, currency)})${scope}. Revisa las categorías más altas o reduce un gasto variable.`,
      tone: "danger",
      priority: 100,
    });
  } else if (income > 0 && margin > 0 && margin / income >= 0.15) {
    tips.push({
      id: "good-margin",
      title: "Buen margen este periodo",
      body: `Te queda un sobrante de ${formatMoney(margin, currency)}${scope}. Si aún no lo hiciste, puedes pasar una parte a una cuenta de ahorro con una transferencia.`,
      tone: "success",
      priority: 40,
    });
  }

  if (prevExpense > 0 && expense > 0) {
    const delta = ((expense - prevExpense) / prevExpense) * 100;
    if (delta >= 20) {
      tips.push({
        id: "expense-up",
        title: "Tus gastos subieron",
        body: `Los gastos${scope} subieron un ${Math.round(delta)}% frente al periodo anterior. Revisa qué categorías impulsaron el aumento.`,
        tone: "warning",
        priority: 80,
      });
    } else if (delta <= -15) {
      tips.push({
        id: "expense-down",
        title: "Bajaste el gasto",
        body: `Buen ritmo: gastaste un ${Math.abs(Math.round(delta))}% menos que en el periodo anterior${scope}.`,
        tone: "success",
        priority: 35,
      });
    }
  }

  const expenseCats = categories.filter((c) => c.kind === "expense" && !c.isArchived);
  let top: { name: string; value: number } | null = null;
  for (const c of expenseCats) {
    const value = transactions
      .filter((t) => t.type === "expense" && t.categoryId === c.id)
      .reduce((s, t) => s + t.amount, 0);
    if (!top || value > top.value) top = { name: c.name, value };
  }
  if (top && top.value > 0 && expense > 0 && top.value / expense >= 0.35) {
    tips.push({
      id: "top-category",
      title: `${top.name} concentra tu gasto`,
      body: `${top.name} representa ${Math.round((top.value / expense) * 100)}% de tus gastos${scope} (${formatMoney(top.value, currency)}). Vale la pena revisarlo con detalle.`,
      tone: "info",
      priority: 55,
    });
  }

  for (const b of budgets) {
    const cat = categories.find((c) => c.id === b.categoryId);
    const spent = spentInCategory(b.categoryId);
    const pct = Math.round((spent / b.limitAmount) * 100);
    if (spent >= b.limitAmount) {
      tips.push({
        id: `budget-over-${b.id}`,
        title: `Límite excedido: ${cat?.name ?? "categoría"}`,
        body: `Ya gastaste ${formatMoney(spent, currency)} de ${formatMoney(b.limitAmount, currency)} en ${cat?.name ?? "esta categoría"}${scope}. Ajusta el tope o pausa ese gasto.`,
        tone: "danger",
        priority: 95,
      });
    } else if (pct >= 80) {
      tips.push({
        id: `budget-near-${b.id}`,
        title: `Cerca del límite: ${cat?.name ?? "categoría"}`,
        body: `Llevas el ${pct}% del presupuesto de ${cat?.name ?? "la categoría"}${scope}. Te quedan ${formatMoney(b.limitAmount - spent, currency)}.`,
        tone: "warning",
        priority: 70,
      });
    }
  }

  // Categoría que más creció vs periodo anterior
  let biggestRise: { name: string; pct: number } | null = null;
  for (const c of expenseCats) {
    const now = transactions
      .filter((t) => t.type === "expense" && t.categoryId === c.id)
      .reduce((s, t) => s + t.amount, 0);
    const prev = compareTransactions
      .filter((t) => t.type === "expense" && t.categoryId === c.id)
      .reduce((s, t) => s + t.amount, 0);
    if (prev >= 10000 && now > prev) {
      const pct = Math.round(((now - prev) / prev) * 100);
      if (pct >= 25 && (!biggestRise || pct > biggestRise.pct)) {
        biggestRise = { name: c.name, pct };
      }
    }
  }
  if (biggestRise) {
    tips.push({
      id: "cat-rise",
      title: `${biggestRise.name} subió fuerte`,
      body: `${biggestRise.name} aumentó un ${biggestRise.pct}% respecto al periodo anterior${scope}. Revisa si fue algo puntual o una tendencia.`,
      tone: "warning",
      priority: 75,
    });
  }

  if (tips.length === 0) {
    tips.push({
      id: "stable",
      title: "Todo en orden por ahora",
      body: `No hay alertas fuertes${scope} en este periodo. Sigue registrando movimientos para mantener el seguimiento al día.`,
      tone: "success",
      priority: 1,
    });
  }

  return tips.sort((a, b) => b.priority - a.priority);
}

function sumBy(txs: Transaction[], type: Transaction["type"]) {
  return txs.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

export function filterTxs(txs: Transaction[], range: DateRange) {
  return txs.filter((t) => inDateRange(t.date, range));
}
