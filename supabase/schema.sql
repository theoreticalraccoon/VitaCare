-- VitaCare database schema for Supabase.
-- Run this in your project's SQL editor (Dashboard → SQL → New query).
-- It is safe to re-run: objects are created with "if not exists" / "or replace".

-- ───────────────────────────── profiles ─────────────────────────────
-- One row per auth user. Holds display name, reminder prefs, caregivers.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text not null default '',
  has_onboarded boolean not null default false,
  notify_push boolean not null default true,
  notify_email boolean not null default false,
  notify_alarm boolean not null default false,
  primary_name text not null default '',
  primary_email text not null default '',
  secondary_name text not null default '',
  secondary_email text not null default '',
  timezone text, -- IANA tz (e.g. "Asia/Colombo"); used to evaluate missed doses
  updated_at timestamptz not null default now()
);

-- Migrate existing databases (safe to re-run):
alter table public.profiles add column if not exists timezone text;

-- ──────────────────────────── medications ───────────────────────────
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  dosage text,
  time text not null,           -- "HH:MM" 24-hour
  color text not null default '#0E9F6E',
  created_at timestamptz not null default now()
);
create index if not exists medications_user_idx on public.medications (user_id);

-- ───────────────────────────── dose_logs ────────────────────────────
create table if not exists public.dose_logs (
  id text primary key,          -- `${medicationId}-${YYYY-MM-DD}`
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid,
  medication_name text not null,
  date date not null,
  scheduled_time text not null,
  status text not null,         -- taken | late | missed
  confirmed_at timestamptz,
  minutes_late int not null default 0,
  escalations text[] not null default '{}'
);
create index if not exists dose_logs_user_idx on public.dose_logs (user_id);

-- ───────────────────────── auto-create profile ──────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────── row level security ────────────────────────
alter table public.profiles enable row level security;
alter table public.medications enable row level security;
alter table public.dose_logs enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own medications" on public.medications;
create policy "own medications" on public.medications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own dose_logs" on public.dose_logs;
create policy "own dose_logs" on public.dose_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
