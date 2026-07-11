-- CHEREPOVETS Moderation — полная схема БД
create extension if not exists pgcrypto;

-- ПРОФИЛИ
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  role text not null default 'Младший модератор',
  vk_id text,
  stage_since date default now(),
  created_at timestamptz default now()
);

-- ОТЧЁТЫ
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  author_nick text,
  work text not null,
  type text not null default 'Норма',
  status text not null default 'На проверке',
  xp int not null default 0,
  proofs jsonb default '[]'::jsonb,
  ai_verdict text,
  created_at timestamptz default now(),
  reviewed_by uuid,
  reviewed_at timestamptz
);

-- НЕАКТИВЫ
create table if not exists public.inactives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nick text,
  from_date date not null,
  to_date date not null,
  reason text,
  status text not null default 'На рассмотрении',
  created_at timestamptz default now()
);

-- НАСТРОЙКИ (API-ключи и пр.) — только сервер
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- АУДИТ
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text,
  detail text,
  created_at timestamptz default now()
);

-- Автосоздание профиля при регистрации
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nickname)
  values (new.id, new.email, split_part(coalesce(new.email, ''), '@', 1))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.inactives enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "reports insert own" on public.reports;
create policy "reports insert own" on public.reports for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "reports read own" on public.reports;
create policy "reports read own" on public.reports for select to authenticated using (auth.uid() = user_id);

drop policy if exists "inactives insert own" on public.inactives;
create policy "inactives insert own" on public.inactives for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "inactives read own" on public.inactives;
create policy "inactives read own" on public.inactives for select to authenticated using (auth.uid() = user_id);

-- app_settings и audit_log: без политик => доступ только через service role (сервер)
