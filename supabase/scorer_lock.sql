-- ============================================================
-- Golf Boetietjies — scorer lock (one designated scorer per fourball)
-- Paste into the Supabase SQL Editor and run. Safe to re-run.
--
-- A fourball is identified by the sorted, comma-joined ids of its 4 (or
-- fewer) players — group_key — so any device that independently picks
-- the same set of players lands on the same lock row. Once a scorer is
-- chosen for a (round, group_key), only that player's device can write
-- scores for that group in that round; everyone else sees live scores
-- read-only. Not real auth — a courtesy lock to stop casual score-
-- fiddling among mates, changeable by anyone in a couple of taps.
-- ============================================================

create table if not exists scorer_locks (
  id uuid primary key default gen_random_uuid(),
  round smallint not null check (round in (1, 2)),
  group_key text not null,
  scorer_player_id uuid not null references players(id) on delete cascade,
  updated_at timestamptz not null default now(),
  unique (round, group_key)
);

alter table scorer_locks enable row level security;

drop policy if exists "public full access" on scorer_locks;
create policy "public full access" on scorer_locks for all using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'scorer_locks'
  ) then
    alter publication supabase_realtime add table scorer_locks;
  end if;
end $$;
