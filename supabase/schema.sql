-- Jalankan sekali di SQL Editor proyek Supabase tujuan.
-- Tabel ini memakai RLS: pengguna hanya dapat mengakses transaksinya sendiri.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  category text not null check (char_length(category) between 1 and 50),
  amount numeric(14, 2) not null check (amount > 0),
  transaction_date date not null default current_date,
  note text check (note is null or char_length(note) <= 240),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);

alter table public.transactions enable row level security;

revoke all on table public.transactions from anon, authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;

drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions"
  on public.transactions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own transactions" on public.transactions;
create policy "Users can create own transactions"
  on public.transactions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions"
  on public.transactions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions"
  on public.transactions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Aktifkan sinkronisasi perubahan lintas perangkat melalui Supabase Realtime.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table public.transactions;
  end if;
end
$$;
