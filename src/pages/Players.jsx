import { useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import PlayerEditSheet from '../components/PlayerEditSheet'
import { PencilIcon } from '../components/icons'

export default function Players() {
  const { players } = useGolfData()
  const { playerId } = useLocalPlayer()
  const [editing, setEditing] = useState(null)

  return (
    <div>
      <h1 className="page-title">The Field</h1>
      <p className="page-subtitle">14 boetietjies, 2 rounds, 1 winner.</p>

      <div style={{ display: 'grid', gap: 10 }}>
        {players.map((p) => (
          <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <span
              className="avatar"
              style={{
                width: 52,
                height: 52,
                fontSize: 22,
                background: p.photo_url ? 'transparent' : playerColor(p),
                boxShadow:
                  p.id === playerId
                    ? '0 0 0 2px var(--brass), 0 3px 8px -3px rgba(0,0,0,0.5)'
                    : 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 3px 8px -3px rgba(0,0,0,0.5)',
              }}
            >
              {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : playerEmoji(p)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {p.name}
                {p.id === playerId && <span className="pill pill-brass">You</span>}
              </div>
              <div className="eyebrow" style={{ marginTop: 2 }}>
                HCP {p.handicap}
              </div>
              {p.tagline && (
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 13.5,
                    color: 'var(--text-dim)',
                    marginTop: 4,
                  }}
                >
                  “{p.tagline}”
                </div>
              )}
            </div>
            <button
              className="btn"
              style={{ padding: '9px 11px', display: 'flex', alignItems: 'center' }}
              onClick={() => setEditing(p)}
              aria-label={`Edit ${p.name}`}
            >
              <PencilIcon width={16} height={16} />
            </button>
          </div>
        ))}
      </div>

      {editing && <PlayerEditSheet player={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
