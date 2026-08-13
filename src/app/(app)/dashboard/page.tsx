"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { UserAvatar } from "@/components/UserAvatar";
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
    itemLabel,
  } = useApp();

  const { year, month } = currentPeriod();
  const currency = user?.currency ?? "COP";
  const txs = workspaceTransactions().filter((t) => inPeriod(t.date, year, month));
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const accountsTotal = workspaceAccounts().reduce((s, a) => s + accountBalance(a.id), 0);
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
  const recent = workspaceTransactions().slice(0, 5);

  const firstName = user?.displayName?.split(/\s+/)[0] || "tú";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="muted text-sm">Hola,</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{firstName}</h1>
          <p className="muted mt-0.5 text-xs capitalize">
            {monthLabel(year, month)} · {workspace?.name}
          </p>
        </div>
        <Link href="/settings" aria-label="Perfil">
          <UserAvatar src={user?.avatarData} name={user?.displayName} size={48} />
        </Link>
      </div>

      <section className="card balance-hero p-4 sm:p-5">
        <p className="muted text-xs font-semibold uppercase tracking-wide">Saldo total</p>
        <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {formatMoney(accountsTotal, currency)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/70 pt-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[color-mix(in_oklab,var(--income)_16%,white)] text-income">
              <ArrowDownLeft size={16} />
            </span>
            <div>
              <p className="muted text-[11px]">Ingresos</p>
              <p className="text-sm font-bold text-income">{formatMoney(income, currency)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[color-mix(in_oklab,var(--expense)_16%,white)] text-expense">
              <ArrowUpRight size={16} />
            </span>
            <div>
              <p className="muted text-[11px]">Gastos</p>
              <p className="text-sm font-bold text-expense">{formatMoney(expense, currency)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Gastos</h2>
          <Link href="/transactions" className="text-xs font-bold uppercase tracking-wide text-accent">
            Ver todos
          </Link>
        </div>
        {byCategory.length === 0 ? (
          <p className="muted text-sm">Aún no hay gastos este mes.</p>
        ) : (
          <>
            <div className="mx-auto h-48 w-full max-w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={2}
                  >
                    {byCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value ?? 0), currency)} />
                  <text
                    x="50%"
                    y="48%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-[var(--muted)] text-[11px]"
                  >
                    Total
                  </text>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-[var(--fg)] text-sm font-bold"
                  >
                    {formatMoney(expense, currency)}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
              {byCategory.slice(0, 6).map((c) => (
                <li key={c.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: c.color }}
                  />
                  <span className="truncate font-medium">{c.name}</span>
                  <span className="muted ml-auto tabular-nums">
                    {Math.round((c.value / totalCat) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {budgets.length > 0 && (
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Presupuestos</h2>
            <Link href="/budgets" className="text-xs font-bold uppercase tracking-wide text-accent">
              Ver
            </Link>
          </div>
          <div className="space-y-3">
            {budgets.slice(0, 3).map((b) => {
              const cat = workspaceCategories().find((c) => c.id === b.categoryId);
              const spent = spentInCategory(b.categoryId, year, month);
              const pct = Math.min(100, Math.round((spent / b.limitAmount) * 100));
              const over = spent >= b.limitAmount;
              return (
                <div key={b.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{cat?.name ?? "Categoría"}</span>
                    <span className={over ? "text-danger" : "muted"}>
                      {formatMoney(spent, currency)} / {formatMoney(b.limitAmount, currency)}
                    </span>
                  </div>
                  <div className="progress h-2.5">
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
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-lg font-bold">Actividad reciente</h2>
          <Link href="/transactions" className="text-xs font-bold uppercase tracking-wide text-accent">
            Ver todo
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="card p-4">
            <p className="muted text-sm">Sin movimientos todavía.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((t) => {
              const cat = workspaceCategories().find((c) => c.id === t.categoryId);
              const positive = t.type === "income" || t.type === "savings_withdrawal";
              return (
                <li key={t.id} className="card flex items-center gap-3 px-3 py-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-white"
                    style={{ background: cat?.color || "var(--accent)" }}
                  >
                    {(cat?.name || t.type).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {t.note || cat?.name || itemLabel(t.workspaceId, t.type)}
                    </p>
                    <p className="muted truncate text-[11px]">
                      {t.date}
                      {cat ? ` · ${cat.name}` : ""}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      positive ? "text-income" : "text-fg"
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
    </div>
  );
}
