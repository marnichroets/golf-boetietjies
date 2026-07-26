import { useEffect, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'

const VISIBLE_MS = 4500

export default function FeedToast() {
  const { players, latestEvent } = useGolfData()
  const [visible, setVisible] = useState(null)

  useEffect(() => {
    if (!latestEvent) return
    setVisible(latestEvent)
    const id = setTimeout(() => {
      setVisible((current) => (current?.id === latestEvent.id ? null : current))
    }, VISIBLE_MS)
    return () => clearTimeout(id)
  }, [latestEvent])

  if (!visible) return null
  const player = players.find((p) => p.id === visible.player_id)

  return (
    <div className="feed-toast" onClick={() => setVisible(null)} role="status">
      <span
        className="avatar"
        style={{
          width: 26,
          height: 26,
          fontSize: 13,
          flexShrink: 0,
          background: player?.photo_url ? 'transparent' : playerColor(player),
        }}
      >
        {player?.photo_url ? <img src={player.photo_url} alt="" /> : playerEmoji(player)}
      </span>
      <span className="feed-toast-text">{visible.message}</span>
    </div>
  )
}
