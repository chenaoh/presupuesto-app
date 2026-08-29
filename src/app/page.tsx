"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InstallPwaButton } from "@/components/InstallPwaButton";
import { SplashScreen } from "@/components/SplashScreen";
import { useApp } from "@/lib/store";

export default function HomePage() {
  const { ready, user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (user) router.replace("/dashboard");
  }, [ready, user, router]);

  if (!ready) {
    return <SplashScreen />;
  }

  if (user) {
    return <SplashScreen label="Entrando…" />;
  }

  return (
    <div className="landing">
      <div className="landing-glow" aria-hidden />
      <div className="landing-orb landing-orb-a" aria-hidden />
      <div className="landing-orb landing-orb-b" aria-hidden />

      <header className="landing-top">
        <div className="landing-brand-row">
          <Image
            src="/brand/logo.png"
            alt="Presupuesto"
            width={40}
            height={40}
            className="landing-logo-mark rounded-xl object-contain"
            priority
          />
          <p className="brand landing-brand">Presupuesto</p>
        </div>
        <Link href="/login" className="btn btn-ghost text-sm">
          Entrar
        </Link>
      </header>

      <main className="landing-hero">
        <div className="landing-visual rise">
          <Image
            src="/brand/logo.png"
            alt=""
            width={280}
            height={280}
            className="landing-logo-hero"
            priority
          />
        </div>

        <div className="landing-copy">
          <p className="landing-kicker rise" style={{ animationDelay: "60ms" }}>
            Finanzas claras
          </p>
          <h1 className="landing-title rise" style={{ animationDelay: "120ms" }}>
            Presupuesto
          </h1>
          <p className="landing-lead rise" style={{ animationDelay: "180ms" }}>
            Ingresos, gastos, cuentas y metas — tuyos o compartidos en familia.
          </p>

          <div className="landing-cta rise" style={{ animationDelay: "260ms" }}>
            <Link href="/register" className="btn btn-primary">
              Empezar gratis
            </Link>
            <InstallPwaButton variant="ghost" />
          </div>
        </div>
      </main>

      <footer className="landing-foot muted text-xs">
        Instálala en tu celular · Lista para usar offline
      </footer>
    </div>
  );
}
