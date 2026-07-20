import { holePoints } from './stableford'

const MIN_HOLES_FOR_CONSISTENCY = 6

// Builds one entry per hole actually played, across both rounds, for every player.
function buildEntries(players, scores, courseHoles) {
  const entries = []
  for (const player of players) {
    for (const round of [1, 2]) {
      const holes = courseHoles[round] || []
      const playerScores = scores[player.id]?.[round] || {}
      for (const h of holes) {
        const strokes = playerScores[h.hole]
        if (strokes == null) continue
        entries.push({
          player,
          round,
          hole: h.hole,
          par: h.par,
          strokes,
          diff: strokes - h.par,
          points: holePoints({ strokes, par: h.par, handicap: player.handicap, strokeIndex: h.stroke_index }),
        })
      }
    }
  }
  return entries
}

function stddev(nums) {
  if (nums.length === 0) return Infinity
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length
  return Math.sqrt(variance)
}

export function computeStats(players, scores, courseHoles) {
  const entries = buildEntries(players, scores, courseHoles)
  if (entries.length === 0) return null

  const parsByPlayer = new Map()
  const pointsByPlayer = new Map()
  let blowUp = null

  for (const e of entries) {
    if (e.diff === 0) parsByPlayer.set(e.player.id, (parsByPlayer.get(e.player.id) || 0) + 1)
    if (!pointsByPlayer.has(e.player.id)) pointsByPlayer.set(e.player.id, [])
    pointsByPlayer.get(e.player.id).push(e.points)
    if (!blowUp || e.diff > blowUp.diff) blowUp = e
  }

  let mostPars = null
  for (const [playerId, count] of parsByPlayer.entries()) {
    if (!mostPars || count > mostPars.count) {
      mostPars = { player: players.find((p) => p.id === playerId), count }
    }
  }

  let mostConsistent = null
  for (const [playerId, points] of pointsByPlayer.entries()) {
    if (points.length < MIN_HOLES_FOR_CONSISTENCY) continue
    const sd = stddev(points)
    if (!mostConsistent || sd < mostConsistent.stddev) {
      mostConsistent = { player: players.find((p) => p.id === playerId), stddev: sd, holesPlayed: points.length }
    }
  }

  return {
    totalHolesLogged: entries.length,
    mostPars,
    blowUp,
    mostConsistent,
  }
}
