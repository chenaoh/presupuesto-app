-- Apariencia por espacio: imagen y color de acento
alter table public.workspaces
  add column if not exists avatar_url text;

alter table public.workspaces
  add column if not exists accent_color text;
