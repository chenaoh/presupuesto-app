"use client";

import { FormEvent, useRef, useState } from "react";
import { Camera, Pencil, Trash2 } from "lucide-react";
import { ManageToggle } from "@/components/ManageToggle";
import { Modal } from "@/components/Modal";
import { UserAvatar } from "@/components/UserAvatar";
import { fileToAvatarDataUrl } from "@/lib/avatar";
import { ACCENT_PRESETS } from "@/lib/constants";
import { useApp } from "@/lib/store";
import type { Workspace } from "@/lib/types";
import { clsx } from "@/lib/format";

export default function WorkspacesPage() {
  const {
    myWorkspaces,
    workspace,
    setActiveWorkspace,
    createSharedWorkspace,
    createInvite,
    acceptInvite,
    renameWorkspace,
    updateWorkspace,
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
  const [editAccent, setEditAccent] = useState("");
  const [managing, setManaging] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editing = editingId ? myWorkspaces.find((w) => w.id === editingId) : null;

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const err = await createSharedWorkspace(name);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setMessage("Espacio familiar creado.");
    setName("");
    setCreateOpen(false);
  }

  async function onAccept(e: FormEvent) {
    e.preventDefault();
    const err = await acceptInvite(inviteCode);
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

  function openEdit(w: Workspace) {
    setEditingId(w.id);
    setEditName(w.name);
    setEditAccent(w.accentColor ?? "");
    setAvatarError(null);
    setEditOpen(true);
  }

  function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const errName = renameWorkspace(editingId, editName);
    if (errName) {
      setError(errName);
      return;
    }
    const errAccent = updateWorkspace(editingId, {
      accentColor: editAccent || "",
    });
    if (errAccent) {
      setError(errAccent);
      return;
    }
    setError(null);
    setMessage("Espacio actualizado.");
    setEditingId(null);
    setEditOpen(false);
  }

  async function onAvatarChange(file: File | null) {
    if (!editingId || !file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Selecciona una imagen (JPG o PNG).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAvatarError("La imagen es muy pesada (máx. 8 MB).");
      return;
    }
    setSavingAvatar(true);
    setAvatarError(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const err = updateWorkspace(editingId, { avatarData: dataUrl });
      if (err) setAvatarError(err);
      else setMessage("Imagen del espacio guardada.");
    } catch {
      setAvatarError("No se pudo procesar la imagen.");
    } finally {
      setSavingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
          <p className="muted mt-0.5 text-sm">Personaliza imagen y color para reconocerlos al cambiar.</p>
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
            const accent = w.accentColor;
            return (
              <li
                key={w.id}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2.5 transition",
                  active && "bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]",
                )}
                style={
                  active && accent
                    ? {
                        background: `color-mix(in oklab, ${accent} 12%, transparent)`,
                        boxShadow: `inset 3px 0 0 ${accent}`,
                      }
                    : active
                      ? { boxShadow: "inset 3px 0 0 var(--accent)" }
                      : undefined
                }
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  onClick={() => setActiveWorkspace(w.id)}
                >
                  <UserAvatar
                    src={w.avatarData}
                    name={w.name}
                    size={40}
                    accent={accent}
                  />
                  <span className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {w.name}
                      {active ? (
                        <span
                          className="ml-1.5 text-[10px] font-semibold text-accent"
                          style={accent ? { color: accent } : undefined}
                        >
                          activo
                        </span>
                      ) : null}
                    </p>
                    <p className="muted text-[11px]">
                      {w.type === "personal" ? "Personal" : "Familiar"} · {members.length} miembro
                      {members.length === 1 ? "" : "s"}
                    </p>
                  </span>
                </button>
                {managing && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="rounded-md border border-border p-1.5"
                      onClick={() => openEdit(w)}
                      aria-label="Personalizar"
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
              onClick={async () => {
                const code = await createInvite();
                setGeneratedCode(code);
              }}
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
            <label className="label">Nombre del espacio</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Familia, Casa, Pareja"
              required
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button className="btn btn-primary w-full">Crear</button>
        </form>
      </Modal>

      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Unirse con código">
        <form onSubmit={onAccept} className="space-y-2">
          <div>
            <label className="label">Código de invitación</label>
            <input
              className="input"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Pega el código de 6 caracteres"
              required
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button className="btn btn-primary w-full">Unirme</button>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingId(null);
          setAvatarError(null);
        }}
        title="Personalizar espacio"
      >
        <form onSubmit={onSaveEdit} className="space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={editing?.avatarData}
              name={editName || editing?.name}
              size={64}
              accent={editAccent || editing?.accentColor}
            />
            <div className="min-w-0 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onAvatarChange(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                className="btn btn-primary text-sm"
                disabled={savingAvatar}
                onClick={() => fileRef.current?.click()}
              >
                <Camera size={15} />
                {savingAvatar ? "Guardando…" : editing?.avatarData ? "Cambiar imagen" : "Subir imagen"}
              </button>
              {editing?.avatarData && (
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() => {
                    if (!editingId) return;
                    updateWorkspace(editingId, { avatarData: "" });
                    setMessage("Imagen quitada.");
                  }}
                >
                  <Trash2 size={14} />
                  Quitar imagen
                </button>
              )}
              {avatarError && <p className="text-xs text-danger">{avatarError}</p>}
            </div>
          </div>

          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre del espacio"
              required
            />
          </div>

          <div>
            <label className="label">Color del espacio</label>
            <p className="muted mb-1.5 text-[11px]">
              Al cambiar de espacio, la app usa este color para que se note en cuál estás.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-8 w-8 rounded-full border ${
                    editAccent === color ? "border-fg" : "border-border"
                  }`}
                  style={{ background: color }}
                  onClick={() => setEditAccent(color)}
                  aria-label={`Color ${color}`}
                />
              ))}
              <input
                type="color"
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                value={editAccent || "#1F6B4F"}
                onChange={(e) => setEditAccent(e.target.value)}
              />
              {editAccent && (
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  onClick={() => setEditAccent("")}
                >
                  Usar color del perfil
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
          <button className="btn btn-primary w-full">Guardar</button>
        </form>
      </Modal>
    </div>
  );
}
