import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'

export default function PickPlayer() {
  const { players } = useGolfData()
  const { setPlayerId } = useLocalPlayer()

  return (
    <div className="app-main" style={{ paddingBottom: 40 }}>
      <div style={{ textAlign: 'center', margin: '28px 0 20px' }}>
        <div style={{ fontSize: 46 }}>🏌️‍♂️</div>
        <h1 className="page-title" style={{ fontSize: 26 }}>
          Golf Boetietjies
        </h1>
        <p className="page-subtitle">Who's this? Pick your name to jump in.</p>
      </div>

      {players.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          No players found yet. Run the Supabase SQL setup first.
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {players.map((p) => (
          <button
            key={p.id}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textAlign: 'left',
              cursor: 'pointer',
              border: `1px solid var(--border)`,
            }}
            onClick={() => setPlayerId(p.id)}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: p.photo_url ? 'transparent' : playerColor(p),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                playerEmoji(p)
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>HCP {p.handicap}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
