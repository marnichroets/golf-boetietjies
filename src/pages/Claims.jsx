import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'

const CATEGORIES = [
  { key: 'longest_drive', label: 'Longest Drive', icon: '💥' },
  { key: 'nearest_pin', label: 'Nearest the Pin', icon: '🎯' },
]

export default function Claims() {
  const { players, claims, claimCategory, isPending } = useGolfData()
  const { playerId: myId } = useLocalPlayer()
  const me = players.find((p) => p.id === myId)

  return (
    <div>
      <h1 className="page-title">Claims</h1>
      <p className="page-subtitle">Bragging rights. Steal it if you beat it.</p>

      {CATEGORIES.map((cat) => (
        <div key={cat.key} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, margin: '4px 0 8px' }}>
            {cat.icon} {cat.label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[1, 2].map((round) => {
              const claim = claims[`${cat.key}:${round}`]
              const holder = players.find((p) => p.id === claim?.player_id)
              const key = `claim:${cat.key}:${round}`
              const pending = isPending(key)
              const isMine = holder && holder.id === myId

              return (
                <div key={round} className="card" style={{ padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, marginBottom: 8 }}>
                    ROUND {round}
                  </div>
                  {holder ? (
                    <>
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          margin: '0 auto 8px',
                          borderRadius: '50%',
                          background: holder.photo_url ? 'transparent' : playerColor(holder),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          overflow: 'hidden',
                        }}
                      >
                        {holder.photo_url ? (
                          <img src={holder.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          playerEmoji(holder)
                        )}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{holder.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 10 }}>
                        {isMine ? 'You hold this 🏆' : 'holds it'}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '14px 0', color: 'var(--text-faint)', fontSize: 13 }}>Unclaimed</div>
                  )}
                  <button
                    className="btn btn-block"
                    style={{ fontSize: 13, opacity: pending ? 0.6 : 1 }}
                    disabled={!me || pending}
                    onClick={() => claimCategory(cat.key, round, myId)}
                  >
                    {isMine ? 'Reclaim' : "I've got this"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
