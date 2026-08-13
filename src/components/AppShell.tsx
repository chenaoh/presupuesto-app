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
  MoreHorizontal,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { clsx } from "@/lib/format";
import { HelpButton } from "@/components/HelpButton";

const links = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/transactions", label: "Movim.", icon: ArrowLeftRight },
  { href: "/accounts", label: "Cuentas", icon: Wallet },
  { href: "/categories", label: "Categorías", icon: Tags },
  { href: "/budgets", label: "Presup.", icon: PiggyBank },
  { href: "/debts", label: "Deudas", icon: Landmark },
  { href: "/savings", label: "Ahorros", icon: Target },
  { href: "/workspaces", label: "Espacios", icon: Users },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

const primaryMobile = [links[0], links[1], links[2], links[6]];
const moreLinks = links.filter((l) => !primaryMobile.some((p) => p.href === l.href));

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

  const moreActive = moreLinks.some((l) => l.href === pathname);

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-1.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Image
              src="/brand/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-lg object-cover"
              priority
            />
            <p className="brand text-sm text-accent sm:text-base">Presupuesto</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
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
              className="btn btn-ghost px-1.5 py-1"
              onClick={() => {
                logout();
                router.replace("/");
              }}
              aria-label="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="app-shell-scroll">
        <div className="mx-auto grid max-w-6xl gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 md:grid-cols-[168px_1fr]">
          <aside className="hidden md:block">
            <nav className="card sticky top-3 space-y-0.5 p-1.5">
              {links.map(({ href, label, icon: Icon }) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => go(href)}
                  className={clsx(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition",
                    pathname === href
                      ? "bg-[color-mix(in_oklab,var(--accent)_22%,transparent)] text-accent"
                      : "muted hover:bg-[color-mix(in_oklab,var(--border)_45%,transparent)]",
                  )}
                >
                  <Icon size={14} />
                  {label === "Movim." ? "Movimientos" : label === "Presup." ? "Presupuestos" : label}
                </button>
              ))}
            </nav>
          </aside>

          <main key={pathname} className="rise min-w-0">
            {children}
          </main>
        </div>
      </div>

      <nav className="app-shell-nav md:hidden safe-bottom">
        <div className="mx-auto grid max-w-6xl grid-cols-5 gap-0 px-0.5 py-0.5">
          {primaryMobile.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <button
                key={href}
                type="button"
                onClick={() => go(href)}
                className={clsx(
                  "flex flex-col items-center justify-center gap-0 rounded-md py-1 text-[8px] font-semibold leading-none",
                  active
                    ? "bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-accent"
                    : "muted",
                )}
              >
                <Icon size={15} strokeWidth={active ? 2.6 : 2.25} />
                <span className="mt-0.5 truncate">{label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={clsx(
              "flex flex-col items-center justify-center gap-0 rounded-md py-1 text-[8px] font-semibold leading-none",
              moreActive || menuOpen
                ? "bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-accent"
                : "muted",
            )}
          >
            <MoreHorizontal size={15} strokeWidth={moreActive || menuOpen ? 2.6 : 2.25} />
            <span className="mt-0.5">Más</span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl border border-border bg-[var(--bg-elevated)] p-2 shadow-2xl safe-bottom">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide muted">Menú</p>
              <button
                type="button"
                className="rounded p-1 muted"
                aria-label="Cerrar"
                onClick={() => setMenuOpen(false)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                const fullLabel =
                  label === "Movim." ? "Movimientos" : label === "Presup." ? "Presupuestos" : label;
                return (
                  <button
                    key={href}
                    type="button"
                    onClick={() => go(href)}
                    className={clsx(
                      "relative flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium",
                      active
                        ? "bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] font-semibold text-accent ring-1 ring-accent/40"
                        : "muted hover:bg-[color-mix(in_oklab,var(--border)_35%,transparent)]",
                    )}
                  >
                    {active && (
                      <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                    <Icon size={16} strokeWidth={active ? 2.6 : 2} />
                    <span className="truncate">{fullLabel}</span>
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
