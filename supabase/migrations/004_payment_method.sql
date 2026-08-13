-- Método de pago opcional en movimientos
alter table public.transactions
  add column if not exists payment_method text;
