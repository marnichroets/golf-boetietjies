import { useEffect, useMemo, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { holePoints, strokesReceived } from '../utils/stableford'
import { playerColor, playerEmoji } from '../utils/playerVisuals'

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
      <p className="page-subtitle">Fast hole-by-hole entry. Tap a mate's name to score for them.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[1, 2].map((r) => (
          <button
            key={r}
            className="btn"
            style={{ flex: 1, background: round === r ? 'var(--accent)' : 'var(--surface-hi)', color: round === r ? '#05130c' : 'var(--text)' }}
            onClick={() => setRound(r)}
          >
            Round {r}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}>
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlayerId(p.id)}
            className="pill"
            style={{
              flexShrink: 0,
              border: p.id === activePlayer.id ? `1px solid ${playerColor(p)}` : '1px solid var(--border)',
              background: p.id === activePlayer.id ? 'var(--surface-hi)' : 'var(--surface-alt)',
              color: p.id === activePlayer.id ? 'var(--text)' : 'var(--text-dim)',
              cursor: 'pointer',
              padding: '8px 12px',
            }}
          >
            {playerEmoji(p)} {p.name.split(' ')[0]}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 5, marginBottom: 16 }}>
        {holes.map((h) => {
          const s = playerScores[h.hole]
          const filled = s != null
          return (
            <button
              key={h.hole}
              onClick={() => setHole(h.hole)}
              style={{
                aspectRatio: '1',
                borderRadius: 8,
                border: h.hole === hole ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: filled ? 'var(--surface-hi)' : 'var(--surface-alt)',
                color: filled ? 'var(--text)' : 'var(--text-faint)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
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
              <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 700 }}>HOLE {hole}</div>
              <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                Par {holeInfo.par} · SI {holeInfo.stroke_index}
                {received > 0 ? ` · +${received} shot${received > 1 ? 's' : ''}` : ''}
              </div>
            </div>
            <span className={`sync-dot ${pendingKey && isPending(pendingKey) ? 'pending' : ''}`} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, margin: '22px 0' }}>
            <button
              className="btn"
              style={{ width: 56, height: 56, borderRadius: '50%', fontSize: 26 }}
              onClick={() => setStrokes((strokes ?? holeInfo.par) - 1)}
            >
              −
            </button>
            <div style={{ textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>{strokes ?? '–'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>strokes</div>
            </div>
            <button
              className="btn btn-accent"
              style={{ width: 56, height: 56, borderRadius: '50%', fontSize: 26 }}
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
              <span className="pill" style={{ fontSize: 13 }}>
                {points} pt{points === 1 ? '' : 's'} · {POINT_LABELS[Math.min(points, 5)] ?? 'Nice'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              className="btn"
              style={{ flex: 1 }}
              disabled={hole <= 1}
              onClick={() => setHole((h) => Math.max(1, h - 1))}
            >
              ← Prev
            </button>
            <button
              className="btn"
              style={{ flex: 1 }}
              disabled={hole >= 18}
              onClick={() => setHole((h) => Math.min(18, h + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
