"use client";

import { FormEvent, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { currentPeriod, formatMoney, monthLabel } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function BudgetsPage() {
  const {
    user,
    data,
    allCategories,
    spentInCategory,
    upsertBudget,
    deleteBudget,
    itemLabel,
    myWorkspaces,
  } = useApp();
  const { year, month } = currentPeriod();
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const currency = user?.currency ?? "COP";
  const categories = allCategories("expense");
  const workspaceIds = new Set(myWorkspaces.map((w) => w.id));
  const budgets = data.budgets.filter(
    (b) => workspaceIds.has(b.workspaceId) && b.periodYear === year && b.periodMonth === month,
  );

  const totalLimit = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce(
    (s, b) => s + spentInCategory(b.categoryId, year, month),
    0,
  );
  const totalPct = totalLimit ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0;
  const remaining = Math.max(0, totalLimit - totalSpent);

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setCategoryId("");
    setLimitAmount("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId || !limitAmount) return;
    upsertBudget(categoryId, Number(limitAmount), year, month);
    closeForm();
  }

  function startEdit(id: string, catId: string, limit: number) {
    setManaging(true);
    setEditingId(id);
    setCategoryId(catId);
    setLimitAmount(String(limit));
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Presupuestos</h1>
          <p className="muted mt-0.5 text-sm capitalize">{monthLabel(year, month)}</p>
        </div>
        <div className="flex items-center gap-2">
          <ManageToggle active={managing} onChange={setManaging} />
          <button
            type="button"
            className="btn btn-primary text-sm"
            onClick={() => {
              setEditingId(null);
              setCategoryId("");
              setLimitAmount("");
              setFormOpen(true);
            }}
          >
            +
          </button>
        </div>
      </div>

      <section className="card p-4 sm:p-5">
        <p className="muted text-xs font-semibold uppercase tracking-wide">
          Gasto total mensual
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">
          {formatMoney(totalSpent, currency)}
          <span className="muted text-base font-semibold">
            {" "}
            / {formatMoney(totalLimit || 0, currency)}
          </span>
        </p>
        <div className="progress mt-3 h-3">
          <span
            style={{
              width: `${totalPct}%`,
              background:
                totalPct >= 100
                  ? "var(--danger)"
                  : totalPct >= 80
                    ? "var(--warning)"
                    : "var(--accent)",
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold">
          <span className="muted">{totalPct}% usado</span>
          <span className={totalPct >= 100 ? "text-danger" : "text-accent"}>
            {totalPct >= 100
              ? "Límite alcanzado"
              : `${formatMoney(remaining, currency)} restantes`}
          </span>
        </div>
      </section>

      <div>
        <h2 className="mb-2 px-0.5 text-base font-bold">Desglose por categoría</h2>
        {budgets.length === 0 ? (
          <div className="card p-4">
            <p className="muted text-sm">Sin presupuestos este mes.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {budgets.map((b) => {
              const cat =
                categories.find((c) => c.id === b.categoryId) ??
                data.categories.find((c) => c.id === b.categoryId);
              const spent = spentInCategory(b.categoryId, year, month);
              const pct = Math.min(100, Math.round((spent / b.limitAmount) * 100));
              const over = spent >= b.limitAmount;
              const near = !over && pct >= 80;
              const left = Math.max(0, b.limitAmount - spent);
              return (
                <li key={b.id} className="card p-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white"
                      style={{ background: cat?.color || "var(--accent)" }}
                    >
                      {(cat?.name || "?").slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold">
                          {cat ? itemLabel(cat.workspaceId, cat.name) : "Categoría"}
                        </p>
                        <p className="shrink-0 text-xs font-semibold tabular-nums">
                          {formatMoney(spent, currency)} de {formatMoney(b.limitAmount, currency)}
                        </p>
                      </div>
                      <div className="progress mt-2 h-2">
                        <span
                          style={{
                            width: `${pct}%`,
                            background: over
                              ? "var(--danger)"
                              : near
                                ? "var(--warning)"
                                : "var(--accent)",
                          }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold">
                        <span className="muted">{pct}% usado</span>
                        <span
                          className={
                            over ? "text-danger" : near ? "text-warning" : "text-accent"
                          }
                        >
                          {over
                            ? "Límite excedido"
                            : near
                              ? "Cerca del límite"
                              : `${formatMoney(left, currency)} restantes`}
                        </span>
                      </div>
                    </div>
                    {managing && (
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          className="rounded-lg border border-border p-1.5"
                          onClick={() => startEdit(b.id, b.categoryId, b.limitAmount)}
                          aria-label="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-300 bg-red-50 p-1.5 text-red-700"
                          onClick={() => deleteBudget(b.id)}
                          aria-label="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={formOpen} onClose={closeForm} title={editingId ? "Editar presupuesto" : "Nuevo presupuesto"}>
        <form onSubmit={onSubmit} className="grid gap-2">
          <div>
            <label className="label">Categoría</label>
            <select
              className="select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={!!editingId}
            >
              <option value="">Selecciona la categoría de gasto</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {itemLabel(c.workspaceId, c.name)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Límite mensual</label>
            <input
              className="input"
              type="number"
              min="1"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              placeholder="Tope a gastar en el mes (ej: 400000)"
              required
            />
          </div>
          <button className="btn btn-primary w-full">{editingId ? "Actualizar" : "Guardar"}</button>
        </form>
      </Modal>
    </div>
  );
}
