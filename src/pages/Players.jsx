import { useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import PlayerEditSheet from '../components/PlayerEditSheet'

export default function Players() {
  const { players } = useGolfData()
  const { playerId } = useLocalPlayer()
  const [editing, setEditing] = useState(null)

  return (
    <div>
      <h1 className="page-title">Players</h1>
      <p className="page-subtitle">14 boetietjies, 2 rounds, 1 winner.</p>

      <div style={{ display: 'grid', gap: 10 }}>
        {players.map((p) => (
          <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: p.photo_url ? 'transparent' : playerColor(p),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
                overflow: 'hidden',
                border: p.id === playerId ? '2px solid var(--accent)' : 'none',
              }}
            >
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                playerEmoji(p)
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {p.name}
                {p.id === playerId && <span className="pill">You</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>HCP {p.handicap}</div>
              {p.tagline && (
                <div style={{ fontSize: 13, color: 'var(--accent-2)', marginTop: 2, fontStyle: 'italic' }}>
                  “{p.tagline}”
                </div>
              )}
            </div>
            <button
              className="btn"
              style={{ padding: '8px 12px', fontSize: 13 }}
              onClick={() => setEditing(p)}
            >
              ✏️
            </button>
          </div>
        ))}
      </div>

      {editing && <PlayerEditSheet player={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
