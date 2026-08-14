-- Permitir aportes al presupuesto de un espacio compartido
alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (
    type in (
      'income',
      'expense',
      'transfer',
      'debt_payment',
      'savings_contribution',
      'savings_withdrawal',
      'space_contribution'
    )
  );
