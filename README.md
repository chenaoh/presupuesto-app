# Presupuesto App

App web + PWA para controlar ingresos, gastos, cuentas, presupuestos, deudas y metas de ahorro, con espacios **personal** y **familiar**.

Proyecto independiente de `codejavu-studio`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Estado local persistente (`localStorage`) listo para usar sin backend
- Migración SQL lista para Supabase (nube + multi-dispositivo)
- Recharts, next-themes, PWA

## Arranque rápido

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal al iniciar.

Los datos se guardan en el navegador. En **Movimientos** puedes asignar un ingreso/gasto a tu espacio personal o a un familiar sin cambiar de vista.

## Funcionalidades

- Login / registro
- Espacio personal + familiar compartido (invitaciones)
- Categorías base + propias
- Cuentas con institución y tipo (ahorros, fiduciaria, billetera, etc.)
- Movimientos: ingreso, gasto, transferencia, pago de deuda, aporte/retiro ahorro
- Presupuestos mensuales por categoría
- Deudas y metas de ahorro
- Dashboard con gráficos
- Temas claro / oscuro / sistema + color de acento
- PWA instalable

## Supabase (opcional, para nube)

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ejecuta [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) en el SQL Editor.
3. Configura `.env.local` desde `.env.example`.
4. Despliega el front en Vercel.

La UI actual usa almacenamiento local. La migración SQL ya modela workspaces, RLS, cuentas, deudas y ahorros para cuando conectes Supabase Auth/DB.

## Deploy front

- Vercel: importa el repo y despliega.
- Sin variables de entorno obligatorias mientras uses el modo local.
