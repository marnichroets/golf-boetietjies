import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
export default function PickPlayer() {
  const { players } = useGolfData()
  const { setPlayerId } = useLocalPlayer()

  return (
    <div className="app-main" style={{ paddingBottom: 40, paddingTop: 22 }}>
      <div className="front-door-banner fairway">
        <div className="front-door-logo-plate">
          <img src="/logo-full-transparent.png" alt="Golf Boetietjies" />
        </div>
        <p className="page-subtitle">Pick your name. No hiding your handicap now.</p>
      </div>

      {players.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          No players found yet. Run the Supabase SQL setup first.
        </div>
      )}

      <div className="pick-grid">
        {players.map((p) => (
          <button key={p.id} className="card pick-card" onClick={() => setPlayerId(p.id)}>
            <span
              className="avatar"
              style={{
                width: 56,
                height: 56,
                fontSize: 24,
                background: p.photo_url ? 'transparent' : playerColor(p),
              }}
            >
              {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : playerEmoji(p)}
            </span>
            <div className="pick-card-name">{p.name}</div>
            <div className="eyebrow">HCP {p.handicap}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
