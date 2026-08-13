"use client";

import { FormEvent, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { NeedAccountsBanner } from "@/components/NeedAccountsBanner";
import { formatMoney } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { SavingsGoal } from "@/lib/types";

export default function SavingsPage() {
  const {
    user,
    workspace,
    workspaceGoals,
    allAccounts,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addTransaction,
    goalProgress,
    itemLabel,
  } = useApp();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [preferredAccountId, setPreferredAccountId] = useState("");
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [goalId, setGoalId] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [mode, setMode] = useState<"savings_contribution" | "savings_withdrawal">("savings_contribution");
  const [error, setError] = useState<string | null>(null);
  const currency = user?.currency ?? "COP";
  const accounts = allAccounts();
  const hasAccounts = accounts.length > 0;
  const goals = workspaceGoals();

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setName("");
    setTargetAmount("");
    setTargetDate("");
    setPreferredAccountId("");
    setError(null);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (editing) {
      const err = updateSavingsGoal(editing.id, {
        name,
        targetAmount: Number(targetAmount),
        targetDate: targetDate || undefined,
        preferredAccountId: preferredAccountId || undefined,
      });
      if (err) {
        setError(err);
        return;
      }
    } else {
      const err = addSavingsGoal({
        name,
        targetAmount: Number(targetAmount),
        targetDate: targetDate || undefined,
        preferredAccountId: preferredAccountId || undefined,
      });
      if (err) {
        setError(err);
        return;
      }
    }
    closeForm();
  }

  function onMove(e: FormEvent) {
    e.preventDefault();
    const goal = goals.find((g) => g.id === goalId);
    const err = addTransaction({
      type: mode,
      amount: Number(amount),
      date: new Date().toISOString().slice(0, 10),
      savingsGoalId: goalId,
      accountId,
      targetWorkspaceId: goal?.workspaceId ?? workspace?.id,
      note: mode === "savings_contribution" ? "Aporte a meta" : "Retiro de meta",
    });
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setAmount("");
    setMoveOpen(false);
  }

  function startEdit(g: SavingsGoal) {
    setManaging(true);
    setEditing(g);
    setName(g.name);
    setTargetAmount(String(g.targetAmount));
    setTargetDate(g.targetDate ?? "");
    setPreferredAccountId(g.preferredAccountId ?? "");
    setFormOpen(true);
  }

  function onDelete(id: string) {
    if (!confirm("¿Eliminar esta meta de ahorro?")) return;
    const err = deleteSavingsGoal(id);
    if (err) setError(err);
    else if (editing?.id === id) closeForm();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl">Ahorros</h1>
          <p className="muted mt-0.5 text-sm">{workspace?.name ?? "—"}</p>
        </div>
        <ManageToggle active={managing} onChange={setManaging} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary text-sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Nueva meta
        </button>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => {
            if (!hasAccounts) {
              setError("Primero crea al menos una cuenta en Cuentas.");
              return;
            }
            setMoveOpen(true);
          }}
          disabled={!hasAccounts}
        >
          Aportar / retirar
        </button>
      </div>

      {!hasAccounts && (
        <NeedAccountsBanner message="Para aportar o retirar de una meta necesitas al menos una cuenta." />
      )}

      {error && !formOpen && !moveOpen && <p className="text-xs text-danger">{error}</p>}

      <div className="card overflow-hidden">
        {goals.length === 0 ? (
          <p className="muted p-3 text-sm">Sin metas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {goals.map((g) => {
              const progress = goalProgress(g.id);
              const pct = Math.min(100, Math.round((progress / g.targetAmount) * 100));
              return (
                <li key={g.id} className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{itemLabel(g.workspaceId, g.name)}</p>
                      <p className="muted text-[11px] tabular-nums">
                        {formatMoney(progress, currency)} / {formatMoney(g.targetAmount, currency)} · {pct}%
                        {g.targetDate ? ` · ${g.targetDate}` : ""}
                      </p>
                    </div>
                    {managing && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="rounded-md border border-border p-1.5"
                          onClick={() => startEdit(g)}
                          aria-label="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-300 bg-red-50 p-1.5 text-red-700"
                          onClick={() => onDelete(g.id)}
                          aria-label="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="progress mt-1.5 h-1.5">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={formOpen} onClose={closeForm} title={editing ? "Editar meta" : "Nueva meta"}>
        <form onSubmit={onCreate} className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="label">Nombre de la meta</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Vacaciones, fondo de emergencia"
              required
            />
          </div>
          <div>
            <label className="label">Valor del objetivo</label>
            <input
              className="input"
              type="number"
              min="1"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="Cantidad que quieres ahorrar (ej: 2000000)"
              required
            />
          </div>
          <div>
            <label className="label">Fecha límite (opcional)</label>
            <input className="input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Cuenta preferida (opcional)</label>
            <select
              className="select"
              value={preferredAccountId}
              onChange={(e) => setPreferredAccountId(e.target.value)}
            >
              <option value="">Sin cuenta preferida</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {itemLabel(a.workspaceId, a.name)}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}
          <button className="btn btn-primary w-full sm:col-span-2">{editing ? "Guardar" : "Crear"}</button>
        </form>
      </Modal>

      <Modal open={moveOpen} onClose={() => setMoveOpen(false)} title="Aportar / retirar">
        <form onSubmit={onMove} className="grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Meta de ahorro</label>
            <select className="select" value={goalId} onChange={(e) => setGoalId(e.target.value)} required>
              <option value="">Selecciona la meta</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {itemLabel(g.workspaceId, g.name)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Acción</label>
            <select
              className="select"
              value={mode}
              onChange={(e) => setMode(e.target.value as "savings_contribution" | "savings_withdrawal")}
            >
              <option value="savings_contribution">Aportar a la meta</option>
              <option value="savings_withdrawal">Retirar de la meta</option>
            </select>
          </div>
          <div>
            <label className="label">Monto</label>
            <input
              className="input"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Valor a aportar o retirar"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Cuenta de origen/destino</label>
            <select className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
              <option value="">Selecciona la cuenta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {itemLabel(a.workspaceId, a.name)}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}
          <button className="btn btn-primary w-full sm:col-span-2">Registrar</button>
        </form>
      </Modal>
    </div>
  );
}
