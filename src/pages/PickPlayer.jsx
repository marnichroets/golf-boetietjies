import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { Crest } from '../components/icons'

export default function PickPlayer() {
  const { players } = useGolfData()
  const { setPlayerId } = useLocalPlayer()

  return (
    <div className="app-main" style={{ paddingBottom: 40 }}>
      <div style={{ textAlign: 'center', margin: '34px 0 22px' }}>
        <Crest size={46} style={{ color: 'var(--brass)', margin: '0 auto 14px' }} />
        <h1 className="page-title" style={{ fontSize: 28 }}>
          Golf Boetietjies
        </h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Pick your name. No hiding your handicap now.
        </p>
      </div>

      <hr className="gold-rule" />

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
              gap: 13,
              textAlign: 'left',
              cursor: 'pointer',
              padding: '13px 16px',
            }}
            onClick={() => setPlayerId(p.id)}
          >
            <span
              className="avatar"
              style={{
                width: 46,
                height: 46,
                fontSize: 20,
                background: p.photo_url ? 'transparent' : playerColor(p),
              }}
            >
              {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : playerEmoji(p)}
            </span>
            <div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div className="eyebrow" style={{ marginTop: 2 }}>
                HCP {p.handicap}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
