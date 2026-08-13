"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { currentPeriod, formatMoney, inPeriod } from "@/lib/format";
import { useApp } from "@/lib/store";

export function DashboardCharts() {
  const {
    workspaceTransactions,
    workspaceCategories,
    user,
  } = useApp();
  const { year, month } = currentPeriod();
  const txs = workspaceTransactions().filter((t) => inPeriod(t.date, year, month));
  const categories = workspaceCategories("expense");

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

  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const compare = [
    { name: "Ingresos", value: income, fill: "var(--income)" },
    { name: "Gastos", value: expense, fill: "var(--expense)" },
  ];

  const currency = user?.currency ?? "COP";

  if (byCategory.length === 0 && income === 0 && expense === 0) {
    return (
      <div className="card p-6 muted text-sm">
        Aún no hay movimientos este mes. Registra un ingreso o gasto para ver los gráficos.
      </div>
    );
  }

  return (
    <div className="grid-cards-auto">
      <div className="card p-3 sm:p-4">
        <h3 className="mb-2 text-base sm:mb-3 sm:text-lg">Gastos por categoría</h3>
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                {byCategory.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatMoney(Number(value ?? 0), currency)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-3 sm:p-4">
        <h3 className="mb-2 text-base sm:mb-3 sm:text-lg">Ingresos vs gastos</h3>
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compare}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip formatter={(value) => formatMoney(Number(value ?? 0), currency)} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {compare.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
