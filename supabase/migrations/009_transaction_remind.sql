-- Recordatorio opcional en movimientos recurrentes
alter table public.transactions
  add column if not exists remind boolean not null default false;
