-- ============================================================
-- Golf Boetietjies — pre-release data reset (run ONCE, manually,
-- before tonight's real round)
--
-- Paste this whole file into the Supabase SQL Editor and run it.
--
-- Touches ONLY:
--   - DELETE all rows: scores, fines, wheel_spins, claims, pairings,
--     scorer_locks
--   - UPDATE app_settings: ryder_cup_enabled -> false
--   - UPDATE players: team_id -> null, is_captain -> false
--
-- Does NOT touch:
--   - players.name / players.photo_url / players.handicap / players.tagline
--   - course_holes (Zebula scorecard data)
--   - teams (Red/Blue names + colours stay defined, just unassigned
--     from every player)
--   - any other table (e.g. feed_events, which this script does not
--     reference at all)
-- ============================================================

begin;

delete from scores;
delete from fines;
delete from wheel_spins;
delete from claims;
delete from pairings;
delete from scorer_locks;

update app_settings
  set ryder_cup_enabled = false, updated_at = now()
  where id = 1;

update players
  set team_id = null, is_captain = false;

commit;
