-- ============================================================
-- Golf Boetietjies — enable realtime DELETE payloads for scores
-- Paste into the Supabase SQL Editor and run. Safe to re-run.
--
-- Clearing a scorecard cell back to genuinely "unentered" deletes its row
-- outright (there's no null/undefined value the strokes column can store).
-- By default Postgres only replicates the primary key on DELETE, so other
-- clients' realtime subscriptions would get an old row missing
-- player_id/round/hole and couldn't tell which cell to clear locally.
-- REPLICA IDENTITY FULL makes Postgres send the whole old row instead.
-- ============================================================

alter table scores replica identity full;
