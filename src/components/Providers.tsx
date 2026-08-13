"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/lib/store";

function AccentSync({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const { setTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const accent = user?.accentColor || "#0D9488";
    root.style.setProperty("--accent", accent);

    if (!user) return;

    root.dataset.theme = user.theme;

    if (user.theme === "custom") {
      setTheme("light");
      root.classList.remove("dark");
      root.style.setProperty("--bg", `color-mix(in oklab, ${accent} 12%, #dce7f0)`);
      root.style.setProperty("--bg-elevated", "#ffffff");
      root.style.setProperty("--fg", "#0b1220");
      root.style.setProperty("--border", `color-mix(in oklab, ${accent} 42%, #94a3b8)`);
      root.style.setProperty(
        "--shadow",
        `0 14px 36px color-mix(in oklab, ${accent} 28%, transparent)`,
      );
    } else if (user.theme === "light") {
      setTheme("light");
      root.classList.remove("dark");
      root.style.removeProperty("--bg");
      root.style.removeProperty("--bg-elevated");
      root.style.removeProperty("--fg");
      root.style.removeProperty("--border");
      root.style.removeProperty("--shadow");
    } else if (user.theme === "dark") {
      setTheme("dark");
      root.classList.add("dark");
      root.style.removeProperty("--bg");
      root.style.removeProperty("--bg-elevated");
      root.style.removeProperty("--fg");
      root.style.removeProperty("--border");
      root.style.removeProperty("--shadow");
    } else {
      setTheme("system");
      root.style.removeProperty("--bg");
      root.style.removeProperty("--bg-elevated");
      root.style.removeProperty("--fg");
      root.style.removeProperty("--border");
      root.style.removeProperty("--shadow");
    }
  }, [setTheme, user]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <AccentSync>{children}</AccentSync>
    </NextThemesProvider>
  );
}
