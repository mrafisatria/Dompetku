-- Schema Dompetku dengan pengguna dan sesi milik aplikasi sendiri.
-- Secret akun tidak disimpan di repository; buat hash melalui administrasi database.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 40),
  secret_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_sessions (
  token_hash text primary key check (char_length(token_hash) = 64),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index if not exists app_sessions_user_expires_idx
  on public.app_sessions (app_user_id, expires_at desc);

create index if not exists app_sessions_expires_idx
  on public.app_sessions (expires_at);

create table if not exists public.app_login_attempts (
  fingerprint text primary key check (char_length(fingerprint) = 64),
  attempts integer not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  app_user_id uuid references public.app_users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  category text not null check (char_length(category) between 1 and 50),
  amount numeric(14, 2) not null check (amount > 0),
  transaction_date date not null default current_date,
  note text check (note is null or char_length(note) <= 240),
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists app_user_id uuid;

alter table public.transactions
  alter column user_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'transactions_app_user_id_fkey'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint transactions_app_user_id_fkey
      foreign key (app_user_id)
      references public.app_users(id)
      on delete cascade;
  end if;
end
$$;

create index if not exists transactions_app_user_date_idx
  on public.transactions (app_user_id, transaction_date desc, created_at desc);

alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.app_login_attempts enable row level security;
alter table public.transactions enable row level security;

revoke all on table public.app_users from anon, authenticated;
revoke all on table public.app_sessions from anon, authenticated;
revoke all on table public.app_login_attempts from anon, authenticated;
revoke all on table public.transactions from anon, authenticated;

grant select, insert, update, delete on table public.app_users to service_role;
grant select, insert, update, delete on table public.app_sessions to service_role;
grant select, insert, update, delete on table public.app_login_attempts to service_role;
grant select, insert, update, delete on table public.transactions to service_role;

drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "Users can create own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;

create or replace function public.verify_app_user(candidate_secret text)
returns table(app_user_id uuid, account_name text)
language sql
security invoker
set search_path = ''
as $$
  select users.id, users.name
  from public.app_users as users
  where users.active
    and users.secret_hash = extensions.crypt(candidate_secret, users.secret_hash)
  limit 1
$$;

revoke all on function public.verify_app_user(text) from public, anon, authenticated;
grant execute on function public.verify_app_user(text) to service_role;

-- Akun dipasang langsung pada proyek tujuan dengan nilai secret yang langsung
-- di-hash menggunakan extensions.crypt(..., extensions.gen_salt('bf', 12)).
