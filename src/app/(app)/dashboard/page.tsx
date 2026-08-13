"use client";

import Link from "next/link";
import { DashboardCharts } from "@/components/DashboardCharts";
import { currentPeriod, formatMoney, inPeriod, monthLabel } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function DashboardPage() {
  const {
    workspace,
    user,
    workspaceTransactions,
    workspaceAccounts,
    accountBalance,
    workspaceBudgets,
    spentInCategory,
    workspaceCategories,
    workspaceDebts,
    workspaceGoals,
    goalProgress,
  } = useApp();

  const { year, month } = currentPeriod();
  const currency = user?.currency ?? "COP";
  const txs = workspaceTransactions().filter((t) => inPeriod(t.date, year, month));
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const accountsTotal = workspaceAccounts().reduce((s, a) => s + accountBalance(a.id), 0);
  const budgets = workspaceBudgets(year, month);
  const categories = workspaceCategories();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="muted text-xs capitalize">{monthLabel(year, month)}</p>
          <h1 className="text-2xl sm:text-3xl">
            {workspace?.type === "shared" ? "Familiar" : "Personal"}
          </h1>
          <p className="muted mt-0.5 text-sm">{workspace?.name}</p>
        </div>
        <Link href="/transactions" className="btn btn-primary text-sm">
          + Movimiento
        </Link>
      </div>

      <div className="grid-cards grid-cards-4">
        <Stat title="Saldo en cuentas" value={formatMoney(accountsTotal, currency)} />
        <Stat title="Ingresos del mes" value={formatMoney(income, currency)} tone="income" />
        <Stat title="Gastos del mes" value={formatMoney(expense, currency)} tone="expense" />
        <Stat title="Balance del mes" value={formatMoney(income - expense, currency)} />
      </div>

      <DashboardCharts />

      <div className="grid-cards-auto">
        <section className="card p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Presupuestos</h2>
            <Link href="/budgets" className="text-sm text-accent">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {budgets.length === 0 && (
              <p className="muted text-sm">Aún no defines límites este mes.</p>
            )}
            {budgets.slice(0, 5).map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              const spent = spentInCategory(b.categoryId, year, month);
              const pct = Math.min(100, Math.round((spent / b.limitAmount) * 100));
              const over = spent >= b.limitAmount;
              return (
                <div key={b.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{cat?.name ?? "Categoría"}</span>
                    <span className={over ? "text-danger" : "muted"}>
                      {formatMoney(spent, currency)} / {formatMoney(b.limitAmount, currency)}
                    </span>
                  </div>
                  <div className="progress">
                    <span
                      style={{
                        width: `${pct}%`,
                        background: over ? "var(--danger)" : pct >= 80 ? "var(--warning)" : "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card space-y-3 p-3 sm:p-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="text-base font-semibold">Deudas</h2>
              <Link href="/debts" className="text-sm text-accent">
                Ver
              </Link>
            </div>
            {workspaceDebts().length === 0 ? (
              <p className="muted text-sm">Sin deudas activas.</p>
            ) : (
              workspaceDebts()
                .slice(0, 3)
                .map((d) => (
                  <div key={d.id} className="flex justify-between text-sm">
                    <span>{d.name}</span>
                    <span className="text-expense">{formatMoney(d.remaining, currency)}</span>
                  </div>
                ))
            )}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="text-base font-semibold">Ahorros</h2>
              <Link href="/savings" className="text-sm text-accent">
                Ver
              </Link>
            </div>
            {workspaceGoals().length === 0 ? (
              <p className="muted text-sm">Sin metas todavía.</p>
            ) : (
              workspaceGoals()
                .slice(0, 3)
                .map((g) => {
                  const progress = goalProgress(g.id);
                  const pct = Math.min(100, Math.round((progress / g.targetAmount) * 100));
                  return (
                    <div key={g.id} className="mb-3">
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{g.name}</span>
                        <span className="muted">{pct}%</span>
                      </div>
                      <div className="progress">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone?: "income" | "expense";
}) {
  return (
    <div className="card stat-card p-3 sm:p-4">
      <p className="muted text-[11px] sm:text-sm">{title}</p>
      <p
        className={`stat-value mt-1.5 font-semibold ${
          tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
