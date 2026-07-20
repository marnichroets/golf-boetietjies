import { useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'

const FRONT_NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const BACK_NINE = [10, 11, 12, 13, 14, 15, 16, 17, 18]

function sumBy(holes, key) {
  return holes.reduce((total, h) => total + (h[key] ?? 0), 0)
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

  return (
    <div>
      <h1 className="page-title">The Course</h1>
      <p className="page-subtitle">Zebula Golf Estate — Elephant tees. Know what's coming.</p>

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
        <div className="card-flush">
          <HeaderRow />
          <Nine label="Out" holes={front} />
          <SumRow label="OUT" par={outPar} metres={outMetres} />
          <Nine label="In" holes={back} />
          <SumRow label="IN" par={inPar} metres={inMetres} />
          <SumRow label="TOTAL" par={outPar + inPar} metres={outMetres + inMetres} total />
        </div>
      )}
    </div>
  )
}

function HeaderRow() {
  return (
    <div style={rowStyle(true)}>
      <span className="eyebrow" style={{ textAlign: 'left' }}>
        Hole
      </span>
      <span className="eyebrow" style={{ textAlign: 'center' }}>
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

function Nine({ label, holes }) {
  return (
    <div>
      <div
        style={{
          padding: '10px 16px 4px',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 13,
          color: 'var(--brass-light)',
        }}
      >
        {label}
      </div>
      {holes.map((h) => (
        <div key={h.hole} style={rowStyle()}>
          <span style={{ fontWeight: 700 }}>{h.hole}</span>
          <span className="num-display" style={{ textAlign: 'center', fontSize: 15 }}>
            {h.par}
          </span>
          <span style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13.5 }}>{h.stroke_index}</span>
          <span style={{ textAlign: 'right', color: 'var(--text-dim)', fontSize: 13.5 }}>
            {h.metres != null ? `${h.metres} m` : '–'}
          </span>
        </div>
      ))}
    </div>
  )
}

function SumRow({ label, par, metres, total }) {
  return (
    <div
      style={{
        ...rowStyle(),
        background: total ? 'rgba(201,162,39,0.14)' : 'rgba(245,239,225,0.03)',
        borderTop: '1px solid var(--border)',
        borderBottom: total ? 'none' : '1px solid var(--border)',
      }}
    >
      <span
        className="eyebrow"
        style={{ color: total ? 'var(--brass-light)' : 'var(--brass)', letterSpacing: '0.1em' }}
      >
        {label}
      </span>
      <span className="num-display" style={{ textAlign: 'center', fontSize: 15, color: total ? 'var(--brass-light)' : 'var(--text)' }}>
        {par}
      </span>
      <span />
      <span
        className="num-display"
        style={{ textAlign: 'right', fontSize: 15, color: total ? 'var(--brass-light)' : 'var(--text)' }}
      >
        {metres} m
      </span>
    </div>
  )
}

function rowStyle(isHeader) {
  return {
    display: 'grid',
    gridTemplateColumns: '0.9fr 0.8fr 0.8fr 1.1fr',
    alignItems: 'center',
    padding: isHeader ? '12px 16px' : '9px 16px',
    borderBottom: isHeader ? '1px solid var(--border)' : '1px solid var(--border-soft)',
  }
}
