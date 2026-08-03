-- ============================================================
-- Golf Boetietjies — correct the Zebula stroke index.
-- The stroke index loaded by update_course_zebula.sql was wrong on
-- 10 of the 18 holes (par and metres were already correct). This
-- replaces course_holes with the real Elephant-tees scorecard for
-- both Round 1 and Round 2, since it's the same course both days.
--
-- Paste into the Supabase SQL Editor and run. Safe to re-run —
-- upserts by (round, hole), overwriting any existing values in place.
-- ============================================================

insert into course_holes (round, hole, par, stroke_index, metres)
select r.round, h.hole, h.par, h.stroke_index, h.metres
from (values (1), (2)) as r(round)
cross join (values
  (1, 4, 5, 369), (2, 5, 13, 473), (3, 4, 17, 302), (4, 3, 11, 197), (5, 4, 1, 429),
  (6, 5, 7, 545), (7, 4, 3, 390), (8, 3, 15, 125), (9, 4, 9, 338), (10, 4, 12, 364),
  (11, 4, 4, 379), (12, 4, 18, 298), (13, 3, 16, 155), (14, 4, 6, 355), (15, 5, 14, 457),
  (16, 4, 2, 385), (17, 3, 10, 200), (18, 5, 8, 482)
) as h(hole, par, stroke_index, metres)
on conflict (round, hole) do update
  set par = excluded.par,
      stroke_index = excluded.stroke_index,
      metres = excluded.metres;
