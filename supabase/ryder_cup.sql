-- ============================================================
-- Golf Boetietjies — optional Ryder Cup / team-match layer
-- Paste into the Supabase SQL Editor and run. Safe to re-run.
--
-- Adds: a shared on/off toggle (app_settings), two teams with a
-- name+colour (teams), a team_id/is_captain pair on players, and a
-- pairings table holding the 4 matches (3 fourball + 1 singles) per
-- round. Match-play status itself is computed client-side from the
-- existing scores table — no schema needed for that.
-- ============================================================

-- ---------- app_settings (singleton row, shared feature toggle) ----------
create table if not exists app_settings (
  id integer primary key default 1,
  ryder_cup_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into app_settings (id, ryder_cup_enabled)
values (1, false)
on conflict (id) do nothing;

-- ---------- teams ----------
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  created_at timestamptz not null default now()
);

-- Seed exactly two teams the first time this runs, defaulting to the
-- existing forest-green / brass-gold theme colours. Re-running this
-- script won't add more once any teams row exists.
insert into teams (name, color)
select v.name, v.color
from (values ('Forest', '#1f5c40'), ('Brass', '#ab7c1e')) as v(name, color)
where not exists (select 1 from teams);

-- ---------- players: team assignment + captain flag ----------
alter table players add column if not exists team_id uuid references teams(id) on delete set null;
alter table players add column if not exists is_captain boolean not null default false;

-- ---------- pairings (4 matches per round: 3 fourball + 1 singles) ----------
create table if not exists pairings (
  id uuid primary key default gen_random_uuid(),
  round smallint not null check (round in (1, 2)),
  match_number smallint not null check (match_number between 1 and 4),
  format text not null check (format in ('fourball', 'singles')),
  side_a uuid[] not null default '{}',
  side_b uuid[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (round, match_number)
);

-- ============================================================
-- Row Level Security — same "public full access" policy as every
-- other table in this app (no auth/login).
-- ============================================================

alter table app_settings enable row level security;
alter table teams enable row level security;
alter table pairings enable row level security;

drop policy if exists "public full access" on app_settings;
create policy "public full access" on app_settings for all using (true) with check (true);

drop policy if exists "public full access" on teams;
create policy "public full access" on teams for all using (true) with check (true);

drop policy if exists "public full access" on pairings;
create policy "public full access" on pairings for all using (true) with check (true);

-- ============================================================
-- Realtime — so the toggle, team edits, and pairings sync live to
-- every phone the moment they change.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_settings'
  ) then
    alter publication supabase_realtime add table app_settings;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams'
  ) then
    alter publication supabase_realtime add table teams;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pairings'
  ) then
    alter publication supabase_realtime add table pairings;
  end if;
end $$;
