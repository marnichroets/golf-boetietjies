// ============================================================
// Golf Boetietjies — live commentary bank.
//
// Edit freely: add, remove, or rewrite any line. `{name}` is
// swapped for the player's name at render time. One line is
// picked at random per event — keep them short, punchy, and
// repeatable so nobody's sick of them by hole 14.
//
// Keys here must match the `type` values used in the
// `feed_events` Supabase table (see supabase/feed_events.sql).
// ============================================================

export const COMMENTARY = {
  eagle: [
    '{name} just did something that should be illegal.',
    'Eagle for {name}. Somebody check the scorecard for cheating.',
    '{name} is playing a different game to the rest of us.',
    'That eagle from {name} just made the bar tab more expensive.',
    '{name} found the pin like it owed him money.',
    'Eagle! {name} is peaking at exactly the wrong time for everyone else.',
    '{name} just turned a hole into a highlight reel.',
    'Somebody get {name} a caddie bib — that was a proper eagle.',
    '{name} with the eagle. The rest of the fourball is quietly seething.',
    'That eagle from {name} gets mentioned at every braai until December.',
    '{name} just posted a number normal golfers only dream about.',
    'Eagle for {name} — practice round who?',
    '{name} is not here to make friends, apparently.',
    "That's an eagle. {name} owes the group nothing, the group owes {name} a beer.",
    '{name} just skipped a few steps on the way to the green.',
  ],

  birdie: [
    '{name} found a birdie. Expect to hear about it all weekend.',
    'Birdie for {name}. Modest as always.',
    '{name} is one under and fully insufferable about it already.',
    'That birdie for {name} is already in the group chat.',
    '{name} just went one better than the rest of us.',
    "Birdie! {name}'s handicap is shaking.",
    '{name} rolled one in. The confidence is now unmanageable.',
    'That putt dropped for {name} and so did everyone else\'s shoulders.',
    'Birdie for {name} — the trash talk starts now.',
    '{name} is under par and will not let anyone forget it.',
    "Nice birdie, {name}. Don't get used to it.",
    '{name} just banked a birdie and a story for later.',
    'Birdie! {name} is technically good at golf now.',
    '{name} rolled that one in like he\'s done it before.',
    'One under for {name}. The group already knows.',
  ],

  blowup: [
    '{name} has discovered a new part of the course.',
    'Somewhere out there, {name} is still looking for that ball.',
    'That hole got the better of {name}. By quite a lot.',
    '{name} just wrote a chapter nobody asked for.',
    'Rough day at the office for {name} on that one.',
    '{name} took the scenic route on that hole.',
    "That's a big number for {name}. The trees won that round.",
    '{name} is recalculating his handicap as we speak.',
    'Somebody check on {name} — that hole did some damage.',
    '{name} just gave the group something to talk about at dinner.',
    'That hole chewed {name} up and spat him out.',
    '{name} is having a moment. Not a good one.',
    'Bad hole for {name} — the golf gods were not listening.',
    '{name} just added a few strokes to the legend of this trip.',
    "That's a card-wrecker for {name}. Onwards.",
  ],

  longest_drive: [
    '{name} has claimed longest drive. Someone go measure it properly.',
    "{name} says that was the longest drive. We'll allow it, for now.",
    "Longest drive to {name} — until somebody proves otherwise.",
    '{name} is claiming bragging rights off the tee.',
    "That's longest drive for {name}. The tape measure is optional, apparently.",
    '{name} just staked a claim on the big one.',
    'Longest drive: {name}. Objections may be filed at the 19th hole.',
    '{name} hit one a long way and wants everyone to know.',
    'Claimed: longest drive, by {name}. Verification pending, as always.',
    '{name} is the self-appointed longest hitter of the day.',
    'Longest drive goes to {name} — for now, watch this space.',
    '{name} put one out there and immediately told everyone.',
    'That drive from {name} is officially on the board.',
    'Longest drive claimed by {name}. Bold move.',
    '{name} has entered the longest drive chat.',
  ],

  nearest_pin: [
    '{name} has claimed nearest the pin. Close enough, apparently.',
    'Nearest the pin: {name}. The rest of the group is unimpressed.',
    '{name} put one close and wants full credit.',
    "That's nearest the pin for {name} — for now.",
    '{name} is claiming the pin. Somebody bring a tape measure.',
    'Nearest pin claimed by {name}. Trust, but verify.',
    '{name} landed one close and made sure everyone saw.',
    "That's a good one from {name} — nearest the pin, self-certified.",
    '{name} has staked a claim on nearest the pin.',
    'Nearest the pin: {name}. Dispute at your own risk.',
    '{name} put it close. Very close, allegedly.',
    "That's nearest pin honours for {name}, until someone knocks it closer.",
    '{name} is claiming proximity bragging rights.',
    'Nearest the pin goes to {name} — the group has been notified.',
    '{name} landed one near the flag and immediately claimed it.',
  ],

  new_leader: [
    '{name} has taken the lead. Enjoy it while it lasts.',
    'New leader: {name}. Everyone else, time to panic quietly.',
    '{name} is top of the leaderboard. The pressure is officially on.',
    "{name} has taken over top spot. Don't get comfortable.",
    "There's a new number one, and it's {name}.",
    '{name} just took the lead — the group chat is about to get busy.',
    '{name} is out front. For how long is the real question.',
    'New leader alert: {name} is currently the one to beat.',
    '{name} has climbed to the top. Everyone else, chase mode.',
    '{name} takes the lead. Bragging rights are temporary, remember.',
    "There's movement at the top — {name} is your new leader.",
    '{name} is leading. The rest of the field is not thrilled.',
    '{name} has grabbed top spot. Book it, for now.',
    'New leader: {name}. May the best boetie win.',
    "{name} is officially the one everyone's chasing.",
  ],
}

// Picks one random line for the given event type and fills in the name.
// Returns null if the type isn't recognised (fails safe — no crash, no post).
export function pickCommentary(type, name) {
  const bank = COMMENTARY[type]
  if (!bank || bank.length === 0) return null
  const line = bank[Math.floor(Math.random() * bank.length)]
  return line.replaceAll('{name}', name)
}
