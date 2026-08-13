-- Presupuesto App — schema inicial para Supabase
-- Ejecutar en SQL Editor del proyecto Supabase (Free tier)

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  theme text not null default 'system' check (theme in ('system','light','dark','custom')),
  accent_color text not null default '#0F766E',
  locale text not null default 'es-CO',
  currency text not null default 'COP',
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('personal','shared')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  used_by uuid references public.profiles(id),
  used_at timestamptz
);

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  is_system boolean not null default false
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  institution_id uuid not null references public.institutions(id) on delete restrict,
  account_type text not null,
  initial_balance numeric not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income','expense')),
  is_system boolean not null default false,
  icon text not null default 'Tag',
  color text not null default '#64748B',
  is_archived boolean not null default false
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  period_year int not null,
  period_month int not null check (period_month between 1 and 12),
  limit_amount numeric not null check (limit_amount > 0),
  unique (workspace_id, category_id, period_year, period_month)
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  principal numeric not null,
  remaining numeric not null,
  due_date date,
  account_id uuid references public.accounts(id),
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  target_date date,
  preferred_account_id uuid references public.accounts(id),
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null check (type in ('income','expense','transfer','debt_payment','savings_contribution','savings_withdrawal')),
  amount numeric not null check (amount > 0),
  date date not null,
  note text not null default '',
  category_id uuid references public.categories(id),
  account_id uuid references public.accounts(id),
  to_account_id uuid references public.accounts(id),
  debt_id uuid references public.debts(id),
  savings_goal_id uuid references public.savings_goals(id),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws_id and m.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.institutions enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.debts enable row level security;
alter table public.savings_goals enable row level security;
alter table public.transactions enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());

create policy "workspaces_member_select" on public.workspaces for select using (public.is_workspace_member(id));
create policy "workspaces_owner_insert" on public.workspaces for insert with check (created_by = auth.uid());

create policy "members_select" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "members_insert" on public.workspace_members for insert with check (
  user_id = auth.uid() or public.is_workspace_member(workspace_id)
);

create policy "invites_member" on public.workspace_invites for all using (public.is_workspace_member(workspace_id));

create policy "institutions_member" on public.institutions for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "accounts_member" on public.accounts for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "categories_member" on public.categories for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "budgets_member" on public.budgets for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "debts_member" on public.debts for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "goals_member" on public.savings_goals for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "transactions_member" on public.transactions for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
