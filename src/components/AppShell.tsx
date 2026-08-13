"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  PiggyBank,
  Landmark,
  Target,
  Settings,
  Users,
  LogOut,
  X,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { clsx } from "@/lib/format";
import { HelpButton } from "@/components/HelpButton";
import { UserAvatar } from "@/components/UserAvatar";
import { useRequireAccounts } from "@/lib/useRequireAccounts";

const links = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/accounts", label: "Cuentas", icon: Wallet },
  { href: "/categories", label: "Categorías", icon: Tags },
  { href: "/budgets", label: "Presupuestos", icon: PiggyBank },
  { href: "/debts", label: "Deudas", icon: Landmark },
  { href: "/savings", label: "Ahorros", icon: Target },
  { href: "/workspaces", label: "Espacios", icon: Users },
  { href: "/settings", label: "Perfil", icon: Settings },
];

const mobilePrimary = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/transactions", label: "Movim.", icon: ArrowLeftRight },
  { href: "/budgets", label: "Presup.", icon: PiggyBank },
];

const mobilePrimaryHrefs = new Set(mobilePrimary.map((t) => t.href));

function scrollAllToTop(scroller?: HTMLElement | null) {
  if (scroller) scroller.scrollTop = 0;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, user, workspace, myWorkspaces, setActiveWorkspace, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { guard, dialog } = useRequireAccounts(
    "Para registrar un movimiento primero debes crear al menos una cuenta.",
  );

  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [ready, user, router]);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    setMenuOpen(false);
    scrollAllToTop(scrollRef.current);
    const id = window.setTimeout(() => scrollAllToTop(scrollRef.current), 0);
    const id2 = window.setTimeout(() => scrollAllToTop(scrollRef.current), 50);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(id2);
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    scrollAllToTop(scrollRef.current);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  function go(href: string) {
    scrollAllToTop(scrollRef.current);
    setMenuOpen(false);
    if (pathname !== href) router.push(href);
  }

  if (!ready || !user) {
    return (
      <div className="min-h-screen grid place-items-center muted">
        Cargando…
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Image
              src="/brand/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-xl object-cover"
              priority
            />
            <p className="brand text-sm text-accent sm:text-base">Presupuesto</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <select
              className="select max-w-[120px] px-1.5 py-1 text-[10px] sm:max-w-[180px] sm:text-xs"
              value={workspace?.id ?? ""}
              onChange={(e) => setActiveWorkspace(e.target.value)}
              aria-label="Espacio"
            >
              {myWorkspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <HelpButton />
            <button
              type="button"
              className="btn btn-ghost hidden px-2 py-1 text-xs md:inline-flex"
              onClick={() => setMenuOpen(true)}
            >
              Más
            </button>
            <button
              className="btn btn-ghost px-1.5 py-1"
              onClick={() => {
                logout();
                router.replace("/");
              }}
              aria-label="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
            <button type="button" onClick={() => go("/settings")} aria-label="Perfil">
              <UserAvatar src={user.avatarData} name={user.displayName} size={32} />
            </button>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="app-shell-scroll">
        <div className="mx-auto grid max-w-6xl gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 md:grid-cols-[188px_1fr]">
          <aside className="hidden md:block">
            <nav className="card sticky top-3 space-y-0.5 p-2">
              {links.map(({ href, label, icon: Icon }) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => go(href)}
                  className={clsx(
                    "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition",
                    pathname === href
                      ? "bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-accent"
                      : "muted hover:bg-[color-mix(in_oklab,var(--border)_40%,transparent)]",
                  )}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <main key={pathname} className="rise min-w-0 pb-2">
            {children}
          </main>
        </div>
      </div>

      <nav className="app-shell-nav md:hidden safe-bottom">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-1 px-2 pb-1.5 pt-1">
          {mobilePrimary.slice(0, 2).map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <button
                key={href}
                type="button"
                onClick={() => go(href)}
                className={clsx(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[9px] font-semibold",
                  active
                    ? "bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-accent"
                    : "muted",
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2.1} />
                <span>{label}</span>
              </button>
            );
          })}

          <button
            type="button"
            aria-label="Agregar movimiento"
            onClick={() =>
              guard(() => {
                go("/transactions");
                window.setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("presupuesto:open-new-tx"));
                }, 50);
              })
            }
            className="nav-fab -mt-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>

          {mobilePrimary.slice(2).map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <button
                key={href}
                type="button"
                onClick={() => go(href)}
                className={clsx(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[9px] font-semibold",
                  active
                    ? "bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-accent"
                    : "muted",
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2.1} />
                <span>{label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={clsx(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[9px] font-semibold",
              menuOpen || !mobilePrimaryHrefs.has(pathname)
                ? "bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-accent"
                : "muted",
            )}
          >
            <MoreHorizontal
              size={18}
              strokeWidth={menuOpen || !mobilePrimaryHrefs.has(pathname) ? 2.5 : 2.1}
            />
            <span>Más</span>
          </button>
        </div>
      </nav>

      {dialog}

      {menuOpen && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-border bg-[var(--bg-elevated)] p-3 shadow-2xl safe-bottom md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[380px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm font-semibold">Secciones</p>
              <button
                type="button"
                className="rounded-full p-1.5 muted"
                aria-label="Cerrar"
                onClick={() => setMenuOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <button
                    key={href}
                    type="button"
                    onClick={() => go(href)}
                    className={clsx(
                      "flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[11px] font-semibold",
                      active
                        ? "bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-accent"
                        : "muted hover:bg-[color-mix(in_oklab,var(--border)_35%,transparent)]",
                    )}
                  >
                    <Icon size={18} />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
