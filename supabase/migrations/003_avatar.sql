-- Foto de perfil (data URL o URL externa)
alter table public.profiles
  add column if not exists avatar_url text;
