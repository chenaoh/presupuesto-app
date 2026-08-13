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
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl">Presupuestos</h1>
          <p className="muted mt-0.5 text-sm capitalize">{monthLabel(year, month)}</p>
        </div>
        <ManageToggle active={managing} onChange={setManaging} />
      </div>

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
        + Nuevo
      </button>

      <div className="card overflow-hidden">
        {budgets.length === 0 ? (
          <p className="muted p-3 text-sm">Sin presupuestos este mes.</p>
        ) : (
          <ul className="divide-y divide-border">
            {budgets.map((b) => {
              const cat =
                categories.find((c) => c.id === b.categoryId) ??
                data.categories.find((c) => c.id === b.categoryId);
              const spent = spentInCategory(b.categoryId, year, month);
              const pct = Math.min(100, Math.round((spent / b.limitAmount) * 100));
              const over = spent >= b.limitAmount;
              return (
                <li key={b.id} className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {cat ? itemLabel(cat.workspaceId, cat.name) : "Categoría"}
                      </p>
                      <p className={`text-[11px] tabular-nums ${over ? "text-danger" : "muted"}`}>
                        {formatMoney(spent, currency)} / {formatMoney(b.limitAmount, currency)} · {pct}%
                      </p>
                    </div>
                    {managing && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="rounded-md border border-border p-1.5"
                          onClick={() => startEdit(b.id, b.categoryId, b.limitAmount)}
                          aria-label="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-300 bg-red-50 p-1.5 text-red-700"
                          onClick={() => deleteBudget(b.id)}
                          aria-label="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="progress mt-1.5 h-1.5">
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
              <option value="">Selecciona</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {itemLabel(c.workspaceId, c.name)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Límite</label>
            <input
              className="input"
              type="number"
              min="1"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary w-full">{editingId ? "Actualizar" : "Guardar"}</button>
        </form>
      </Modal>
    </div>
  );
}
