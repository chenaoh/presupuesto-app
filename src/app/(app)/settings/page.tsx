"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { UserAvatar } from "@/components/UserAvatar";
import { ACCENT_PRESETS } from "@/lib/constants";
import { fileToAvatarDataUrl } from "@/lib/avatar";
import { useApp } from "@/lib/store";
import type { ThemeMode } from "@/lib/types";

export default function SettingsPage() {
  const { user, updateProfile } = useApp();
  const { setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  if (!user) return null;

  function applyTheme(mode: ThemeMode) {
    if (!user) return;
    updateProfile({ theme: mode });
    const root = document.documentElement;
    root.dataset.theme = mode;
    const accent = user.accentColor || "#1F6B4F";
    if (mode === "custom") {
      setTheme("light");
      root.classList.remove("dark");
      root.style.setProperty("--bg", `color-mix(in oklab, ${accent} 10%, #f2f7f4)`);
      root.style.setProperty("--bg-elevated", "#ffffff");
      root.style.setProperty("--fg", "#10231c");
      root.style.setProperty("--border", `color-mix(in oklab, ${accent} 28%, #c5d5cc)`);
    } else if (mode === "light") {
      setTheme("light");
      root.classList.remove("dark");
      clearCustomOverrides(root);
    } else if (mode === "dark") {
      setTheme("dark");
      root.classList.add("dark");
      clearCustomOverrides(root);
    } else {
      setTheme("system");
      clearCustomOverrides(root);
    }
    root.style.setProperty("--accent", accent);
  }

  function clearCustomOverrides(root: HTMLElement) {
    root.style.removeProperty("--bg");
    root.style.removeProperty("--bg-elevated");
    root.style.removeProperty("--fg");
    root.style.removeProperty("--border");
    root.style.removeProperty("--shadow");
  }

  async function onAvatarChange(file: File | null) {
    if (!file) return;
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
      updateProfile({ avatarData: dataUrl });
    } catch {
      setAvatarError("No se pudo procesar la foto.");
    } finally {
      setSavingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Perfil</h1>
        <p className="muted mt-0.5 text-sm">Foto, nombre y apariencia.</p>
      </div>

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="text-base font-bold">Tu foto</h2>
        <div className="flex items-center gap-4">
          <UserAvatar src={user.avatarData} name={user.displayName} size={72} />
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
              {savingAvatar ? "Guardando…" : user.avatarData ? "Cambiar foto" : "Cargar foto"}
            </button>
            {user.avatarData && (
              <button
                type="button"
                className="btn btn-ghost text-sm"
                onClick={() => updateProfile({ avatarData: "" })}
              >
                <Trash2 size={14} />
                Quitar foto
              </button>
            )}
            {avatarError && <p className="text-xs text-danger">{avatarError}</p>}
            <p className="muted text-xs">Se usa en inicio y en la barra inferior.</p>
          </div>
        </div>
      </section>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="text-base font-bold">Datos</h2>
        <div>
          <label className="label">Nombre para mostrar</label>
          <input
            className="input"
            value={user.displayName}
            onChange={(e) => updateProfile({ displayName: e.target.value })}
            placeholder="Cómo te verán en espacios compartidos"
          />
        </div>
        <p className="muted text-xs">{user.email}</p>
      </section>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="text-base font-bold">Tema</h2>
        <div className="flex flex-wrap gap-2">
          {(["system", "light", "dark", "custom"] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`pill ${user.theme === mode ? "border-accent text-accent" : ""}`}
              onClick={() => applyTheme(mode)}
            >
              {mode === "system"
                ? "Sistema"
                : mode === "light"
                  ? "Claro"
                  : mode === "dark"
                    ? "Oscuro"
                    : "Personalizado"}
            </button>
          ))}
        </div>
        <div>
          <label className="label">Color de acento</label>
          <p className="muted mb-1.5 text-[11px]">
            Se usa si el espacio activo no tiene color propio (Espacios → Gestionar).
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                className={`h-8 w-8 rounded-full border ${
                  user.accentColor === color ? "border-fg" : "border-border"
                }`}
                style={{ background: color }}
                onClick={() => {
                  updateProfile({ accentColor: color });
                  document.documentElement.style.setProperty("--accent", color);
                }}
                aria-label={`Acento ${color}`}
              />
            ))}
            <input
              type="color"
              className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
              value={user.accentColor}
              onChange={(e) => {
                updateProfile({ accentColor: e.target.value });
                document.documentElement.style.setProperty("--accent", e.target.value);
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
