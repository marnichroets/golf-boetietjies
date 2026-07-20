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
      <p className="page-subtitle">Stableford points. Bragging rights are permanent.</p>

      <div className="segmented" style={{ marginBottom: 16 }}>
        {VIEWS.map((v) => (
          <button key={v.key} className={view === v.key ? 'active' : ''} onClick={() => setView(v.key)}>
            {v.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 9 }}>
        {rows.map((row, idx) => {
          const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''
          const isLeader = idx === 0 && row.points > 0
          return (
            <div
              key={row.player.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                border: isLeader ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                boxShadow: isLeader ? '0 14px 30px -16px rgba(201,162,39,0.45), var(--shadow-card)' : 'var(--shadow-card)',
              }}
            >
              <div className={`rank-badge ${rankClass}`} style={rankClass ? undefined : { background: 'var(--surface-hi)' }}>
                {idx + 1}
              </div>
              <span
                className="avatar"
                style={{
                  width: 40,
                  height: 40,
                  fontSize: 18,
                  background: row.player.photo_url ? 'transparent' : playerColor(row.player),
                  boxShadow: isLeader
                    ? '0 0 0 2px var(--brass), 0 3px 8px -3px rgba(0,0,0,0.5)'
                    : 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 3px 8px -3px rgba(0,0,0,0.5)',
                }}
              >
                {row.player.photo_url ? <img src={row.player.photo_url} alt="" /> : playerEmoji(row.player)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.player.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {row.holesPlayed === 0 ? 'Not started' : row.holesPlayed >= row.thruMax ? 'Finished' : `Thru ${row.holesPlayed}`}
                  {' · HCP '}
                  {row.player.handicap}
                </div>
              </div>
              <div className="num-display" style={{ fontSize: 27, color: isLeader ? 'var(--brass-light)' : 'var(--text)' }}>
                {row.points}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
