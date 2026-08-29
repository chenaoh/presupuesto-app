"use client";

import { FormEvent, useMemo, useState } from "react";
import { Building2, Pencil, Trash2, Archive, History } from "lucide-react";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { NumericInput } from "@/components/NumericInput";
import { PeriodPicker } from "@/components/PeriodPicker";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { accountColor } from "@/lib/colors";
import { formatDate, formatMoney } from "@/lib/format";
import { filterTxs } from "@/lib/insights";
import { rangeAnchorMonth, usePeriod } from "@/lib/period";
import { useApp } from "@/lib/store";
import type { Account, AccountType, Institution } from "@/lib/types";

export default function AccountsPage() {
  const {
    user,
    data,
    workspace,
    workspaceAccounts,
    accountBalance,
    addAccount,
    updateAccount,
    addInstitution,
    updateInstitution,
    deleteInstitution,
    archiveAccount,
    deleteAccount,
    itemLabel,
    workspaceTransactions,
    personalAccountsTotal,
    workspaceBudgetBalance,
    workspaceBudgetFunded,
    workspaceBudgetSpent,
  } = useApp();
  const { range, label: periodLabelText } = usePeriod("accounts");

  const institutions = data.institutions.filter((i) => i.workspaceId === workspace?.id);
  const [name, setName] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("ahorros");
  const [initialBalance, setInitialBalance] = useState("");
  const [editing, setEditing] = useState<Account | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [instOpen, setInstOpen] = useState(false);
  const [instName, setInstName] = useState("");
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [historyAccount, setHistoryAccount] = useState<Account | null>(null);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = user?.currency ?? "COP";
  const accounts = workspaceAccounts();
  const hasInstitutions = institutions.length > 0;
  const { year, month } = rangeAnchorMonth(range);
  const isShared = workspace?.type === "shared";
  const isPersonal = workspace?.type === "personal";
  const accountsTotal = isPersonal
    ? personalAccountsTotal()
    : isShared
      ? workspaceBudgetBalance(workspace?.id, year, month)
      : accounts.reduce((s, a) => s + accountBalance(a.id), 0);
  const spaceFunded = isShared ? workspaceBudgetFunded(workspace?.id, year, month) : 0;
  const spaceSpentBudget = isShared ? workspaceBudgetSpent(workspace?.id, year, month) : 0;

  const accountsByType = useMemo(() => {
    const order = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];
    const groups: Array<{ type: AccountType; label: string; color: string; items: Account[] }> = [];
    for (const type of order) {
      const items = accounts.filter((a) => a.accountType === type);
      if (items.length === 0) continue;
      groups.push({
        type,
        label: ACCOUNT_TYPE_LABELS[type],
        color: accountColor(type),
        items,
      });
    }
    return groups;
  }, [accounts]);

  const historyTxs = useMemo(() => {
    if (!historyAccount) return [];
    return filterTxs(workspaceTransactions(), range)
      .filter(
        (t) => t.accountId === historyAccount.id || t.toAccountId === historyAccount.id,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [historyAccount, range, workspaceTransactions]);

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setName("");
    setInstitutionId("");
    setAccountType("ahorros");
    setInitialBalance("");
    setError(null);
  }

  function closeInst() {
    setInstOpen(false);
    setEditingInst(null);
    setInstName("");
    setError(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hasInstitutions) {
      setError("Primero crea una institución.");
      return;
    }
    if (editing) {
      const err = updateAccount(editing.id, {
        name,
        institutionId,
        accountType,
        initialBalance: Number(initialBalance) || 0,
      });
      if (err) {
        setError(err);
        return;
      }
    } else {
      const err = addAccount({
        name,
        institutionId,
        accountType,
        initialBalance: Number(initialBalance) || 0,
      });
      if (err) {
        setError(err);
        return;
      }
    }
    closeForm();
  }

  function onSaveInstitution(e: FormEvent) {
    e.preventDefault();
    if (editingInst) {
      const err = updateInstitution(editingInst.id, instName);
      if (err) {
        setError(err);
        return;
      }
    } else {
      const err = addInstitution(instName);
      if (err) {
        setError(err);
        return;
      }
    }
    setEditingInst(null);
    setInstName("");
    setError(null);
  }

  function startEditInst(inst: Institution) {
    setEditingInst(inst);
    setInstName(inst.name);
    setError(null);
  }

  function onDeleteInst(id: string) {
    if (!confirm("¿Eliminar esta institución?")) return;
    const err = deleteInstitution(id);
    if (err) setError(err);
    else if (editingInst?.id === id) {
      setEditingInst(null);
      setInstName("");
    }
  }

  function startEdit(account: Account) {
    setManaging(true);
    setEditing(account);
    setName(account.name);
    setInstitutionId(account.institutionId);
    setAccountType(account.accountType);
    setInitialBalance(String(account.initialBalance));
    setFormOpen(true);
  }

  function onDelete(id: string) {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    const err = deleteAccount(id);
    if (err) setError(err);
    else if (editing?.id === id) closeForm();
  }

  function openNewAccount() {
    if (!hasInstitutions) {
      setError("Primero crea al menos una institución.");
      setInstOpen(true);
      return;
    }
    setEditing(null);
    setInstitutionId(institutions[0]?.id ?? "");
    setError(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl">Cuentas</h1>
          <p className="muted mt-0.5 text-sm">{workspace?.name ?? "—"}</p>
        </div>
        <ManageToggle active={managing} onChange={setManaging} />
      </div>

      <section className="card balance-hero p-4 sm:p-5">
        <p className="muted text-xs font-semibold uppercase tracking-wide">
          {isShared ? "Saldo del presupuesto" : "Saldo total"}
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {formatMoney(accountsTotal, currency)}
        </p>
        {isShared ? (
          <p className="muted mt-1 text-xs">
            Aportado {formatMoney(spaceFunded, currency)} − gastado{" "}
            {formatMoney(spaceSpentBudget, currency)}.
          </p>
        ) : isPersonal ? (
          <p className="muted mt-1 text-xs">Suma de tus cuentas bancarias del perfil personal.</p>
        ) : (
          <p className="muted mt-1 text-xs">Suma de las cuentas de este espacio.</p>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary text-sm" onClick={openNewAccount}>
          + Nueva cuenta
        </button>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => {
            setError(null);
            setEditingInst(null);
            setInstName("");
            setInstOpen(true);
          }}
        >
          <Building2 size={14} className="mr-1 inline" />
          Instituciones
        </button>
      </div>

      <section className="card space-y-2 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide muted">
          Periodo del historial
        </p>
        <PeriodPicker compact scope="accounts" />
        <p className="muted text-[11px] capitalize">{periodLabelText}</p>
      </section>

      {!hasInstitutions && (
        <p className="rounded-md border border-border px-3 py-2 text-sm">
          Aún no hay instituciones en este espacio. Créalas con el botón{" "}
          <strong>Instituciones</strong> antes de agregar cuentas.
        </p>
      )}

      {error && !formOpen && !instOpen && <p className="text-xs text-danger">{error}</p>}

      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="card">
            <p className="muted p-3 text-sm">Sin cuentas.</p>
          </div>
        ) : (
          accountsByType.map((group) => (
            <section key={group.type} className="card overflow-hidden">
              <div
                className="flex items-center gap-2 border-b border-border px-3 py-2"
                style={{
                  background: `color-mix(in oklab, ${group.color} 14%, var(--bg-elevated))`,
                  boxShadow: `inset 3px 0 0 ${group.color}`,
                }}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: group.color }}
                  aria-hidden
                />
                <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: group.color }}>
                  {group.label}
                </h2>
                <span className="muted text-[11px]">
                  {group.items.length} cuenta{group.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {group.items.map((account) => {
                  const institution = institutions.find((i) => i.id === account.institutionId);
                  const color = accountColor(account.accountType);
                  return (
                    <li key={account.id} className="flex items-center gap-2 px-3 py-2">
                      <span
                        className="h-8 w-1.5 shrink-0 rounded-full"
                        style={{ background: color }}
                        aria-hidden
                      />
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setHistoryAccount(account)}
                      >
                        <p className="truncate text-sm font-medium">
                          {itemLabel(account.workspaceId, account.name)}
                        </p>
                        <p className="muted truncate text-[11px]">
                          {institution?.name} · Ver flujo
                        </p>
                      </button>
                      <p
                        className="shrink-0 text-sm font-semibold tabular-nums"
                        style={{ color }}
                      >
                        {formatMoney(accountBalance(account.id), currency)}
                      </p>
                      <button
                        type="button"
                        className="rounded-md border border-border p-1.5"
                        onClick={() => setHistoryAccount(account)}
                        aria-label="Historial"
                        title="Historial del periodo"
                      >
                        <History size={13} />
                      </button>
                      {managing && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            className="rounded-md border border-border p-1.5"
                            onClick={() => startEdit(account)}
                            aria-label="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-border p-1.5"
                            onClick={() => archiveAccount(account.id)}
                            aria-label="Archivar"
                          >
                            <Archive size={13} />
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-red-300 bg-red-50 p-1.5 text-red-700"
                            onClick={() => onDelete(account.id)}
                            aria-label="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      <Modal open={formOpen} onClose={closeForm} title={editing ? "Editar cuenta" : "Nueva cuenta"}>
        <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="label">Nombre de la cuenta</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ahorros nómina, Efectivo"
              required
            />
          </div>
          <div>
            <label className="label">Institución</label>
            <select
              className="select"
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              required
            >
              <option value="">Selecciona banco o billetera</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tipo de cuenta</label>
            <div className="flex items-center gap-2">
              <span
                className="h-8 w-2 shrink-0 rounded-full"
                style={{ background: accountColor(accountType) }}
                aria-hidden
              />
              <select
                className="select flex-1"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
              >
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Saldo inicial</label>
            <NumericInput
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="Saldo actual al crear la cuenta (ej: 350000)"
            />
          </div>
          {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}
          <button className="btn btn-primary w-full sm:col-span-2">{editing ? "Guardar" : "Crear"}</button>
        </form>
      </Modal>

      <Modal open={instOpen} onClose={closeInst} title="Instituciones">
        <form onSubmit={onSaveInstitution} className="mb-3 flex gap-2">
          <input
            className="input flex-1"
            value={instName}
            onChange={(e) => setInstName(e.target.value)}
            placeholder={
              editingInst
                ? "Nuevo nombre de la institución"
                : "Ej: Bancolombia, Nequi, Efectivo en casa"
            }
            required
          />
          <button type="submit" className="btn btn-primary shrink-0">
            {editingInst ? "Guardar" : "Agregar"}
          </button>
          {editingInst && (
            <button
              type="button"
              className="btn btn-ghost shrink-0"
              onClick={() => {
                setEditingInst(null);
                setInstName("");
              }}
            >
              Cancelar
            </button>
          )}
        </form>
        {error && <p className="mb-2 text-xs text-danger">{error}</p>}
        {institutions.length === 0 ? (
          <p className="muted text-sm">Sin instituciones. Agrega la primera arriba.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {institutions.map((inst) => (
              <li key={inst.id} className="flex items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inst.name}</p>
                  {inst.isSystem && <p className="muted text-[11px]">Base del sistema</p>}
                </div>
                <button
                  type="button"
                  className="rounded-md border border-border p-1.5"
                  onClick={() => startEditInst(inst)}
                  aria-label="Editar"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="rounded-md border border-red-300 bg-red-50 p-1.5 text-red-700"
                  onClick={() => onDeleteInst(inst.id)}
                  aria-label="Eliminar"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={!!historyAccount}
        onClose={() => setHistoryAccount(null)}
        title={
          historyAccount
            ? `Flujo · ${itemLabel(historyAccount.workspaceId, historyAccount.name)}`
            : "Flujo"
        }
      >
        <p className="muted mb-3 text-xs capitalize">{periodLabelText}</p>
        {historyTxs.length === 0 ? (
          <p className="muted text-sm">Sin movimientos de esta cuenta en el periodo.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {historyTxs.map((t) => {
              const from = t.accountId
                ? data.accounts.find((a) => a.id === t.accountId)
                : undefined;
              const to = t.toAccountId
                ? data.accounts.find((a) => a.id === t.toAccountId)
                : undefined;
              const leaving =
                t.type === "transfer"
                  ? t.accountId === historyAccount?.id
                  : t.type === "income" || t.type === "savings_withdrawal"
                    ? false
                    : t.accountId === historyAccount?.id;
              const entering =
                t.type === "transfer"
                  ? t.toAccountId === historyAccount?.id
                  : t.type === "income" || t.type === "savings_withdrawal"
                    ? t.accountId === historyAccount?.id
                    : false;
              let flowLabel = String(t.type);
              if (t.type === "transfer" && from && to) {
                flowLabel = `De ${from.name} → ${to.name}`;
              } else if (leaving) flowLabel = "Salida";
              else if (entering) flowLabel = "Entrada";
              return (
                <li key={t.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{flowLabel}</p>
                    <p className="muted truncate text-[11px]">
                      {formatDate(t.date)}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-semibold tabular-nums ${
                      entering ? "text-income" : leaving ? "text-expense" : ""
                    }`}
                  >
                    {entering ? "+" : leaving ? "-" : ""}
                    {formatMoney(t.amount, currency)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </div>
  );
}
