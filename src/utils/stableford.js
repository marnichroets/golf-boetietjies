// Standard Stableford scoring against a course handicap allocated by stroke index.

export function strokesReceived(handicap, strokeIndex) {
  const base = Math.floor(handicap / 18)
  const remainder = handicap % 18
  return base + (strokeIndex <= remainder ? 1 : 0)
}

// strokes === 0 is the sentinel for a deliberate no-score / pick-up — always
// worth 0 points, regardless of handicap allocation.
export function holePoints({ strokes, par, handicap, strokeIndex }) {
  if (strokes == null || par == null) return null
  if (strokes === 0) return 0
  const received = strokesReceived(handicap ?? 0, strokeIndex ?? 10)
  const net = strokes - received
  return Math.max(0, 2 - (net - par))
}

// scoresByHole: { [hole]: strokes }, holes: [{ hole, par, stroke_index }]
// A picked-up hole (strokes === 0) counts toward holesPlayed/thru so the
// "Thru N" indicator advances correctly, but contributes no gross strokes —
// there's no real stroke count to add to the OUT/IN/TOTAL gross figure.
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
    thru = Math.max(thru, h.hole)
    if (strokes === 0) continue
    grossStrokes += strokes
    parPlayed += h.par
    points += holePoints({ strokes, par: h.par, handicap, strokeIndex: h.stroke_index })
  }
  return { points, holesPlayed, grossStrokes, parPlayed, thru, toPar: grossStrokes - parPlayed }
}

// +6 -> "+6", 0 -> "E", -3 -> "-3"
export function formatRelativePar(toPar) {
  if (toPar === 0) return 'E'
  return toPar > 0 ? `+${toPar}` : `${toPar}`
}
