import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { FlagIcon, TargetIcon } from '../components/icons'

const CATEGORIES = [
  { key: 'longest_drive', label: 'Longest Drive', Icon: FlagIcon },
  { key: 'nearest_pin', label: 'Nearest the Pin', Icon: TargetIcon },
]

export default function Claims() {
  const { players, claims, claimCategory, isPending } = useGolfData()
  const { playerId: myId } = useLocalPlayer()
  const me = players.find((p) => p.id === myId)

  return (
    <div>
      <h1 className="page-title">Claims</h1>
      <p className="page-subtitle">Glory is temporary. Steal it if you can back it up.</p>

      {CATEGORIES.map((cat) => (
        <div key={cat.key} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
            <cat.Icon width={17} height={17} style={{ color: 'var(--brass)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{cat.label}</span>
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
                  <div className="eyebrow" style={{ marginBottom: 10 }}>
                    Round {round}
                  </div>
                  {holder ? (
                    <>
                      <span
                        className="avatar"
                        style={{
                          width: 48,
                          height: 48,
                          margin: '0 auto 8px',
                          fontSize: 20,
                          background: holder.photo_url ? 'transparent' : playerColor(holder),
                          boxShadow: isMine
                            ? '0 0 0 2px var(--brass), 0 4px 10px -3px rgba(201,162,39,0.5)'
                            : 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 3px 8px -3px rgba(0,0,0,0.5)',
                        }}
                      >
                        {holder.photo_url ? <img src={holder.photo_url} alt="" /> : playerEmoji(holder)}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{holder.name}</div>
                      <div style={{ fontSize: 11, color: isMine ? 'var(--brass-ink)' : 'var(--text-faint)', margin: '2px 0 10px' }}>
                        {isMine ? 'You hold this' : 'holds it'}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '16px 0', color: 'var(--text-faint)', fontSize: 13 }}>Unclaimed</div>
                  )}
                  <button
                    className="btn btn-block"
                    style={{ fontSize: 12.5, opacity: pending ? 0.6 : 1 }}
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
