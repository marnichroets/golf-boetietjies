-- ============================================================
-- Golf Boetietjies — fines "logged by" tracking + claims photo/unclaim
-- Paste into the Supabase SQL Editor and run. Safe to re-run.
-- ============================================================

-- ---------- fines: track which device/player logged it ----------
-- Powers the courtesy delete gate — only the player who was active on the
-- device that logged a fine can delete it (same non-auth, trust-based
-- pattern as the scorer lock).
alter table fines add column if not exists logged_by_player_id uuid references players(id) on delete set null;

-- ---------- claims: optional photo proof ----------
alter table claims add column if not exists photo_url text;

-- ---------- claims: full row on DELETE realtime payloads ----------
-- Unclaiming deletes the claims row outright. By default Postgres only
-- replicates the primary key on DELETE, so other clients' realtime
-- subscriptions would get an old row missing category/round and couldn't
-- tell which claim to clear locally. Same fix as allow_clear_scores.sql.
alter table claims replica identity full;

-- ============================================================
-- Storage — public bucket for claim (longest drive / nearest pin) photos
-- ============================================================

insert into storage.buckets (id, name, public)
values ('claim-photos', 'claim-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read claim photos" on storage.objects;
create policy "public read claim photos" on storage.objects
  for select using (bucket_id = 'claim-photos');

drop policy if exists "public upload claim photos" on storage.objects;
create policy "public upload claim photos" on storage.objects
  for insert with check (bucket_id = 'claim-photos');

drop policy if exists "public update claim photos" on storage.objects;
create policy "public update claim photos" on storage.objects
  for update using (bucket_id = 'claim-photos') with check (bucket_id = 'claim-photos');

drop policy if exists "public delete claim photos" on storage.objects;
create policy "public delete claim photos" on storage.objects
  for delete using (bucket_id = 'claim-photos');
