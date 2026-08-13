"use client";

import { FormEvent, useState } from "react";
import { Pencil, Trash2, Archive } from "lucide-react";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Account, AccountType } from "@/lib/types";

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
    archiveAccount,
    deleteAccount,
    itemLabel,
  } = useApp();

  const institutions = data.institutions.filter((i) => i.workspaceId === workspace?.id);
  const [name, setName] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("ahorros");
  const [initialBalance, setInitialBalance] = useState("0");
  const [newInstitution, setNewInstitution] = useState("");
  const [editing, setEditing] = useState<Account | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = user?.currency ?? "COP";
  const accounts = workspaceAccounts();

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setName("");
    setInstitutionId("");
    setAccountType("ahorros");
    setInitialBalance("0");
    setNewInstitution("");
    setError(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
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

  function onAddInstitution(e: FormEvent) {
    e.preventDefault();
    const err = addInstitution(newInstitution);
    if (err) setError(err);
    else {
      setNewInstitution("");
      setError(null);
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

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl">Cuentas</h1>
          <p className="muted mt-0.5 text-sm">{workspace?.name ?? "—"}</p>
        </div>
        <ManageToggle active={managing} onChange={setManaging} />
      </div>

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

      {error && !formOpen && <p className="text-xs text-danger">{error}</p>}

      <div className="card overflow-hidden">
        {accounts.length === 0 ? (
          <p className="muted p-3 text-sm">Sin cuentas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((account) => {
              const institution = institutions.find((i) => i.id === account.institutionId);
              return (
                <li key={account.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {itemLabel(account.workspaceId, account.name)}
                    </p>
                    <p className="muted truncate text-[11px]">
                      {institution?.name} · {ACCOUNT_TYPE_LABELS[account.accountType]}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMoney(accountBalance(account.id), currency)}
                  </p>
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
        )}
      </div>

      <Modal open={formOpen} onClose={closeForm} title={editing ? "Editar cuenta" : "Nueva cuenta"}>
        <form onSubmit={onAddInstitution} className="mb-3 flex gap-2">
          <input
            className="input flex-1"
            value={newInstitution}
            onChange={(e) => setNewInstitution(e.target.value)}
            placeholder="Nueva institución"
          />
          <button type="submit" className="btn btn-ghost shrink-0">
            Agregar
          </button>
        </form>
        <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Institución</label>
            <select className="select" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} required>
              <option value="">Selecciona</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select
              className="select"
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
          <div>
            <label className="label">Saldo inicial</label>
            <input
              className="input"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}
          <button className="btn btn-primary w-full sm:col-span-2">{editing ? "Guardar" : "Crear"}</button>
        </form>
      </Modal>
    </div>
  );
}
