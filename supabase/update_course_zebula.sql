-- ============================================================
-- Golf Boetietjies — load the real Zebula Golf Estate scorecard
-- (Elephant championship tees), applied to both Round 1 and
-- Round 2 since it's the same course both days.
--
-- Paste into the Supabase SQL Editor and run. Safe to re-run —
-- upserts by (round, hole), so it overwrites the existing
-- placeholder par-72 values in place.
-- ============================================================

insert into course_holes (round, hole, par, stroke_index)
select r.round, h.hole, h.par, h.stroke_index
from (values (1), (2)) as r(round)
cross join (values
  (1, 4, 5), (2, 5, 13), (3, 4, 15), (4, 3, 11), (5, 4, 1),
  (6, 5, 9), (7, 4, 3), (8, 3, 17), (9, 4, 7), (10, 4, 12),
  (11, 4, 6), (12, 4, 14), (13, 3, 18), (14, 4, 2), (15, 5, 16),
  (16, 4, 4), (17, 3, 10), (18, 5, 8)
) as h(hole, par, stroke_index)
on conflict (round, hole) do update
  set par = excluded.par,
      stroke_index = excluded.stroke_index;
