# Presupuesto App

App web + PWA para controlar ingresos, gastos, cuentas, presupuestos, deudas y metas de ahorro, con espacios **personal** y **familiar**.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Supabase (Auth + Postgres) para multi-dispositivo e invitaciones
- Fallback local (`localStorage`) si no hay variables de Supabase
- Recharts, next-themes, PWA

## Arranque rápido (solo local)

```bash
npm install
npm run dev
```

Sin Supabase, los datos viven en el navegador. Un código de invitación **no** sirve en otro celular/PC.

## Multi-dispositivo (recomendado para producción)

Para que una persona se una a tu espacio familiar desde la app desplegada:

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el SQL Editor, ejecuta en orden:
   - [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)
   - [`supabase/migrations/002_invites_and_auth.sql`](supabase/migrations/002_invites_and_auth.sql)
   - [`supabase/migrations/003_avatar.sql`](supabase/migrations/003_avatar.sql)
3. En **Authentication → Providers → Email**, para pruebas rápidas puedes desactivar **Confirm email**.
4. Copia URL y anon key a `.env.local` (ver `.env.example`).
5. En Vercel → Project → Settings → Environment Variables, agrega las mismas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Redeploy.

### Flujo familiar

1. Usuario A se registra en la URL de Vercel e inicia sesión.
2. Crea un espacio familiar y genera un código (válido 7 días, un solo uso).
3. Usuario B se registra/entra en la **misma URL**, pega el código y se une.
4. Ambos ven categorías y movimientos del espacio compartido (guardados en Supabase).

## Funcionalidades

- Login / registro (Supabase Auth cuando hay nube)
- Espacio personal + familiar compartido (invitaciones por código)
- Categorías, cuentas, movimientos, presupuestos, deudas y metas
- Dashboard con gráficos
- Temas + color de acento
- PWA instalable
- Exportar gastos a CSV
