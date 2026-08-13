"use client";

import { FormEvent, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { useApp } from "@/lib/store";
import type { Category, CategoryKind } from "@/lib/types";

export default function CategoriesPage() {
  const {
    workspace,
    workspaceCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    itemLabel,
  } = useApp();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [color, setColor] = useState("#0F766E");
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const income = workspaceCategories("income");
  const expense = workspaceCategories("expense");

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setName("");
    setColor("#0F766E");
    setError(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (editing) {
      const err = updateCategory(editing.id, { name, kind, color });
      if (err) {
        setError(err);
        return;
      }
    } else {
      const err = addCategory(name, kind, color);
      if (err) {
        setError(err);
        return;
      }
    }
    closeForm();
  }

  function startEdit(c: Category) {
    setEditing(c);
    setName(c.name);
    setKind(c.kind);
    setColor(c.color);
    setManaging(true);
    setFormOpen(true);
  }

  function onDelete(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    deleteCategory(id);
    if (editing?.id === id) closeForm();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl">Categorías</h1>
          <p className="muted mt-0.5 text-sm">{workspace?.name ?? "—"}</p>
        </div>
        <ManageToggle active={managing} onChange={setManaging} />
      </div>

      <button
        type="button"
        className="btn btn-primary text-sm"
        onClick={() => {
          setEditing(null);
          setName("");
          setFormOpen(true);
        }}
      >
        + Nueva
      </button>

      <CategoryTable
        title="Ingresos"
        items={income}
        itemLabel={itemLabel}
        managing={managing}
        onEdit={startEdit}
        onDelete={onDelete}
      />
      <CategoryTable
        title="Gastos"
        items={expense}
        itemLabel={itemLabel}
        managing={managing}
        onEdit={startEdit}
        onDelete={onDelete}
      />

      <Modal open={formOpen} onClose={closeForm} title={editing ? "Editar categoría" : "Nueva categoría"}>
        <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="select" value={kind} onChange={(e) => setKind(e.target.value as CategoryKind)}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>
          <div>
            <label className="label">Color</label>
            <input className="input h-[42px]" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}
          <button className="btn btn-primary w-full sm:col-span-2">{editing ? "Guardar" : "Crear"}</button>
        </form>
      </Modal>
    </div>
  );
}

function CategoryTable({
  title,
  items,
  itemLabel,
  managing,
  onEdit,
  onDelete,
}: {
  title: string;
  items: Category[];
  itemLabel: (workspaceId: string, name: string) => string;
  managing: boolean;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="muted p-3 text-xs">Sin categorías.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-2 px-3 py-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
              <span className="min-w-0 flex-1 truncate text-sm">
                {itemLabel(c.workspaceId, c.name)}
                {c.isSystem ? <span className="muted ml-1 text-[10px]">base</span> : null}
              </span>
              {managing && (
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="rounded-md border border-border p-1.5"
                    onClick={() => onEdit(c)}
                    aria-label="Editar"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-red-300 bg-red-50 p-1.5 text-red-700"
                    onClick={() => onDelete(c.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
