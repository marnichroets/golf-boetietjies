import { useNavigate } from 'react-router-dom'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { Crest, SwapIcon } from './icons'

export default function TopBar() {
  const { connected, players } = useGolfData()
  const { playerId, setPlayerId } = useLocalPlayer()
  const navigate = useNavigate()
  const me = players.find((p) => p.id === playerId)

  const switchPlayer = () => {
    setPlayerId(null)
    navigate('/')
  }

  return (
    <div className="top-bar">
      <div className="brand">
        <Crest size={22} style={{ color: 'var(--brass)' }} />
        <span className="brand-word">Golf Boetietjies</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div className="conn-pill">
          <span className={`sync-dot ${connected ? '' : 'pending'}`} />
          {connected ? 'Live' : 'Offline'}
        </div>
        {me && (
          <>
            <span className="pill" style={{ border: '1px solid var(--border)' }}>
              <span
                className="avatar"
                style={{
                  width: 18,
                  height: 18,
                  fontSize: 11,
                  background: me.photo_url ? 'transparent' : playerColor(me),
                }}
              >
                {me.photo_url ? <img src={me.photo_url} alt="" /> : playerEmoji(me)}
              </span>
              {me.name}
            </span>
            <button
              onClick={switchPlayer}
              aria-label="Not you? Switch player"
              title="Not you? Switch player"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'var(--surface-alt)',
                color: 'var(--brass)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <SwapIcon width={14} height={14} strokeWidth={2} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
