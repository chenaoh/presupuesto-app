"use client";

import { FormEvent, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { useApp } from "@/lib/store";

export default function WorkspacesPage() {
  const {
    myWorkspaces,
    workspace,
    setActiveWorkspace,
    createSharedWorkspace,
    createInvite,
    acceptInvite,
    renameWorkspace,
    deleteWorkspace,
    data,
    memberName,
  } = useApp();
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [managing, setManaging] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const err = createSharedWorkspace(name);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setMessage("Espacio familiar creado.");
    setName("");
    setCreateOpen(false);
  }

  function onAccept(e: FormEvent) {
    e.preventDefault();
    const err = acceptInvite(inviteCode);
    if (err) {
      setError(err);
      setMessage(null);
      return;
    }
    setError(null);
    setMessage("Te uniste al espacio familiar.");
    setInviteCode("");
    setJoinOpen(false);
  }

  function onRename(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const err = renameWorkspace(editingId, editName);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setMessage("Espacio actualizado.");
    setEditingId(null);
    setRenameOpen(false);
  }

  function onDelete(id: string) {
    if (!confirm("¿Eliminar este espacio y todos sus datos?")) return;
    const err = deleteWorkspace(id);
    if (err) setError(err);
    else {
      setError(null);
      setMessage("Espacio eliminado.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl">Espacios</h1>
          <p className="muted mt-0.5 text-sm">Personal y familiar independientes.</p>
        </div>
        <ManageToggle active={managing} onChange={setManaging} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary text-sm" onClick={() => setCreateOpen(true)}>
          + Nuevo espacio
        </button>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => setJoinOpen(true)}>
          Unirse
        </button>
      </div>

      <div className="card overflow-hidden">
        <ul className="divide-y divide-border">
          {myWorkspaces.map((w) => {
            const members = data.members.filter((m) => m.workspaceId === w.id);
            const active = workspace?.id === w.id;
            return (
              <li key={w.id} className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setActiveWorkspace(w.id)}
                >
                  <p className="truncate text-sm font-medium">
                    {w.name}
                    {active ? <span className="ml-1.5 text-[10px] text-accent">activo</span> : null}
                  </p>
                  <p className="muted text-[11px]">
                    {w.type === "personal" ? "Personal" : "Familiar"} · {members.length} miembro
                    {members.length === 1 ? "" : "s"}
                  </p>
                </button>
                {managing && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="rounded-md border border-border p-1.5"
                      onClick={() => {
                        setEditingId(w.id);
                        setEditName(w.name);
                        setRenameOpen(true);
                      }}
                      aria-label="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    {w.type === "shared" && (
                      <button
                        type="button"
                        className="rounded-md border border-red-300 bg-red-50 p-1.5 text-red-700"
                        onClick={() => onDelete(w.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {workspace?.type === "shared" && (
        <section className="card space-y-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Invitar a {workspace.name}</h2>
            <button
              className="btn btn-ghost text-sm"
              type="button"
              onClick={() => setGeneratedCode(createInvite())}
            >
              Generar código
            </button>
          </div>
          {generatedCode && (
            <p className="text-sm">
              Código: <strong className="text-accent">{generatedCode}</strong>
            </p>
          )}
          <ul className="space-y-0.5 text-xs muted">
            {data.members
              .filter((m) => m.workspaceId === workspace.id)
              .map((m) => (
                <li key={m.id}>
                  {memberName(m.userId)} · {m.role === "owner" ? "dueño" : "miembro"}
                </li>
              ))}
          </ul>
        </section>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
      {message && <p className="text-xs text-income">{message}</p>}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo espacio">
        <form onSubmit={onCreate} className="space-y-2">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button className="btn btn-primary w-full">Crear</button>
        </form>
      </Modal>

      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Unirse con código">
        <form onSubmit={onAccept} className="space-y-2">
          <div>
            <label className="label">Código</label>
            <input
              className="input"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button className="btn btn-primary w-full">Unirme</button>
        </form>
      </Modal>

      <Modal
        open={renameOpen}
        onClose={() => {
          setRenameOpen(false);
          setEditingId(null);
        }}
        title="Renombrar espacio"
      >
        <form onSubmit={onRename} className="space-y-2">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button className="btn btn-primary w-full">Guardar</button>
        </form>
      </Modal>
    </div>
  );
}
