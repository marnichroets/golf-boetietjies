-- ============================================================
-- Golf Boetietjies — live commentary feed
-- Paste into the Supabase SQL Editor and run. Safe to re-run.
-- ============================================================

create table if not exists feed_events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (
    type in ('eagle', 'birdie', 'blowup', 'pickup', 'longest_drive', 'nearest_pin', 'new_leader')
  ),
  player_id uuid references players(id) on delete cascade,
  message text not null,
  round smallint check (round in (1, 2)),
  hole smallint check (hole between 1 and 18),
  strokes smallint,
  par smallint,
  created_at timestamptz not null default now()
);

create index if not exists feed_events_created_at_idx on feed_events (created_at desc);

-- ---------- Row Level Security — same public read/write as every other table ----------

alter table feed_events enable row level security;

drop policy if exists "public full access" on feed_events;
create policy "public full access" on feed_events for all using (true) with check (true);

-- ---------- Realtime — broadcast new commentary to every subscriber ----------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'feed_events'
  ) then
    alter publication supabase_realtime add table feed_events;
  end if;
end $$;
