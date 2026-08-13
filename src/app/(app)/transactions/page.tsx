"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Pencil, Repeat2, Trash2 } from "lucide-react";
import { ColorCombo } from "@/components/ColorCombo";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { PeriodPicker } from "@/components/PeriodPicker";
import { accountColor, TYPE_COLORS } from "@/lib/colors";
import { downloadCsv } from "@/lib/csv";
import { formatDate, formatMoney, todayIso } from "@/lib/format";
import { filterTxs } from "@/lib/insights";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, type PaymentMethod } from "@/lib/payment";
import { usePeriod } from "@/lib/period";
import { useApp } from "@/lib/store";
import { useRequireAccounts } from "@/lib/useRequireAccounts";
import type { Transaction, TransactionType } from "@/lib/types";

const TYPES: Array<{ value: TransactionType; label: string }> = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transferencia" },
  { value: "debt_payment", label: "Pago deuda" },
  { value: "savings_contribution", label: "Aporte" },
  { value: "savings_withdrawal", label: "Retiro" },
];

export default function TransactionsPage() {
  const {
    user,
    workspace,
    data,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    repeatTransaction,
    workspaceTransactions,
    workspaceCategories,
    allAccounts,
    workspaceDebts,
    workspaceGoals,
    itemLabel,
    workspaceLabel,
    memberName,
  } = useApp();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [debtId, setDebtId] = useState("");
  const [savingsGoalId, setSavingsGoalId] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "recurring" | TransactionType>("all");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("");
  const [repeatId, setRepeatId] = useState<string | null>(null);
  const [repeatDate, setRepeatDate] = useState(todayIso());
  const [repeatAmount, setRepeatAmount] = useState("");
  const [repeatNote, setRepeatNote] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [managing, setManaging] = useState(false);
  const { guard, dialog } = useRequireAccounts(
    "Para registrar un movimiento primero debes crear al menos una cuenta.",
  );
  const { range, label: periodLabelText } = usePeriod();

  useEffect(() => {
    setFilterCategoryId("");
    setFilterAccountId("");
    setFilter("all");
    setDetailTx(null);
  }, [workspace?.id]);

  const categories = useMemo(() => {
    if (type === "income") return workspaceCategories("income");
    if (type === "expense") return workspaceCategories("expense");
    return [];
  }, [type, workspaceCategories]);

  const accounts = allAccounts();
  const debts = workspaceDebts();
  const goals = workspaceGoals();
  const filterCategories = useMemo(
    () => workspaceCategories(),
    [workspaceCategories],
  );
  const txs = filterTxs(workspaceTransactions(), range).filter((t) => {
    if (filterCategoryId && t.categoryId !== filterCategoryId) return false;
    if (
      filterAccountId &&
      t.accountId !== filterAccountId &&
      t.toAccountId !== filterAccountId
    ) {
      return false;
    }
    if (filter === "all") return true;
    if (filter === "recurring") return Boolean(t.recurring);
    return t.type === filter;
  });
  const currency = user?.currency ?? "COP";

  function resetFields() {
    setAmount("");
    setNote("");
    setCategoryId("");
    setAccountId("");
    setToAccountId("");
    setDebtId("");
    setSavingsGoalId("");
    setRecurring(false);
    setPaymentMethod("");
    setEditingId(null);
    setError(null);
    setType("expense");
    setDate(todayIso());
  }

  function openCreate() {
    guard(() => {
      resetFields();
      setFormOpen(true);
    });
  }

  useEffect(() => {
    function onOpen() {
      openCreate();
    }
    window.addEventListener("presupuesto:open-new-tx", onOpen);
    return () => window.removeEventListener("presupuesto:open-new-tx", onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guard]);

  function openEdit(tx: Transaction) {
    if (!user || tx.createdBy !== user.id) return;
    setEditingId(tx.id);
    setType(tx.type);
    setAmount(String(tx.amount));
    setDate(tx.date);
    setNote(tx.note);
    setCategoryId(tx.categoryId ?? "");
    setAccountId(tx.accountId ?? "");
    setToAccountId(tx.toAccountId ?? "");
    setDebtId(tx.debtId ?? "");
    setSavingsGoalId(tx.savingsGoalId ?? "");
    setRecurring(Boolean(tx.recurring));
    setPaymentMethod(tx.paymentMethod ?? "");
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    resetFields();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const category = categories.find((c) => c.id === categoryId);
    const debt = debts.find((d) => d.id === debtId);
    const goal = goals.find((g) => g.id === savingsGoalId);
    const account = accounts.find((a) => a.id === accountId);
    const targetWorkspaceId =
      category?.workspaceId ||
      debt?.workspaceId ||
      goal?.workspaceId ||
      workspace?.id ||
      account?.workspaceId;

    const payload = {
      type,
      amount: Number(amount),
      date,
      note,
      categoryId: categoryId || undefined,
      accountId: accountId || undefined,
      toAccountId: toAccountId || undefined,
      debtId: debtId || undefined,
      savingsGoalId: savingsGoalId || undefined,
      targetWorkspaceId,
      recurring,
      paymentMethod: paymentMethod || undefined,
    };

    const err = editingId ? updateTransaction(editingId, payload) : addTransaction(payload);
    if (err) {
      setError(err);
      setMessage(null);
      return;
    }
    setMessage(editingId ? "Actualizado." : "Guardado.");
    closeForm();
  }

  function openRepeat(tx: Transaction) {
    setRepeatId(tx.id);
    setRepeatDate(todayIso());
    setRepeatAmount(String(tx.amount));
    setRepeatNote(tx.note ?? "");
    setError(null);
  }

  function confirmRepeat() {
    if (!repeatId) return;
    const amount = Number(repeatAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }
    const err = repeatTransaction(repeatId, {
      date: repeatDate,
      amount,
      note: repeatNote.trim(),
    });
    if (err) {
      setError(err);
      return;
    }
    setMessage(`Repetido (${repeatDate}).`);
    setRepeatId(null);
    setError(null);
  }

  function onDelete(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    const err = deleteTransaction(id);
    if (err) setError(err);
  }

  function exportExpensesCsv() {
    const expenses = filterTxs(workspaceTransactions(), range)
      .filter((t) => t.type === "expense")
      .filter((t) => !filterCategoryId || t.categoryId === filterCategoryId)
      .filter(
        (t) =>
          !filterAccountId ||
          t.accountId === filterAccountId ||
          t.toAccountId === filterAccountId,
      )
      .sort((a, b) => b.date.localeCompare(a.date));

    if (expenses.length === 0) {
      setError("No hay gastos para exportar en este periodo.");
      setMessage(null);
      return;
    }

    const rows = expenses.map((tx) => {
      const cat = tx.categoryId
        ? data.categories.find((c) => c.id === tx.categoryId)
        : undefined;
      const account = tx.accountId
        ? data.accounts.find((a) => a.id === tx.accountId)
        : undefined;
      return [
        tx.date,
        cat ? itemLabel(cat.workspaceId, cat.name) : "",
        account ? itemLabel(account.workspaceId, account.name) : "",
        workspaceLabel(tx.workspaceId),
        tx.paymentMethod ? PAYMENT_METHOD_LABELS[tx.paymentMethod] : "",
        tx.amount,
        tx.note || "",
        tx.recurring ? "sí" : "no",
      ];
    });

    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `gastos-${stamp}.csv`,
      ["Fecha", "Categoría", "Cuenta", "Espacio", "Método", "Monto", "Nota", "Recurrente"],
      rows,
    );
    setError(null);
    setMessage(`CSV exportado (${expenses.length} gasto${expenses.length === 1 ? "" : "s"}).`);
  }

  function txAccent(tx: Transaction) {
    if (tx.categoryId) {
      const cat = data.categories.find((c) => c.id === tx.categoryId);
      if (cat) return cat.color;
    }
    if (tx.accountId) {
      const acc = data.accounts.find((a) => a.id === tx.accountId);
      if (acc) return accountColor(acc.accountType);
    }
    if (tx.savingsGoalId) return TYPE_COLORS.savings_contribution;
    if (tx.debtId) return TYPE_COLORS.debt_payment;
    return TYPE_COLORS[tx.type] ?? "var(--accent)";
  }

  function txTypeLabel(tx: Transaction) {
    return TYPES.find((t) => t.value === tx.type)?.label ?? tx.type;
  }

  function txCategoryLabel(tx: Transaction) {
    if (tx.categoryId) {
      const cat = data.categories.find((c) => c.id === tx.categoryId);
      if (cat) return itemLabel(cat.workspaceId, cat.name);
    }
    if (tx.debtId) {
      const debt = data.debts.find((d) => d.id === tx.debtId);
      if (debt) return itemLabel(debt.workspaceId, debt.name);
    }
    if (tx.savingsGoalId) {
      const goal = data.savingsGoals.find((g) => g.id === tx.savingsGoalId);
      if (goal) return itemLabel(goal.workspaceId, goal.name);
    }
    if (tx.type === "transfer" && tx.accountId && tx.toAccountId) {
      const from = data.accounts.find((a) => a.id === tx.accountId);
      const to = data.accounts.find((a) => a.id === tx.toAccountId);
      if (from && to) {
        return `${itemLabel(from.workspaceId, from.name)} → ${itemLabel(to.workspaceId, to.name)}`;
      }
    }
    return txTypeLabel(tx);
  }

  function txDescription(tx: Transaction) {
    const note = tx.note.trim();
    if (note) return note;
    return txTypeLabel(tx);
  }

  function accountLabel(id?: string) {
    if (!id) return null;
    const acc = data.accounts.find((a) => a.id === id);
    return acc ? itemLabel(acc.workspaceId, acc.name) : null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Movimientos</h1>
          <p className="muted mt-0.5 text-sm">
            Solo del espacio activo ({workspace?.name ?? "…"}). Edita o elimina los que creaste.
          </p>
        </div>
        <ManageToggle active={managing} onChange={setManaging} />
      </div>

      <section className="card space-y-2 p-3">
        <PeriodPicker compact />
        <p className="muted text-[11px] capitalize">{periodLabelText}</p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary text-sm" onClick={openCreate}>
          + Nuevo
        </button>
        <button type="button" className="btn btn-ghost text-sm" onClick={exportExpensesCsv}>
          <Download size={14} />
          CSV gastos
        </button>
      </div>

      {dialog}

      {(error || message) && !formOpen && (
        <p className={`text-xs ${error ? "text-danger" : "text-income"}`}>{error ?? message}</p>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <FilterPill
          active={filter === "all"}
          color="#475569"
          onClick={() => setFilter("all")}
        >
          Todos
        </FilterPill>
        <FilterPill
          active={filter === "recurring"}
          color="#7C3AED"
          onClick={() => setFilter("recurring")}
        >
          Recurrentes
        </FilterPill>
        {TYPES.map((t) => (
          <FilterPill
            key={t.value}
            active={filter === t.value}
            color={TYPE_COLORS[t.value] ?? "#64748B"}
            onClick={() => setFilter(t.value)}
          >
            {t.label}
          </FilterPill>
        ))}
      </div>

      <ColorCombo
        label="Filtrar por categoría"
        value={filterCategoryId}
        onChange={setFilterCategoryId}
        placeholder="Todas las categorías"
        options={filterCategories.map((c) => ({
          value: c.id,
          label: itemLabel(c.workspaceId, c.name),
          color: c.color,
        }))}
      />

      <ColorCombo
        label="Filtrar por cuenta (flujo)"
        value={filterAccountId}
        onChange={setFilterAccountId}
        placeholder="Todas las cuentas"
        options={accounts.map((a) => ({
          value: a.id,
          label: itemLabel(a.workspaceId, a.name),
          color: accountColor(a.accountType),
        }))}
      />

      {txs.length === 0 ? (
        <p className="muted text-sm">Sin movimientos en este periodo con los filtros actuales.</p>
      ) : null}
      <div className="card overflow-hidden">
        {txs.length === 0 && <p className="muted p-3 text-sm">Sin movimientos.</p>}
        <ul className="divide-y divide-border">
          {txs.map((tx) => {
            const positive = tx.type === "income" || tx.type === "savings_withdrawal";
            const mine = user?.id === tx.createdBy;
            const accent = txAccent(tx);
            const category = txCategoryLabel(tx);
            return (
              <li key={tx.id} className="flex items-stretch gap-1 px-1.5 py-1 sm:px-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-2 text-left transition hover:bg-[color-mix(in_oklab,var(--border)_35%,transparent)]"
                  onClick={() => setDetailTx(tx)}
                >
                  <span className="tx-swatch" style={{ ["--swatch" as string]: accent }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold">{txDescription(tx)}</p>
                      {tx.recurring && (
                        <span
                          className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: `color-mix(in oklab, ${accent} 18%, var(--bg-elevated))`,
                            color: accent,
                          }}
                        >
                          rec.
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-medium" style={{ color: accent }}>
                      {category}
                    </p>
                    <p className="muted truncate text-[11px]">{formatDate(tx.date)}</p>
                  </div>
                  <p
                    className={`shrink-0 self-center text-sm font-semibold tabular-nums ${
                      positive ? "text-income" : "text-expense"
                    }`}
                  >
                    {positive ? "+" : "-"}
                    {formatMoney(tx.amount, currency)}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-1 pr-1">
                  {tx.recurring && (
                    <button
                      type="button"
                      className="rounded-md border border-border p-1.5 muted hover:text-fg"
                      title="Repetir"
                      onClick={() => openRepeat(tx)}
                    >
                      <Repeat2 size={13} />
                    </button>
                  )}
                  {mine && (
                    <button
                      type="button"
                      className="rounded-md border border-border p-1.5 muted hover:text-fg"
                      title="Editar"
                      onClick={() => openEdit(tx)}
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  {managing && mine && (
                    <button
                      type="button"
                      className="rounded-md border border-red-300 bg-red-50 p-1.5 text-red-700"
                      title="Borrar"
                      onClick={() => onDelete(tx.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Modal
        open={!!detailTx}
        onClose={() => setDetailTx(null)}
        title="Detalle del movimiento"
      >
        {detailTx && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide muted">
                  {txTypeLabel(detailTx)}
                </p>
                <p className="mt-0.5 text-base font-semibold">{txDescription(detailTx)}</p>
              </div>
              <p
                className={`shrink-0 text-lg font-bold tabular-nums ${
                  detailTx.type === "income" || detailTx.type === "savings_withdrawal"
                    ? "text-income"
                    : "text-expense"
                }`}
              >
                {detailTx.type === "income" || detailTx.type === "savings_withdrawal" ? "+" : "-"}
                {formatMoney(detailTx.amount, currency)}
              </p>
            </div>

            <dl className="grid gap-2 text-sm">
              <DetailRow label="Fecha" value={formatDate(detailTx.date)} />
              <DetailRow label="Categoría" value={txCategoryLabel(detailTx)} />
              <DetailRow label="Descripción" value={detailTx.note.trim() || "Sin descripción"} />
              <DetailRow label="Cuenta" value={accountLabel(detailTx.accountId) ?? "—"} />
              {detailTx.toAccountId && (
                <DetailRow label="Cuenta destino" value={accountLabel(detailTx.toAccountId) ?? "—"} />
              )}
              {detailTx.paymentMethod && (
                <DetailRow
                  label="Método de pago"
                  value={PAYMENT_METHOD_LABELS[detailTx.paymentMethod]}
                />
              )}
              <DetailRow label="Recurrente" value={detailTx.recurring ? "Sí" : "No"} />
              <DetailRow label="Espacio" value={workspaceLabel(detailTx.workspaceId)} />
              <DetailRow label="Registrado por" value={memberName(detailTx.createdBy)} />
            </dl>

            {user?.id === detailTx.createdBy && (
              <button
                type="button"
                className="btn btn-primary w-full text-sm"
                onClick={() => {
                  const tx = detailTx;
                  setDetailTx(null);
                  openEdit(tx);
                }}
              >
                Editar movimiento
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Editar movimiento" : "Nuevo movimiento"}
      >
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Tipo</label>
            <select
              className="select"
              value={type}
              disabled={!!editingId}
              onChange={(e) => {
                setType(e.target.value as TransactionType);
                setCategoryId("");
                setDebtId("");
                setSavingsGoalId("");
              }}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
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
              placeholder="Valor del movimiento (ej: 85000)"
              required
            />
          </div>
          <div>
            <label className="label">Fecha</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="label">Nota</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detalle opcional (ej: mercado, Netflix)"
            />
          </div>

          {(type === "income" || type === "expense") && (
            <div className="sm:col-span-2">
              <ColorCombo
                label="Categoría"
                value={categoryId}
                onChange={setCategoryId}
                required
                placeholder="Selecciona la categoría"
                options={categories.map((c) => ({
                  value: c.id,
                  label: itemLabel(c.workspaceId, c.name),
                  color: c.color,
                }))}
              />
            </div>
          )}

          {type !== "transfer" && (
            <div className="sm:col-span-2">
              <ColorCombo
                label="Cuenta"
                value={accountId}
                onChange={setAccountId}
                required
                placeholder="Selecciona la cuenta"
                options={accounts.map((a) => ({
                  value: a.id,
                  label: itemLabel(a.workspaceId, a.name),
                  color: accountColor(a.accountType),
                }))}
              />
            </div>
          )}

          {type === "transfer" && (
            <>
              <div>
                <ColorCombo
                  label="Desde"
                  value={accountId}
                  onChange={setAccountId}
                  required
                  placeholder="Cuenta de origen"
                  options={accounts.map((a) => ({
                    value: a.id,
                    label: itemLabel(a.workspaceId, a.name),
                    color: accountColor(a.accountType),
                  }))}
                />
              </div>
              <div>
                <ColorCombo
                  label="Hacia"
                  value={toAccountId}
                  onChange={setToAccountId}
                  required
                  placeholder="Cuenta de destino"
                  options={accounts.map((a) => ({
                    value: a.id,
                    label: itemLabel(a.workspaceId, a.name),
                    color: accountColor(a.accountType),
                  }))}
                />
              </div>
            </>
          )}

          {type === "debt_payment" && (
            <div className="sm:col-span-2">
              <ColorCombo
                label="Deuda"
                value={debtId}
                onChange={setDebtId}
                required
                placeholder="Selecciona la deuda a pagar"
                options={debts.map((d) => ({
                  value: d.id,
                  label: itemLabel(d.workspaceId, d.name),
                  color: TYPE_COLORS.debt_payment,
                }))}
              />
            </div>
          )}

          {(type === "savings_contribution" || type === "savings_withdrawal") && (
            <div className="sm:col-span-2">
              <ColorCombo
                label="Meta"
                value={savingsGoalId}
                onChange={setSavingsGoalId}
                required
                placeholder="Selecciona la meta de ahorro"
                options={goals.map((g) => ({
                  value: g.id,
                  label: itemLabel(g.workspaceId, g.name),
                  color:
                    type === "savings_contribution"
                      ? TYPE_COLORS.savings_contribution
                      : TYPE_COLORS.savings_withdrawal,
                }))}
              />
            </div>
          )}

          {(type === "expense" || type === "income" || type === "debt_payment") && (
            <div className="sm:col-span-2">
              <label className="label">Método de pago (opcional)</label>
              <select
                className="select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
              >
                <option value="">Sin especificar</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs font-medium sm:col-span-2">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
            Marcar como recurrente (arriendo, suscripciones, etc.)
          </label>
          {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button className="btn btn-primary w-full">{editingId ? "Guardar cambios" : "Guardar"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!repeatId} onClose={() => setRepeatId(null)} title="Repetir movimiento">
        <div className="space-y-3">
          <p className="muted text-xs">
            Se copia el tipo, categoría y cuentas. Puedes ajustar fecha, monto y descripción.
          </p>
          <div>
            <label className="label">Nueva fecha</label>
            <input
              className="input"
              type="date"
              value={repeatDate}
              onChange={(e) => setRepeatDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Monto</label>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={repeatAmount}
              onChange={(e) => setRepeatAmount(e.target.value)}
              placeholder="Ej: 150000"
              required
            />
          </div>
          <div>
            <label className="label">Descripción</label>
            <input
              className="input"
              value={repeatNote}
              onChange={(e) => setRepeatNote(e.target.value)}
              placeholder="Ej: Arriendo marzo, Netflix"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button type="button" className="btn btn-primary w-full" onClick={confirmRepeat}>
            Confirmar
          </button>
        </div>
      </Modal>
    </div>
  );
}

function FilterPill({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`filter-pill ${active ? "is-active" : ""}`}
      style={{ ["--pill-color" as keyof React.CSSProperties]: color } as React.CSSProperties}
    >
      {children}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-[color-mix(in_oklab,var(--border)_28%,transparent)] px-3 py-2">
      <dt className="muted shrink-0 text-xs font-medium">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

