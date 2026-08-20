"use client";

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
  ChevronRight,
  Plus,
  Menu,
  Lightbulb,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { NewTxTypeSheet } from "@/components/NewTxTypeSheet";
import { RecurringReminders } from "@/components/RecurringReminders";
import { UserAvatar } from "@/components/UserAvatar";
import { clsx } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useRequireAccounts } from "@/lib/useRequireAccounts";
import type { TransactionType } from "@/lib/types";

const links = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/accounts", label: "Cuentas", icon: Wallet },
  { href: "/categories", label: "Categorías", icon: Tags },
  { href: "/budgets", label: "Bolsillos", icon: PiggyBank },
  { href: "/savings", label: "Ahorros", icon: Target },
  { href: "/debts", label: "Deudas", icon: Landmark },
  { href: "/consejos", label: "Consejos", icon: Lightbulb },
  { href: "/workspaces", label: "Espacios", icon: Users },
  { href: "/settings", label: "Perfil", icon: Settings },
];

const moreGroups = [
  {
    title: "Finanzas",
    items: [
      { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
      { href: "/accounts", label: "Cuentas", icon: Wallet },
      { href: "/categories", label: "Categorías", icon: Tags },
    ],
  },
  {
    title: "Planificación",
    items: [
      { href: "/budgets", label: "Bolsillos", icon: PiggyBank },
      { href: "/savings", label: "Ahorros", icon: Target },
      { href: "/debts", label: "Deudas", icon: Landmark },
    ],
  },
  {
    title: "Otros",
    items: [
      { href: "/consejos", label: "Consejos", icon: Lightbulb },
      { href: "/workspaces", label: "Espacios", icon: Users },
      { href: "/settings", label: "Perfil", icon: Settings },
    ],
  },
];

const mobilePrimary = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/budgets", label: "Bolsillos", icon: PiggyBank },
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
  const [typeOpen, setTypeOpen] = useState(false);
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

  function openNew(type?: TransactionType) {
    guard(() => {
      if (type) {
        go("/transactions");
        window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("presupuesto:open-new-tx", { detail: { type } }),
          );
        }, 180);
        return;
      }
      setTypeOpen(true);
    });
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
      <aside className="app-sidebar">
        <div className="flex items-center gap-2.5 px-2 pb-4">
          <BrandMark size={36} />
          <p className="brand text-lg text-accent">Presupuesto</p>
        </div>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              type="button"
              onClick={() => go(href)}
              className={clsx(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                pathname === href
                  ? "bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-accent"
                  : "muted hover:bg-[color-mix(in_oklab,var(--border)_40%,transparent)]",
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <div className="flex items-center gap-2 rounded-2xl bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-2 py-2">
            <UserAvatar src={user.avatarData} name={user.displayName} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{user.displayName}</p>
              <select
                className="mt-0.5 w-full border-0 bg-transparent p-0 text-[11px] font-semibold text-accent outline-none"
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
            </div>
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold muted hover:bg-[color-mix(in_oklab,var(--border)_40%,transparent)]"
            onClick={() => go("/settings")}
          >
            <Settings size={15} />
            Configuración
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold muted hover:bg-[color-mix(in_oklab,var(--border)_40%,transparent)]"
            onClick={() => {
              logout();
              router.replace("/");
            }}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="app-shell-main relative flex min-h-0 min-w-0 flex-1 flex-col">
        {pathname !== "/dashboard" && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 md:hidden">
            <select
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-accent outline-none"
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
            <button type="button" onClick={() => go("/settings")} aria-label="Perfil">
              <UserAvatar src={user.avatarData} name={user.displayName} size={32} />
            </button>
          </div>
        )}
        <div ref={scrollRef} className="app-shell-scroll">
          <div className="mx-auto min-w-0 max-w-6xl px-3 py-3 sm:px-5 sm:py-5">
            <main key={pathname} className="rise min-w-0 overflow-x-hidden pb-16 md:pb-20">
              {children}
            </main>
          </div>
        </div>
        <RecurringReminders />

        <div className="app-fab-desktop">
          <button
            type="button"
            aria-label="Agregar movimiento"
            onClick={() => openNew()}
            className="nav-fab flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
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
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold",
                  active ? "text-accent" : "muted",
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
            onClick={() => openNew()}
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
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold",
                  active ? "text-accent" : "muted",
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
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold",
              menuOpen || !mobilePrimaryHrefs.has(pathname) ? "text-accent" : "muted",
            )}
          >
            <Menu
              size={18}
              strokeWidth={menuOpen || !mobilePrimaryHrefs.has(pathname) ? 2.5 : 2.1}
            />
            <span>Menú</span>
          </button>
        </div>
      </nav>

      {dialog}

      <NewTxTypeSheet
        open={typeOpen}
        onClose={() => setTypeOpen(false)}
        onPick={(type) => {
          setTypeOpen(false);
          openNew(type);
        }}
      />

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-border bg-[var(--bg-elevated)] p-4 shadow-2xl safe-bottom">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-bold">Menú</p>
            </div>
            <div className="space-y-4">
              {moreGroups.map((group) => (
                <div key={group.title}>
                  <p className="muted mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide">
                    {group.title}
                  </p>
                  <ul className="overflow-hidden rounded-2xl border border-border">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <li key={item.href} className="border-b border-border last:border-b-0">
                          <button
                            type="button"
                            onClick={() => go(item.href)}
                            className={clsx(
                              "flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold",
                              active ? "text-accent" : "",
                            )}
                          >
                            <span
                              className={clsx(
                                "grid h-9 w-9 place-items-center rounded-xl",
                                active
                                  ? "bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-accent"
                                  : "bg-[color-mix(in_oklab,var(--border)_45%,transparent)] muted",
                              )}
                            >
                              <Icon size={16} />
                            </span>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronRight size={16} className="muted" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
