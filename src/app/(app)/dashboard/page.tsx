"use client";

import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PeriodPicker } from "@/components/PeriodPicker";
import { UserAvatar } from "@/components/UserAvatar";
import { formatDate, formatMoney, parseLocalDate } from "@/lib/format";
import { buildTips, filterTxs } from "@/lib/insights";
import { rangeAnchorMonth, usePeriod } from "@/lib/period";
import { useApp } from "@/lib/store";

export default function DashboardPage() {
  const {
    workspace,
    user,
    myWorkspaces,
    setActiveWorkspace,
    workspaceTransactions,
    workspaceAccounts,
    accountBalance,
    workspaceBudgets,
    spentInCategory,
    workspaceCategories,
    itemLabel,
    workspaceBudgetBalance,
    workspaceBudgetFunded,
    workspaceBudgetSpent,
    personalAccountsTotal,
  } = useApp();
  const { range, compareRange, label, monthTitle, shiftMonth } = usePeriod();

  const currency = user?.currency ?? "COP";
  const allWsTxs = workspaceTransactions();
  const txs = filterTxs(allWsTxs, range);
  const compareTxs = filterTxs(allWsTxs, compareRange);
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const prevExpense = compareTxs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const expenseDelta =
    prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : null;
  const { year, month } = rangeAnchorMonth(range);
  const isShared = workspace?.type === "shared";
  const isPersonal = workspace?.type === "personal";
  const accountsTotal = isPersonal
    ? personalAccountsTotal()
    : isShared
      ? workspaceBudgetBalance(workspace?.id, year, month)
      : workspaceAccounts().reduce((s, a) => s + accountBalance(a.id), 0);
  const spaceFunded = isShared ? workspaceBudgetFunded(workspace?.id, year, month) : 0;
  const spaceSpentBudget = isShared ? workspaceBudgetSpent(workspace?.id, year, month) : 0;
  const categories = workspaceCategories("expense");
  const budgets = workspaceBudgets(year, month);

  const byCategory = categories
    .map((c) => ({
      name: c.name,
      value: txs
        .filter((t) => t.type === "expense" && t.categoryId === c.id)
        .reduce((s, t) => s + t.amount, 0),
      color: c.color,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalCat = byCategory.reduce((s, c) => s + c.value, 0) || 1;
  const recent = [...txs]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const spark = buildSparkline(range.from, range.to, txs);
  const pocketTotal = budgets.reduce((s, b) => s + b.limitAmount, 0);

  const tips = buildTips({
    currency,
    range,
    compareRange,
    transactions: txs,
    compareTransactions: compareTxs,
    categories: workspaceCategories(),
    budgets,
    spentInCategory: (categoryId) =>
      txs
        .filter((t) => t.type === "expense" && t.categoryId === categoryId)
        .reduce((s, t) => s + t.amount, 0),
    workspaceName: workspace?.name,
  });
  const firstName = user?.displayName?.split(/\s+/)[0] || "tú";

  const greeting = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Hola, {firstName} <span aria-hidden>👋</span>
        </h1>
        <select
          className="mt-1 max-w-[180px] border-0 bg-transparent p-0 text-sm font-semibold text-accent outline-none md:hidden"
          value={workspace?.id ?? ""}
          onChange={(e) => setActiveWorkspace(e.target.value)}
          aria-label="Espacio"
        >
          {myWorkspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <p className="muted mt-1 hidden text-sm font-semibold capitalize md:block">
          {workspace?.name} · {label}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden rounded-full border border-border p-2 muted md:grid">
          <Bell size={16} />
        </span>
        <Link href="/settings" className="md:hidden" aria-label="Perfil">
          <UserAvatar src={user?.avatarData} name={user?.displayName} size={44} />
        </Link>
      </div>
    </div>
  );

  const periodRow = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="rounded-full p-1 muted hover:text-fg"
          aria-label="Mes anterior"
          onClick={() => shiftMonth(-1)}
        >
          <ChevronLeft size={18} />
        </button>
        <p className="min-w-[9rem] text-center text-sm font-semibold capitalize">{monthTitle}</p>
        <button
          type="button"
          className="rounded-full p-1 muted hover:text-fg"
          aria-label="Mes siguiente"
          onClick={() => shiftMonth(1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <PeriodPicker compact />
    </div>
  );

  const saldoCard = (
    <section className="card balance-hero p-4 sm:p-5">
      <p className="muted text-xs font-semibold uppercase tracking-wide">
        {isShared ? "Saldo del presupuesto" : "Saldo disponible"}
      </p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-bold tracking-tight sm:text-4xl">
            {formatMoney(accountsTotal, currency)}
          </p>
          {expenseDelta !== null && (
            <p
              className={`mt-1 text-xs font-semibold ${
                expenseDelta > 0 ? "text-expense" : "text-income"
              }`}
            >
              {expenseDelta > 0 ? "+" : ""}
              {expenseDelta}% vs. periodo anterior
            </p>
          )}
        </div>
        {spark.length > 1 && (
          <div className="h-14 w-28 shrink-0 sm:w-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark}>
                <defs>
                  <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--accent)"
                  fill="url(#sparkFill)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {isShared ? (
        <p className="muted mt-1 text-xs">
          Aportado {formatMoney(spaceFunded, currency)} − gastado{" "}
          {formatMoney(spaceSpentBudget, currency)}.
        </p>
      ) : isPersonal ? (
        <p className="muted mt-1 text-xs">Suma de tus cuentas bancarias del perfil personal.</p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-[color-mix(in_oklab,var(--income)_10%,transparent)] px-3 py-2.5">
          <p className="muted text-[11px]">Ingresos del periodo</p>
          <p className="text-sm font-bold text-income">{formatMoney(income, currency)}</p>
        </div>
        <div className="rounded-2xl bg-[color-mix(in_oklab,var(--expense)_10%,transparent)] px-3 py-2.5">
          <p className="muted text-[11px]">Gastos del periodo</p>
          <p className="text-sm font-bold text-expense">{formatMoney(expense, currency)}</p>
        </div>
      </div>
    </section>
  );

  const gastosCard = (
    <section className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Gastos del mes</h2>
        <Link href="/transactions" className="text-xs font-bold text-accent">
          Ver todos
        </Link>
      </div>
      {byCategory.length === 0 ? (
        <p className="muted text-sm">Aún no hay gastos en este periodo.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,180px)_1fr] sm:items-center">
          <div className="relative mx-auto h-44 w-full max-w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {byCategory.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value ?? 0), currency)} />
              </PieChart>
            </ResponsiveContainer>
            <p className="pointer-events-none absolute inset-0 grid place-content-center text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wide muted">
                Total
              </span>
              <span className="text-xs font-bold">{formatMoney(expense, currency)}</span>
            </p>
          </div>
          <ul className="space-y-2">
            {byCategory.slice(0, 6).map((c) => (
              <li key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                <span className="muted tabular-nums">{Math.round((c.value / totalCat) * 100)}%</span>
                <span className="tabular-nums font-semibold">{formatMoney(c.value, currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );

  const insightsCard = (
    <section className="card p-4">
      <p className="mb-3 text-sm font-bold">Insights</p>
      <ul className="space-y-3">
        {tips.slice(0, 3).map((tip) => (
          <li key={tip.id} className="flex items-start gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-accent">
              <Lightbulb size={15} />
            </span>
            <div>
              <p className="text-sm font-semibold">{tip.title}</p>
              <p className="muted mt-0.5 text-xs leading-relaxed">{tip.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/consejos" className="mt-3 inline-block text-xs font-bold text-accent">
        Ver análisis →
      </Link>
    </section>
  );

  const pocketsCard = budgets.length > 0 && (
    <section className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-bold">Bolsillos</h2>
        <Link href="/budgets" className="text-xs font-bold text-accent">
          Ver
        </Link>
      </div>
      <p className="muted mb-3 text-xs">
        Total {formatMoney(pocketTotal, currency)} · {budgets.length} bolsillos
      </p>
      <div className="space-y-3">
        {budgets.slice(0, 5).map((b) => {
          const cat = workspaceCategories().find((c) => c.id === b.categoryId);
          const spent = spentInCategory(b.categoryId, year, month);
          const pct = Math.min(100, Math.round((spent / b.limitAmount) * 100));
          const over = spent >= b.limitAmount;
          return (
            <div key={b.id} className="flex items-center gap-2.5">
              <CategoryIcon icon={cat?.icon} color={cat?.color} size={16} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{cat?.name ?? "Categoría"}</span>
                  <span className={over ? "text-danger" : "muted"}>
                    {formatMoney(spent, currency)} / {formatMoney(b.limitAmount, currency)}
                  </span>
                </div>
                <div className="progress h-2">
                  <span
                    style={{
                      width: `${pct}%`,
                      background: over
                        ? "var(--danger)"
                        : pct >= 80
                          ? "var(--warning)"
                          : "var(--accent)",
                    }}
                  />
                </div>
              </div>
              <span className="w-8 text-right text-[11px] font-semibold muted">{pct}%</span>
            </div>
          );
        })}
      </div>
    </section>
  );

  const recentCard = (
    <section className="card overflow-hidden p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Movimientos recientes</h2>
        <Link href="/transactions" className="text-xs font-bold text-accent">
          Ver todo
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="muted text-sm">Sin movimientos en este periodo.</p>
      ) : (
        <ul className="divide-y divide-border">
          {recent.map((t) => {
            const cat = workspaceCategories().find((c) => c.id === t.categoryId);
            const positive = t.type === "income" || t.type === "savings_withdrawal";
            return (
              <li key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <CategoryIcon icon={cat?.icon} color={cat?.color || "var(--accent)"} size={16} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {t.note || cat?.name || itemLabel(t.workspaceId, t.type)}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {cat && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: `color-mix(in oklab, ${cat.color} 16%, var(--bg-elevated))`,
                          color: cat.color,
                        }}
                      >
                        {cat.name}
                      </span>
                    )}
                    <span className="muted text-[11px]">{formatDate(t.date)}</span>
                  </div>
                </div>
                <p
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    positive ? "text-income" : "text-expense"
                  }`}
                >
                  {positive ? "+" : "-"}
                  {formatMoney(t.amount, currency)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      {greeting}
      {periodRow}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,1fr)]">
        <div className="space-y-4">
          {saldoCard}
          {gastosCard}
          {recentCard}
        </div>
        <div className="space-y-4">
          {insightsCard}
          {pocketsCard}
        </div>
      </div>
    </div>
  );
}

function buildSparkline(from: string, to: string, txs: { date: string; type: string; amount: number }[]) {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  const days: Array<{ value: number }> = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    const value = txs
      .filter((t) => t.date.slice(0, 10) === iso && t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    days.push({ value });
    cursor.setDate(cursor.getDate() + 1);
    if (days.length > 62) break;
  }
  return days;
}
