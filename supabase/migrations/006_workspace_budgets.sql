-- Presupuesto mensual por espacio (distinto de bolsillos por categoría)
create table if not exists public.workspace_budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  period_year integer not null,
  period_month integer not null check (period_month between 1 and 12),
  limit_amount numeric not null check (limit_amount >= 0),
  unique (workspace_id, period_year, period_month)
);

alter table public.workspace_budgets enable row level security;

drop policy if exists "workspace_budgets_member_select" on public.workspace_budgets;
create policy "workspace_budgets_member_select" on public.workspace_budgets
for select using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_budgets_member_insert" on public.workspace_budgets;
create policy "workspace_budgets_member_insert" on public.workspace_budgets
for insert with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_budgets_member_update" on public.workspace_budgets;
create policy "workspace_budgets_member_update" on public.workspace_budgets
for update using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_budgets_member_delete" on public.workspace_budgets;
create policy "workspace_budgets_member_delete" on public.workspace_budgets
for delete using (public.is_workspace_member(workspace_id));

-- Aporte al presupuesto del espacio (desde cuenta personal del miembro).
-- El check de type se actualiza en 007_space_contribution_type.sql.
