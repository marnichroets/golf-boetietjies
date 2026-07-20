import { useEffect, useMemo, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { holePoints, strokesReceived } from '../utils/stableford'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons'

const POINT_LABELS = { 0: 'Blow up', 1: 'Bogey', 2: 'Par', 3: 'Birdie', 4: 'Eagle', 5: 'Albatross' }

export default function Scorecard() {
  const { players, courseHoles, scores, upsertScore, isPending } = useGolfData()
  const { playerId: myId } = useLocalPlayer()
  const [round, setRound] = useState(1)
  const [activePlayerId, setActivePlayerId] = useState(myId)
  const [hole, setHole] = useState(1)

  useEffect(() => {
    if (myId && !activePlayerId) setActivePlayerId(myId)
  }, [myId, activePlayerId])

  const activePlayer = players.find((p) => p.id === activePlayerId) || players[0]
  const holes = courseHoles[round] || []
  const holeInfo = holes.find((h) => h.hole === hole)
  const playerScores = (activePlayer && scores[activePlayer.id]?.[round]) || {}
  const strokes = playerScores[hole] ?? null

  const points = useMemo(() => {
    if (!holeInfo || !activePlayer) return null
    return holePoints({
      strokes,
      par: holeInfo.par,
      handicap: activePlayer.handicap,
      strokeIndex: holeInfo.stroke_index,
    })
  }, [strokes, holeInfo, activePlayer])

  const received = holeInfo && activePlayer ? strokesReceived(activePlayer.handicap, holeInfo.stroke_index) : 0

  const setStrokes = (val) => {
    if (!activePlayer) return
    const clamped = Math.max(1, Math.min(15, val))
    upsertScore(activePlayer.id, round, hole, clamped)
  }

  const pendingKey = activePlayer ? `score:${activePlayer.id}:${round}:${hole}` : null

  if (!activePlayer) {
    return <div className="card">No players yet — set up players first.</div>
  }

  return (
    <div>
      <h1 className="page-title">Scorecard</h1>
      <p className="page-subtitle">Fast entry, big numbers, no excuses.</p>

      <div className="segmented" style={{ marginBottom: 14 }}>
        {[1, 2].map((r) => (
          <button key={r} className={round === r ? 'active' : ''} onClick={() => setRound(r)}>
            Round {r}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}>
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlayerId(p.id)}
            className={`pill ${p.id === activePlayer.id ? 'pill-brass' : ''}`}
            style={{
              flexShrink: 0,
              cursor: 'pointer',
              padding: '8px 12px',
              fontSize: 12.5,
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 5, marginBottom: 16 }}>
        {holes.map((h) => {
          const s = playerScores[h.hole]
          const filled = s != null
          const isCurrent = h.hole === hole
          return (
            <button
              key={h.hole}
              onClick={() => setHole(h.hole)}
              style={{
                aspectRatio: '1',
                borderRadius: 9,
                border: isCurrent ? '1.5px solid var(--brass)' : '1px solid var(--border)',
                background: isCurrent
                  ? 'rgba(201,162,39,0.16)'
                  : filled
                    ? 'var(--surface-hi)'
                    : 'var(--surface-alt)',
                color: isCurrent ? 'var(--brass-light)' : filled ? 'var(--text)' : 'var(--text-faint)',
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.12s var(--ease)',
              }}
            >
              {h.hole}
            </button>
          )
        })}
      </div>

      {holeInfo && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow">Hole {hole}</div>
              <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 2 }}>
                Par {holeInfo.par} · SI {holeInfo.stroke_index}
                {received > 0 ? ` · +${received} shot${received > 1 ? 's' : ''}` : ''}
              </div>
            </div>
            <span className={`sync-dot ${pendingKey && isPending(pendingKey) ? 'pending' : ''}`} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, margin: '24px 0' }}>
            <button
              className="btn"
              style={{ width: 54, height: 54, borderRadius: '50%', fontSize: 24, padding: 0 }}
              onClick={() => setStrokes((strokes ?? holeInfo.par) - 1)}
            >
              −
            </button>
            <div style={{ textAlign: 'center', minWidth: 96 }}>
              <div className="num-display" style={{ fontSize: 60, lineHeight: 1 }}>
                {strokes ?? '–'}
              </div>
              <div className="eyebrow" style={{ marginTop: 4 }}>
                strokes
              </div>
            </div>
            <button
              className="btn btn-accent"
              style={{ width: 54, height: 54, borderRadius: '50%', fontSize: 24, padding: 0 }}
              onClick={() => setStrokes((strokes ?? holeInfo.par) + 1)}
            >
              +
            </button>
          </div>

          {strokes == null ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[holeInfo.par - 1, holeInfo.par, holeInfo.par + 1, holeInfo.par + 2].map((val) => (
                <button key={val} className="btn" onClick={() => setStrokes(val)}>
                  {val}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <span className="pill pill-brass" style={{ fontSize: 13, padding: '6px 14px' }}>
                {points} pt{points === 1 ? '' : 's'} · {POINT_LABELS[Math.min(points, 5)] ?? 'Nice'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              className="btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              disabled={hole <= 1}
              onClick={() => setHole((h) => Math.max(1, h - 1))}
            >
              <ChevronLeftIcon width={16} height={16} /> Prev
            </button>
            <button
              className="btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              disabled={hole >= 18}
              onClick={() => setHole((h) => Math.min(18, h + 1))}
            >
              Next <ChevronRightIcon width={16} height={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
