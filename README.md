# Golf Boetietjies 🏌️‍♂️

Live shared Stableford scoreboard for the boys' trip to Zebula. React + Vite, Supabase for realtime shared data, no login — pick your name and go.

## Local dev

```bash
npm install
npm run dev
```

Supabase keys live in `.env` (already filled in, gitignored). See `.env.example` for the shape.

## One-time Supabase setup

1. Open your Supabase project → **SQL Editor**.
2. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it.
   - This creates `players`, `course_holes`, `scores`, `claims`, sets RLS policies for public
     anon read/write (no auth), turns on Realtime for `players`/`scores`/`claims`, creates the
     `player-photos` storage bucket, and seeds 14 placeholder players + Zebula Golf Estate's real
     scorecard (Elephant championship tees), applied to both rounds.
3. Rename the 14 seeded players either by editing the `insert into players (...)` block before
   running the SQL, or afterwards from the **Players** tab in the app (tap the pencil on any card).
4. If a project already had the old placeholder or the pre-distances course loaded, run
   [`supabase/update_course_zebula.sql`](./supabase/update_course_zebula.sql) once — it adds the
   `metres` column if missing and overwrites `course_holes` with the real Zebula numbers.

## Features

- **Players** — 14 profiles: photo (upload, emoji fallback), handicap, trash-talk tagline.
- **Scorecard** — hole-by-hole entry for Round 1 & 2, Stableford points computed live, optimistic
  writes so it never blocks on patchy course wifi/data.
- **Course** — the Zebula scorecard itself: par, stroke index, and distance per hole, grouped
  front/back nine with OUT/IN/TOTAL sums.
- **Leaderboard** — Round 1 / Round 2 / Combined, ranked live by Stableford points.
- **Claims** — tap to claim Longest Drive / Nearest the Pin per round, live holder display.
- **Stats** — most pars, biggest blow-up hole, most consistent player, auto-generated banter.

## Deploying to Vercel

```bash
npm i -g vercel   # if you don't have it
vercel
```

Or connect the repo in the Vercel dashboard. Either way, set these two environment variables in
the Vercel project settings (Project → Settings → Environment Variables):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Framework preset: **Vite**. Build command `npm run build`, output directory `dist` (Vercel
detects this automatically).

## Notes

- No auth: the Supabase anon key has full public read/write on all tables by design — fine for a
  trusted group of 14 mates on a private link, not meant for anything beyond that.
- Realtime updates flow through a single Supabase Realtime channel subscribed to `players`,
  `scores`, and `claims` — see `src/context/GolfDataContext.jsx`.
