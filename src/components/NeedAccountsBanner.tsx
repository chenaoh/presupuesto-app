"use client";

import Link from "next/link";

type Props = {
  message?: string;
};

export function NeedAccountsBanner({
  message = "Primero crea al menos una cuenta para poder continuar.",
}: Props) {
  return (
    <div className="rounded-md border border-border bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-3 py-2 text-sm">
      <p>{message}</p>
      <Link href="/accounts" className="mt-1 inline-block text-sm font-semibold text-accent">
        Ir a Cuentas →
      </Link>
    </div>
  );
}
