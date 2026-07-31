import { useMemo, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { Crest, DoglegRightIcon, MapIcon, SplitFairwayIcon, StraightHoleIcon, WaterHazardIcon } from '../components/icons'

const FRONT_NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const BACK_NINE = [10, 11, 12, 13, 14, 15, 16, 17, 18]

// Real, publicly-known Zebula Elephant course notes — paraphrased, not
// copied from any source. Matches the loaded hole data (par/SI) for these
// holes, which is how we know it's genuinely this course. Every other hole
// intentionally has no entry here rather than an invented one — see
// StraightHoleIcon default below.
const HOLE_NOTES = {
  1: { icon: 'dogleg-right', note: 'Dogleg right around a stand of trees off the tee.' },
  8: { icon: 'water', note: 'Raised green guarded by both water and a bunker.' },
  15: { icon: 'split', note: 'Split fairway — pick your line off the tee.' },
  18: { icon: 'water', note: 'Risk-reward par 5 — a pond guards a green reachable in two.' },
}

function HoleShapeIcon({ type, ...rest }) {
  if (type === 'dogleg-right') return <DoglegRightIcon {...rest} />
  if (type === 'split') return <SplitFairwayIcon {...rest} />
  if (type === 'water') return <WaterHazardIcon {...rest} />
  return <StraightHoleIcon {...rest} />
}

function sumBy(holes, key) {
  return holes.reduce((total, h) => total + (h[key] ?? 0), 0)
}

// Low stroke index = the hardest holes (shots given first) — colour-code so
// the toughest and easiest holes are scannable at a glance.
function siStyle(si) {
  if (si == null) return {}
  if (si <= 6) {
    return { background: 'rgba(31, 92, 64, 0.14)', color: 'var(--forest-dark)', border: '1px solid rgba(31, 92, 64, 0.3)' }
  }
  if (si <= 12) {
    return { background: 'var(--surface-hi)', color: 'var(--text-dim)', border: '1px solid var(--border)' }
  }
  return { background: 'rgba(171, 124, 30, 0.1)', color: 'var(--brass-ink)', border: '1px solid rgba(171, 124, 30, 0.28)' }
}

function badgeStyle(par) {
  if (par <= 3) return { borderColor: 'var(--brass)', color: 'var(--brass-ink)' }
  if (par >= 5) return { borderColor: 'var(--forest)', color: 'var(--forest-dark)' }
  return {}
}

export default function Course() {
  const { courseHoles } = useGolfData()
  const [round, setRound] = useState(1)

  const holes = courseHoles[round] || []
  const front = FRONT_NINE.map((n) => holes.find((h) => h.hole === n)).filter(Boolean)
  const back = BACK_NINE.map((n) => holes.find((h) => h.hole === n)).filter(Boolean)

  const outPar = sumBy(front, 'par')
  const inPar = sumBy(back, 'par')
  const outMetres = sumBy(front, 'metres')
  const inMetres = sumBy(back, 'metres')
  const maxMetres = useMemo(() => Math.max(1, ...holes.map((h) => h.metres || 0)), [holes])

  return (
    <div>
      <div className="course-hero fairway">
        <div className="eyebrow">Zebula Golf Estate</div>
        <div className="course-hero-title">The Course</div>
        <div className="course-hero-sub">Elephant Tees — know what's coming before you tee off.</div>
        <div className="course-hero-chips">
          <span className="course-hero-chip">
            <strong>Par</strong>72
          </span>
          <span className="course-hero-chip">
            <strong>{(outMetres + inMetres).toLocaleString()}</strong>m
          </span>
          <span className="course-hero-chip">
            <strong>18</strong>holes
          </span>
        </div>
      </div>

      <div className="segmented" style={{ marginBottom: 16 }}>
        {[1, 2].map((r) => (
          <button key={r} className={round === r ? 'active' : ''} onClick={() => setRound(r)}>
            Round {r}
          </button>
        ))}
      </div>

      {holes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          No course data loaded yet.
        </div>
      ) : (
        <>
          <div className="hole-notes-caption">
            <MapIcon width={12} height={12} />
            General hole guidance from public course info — not a precise yardage map.
          </div>

          <div className="card-flush" style={{ marginBottom: 14 }}>
            <NineHeading label="Front Nine" range="Holes 1–9" />
            <TableHead />
            {front.map((h) => (
              <HoleRow key={h.hole} hole={h} maxMetres={maxMetres} />
            ))}
            <SumRow label="OUT" par={outPar} metres={outMetres} />
          </div>

          <div className="card-flush" style={{ marginBottom: 14 }}>
            <NineHeading label="Back Nine" range="Holes 10–18" />
            <TableHead />
            {back.map((h) => (
              <HoleRow key={h.hole} hole={h} maxMetres={maxMetres} />
            ))}
            <SumRow label="IN" par={inPar} metres={inMetres} />
          </div>

          <div className="card-flush">
            <SumRow label="TOTAL" par={outPar + inPar} metres={outMetres + inMetres} total />
          </div>
        </>
      )}
    </div>
  )
}

function NineHeading({ label, range }) {
  return (
    <div className="nine-heading">
      <Crest size={14} style={{ color: 'var(--brass)' }} />
      {label}
      <span className="pill" style={{ marginLeft: 'auto' }}>
        {range}
      </span>
    </div>
  )
}

function TableHead() {
  return (
    <div className="hole-table-head">
      <span className="eyebrow" style={{ textAlign: 'left' }}>
        Hole
      </span>
      <span className="eyebrow" style={{ textAlign: 'left' }}>
        Par
      </span>
      <span className="eyebrow" style={{ textAlign: 'center' }}>
        S.I.
      </span>
      <span className="eyebrow" style={{ textAlign: 'right' }}>
        Metres
      </span>
    </div>
  )
}

function HoleRow({ hole: h, maxMetres }) {
  const fillPct = h.metres != null ? Math.max(8, Math.round((h.metres / maxMetres) * 100)) : 0
  const note = HOLE_NOTES[h.hole]
  return (
    <div className="hole-row-wrap">
      <div className="hole-row">
        <div className="hole-shape-cell">
          <div className="hole-badge" style={badgeStyle(h.par)}>
            {h.hole}
          </div>
          <HoleShapeIcon
            type={note?.icon}
            width={12}
            height={12}
            strokeWidth={1.6}
            style={{ color: note ? 'var(--brass-ink)' : 'var(--text-faint)', flexShrink: 0 }}
          />
        </div>
        <span className="num-display" style={{ fontSize: 17 }}>
          {h.par}
        </span>
        <span style={{ display: 'flex', justifyContent: 'center' }}>
          <span className="si-chip" style={siStyle(h.stroke_index)}>
            {h.stroke_index}
          </span>
        </span>
        <div className="dist-cell">
          <span className="num-display" style={{ fontSize: 14 }}>
            {h.metres != null ? `${h.metres} m` : '–'}
          </span>
          {h.metres != null && (
            <div className="dist-track">
              <div className="dist-fill" style={{ width: `${fillPct}%` }} />
            </div>
          )}
        </div>
      </div>
      {note && (
        <div className="hole-note-strip">
          <HoleShapeIcon type={note.icon} width={13} height={13} strokeWidth={1.6} style={{ color: 'var(--brass-ink)', flexShrink: 0, marginTop: 1 }} />
          <span>{note.note}</span>
        </div>
      )}
    </div>
  )
}

function SumRow({ label, par, metres, total }) {
  return (
    <div className={`course-sum-row ${total ? 'total' : ''}`}>
      <span className="csr-label">{label}</span>
      <span className="csr-value">{par}</span>
      <span />
      <span className="csr-dist">{metres.toLocaleString()} m</span>
    </div>
  )
}
