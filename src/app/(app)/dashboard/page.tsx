"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Modal } from "@/components/Modal";
import { PeriodPicker } from "@/components/PeriodPicker";
import { RemindersBellButton } from "@/components/RecurringReminders";
import { UserAvatar } from "@/components/UserAvatar";
import { formatMoney } from "@/lib/format";
import { buildTips, filterTxs } from "@/lib/insights";
import { rangeAnchorMonth, usePeriod } from "@/lib/period";
import { useApp } from "@/lib/store";

type CategorySlice = {
  id: string;
  name: string;
  value: number;
  color: string;
  icon?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const {
    workspace,
    user,
    myWorkspaces,
    setActiveWorkspace,
    workspaceBudgets,
    spentInCategory,
    workspaceCategories,
    workspaceTransactions,
  } = useApp();
  const { range, compareRange, label, monthTitle, shiftMonth } = usePeriod();
  const [categoryPreview, setCategoryPreview] = useState<CategorySlice | null>(null);

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
  const categories = workspaceCategories("expense");
  const budgets = workspaceBudgets(year, month);

  const byCategory: CategorySlice[] = categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      value: txs
        .filter((t) => t.type === "expense" && t.categoryId === c.id)
        .reduce((s, t) => s + t.amount, 0),
      color: c.color,
      icon: c.icon,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalCat = byCategory.reduce((s, c) => s + c.value, 0) || 1;
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

  function openCategoryPreview(id: string) {
    const item = byCategory.find((c) => c.id === id);
    if (item) setCategoryPreview(item);
  }

  function goToCategory(id: string) {
    setCategoryPreview(null);
    router.push(`/transactions?category=${encodeURIComponent(id)}`);
  }

  const previewTxCount = categoryPreview
    ? txs.filter((t) => t.type === "expense" && t.categoryId === categoryPreview.id).length
    : 0;
  const previewPct = categoryPreview
    ? Math.round((categoryPreview.value / totalCat) * 100)
    : 0;
  const previewBudget = categoryPreview
    ? budgets.find((b) => b.categoryId === categoryPreview.id)
    : undefined;

  const greeting = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Hola, {firstName} <span aria-hidden>👋</span>
        </h1>
        <select
          className="mt-1 block w-[min(100%,12rem)] max-w-full border-0 bg-transparent p-0 text-sm font-semibold text-accent outline-none md:hidden"
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
        <RemindersBellButton className="grid rounded-full border border-border p-2 muted hover:text-fg" />
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

  const periodSummary = (
    <section className="grid grid-cols-2 gap-2">
      <div className="card px-3 py-2.5">
        <p className="muted text-[11px]">Ingresos del periodo</p>
        <p className="text-sm font-bold text-income">{formatMoney(income, currency)}</p>
      </div>
      <div className="card px-3 py-2.5">
        <p className="muted text-[11px]">Gastos del periodo</p>
        <p className="text-sm font-bold text-expense">{formatMoney(expense, currency)}</p>
        {expenseDelta !== null && (
          <p
            className={`mt-0.5 text-[11px] font-semibold ${
              expenseDelta > 0 ? "text-expense" : "text-income"
            }`}
          >
            {expenseDelta > 0 ? "+" : ""}
            {expenseDelta}% vs. periodo anterior
          </p>
        )}
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
                  cursor="pointer"
                  onClick={(_, index) => {
                    const item = byCategory[index];
                    if (item) openCategoryPreview(item.id);
                  }}
                >
                  {byCategory.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.color}
                      cursor="pointer"
                      onClick={() => openCategoryPreview(entry.id)}
                    />
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
              <li key={c.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left text-xs"
                  onClick={() => openCategoryPreview(c.id)}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: c.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                  <span className="muted tabular-nums">
                    {Math.round((c.value / totalCat) * 100)}%
                  </span>
                  <span className="tabular-nums font-semibold">
                    {formatMoney(c.value, currency)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {byCategory.length > 0 && (
        <p className="muted mt-3 text-[11px]">
          Toca una categoría o un trozo del gráfico para ver el detalle.
        </p>
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

  return (
    <div className="min-w-0 space-y-4">
      {greeting}
      {periodRow}

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,1fr)]">
        <div className="min-w-0 space-y-4">
          {periodSummary}
          {gastosCard}
        </div>
        <div className="min-w-0 space-y-4">
          {insightsCard}
          {pocketsCard}
        </div>
      </div>

      <Modal
        open={Boolean(categoryPreview)}
        onClose={() => setCategoryPreview(null)}
        title={categoryPreview?.name ?? "Categoría"}
      >
        {categoryPreview && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CategoryIcon
                icon={categoryPreview.icon}
                color={categoryPreview.color}
                size={20}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{categoryPreview.name}</p>
                <p className="muted text-xs">{label}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-[color-mix(in_oklab,var(--expense)_10%,transparent)] px-3 py-2.5">
                <p className="muted text-[11px]">Gastado</p>
                <p className="text-sm font-bold text-expense tabular-nums">
                  {formatMoney(categoryPreview.value, currency)}
                </p>
              </div>
              <div className="rounded-2xl bg-[color-mix(in_oklab,var(--border)_28%,transparent)] px-3 py-2.5">
                <p className="muted text-[11px]">Del total</p>
                <p className="text-sm font-bold tabular-nums">{previewPct}%</p>
              </div>
            </div>

            <p className="muted text-xs">
              {previewTxCount} movimiento{previewTxCount === 1 ? "" : "s"} en este periodo.
              {previewBudget
                ? ` Bolsillo: ${formatMoney(spentInCategory(categoryPreview.id, year, month), currency)} / ${formatMoney(previewBudget.limitAmount, currency)}.`
                : ""}
            </p>

            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => goToCategory(categoryPreview.id)}
            >
              Ver movimientos
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
