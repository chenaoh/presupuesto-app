"use client";

import { useTheme } from "next-themes";
import { ACCENT_PRESETS } from "@/lib/constants";
import { useApp } from "@/lib/store";
import type { ThemeMode } from "@/lib/types";

export default function SettingsPage() {
  const { user, updateProfile } = useApp();
  const { setTheme } = useTheme();

  if (!user) return null;

  function applyTheme(mode: ThemeMode) {
    if (!user) return;
    updateProfile({ theme: mode });
    const root = document.documentElement;
    root.dataset.theme = mode;
    const accent = user.accentColor || "#0D9488";
    if (mode === "custom") {
      setTheme("light");
      root.classList.remove("dark");
      root.style.setProperty("--bg", `color-mix(in oklab, ${accent} 12%, #dce7f0)`);
      root.style.setProperty("--bg-elevated", "#ffffff");
      root.style.setProperty("--fg", "#0b1220");
      root.style.setProperty("--border", `color-mix(in oklab, ${accent} 42%, #94a3b8)`);
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl">Ajustes</h1>
        <p className="muted mt-0.5 text-sm">Perfil y apariencia.</p>
      </div>

      <section className="card space-y-3 p-3 sm:p-4">
        <h2 className="text-base font-semibold">Perfil</h2>
        <div>
          <label className="label">Nombre</label>
          <input
            className="input"
            value={user.displayName}
            onChange={(e) => updateProfile({ displayName: e.target.value })}
          />
        </div>
        <p className="muted text-xs">{user.email}</p>
      </section>

      <section className="card space-y-3 p-3 sm:p-4">
        <h2 className="text-base font-semibold">Tema</h2>
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

      <section className="card space-y-1 p-3 sm:p-4">
        <h2 className="text-base font-semibold">Datos</h2>
        <p className="muted text-xs">
          Datos locales. Moneda: {user.currency}.
        </p>
      </section>
    </div>
  );
}
