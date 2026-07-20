-- ============================================================
-- Golf Boetietjies — load the real Zebula Golf Estate scorecard
-- (Elephant championship tees), applied to both Round 1 and
-- Round 2 since it's the same course both days. Includes hole
-- distances in metres for the Course tab.
--
-- Paste into the Supabase SQL Editor and run. Safe to re-run —
-- adds the metres column if it isn't there yet, then upserts by
-- (round, hole), overwriting any existing values in place.
-- ============================================================

alter table course_holes add column if not exists metres smallint check (metres between 50 and 700);

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
