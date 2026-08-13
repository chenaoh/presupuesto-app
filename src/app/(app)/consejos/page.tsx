"use client";

import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { PeriodPicker } from "@/components/PeriodPicker";
import { buildTips, filterTxs, type TipTone } from "@/lib/insights";
import { rangeAnchorMonth, usePeriod } from "@/lib/period";
import { useApp } from "@/lib/store";
import { clsx } from "@/lib/format";

const TONE_CLASS: Record<TipTone, string> = {
  info: "border-accent/30",
  warning: "border-[color-mix(in_oklab,var(--warning)_45%,var(--border))]",
  danger: "border-[color-mix(in_oklab,var(--danger)_45%,var(--border))]",
  success: "border-[color-mix(in_oklab,var(--income)_45%,var(--border))]",
};

export default function ConsejosPage() {
  const {
    workspace,
    user,
    workspaceTransactions,
    workspaceBudgets,
    workspaceCategories,
  } = useApp();
  const { range, compareRange, label } = usePeriod();
  const currency = user?.currency ?? "COP";
  const allWsTxs = workspaceTransactions();
  const txs = filterTxs(allWsTxs, range);
  const compareTxs = filterTxs(allWsTxs, compareRange);
  const { year, month } = rangeAnchorMonth(range);
  const budgets = workspaceBudgets(year, month);

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Consejos</h1>
        <p className="muted mt-0.5 text-sm">
          Tips según tus movimientos en {workspace?.name ?? "este espacio"}.
        </p>
      </div>

      <section className="card space-y-2 p-3 sm:p-4">
        <PeriodPicker compact />
        <p className="muted text-[11px] capitalize">{label}</p>
      </section>

      <ul className="space-y-2">
        {tips.map((tip) => (
          <li key={tip.id} className={clsx("card border p-4", TONE_CLASS[tip.tone])}>
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--accent)_14%,white)] text-accent">
                <Lightbulb size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{tip.title}</p>
                <p className="muted mt-1 text-sm leading-relaxed">{tip.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="muted text-center text-xs">
        ¿Quieres ver el detalle?{" "}
        <Link href="/transactions" className="font-semibold text-accent">
          Ir a Movimientos
        </Link>
      </p>
    </div>
  );
}
