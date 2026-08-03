-- ============================================================
-- Golf Boetietjies — Fines log + Spin the Wheel
-- Paste into the Supabase SQL Editor and run. Safe to re-run.
-- ============================================================

-- ---------- fines (a reason logged against a player, no rand amount) ----------
create table if not exists fines (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists fines_created_at_idx on fines (created_at desc);

-- ---------- wheel_spins (club a player was forced to hit next, per spin) ----------
create table if not exists wheel_spins (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  club text not null,
  created_at timestamptz not null default now()
);

create index if not exists wheel_spins_created_at_idx on wheel_spins (created_at desc);

-- ============================================================
-- Row Level Security — same public read/write as every other table
-- ============================================================

alter table fines enable row level security;
drop policy if exists "public full access" on fines;
create policy "public full access" on fines for all using (true) with check (true);

alter table wheel_spins enable row level security;
drop policy if exists "public full access" on wheel_spins;
create policy "public full access" on wheel_spins for all using (true) with check (true);

-- ============================================================
-- Realtime — broadcast new rows to every subscriber
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fines'
  ) then
    alter publication supabase_realtime add table fines;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'wheel_spins'
  ) then
    alter publication supabase_realtime add table wheel_spins;
  end if;
end $$;
