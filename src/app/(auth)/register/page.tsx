"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { useApp } from "@/lib/store";

export default function RegisterPage() {
  const { register, user, ready } = useApp();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const err = await register({ email, password, displayName });
      if (err) setError(err);
      else router.replace("/dashboard");
    } catch {
      setError("No se pudo crear la cuenta. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="card rise w-full max-w-md p-6 md:p-8">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 rounded-xl object-cover"
            priority
          />
          <p className="brand text-3xl text-accent">Presupuesto</p>
        </div>
        <h1 className="mt-2 text-2xl">Crea tu cuenta</h1>
        <p className="muted mt-1 text-sm">
          Se crea automáticamente tu espacio personal privado.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Correo</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <PasswordField
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Creando…" : "Crear cuenta"}
          </button>
        </form>
        <p className="muted mt-5 text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-accent underline-offset-2 hover:underline">
            Iniciar sesión
          </Link>
        </p>
        <p className="muted mt-3 text-sm">
          <Link href="/" className="underline-offset-2 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
