"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { useApp } from "@/lib/store";

export default function LoginPage() {
  const { login, user, ready } = useApp();
  const router = useRouter();
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
      const err = await login(email, password);
      if (err) setError(err);
      else router.replace("/dashboard");
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
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
        <h1 className="mt-2 text-2xl">Inicia sesión</h1>
        <p className="muted mt-1 text-sm">
          Controla lo personal y lo familiar sin mezclar privacidad.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Correo</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              autoComplete="email"
            />
          </div>
          <PasswordField
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            required
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="muted mt-5 text-sm">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-accent underline-offset-2 hover:underline">
            Crear cuenta
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
