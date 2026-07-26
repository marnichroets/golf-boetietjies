import { useEffect, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { timeAgo } from '../utils/time'

const TYPE_META = {
  eagle: { label: 'Eagle', className: 'feed-tag-gold' },
  birdie: { label: 'Birdie', className: 'feed-tag-gold' },
  blowup: { label: 'Blow-up', className: 'feed-tag-danger' },
  longest_drive: { label: 'Longest Drive', className: 'feed-tag-brass' },
  nearest_pin: { label: 'Nearest Pin', className: 'feed-tag-brass' },
  new_leader: { label: 'New Leader', className: 'feed-tag-forest' },
}

export default function LiveFeed() {
  const { players, feedEvents } = useGolfData()
  const [, forceTick] = useState(0)

  // Re-render periodically just to keep the "how long ago" labels fresh.
  useEffect(() => {
    const id = setInterval(() => forceTick((v) => v + 1), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '4px 0 10px' }}>
        <span className="section-heading" style={{ margin: 0 }}>
          Live Commentary
        </span>
        <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="sync-dot" />
          Live
        </span>
      </div>

      {feedEvents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13.5 }}>
          Quiet so far. Something good (or disastrous) will show up here.
        </div>
      ) : (
        <div className="card-flush">
          {feedEvents.map((event) => {
            const player = players.find((p) => p.id === event.player_id)
            const meta = TYPE_META[event.type] || { label: event.type, className: 'feed-tag-brass' }
            return (
              <div key={event.id} className="feed-row">
                <span
                  className="avatar"
                  style={{
                    width: 34,
                    height: 34,
                    fontSize: 15,
                    flexShrink: 0,
                    background: player?.photo_url ? 'transparent' : playerColor(player),
                  }}
                >
                  {player?.photo_url ? <img src={player.photo_url} alt="" /> : playerEmoji(player)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className={`feed-tag ${meta.className}`}>{meta.label}</span>
                  <div className="feed-message">{event.message}</div>
                </div>
                <span className="feed-time">{timeAgo(event.created_at)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
