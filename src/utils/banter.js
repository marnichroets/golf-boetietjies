// Roast-y line banks for the Stats tab's Clubhouse Banter card — one bank
// per stat category, several alternatives each, so the trip doesn't read
// the exact same sentence every time the same guy tops a category.

function pick(lines) {
  return lines[Math.floor(Math.random() * lines.length)]
}

const MOST_PARS_LINES = [
  ({ name, count, parWord }) =>
    `${name} is out here collecting ${parWord} like it's a personality trait — ${count} so far, and still no personality to show for it.`,
  ({ name, count, parWord }) => `${name} has ${count} ${parWord} logged. Boring? Yes. Effective? Also yes.`,
  ({ name, count, parWord }) => `${name}'s scorecard reads like a flatline — ${count} ${parWord} and not one interesting moment.`,
  ({ name, count, parWord }) => `Somewhere, a spreadsheet is in love with ${name}: ${count} ${parWord}, zero drama, maximum smugness.`,
  ({ name, count, parWord }) => `${name} treats bogeys like they're beneath him. ${count} ${parWord} later, he might be right.`,
  ({ name, count, parWord }) => `${count} ${parWord} for ${name}. We checked the course for rigging. It's clean — he's just annoyingly solid.`,
]

const BLOW_UP_LINES = [
  ({ name, strokes, hole, par }) => `${name} turned hole ${hole} into a crime scene — a ${strokes} on a par ${par}. Somebody call it in.`,
  ({ name, strokes, hole, round }) => `Hole ${hole}, Round ${round}: ${name} needed ${strokes} shots and most of his dignity to get there.`,
  ({ name, strokes, hole, par }) => `${name} carded a ${strokes} on hole ${hole} (par ${par}). The ball's fine. His ego is not.`,
  ({ name, strokes, hole }) => `Somewhere on hole ${hole}, ${name}'s swing filed for divorce. Final score: ${strokes}.`,
  ({ name, strokes, par }) => `${name} took ${strokes} on a par ${par}. That's not golf, that's a hostage situation.`,
  ({ name, strokes, hole }) => `Hole ${hole} ate ${name} alive — ${strokes} shots, and at least three of them were out of pure spite.`,
]

const MOST_CONSISTENT_LINES = [
  ({ name, holesPlayed }) => `${name} has been eerily consistent for ${holesPlayed} holes straight. We checked — still human. Probably.`,
  ({ name, holesPlayed }) => `${name}'s scores don't move. His personality doesn't either. ${holesPlayed} holes of pure, unbothered sameness.`,
  ({ name, holesPlayed }) => `Scientists are studying ${name}'s scorecard — ${holesPlayed} holes in, still flatlining beautifully.`,
  ({ name, holesPlayed }) => `${name} hasn't had a bad hole in ${holesPlayed} tries. Either he's a robot or he's cheating. We're leaning robot.`,
  ({ name, holesPlayed }) => `${name}: the human equivalent of a perfectly boring metronome — ${holesPlayed} holes of zero surprises.`,
  ({ name, holesPlayed }) => `While everyone else implodes, ${name} just keeps doing... this. ${holesPlayed} holes of infuriating consistency.`,
]

// stats is the computeStats() result (or null before any scores exist).
// One random line per category currently in play, in the same fixed
// category order every time (most pars, blow-up, most consistent).
export function buildBanter(stats) {
  if (!stats) return []
  const lines = []
  if (stats.mostPars) {
    const { player, count } = stats.mostPars
    lines.push(pick(MOST_PARS_LINES)({ name: player.name, count, parWord: count === 1 ? 'par' : 'pars' }))
  }
  if (stats.blowUp) {
    const { player, strokes, hole, par, round } = stats.blowUp
    lines.push(pick(BLOW_UP_LINES)({ name: player.name, strokes, hole, par, round }))
  }
  if (stats.mostConsistent) {
    const { player, holesPlayed } = stats.mostConsistent
    lines.push(pick(MOST_CONSISTENT_LINES)({ name: player.name, holesPlayed }))
  }
  return lines
}
