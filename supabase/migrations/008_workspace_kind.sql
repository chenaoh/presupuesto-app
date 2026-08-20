-- Tipo/etiqueta libre del espacio (Hogar, Trabajo, etc.)
alter table public.workspaces
  add column if not exists space_kind text;
