// Ryder Cup matchplay status, derived entirely from the individual hole
// scores that are already being entered on the Scorecard tab — nobody has
// to record anything twice.
import { holePoints } from './stableford'

// A side's score for one hole: the best (highest) net Stableford points
// among its players who have a score in for that hole. Fourball naturally
// becomes "best ball" this way; singles is just the one player's points.
// Returns null if nobody on the side has posted a score yet — there's no
// formal "concede" gesture in this app, so a hole only counts once at
// least one side member has a real entry on the books.
function sideHolePoints(playerIds, hole, scoresByPlayer, players) {
  let best = null
  for (const playerId of playerIds) {
    const strokes = scoresByPlayer[playerId]?.[hole.hole] ?? null
    if (strokes == null) continue
    const player = players.find((p) => p.id === playerId)
    if (!player) continue
    const pts = holePoints({ strokes, par: hole.par, handicap: player.handicap, strokeIndex: hole.stroke_index })
    if (best == null || pts > best) best = pts
  }
  return best
}

// scoresByPlayer: { [playerId]: { [hole]: strokes } } for the round this
// match is being played in. holes: the round's course_holes, in order.
export function computeMatchStatus({ sideA, sideB, holes, scoresByPlayer, players }) {
  let diff = 0 // positive => side A up, negative => side B up
  let holesDecided = 0
  let closed = null

  for (const hole of holes) {
    const a = sideHolePoints(sideA, hole, scoresByPlayer, players)
    const b = sideHolePoints(sideB, hole, scoresByPlayer, players)
    // Holes are read in order and we stop at the first one that isn't
    // decided yet, since a round is played front-to-back — this keeps
    // "holes thru" meaningful instead of counting scattered future holes.
    if (a == null || b == null) break

    holesDecided += 1
    if (a > b) diff += 1
    else if (b > a) diff -= 1

    const holesRemaining = holes.length - holesDecided
    if (Math.abs(diff) > holesRemaining) {
      closed = { diff, holesRemaining }
      break
    }
  }

  const totalHoles = holes.length
  const finished = closed != null || (totalHoles > 0 && holesDecided === totalHoles)
  const label = formatMatchLabel({ diff, holesDecided, closed, totalHoles })

  return { diff, holesDecided, closed: closed != null, finished, label }
}

function formatMatchLabel({ diff, holesDecided, closed, totalHoles }) {
  if (closed) return `${Math.abs(closed.diff)}&${closed.holesRemaining}`
  if (totalHoles > 0 && holesDecided === totalHoles) return diff === 0 ? 'Halved' : `${Math.abs(diff)} UP`
  if (holesDecided === 0) return 'Not started'
  if (diff === 0) return `All Square thru ${holesDecided}`
  return `${Math.abs(diff)} UP thru ${holesDecided}`
}

// Points a finished match banks for the team scoreboard. An in-progress
// match's live lean isn't "banked" yet — only a finished result (closed
// early, or all square/decided after the last hole) contributes.
export function matchPoints(status) {
  if (!status.finished) return { a: 0, b: 0 }
  if (status.diff === 0) return { a: 0.5, b: 0.5 }
  return status.diff > 0 ? { a: 1, b: 0 } : { a: 0, b: 1 }
}

// 3.5 -> "3½", 3 -> "3", 0.5 -> "½"
export function formatPoints(n) {
  const whole = Math.floor(n)
  const half = n - whole >= 0.5
  if (whole === 0 && half) return '½'
  return half ? `${whole}½` : `${whole}`
}
