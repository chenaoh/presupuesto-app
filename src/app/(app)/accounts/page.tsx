"use client";

import { FormEvent, useState } from "react";
import { Building2, Pencil, Trash2, Archive } from "lucide-react";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
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
  } = useApp();

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
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = user?.currency ?? "COP";
  const accounts = workspaceAccounts();
  const hasInstitutions = institutions.length > 0;

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

      {!hasInstitutions && (
        <p className="rounded-md border border-border px-3 py-2 text-sm">
          Aún no hay instituciones en este espacio. Créalas con el botón{" "}
          <strong>Instituciones</strong> antes de agregar cuentas.
        </p>
      )}

      {error && !formOpen && !instOpen && <p className="text-xs text-danger">{error}</p>}

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
    </div>
  );
}
