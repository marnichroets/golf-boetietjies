-- ============================================================
-- Golf Boetietjies — allow blank / picked-up holes
-- Paste into the Supabase SQL Editor and run. Safe to re-run.
--
-- strokes = 0 is now a valid, deliberate value meaning "picked up /
-- no score" for that hole (previously only 1-15 was allowed, so a
-- picked-up hole had no way to be recorded as distinct from "not
-- played yet"). Also teaches feed_events about the new 'pickup'
-- commentary type used when a player picks up.
-- ============================================================

alter table scores drop constraint if exists scores_strokes_check;
alter table scores add constraint scores_strokes_check check (strokes between 0 and 15);

alter table feed_events drop constraint if exists feed_events_type_check;
alter table feed_events add constraint feed_events_type_check check (
  type in ('eagle', 'birdie', 'blowup', 'pickup', 'longest_drive', 'nearest_pin', 'new_leader')
);
