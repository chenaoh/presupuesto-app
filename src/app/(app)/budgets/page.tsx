"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ColorCombo } from "@/components/ColorCombo";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { accountColor } from "@/lib/colors";
import { currentPeriod, formatMoney, monthLabel, todayIso } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function BudgetsPage() {
  const {
    user,
    workspace,
    data,
    workspaceCategories,
    workspaceBudgets,
    spentInCategory,
    upsertBudget,
    deleteBudget,
    upsertWorkspaceBudget,
    deleteWorkspaceBudget,
    workspaceBudgetFunded,
    workspaceBudgetSpent,
    fundingAccounts,
    addTransaction,
    accountBalance,
    itemLabel,
  } = useApp();
  const { year, month } = currentPeriod();
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [spaceLimit, setSpaceLimit] = useState("");
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(false);
  const [contribAmount, setContribAmount] = useState("");
  const [contribAccountId, setContribAccountId] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [contribError, setContribError] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const currency = user?.currency ?? "COP";
  const isShared = workspace?.type === "shared";
  const categories = workspaceCategories("expense");
  const budgets = workspaceBudgets(year, month);
  const personalAccounts = fundingAccounts();

  const spaceBudget = useMemo(
    () =>
      (data.workspaceBudgets ?? []).find(
        (b) =>
          b.workspaceId === workspace?.id &&
          b.periodYear === year &&
          b.periodMonth === month,
      ),
    [data.workspaceBudgets, workspace?.id, year, month],
  );

  const funded = workspaceBudgetFunded(workspace?.id, year, month);
  const spaceSpent = workspaceBudgetSpent(workspace?.id, year, month);
  const spaceLimitAmt = spaceBudget?.limitAmount ?? 0;
  const spacePct = spaceLimitAmt
    ? Math.min(100, Math.round((spaceSpent / spaceLimitAmt) * 100))
    : 0;

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

  function onSaveSpaceBudget(e: FormEvent) {
    e.preventDefault();
    const err = upsertWorkspaceBudget(Number(spaceLimit), year, month);
    if (err) {
      setContribError(err);
      return;
    }
    setSpaceFormOpen(false);
    setContribError(null);
  }

  function onContribute(e: FormEvent) {
    e.preventDefault();
    if (!workspace) return;
    const err = addTransaction({
      type: "space_contribution",
      amount: Number(contribAmount),
      date: todayIso(),
      note: contribNote || `Aporte a ${workspace.name}`,
      accountId: contribAccountId || undefined,
      targetWorkspaceId: workspace.id,
    });
    if (err) {
      setContribError(err);
      return;
    }
    setContribOpen(false);
    setContribAmount("");
    setContribNote("");
    setContribError(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isShared ? "Presupuesto y bolsillos" : "Bolsillos"}
          </h1>
          <p className="muted mt-0.5 text-sm capitalize">
            {workspace?.name ?? "—"} · {monthLabel(year, month)}
          </p>
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
            + Bolsillo
          </button>
        </div>
      </div>

      {isShared && (
        <section className="card space-y-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="muted text-xs font-semibold uppercase tracking-wide">
                Presupuesto del espacio
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatMoney(spaceSpent, currency)}
                <span className="muted text-base font-semibold">
                  {" "}
                  / {formatMoney(spaceLimitAmt || 0, currency)}
                </span>
              </p>
              <p className="muted mt-1 text-xs">
                Aportado por miembros: {formatMoney(funded, currency)}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={() => {
                  setSpaceLimit(spaceBudget ? String(spaceBudget.limitAmount) : "");
                  setSpaceFormOpen(true);
                }}
              >
                {spaceBudget ? "Editar tope" : "Definir tope"}
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs"
                onClick={() => {
                  setContribError(null);
                  setContribAccountId(personalAccounts[0]?.id ?? "");
                  setContribOpen(true);
                }}
              >
                Aportar
              </button>
            </div>
          </div>
          <div className="progress h-3">
            <span
              style={{
                width: `${spacePct}%`,
                background:
                  spacePct >= 100
                    ? "var(--danger)"
                    : spacePct >= 80
                      ? "var(--warning)"
                      : "var(--accent)",
              }}
            />
          </div>
          <p className="muted text-[11px]">
            El aporte sale de tu cuenta personal y alimenta el presupuesto de {workspace?.name}.
          </p>
          {managing && spaceBudget && (
            <button
              type="button"
              className="btn btn-ghost text-xs text-danger"
              onClick={() => deleteWorkspaceBudget(spaceBudget.id)}
            >
              Quitar tope del mes
            </button>
          )}
        </section>
      )}

      <section className="card p-4 sm:p-5">
        <p className="muted text-xs font-semibold uppercase tracking-wide">
          Bolsillos · gasto del mes
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
        <h2 className="mb-2 px-0.5 text-base font-bold">Bolsillos por categoría</h2>
        {budgets.length === 0 ? (
          <div className="card p-4">
            <p className="muted text-sm">Sin bolsillos este mes en este espacio.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {budgets.map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              const spent = spentInCategory(b.categoryId, year, month);
              const pct = Math.min(100, Math.round((spent / b.limitAmount) * 100));
              const over = spent >= b.limitAmount;
              const near = !over && pct >= 80;
              const left = Math.max(0, b.limitAmount - spent);
              return (
                <li key={b.id} className="card p-3.5">
                  <div className="flex items-center gap-3">
                    <CategoryIcon icon={cat?.icon} color={cat?.color} size={18} />
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

      <Modal open={formOpen} onClose={closeForm} title={editingId ? "Editar bolsillo" : "Nuevo bolsillo"}>
        <form onSubmit={onSubmit} className="grid gap-2">
          <div>
            <ColorCombo
              label="Categoría"
              value={categoryId}
              onChange={setCategoryId}
              required
              placeholder="Selecciona la categoría de gasto"
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
                color: c.color,
                icon: c.icon,
              }))}
            />
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

      <Modal
        open={spaceFormOpen}
        onClose={() => setSpaceFormOpen(false)}
        title="Presupuesto del espacio"
      >
        <form onSubmit={onSaveSpaceBudget} className="space-y-2">
          <p className="muted text-xs">
            Define el tope mensual del espacio. Cada miembro aporta desde su cuenta personal.
          </p>
          <div>
            <label className="label">Tope del mes</label>
            <input
              className="input"
              type="number"
              min="0"
              value={spaceLimit}
              onChange={(e) => setSpaceLimit(e.target.value)}
              placeholder="Ej: 2000000"
              required
            />
          </div>
          {contribError && <p className="text-xs text-danger">{contribError}</p>}
          <button className="btn btn-primary w-full">Guardar presupuesto</button>
        </form>
      </Modal>

      <Modal open={contribOpen} onClose={() => setContribOpen(false)} title="Aportar al espacio">
        <form onSubmit={onContribute} className="space-y-2">
          <p className="muted text-xs">
            Sale de tu espacio personal y se registra como aporte al presupuesto de{" "}
            {workspace?.name}.
          </p>
          <ColorCombo
            label="Cuenta personal"
            value={contribAccountId}
            onChange={setContribAccountId}
            required
            placeholder="Elige tu cuenta"
            options={personalAccounts.map((a) => ({
              value: a.id,
              label: `${a.name} · ${formatMoney(accountBalance(a.id), currency)}`,
              color: accountColor(a.accountType),
            }))}
          />
          <div>
            <label className="label">Monto</label>
            <input
              className="input"
              type="number"
              min="1"
              value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value)}
              placeholder="Ej: 300000"
              required
            />
          </div>
          <div>
            <label className="label">Nota</label>
            <input
              className="input"
              value={contribNote}
              onChange={(e) => setContribNote(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          {contribError && <p className="text-xs text-danger">{contribError}</p>}
          <button className="btn btn-primary w-full">Registrar aporte</button>
        </form>
      </Modal>
    </div>
  );
}
