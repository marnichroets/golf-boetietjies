import { useMemo, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { roundSummary } from '../utils/stableford'
import { playerColor, playerEmoji } from '../utils/playerVisuals'

const VIEWS = [
  { key: 'combined', label: 'Combined' },
  { key: 1, label: 'Round 1' },
  { key: 2, label: 'Round 2' },
]

export default function Leaderboard() {
  const { players, courseHoles, scores } = useGolfData()
  const [view, setView] = useState('combined')

  const rows = useMemo(() => {
    return players
      .map((p) => {
        const r1 = roundSummary(scores[p.id]?.[1] || {}, courseHoles[1] || [], p.handicap)
        const r2 = roundSummary(scores[p.id]?.[2] || {}, courseHoles[2] || [], p.handicap)
        const combined = {
          points: r1.points + r2.points,
          holesPlayed: r1.holesPlayed + r2.holesPlayed,
        }
        const active = view === 'combined' ? combined : view === 1 ? r1 : r2
        const thruMax = view === 'combined' ? 36 : 18
        return { player: p, points: active.points, holesPlayed: active.holesPlayed, thruMax }
      })
      .sort((a, b) => b.points - a.points || b.holesPlayed - a.holesPlayed)
  }, [players, courseHoles, scores, view])

  return (
    <div>
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-subtitle">Stableford points. Higher is better.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {VIEWS.map((v) => (
          <button
            key={v.key}
            className="btn"
            style={{
              flex: 1,
              fontSize: 13,
              padding: '10px 8px',
              background: view === v.key ? 'var(--accent)' : 'var(--surface-hi)',
              color: view === v.key ? '#05130c' : 'var(--text)',
            }}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((row, idx) => (
          <div
            key={row.player.id}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              border: idx === 0 && row.points > 0 ? '1px solid var(--accent)' : '1px solid var(--border)',
            }}
          >
            <div style={{ width: 22, textAlign: 'center', fontWeight: 800, color: idx === 0 ? 'var(--accent)' : 'var(--text-dim)' }}>
              {idx + 1}
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: row.player.photo_url ? 'transparent' : playerColor(row.player),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {row.player.photo_url ? (
                <img src={row.player.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                playerEmoji(row.player)
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.player.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                {row.holesPlayed === 0
                  ? 'Not started'
                  : row.holesPlayed >= row.thruMax
                    ? 'F'
                    : `Thru ${view === 'combined' ? row.holesPlayed : row.holesPlayed}`}
                {' '}
                · HCP {row.player.handicap}
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{row.points}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
