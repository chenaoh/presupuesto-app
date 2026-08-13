-- Fix invitaciones cross-device + trigger de perfil + recurring en transactions
-- Ejecutar en SQL Editor de Supabase después de 001_initial.sql

-- Perfiles de compañeros del mismo workspace
drop policy if exists "profiles_select_coworkers" on public.profiles;
create policy "profiles_select_coworkers" on public.profiles
for select using (
  id = auth.uid()
  or exists (
    select 1
    from public.workspace_members me
    join public.workspace_members other on other.workspace_id = me.workspace_id
    where me.user_id = auth.uid()
      and other.user_id = profiles.id
  )
);

-- Invites: policies separadas (el "for all" impedía aceptar por código)
drop policy if exists "invites_member" on public.workspace_invites;

create policy "invites_select_member" on public.workspace_invites
for select using (public.is_workspace_member(workspace_id));

create policy "invites_insert_member" on public.workspace_invites
for insert with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
);

create policy "invites_update_member" on public.workspace_invites
for update using (public.is_workspace_member(workspace_id));

-- Aceptar invitación sin ser miembro aún (security definer)
create or replace function public.accept_workspace_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.workspace_invites%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into inv
  from public.workspace_invites
  where upper(code) = upper(trim(p_code))
    and used_by is null
  for update;

  if not found then
    raise exception 'invalid_code';
  end if;

  if inv.expires_at < now() then
    raise exception 'expired_code';
  end if;

  if exists (
    select 1 from public.workspace_members m
    where m.workspace_id = inv.workspace_id and m.user_id = uid
  ) then
    raise exception 'already_member';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, uid, 'member');

  update public.workspace_invites
  set used_by = uid, used_at = now()
  where id = inv.id;

  return inv.workspace_id;
end;
$$;

grant execute on function public.accept_workspace_invite(text) to authenticated;

-- Crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Usuario')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recurrente en movimientos
alter table public.transactions
  add column if not exists recurring boolean not null default false;

-- Workspaces: permitir update/delete al owner
drop policy if exists "workspaces_owner_update" on public.workspaces;
create policy "workspaces_owner_update" on public.workspaces
for update using (created_by = auth.uid());

drop policy if exists "workspaces_owner_delete" on public.workspaces;
create policy "workspaces_owner_delete" on public.workspaces
for delete using (created_by = auth.uid() and type = 'shared');
