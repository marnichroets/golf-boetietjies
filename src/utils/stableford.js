// Standard Stableford scoring against a course handicap allocated by stroke index.

export function strokesReceived(handicap, strokeIndex) {
  const base = Math.floor(handicap / 18)
  const remainder = handicap % 18
  return base + (strokeIndex <= remainder ? 1 : 0)
}

export function holePoints({ strokes, par, handicap, strokeIndex }) {
  if (strokes == null || par == null) return null
  const received = strokesReceived(handicap ?? 0, strokeIndex ?? 10)
  const net = strokes - received
  return Math.max(0, 2 - (net - par))
}

// scoresByHole: { [hole]: strokes }, holes: [{ hole, par, stroke_index }]
export function roundSummary(scoresByHole, holes, handicap) {
  let points = 0
  let holesPlayed = 0
  let grossStrokes = 0
  let parPlayed = 0
  let thru = 0
  for (const h of holes) {
    const strokes = scoresByHole[h.hole]
    if (strokes == null) continue
    holesPlayed += 1
    grossStrokes += strokes
    parPlayed += h.par
    points += holePoints({ strokes, par: h.par, handicap, strokeIndex: h.stroke_index })
    thru = Math.max(thru, h.hole)
  }
  return { points, holesPlayed, grossStrokes, parPlayed, thru, toPar: grossStrokes - parPlayed }
}

// +6 -> "+6", 0 -> "E", -3 -> "-3"
export function formatRelativePar(toPar) {
  if (toPar === 0) return 'E'
  return toPar > 0 ? `+${toPar}` : `${toPar}`
}
