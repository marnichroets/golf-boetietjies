-- ============================================================
-- Golf Boetietjies — Supabase schema
-- Paste this whole file into the Supabase SQL Editor and run it.
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- players ----------
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  photo_url text,
  handicap smallint not null default 18 check (handicap between 0 and 54),
  tagline text,
  created_at timestamptz not null default now()
);

-- ---------- course holes (par + stroke index + distance, per round) ----------
create table if not exists course_holes (
  id uuid primary key default gen_random_uuid(),
  round smallint not null check (round in (1, 2)),
  hole smallint not null check (hole between 1 and 18),
  par smallint not null check (par between 3 and 5),
  stroke_index smallint not null check (stroke_index between 1 and 18),
  metres smallint check (metres between 50 and 700),
  unique (round, hole)
);

alter table course_holes add column if not exists metres smallint check (metres between 50 and 700);

-- ---------- scores (one row per player/round/hole) ----------
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  round smallint not null check (round in (1, 2)),
  hole smallint not null check (hole between 1 and 18),
  strokes smallint check (strokes between 1 and 15),
  updated_at timestamptz not null default now(),
  unique (player_id, round, hole)
);

-- ---------- claims (longest drive / nearest pin, per round) ----------
create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('longest_drive', 'nearest_pin')),
  round smallint not null check (round in (1, 2)),
  player_id uuid references players(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (category, round)
);

-- ============================================================
-- Row Level Security — no auth/login, so anon key gets full
-- public read + write access on every table.
-- ============================================================

alter table players enable row level security;
alter table course_holes enable row level security;
alter table scores enable row level security;
alter table claims enable row level security;

drop policy if exists "public full access" on players;
create policy "public full access" on players for all using (true) with check (true);

drop policy if exists "public full access" on course_holes;
create policy "public full access" on course_holes for all using (true) with check (true);

drop policy if exists "public full access" on scores;
create policy "public full access" on scores for all using (true) with check (true);

drop policy if exists "public full access" on claims;
create policy "public full access" on claims for all using (true) with check (true);

-- ============================================================
-- Realtime — broadcast changes on these tables to subscribers
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'scores'
  ) then
    alter publication supabase_realtime add table scores;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'claims'
  ) then
    alter publication supabase_realtime add table claims;
  end if;
end $$;

-- ============================================================
-- Storage — public bucket for player profile photos
-- ============================================================

insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read player photos" on storage.objects;
create policy "public read player photos" on storage.objects
  for select using (bucket_id = 'player-photos');

drop policy if exists "public upload player photos" on storage.objects;
create policy "public upload player photos" on storage.objects
  for insert with check (bucket_id = 'player-photos');

drop policy if exists "public update player photos" on storage.objects;
create policy "public update player photos" on storage.objects
  for update using (bucket_id = 'player-photos') with check (bucket_id = 'player-photos');

drop policy if exists "public delete player photos" on storage.objects;
create policy "public delete player photos" on storage.objects
  for delete using (bucket_id = 'player-photos');

-- ============================================================
-- Seed: 14 players (edit the names/handicaps below before running,
-- or just rename them later from the Players screen in the app).
-- ============================================================

insert into players (name, handicap, tagline) values
  ('Player 1', 18, ''),
  ('Player 2', 18, ''),
  ('Player 3', 18, ''),
  ('Player 4', 18, ''),
  ('Player 5', 18, ''),
  ('Player 6', 18, ''),
  ('Player 7', 18, ''),
  ('Player 8', 18, ''),
  ('Player 9', 18, ''),
  ('Player 10', 18, ''),
  ('Player 11', 18, ''),
  ('Player 12', 18, ''),
  ('Player 13', 18, ''),
  ('Player 14', 18, '')
on conflict (name) do nothing;

-- ============================================================
-- Seed: Zebula Golf Estate scorecard (Elephant championship
-- tees), used for both rounds since it's the same course both
-- days. stroke_index is the hole's difficulty rank (1 = hardest,
-- 18 = easiest) used for handicap allocation. metres is the
-- hole's playing distance from the tee.
-- ============================================================

insert into course_holes (round, hole, par, stroke_index, metres)
select r.round, h.hole, h.par, h.stroke_index, h.metres
from (values (1), (2)) as r(round)
cross join (values
  (1, 4, 5, 369), (2, 5, 13, 473), (3, 4, 15, 302), (4, 3, 11, 197), (5, 4, 1, 429),
  (6, 5, 9, 545), (7, 4, 3, 390), (8, 3, 17, 125), (9, 4, 7, 338), (10, 4, 12, 364),
  (11, 4, 6, 379), (12, 4, 14, 298), (13, 3, 18, 155), (14, 4, 2, 355), (15, 5, 16, 457),
  (16, 4, 4, 385), (17, 3, 10, 200), (18, 5, 8, 482)
) as h(hole, par, stroke_index, metres)
on conflict (round, hole) do update
  set par = excluded.par,
      stroke_index = excluded.stroke_index,
      metres = excluded.metres;
