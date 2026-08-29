"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { NumericInput } from "@/components/NumericInput";
import { formatDate, formatMoney, todayIso } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useRequireAccounts } from "@/lib/useRequireAccounts";
import type { Debt } from "@/lib/types";

export default function DebtsPage() {
  const {
    user,
    workspace,
    data,
    workspaceDebts,
    fundingAccounts,
    workspaceAccounts,
    addDebt,
    updateDebt,
    deleteDebt,
    addTransaction,
    itemLabel,
  } = useApp();
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [editing, setEditing] = useState<Debt | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [payDebtId, setPayDebtId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [payDate, setPayDate] = useState(todayIso());
  const [detailDebt, setDetailDebt] = useState<Debt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currency = user?.currency ?? "COP";
  const accounts = (() => {
    const map = new Map(
      [...fundingAccounts(), ...workspaceAccounts()].map((a) => [a.id, a]),
    );
    return [...map.values()];
  })();
  const debts = workspaceDebts();
  const { guard, dialog } = useRequireAccounts(
    "Para registrar un pago de deuda primero debes crear al menos una cuenta.",
  );

  const detailPayments = useMemo(() => {
    if (!detailDebt) return [];
    return data.transactions
      .filter((t) => t.debtId === detailDebt.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [data.transactions, detailDebt]);

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setName("");
    setPrincipal("");
    setDueDate("");
    setAccountId("");
    setError(null);
  }

  function closePay() {
    setPayOpen(false);
    setPayAmount("");
    setPayDate(todayIso());
    setError(null);
  }

  function openPay(debtId?: string) {
    guard(() => {
      setPayDebtId(debtId || payDebtId);
      setPayDate(todayIso());
      setPayAmount("");
      setError(null);
      setPayOpen(true);
    });
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (editing) {
      const err = updateDebt(editing.id, {
        name,
        dueDate: dueDate || undefined,
        accountId: accountId || undefined,
        remaining: Number(principal) || editing.remaining,
      });
      if (err) {
        setError(err);
        return;
      }
    } else {
      const err = addDebt({
        name,
        principal: Number(principal),
        dueDate: dueDate || undefined,
        accountId: accountId || undefined,
      });
      if (err) {
        setError(err);
        return;
      }
    }
    closeForm();
  }

  function onPay(e: FormEvent) {
    e.preventDefault();
    const debt = debts.find((d) => d.id === payDebtId);
    const err = addTransaction({
      type: "debt_payment",
      amount: Number(payAmount),
      date: payDate || todayIso(),
      debtId: payDebtId,
      accountId: payAccountId,
      targetWorkspaceId: debt?.workspaceId,
      note: "Pago de deuda",
    });
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setPayAmount("");
    setPayOpen(false);
  }

  function startEdit(d: Debt) {
    setManaging(true);
    setEditing(d);
    setName(d.name);
    setPrincipal(String(d.remaining));
    setDueDate(d.dueDate ?? "");
    setAccountId(d.accountId ?? "");
    setFormOpen(true);
  }

  function onDelete(id: string) {
    if (!confirm("¿Eliminar esta deuda?")) return;
    const err = deleteDebt(id);
    if (err) setError(err);
    else if (editing?.id === id) closeForm();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl">Deudas</h1>
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
          + Nueva
        </button>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => openPay()}
        >
          Registrar pago
        </button>
      </div>

      {dialog}

      {error && !formOpen && !payOpen && <p className="text-xs text-danger">{error}</p>}

      <div className="card overflow-hidden">
        {debts.length === 0 ? (
          <p className="muted p-3 text-sm">Sin deudas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {debts.map((d) => {
              const paid = d.principal - d.remaining;
              const pct = d.principal ? Math.round((paid / d.principal) * 100) : 0;
              return (
                <li key={d.id} className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setDetailDebt(d)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{itemLabel(d.workspaceId, d.name)}</p>
                          <p className="muted text-[11px]">
                            {formatMoney(d.remaining, currency)}
                            {d.dueDate ? ` · vence ${d.dueDate}` : ""}
                          </p>
                        </div>
                        <ChevronRight size={16} className="muted shrink-0" aria-hidden />
                      </div>
                    </button>
                    {managing && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="rounded-md border border-border p-1.5"
                          onClick={() => startEdit(d)}
                          aria-label="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-300 bg-red-50 p-1.5 text-red-700"
                          onClick={() => onDelete(d.id)}
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

      <Modal
        open={!!detailDebt}
        onClose={() => setDetailDebt(null)}
        title={detailDebt ? itemLabel(detailDebt.workspaceId, detailDebt.name) : "Deuda"}
        variant="sheet"
        hideFooter
      >
        {detailDebt && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-[color-mix(in_oklab,var(--border)_28%,transparent)] px-3 py-2.5">
                <p className="muted text-[11px]">Pendiente</p>
                <p className="text-sm font-bold tabular-nums text-expense">
                  {formatMoney(detailDebt.remaining, currency)}
                </p>
              </div>
              <div className="rounded-2xl bg-[color-mix(in_oklab,var(--border)_28%,transparent)] px-3 py-2.5">
                <p className="muted text-[11px]">Pagado</p>
                <p className="text-sm font-bold tabular-nums text-income">
                  {formatMoney(Math.max(0, detailDebt.principal - detailDebt.remaining), currency)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary w-full text-sm"
              onClick={() => {
                const id = detailDebt.id;
                setDetailDebt(null);
                openPay(id);
              }}
            >
              Registrar pago
            </button>
            {detailPayments.length === 0 ? (
              <p className="muted text-sm">Aún no hay movimientos asociados a esta deuda.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {detailPayments.map((t) => {
                  const acc = t.accountId
                    ? data.accounts.find((a) => a.id === t.accountId)
                    : undefined;
                  return (
                    <li key={t.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{t.note.trim() || "Pago de deuda"}</p>
                        <p className="muted truncate text-[11px]">
                          {formatDate(t.date)}
                          {acc ? ` · ${itemLabel(acc.workspaceId, acc.name)}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums text-expense">
                        -{formatMoney(t.amount, currency)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </Modal>

      <Modal open={formOpen} onClose={closeForm} title={editing ? "Editar deuda" : "Nueva deuda"}>
        <form onSubmit={onCreate} className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="label">Nombre de la deuda</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Tarjeta Visa, préstamo carro"
              required
            />
          </div>
          <div>
            <label className="label">{editing ? "Saldo restante" : "Monto principal"}</label>
            <NumericInput
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder={editing ? "Cuánto falta por pagar" : "Valor total de la deuda"}
              required
            />
          </div>
          <div>
            <label className="label">Fecha de vencimiento (opcional)</label>
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Cuenta asociada (opcional)</label>
            <select className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Sin cuenta asociada</option>
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

      <Modal open={payOpen} onClose={closePay} title="Registrar pago">
        <form onSubmit={onPay} className="grid gap-2">
          <div>
            <label className="label">Deuda a pagar</label>
            <select className="select" value={payDebtId} onChange={(e) => setPayDebtId(e.target.value)} required>
              <option value="">Selecciona la deuda</option>
              {debts.map((d) => (
                <option key={d.id} value={d.id}>
                  {itemLabel(d.workspaceId, d.name)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fecha del pago</label>
            <input
              className="input"
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Monto del pago</label>
            <NumericInput
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Cuánto vas a abonar"
              required
            />
          </div>
          <div>
            <label className="label">Cuenta desde la que pagas</label>
            <select
              className="select"
              value={payAccountId}
              onChange={(e) => setPayAccountId(e.target.value)}
              required
            >
              <option value="">Selecciona la cuenta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {itemLabel(a.workspaceId, a.name)}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button className="btn btn-primary w-full">Pagar</button>
        </form>
      </Modal>
    </div>
  );
}
