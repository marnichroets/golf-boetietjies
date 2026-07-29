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
    <>
      <div className="top-bar fairway">
        <div className="brand">
          <Crest size={23} style={{ color: 'var(--brass-light)' }} />
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
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-alt)',
                  color: 'var(--brass)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <SwapIcon width={16} height={16} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
      <svg className="grass-edge" viewBox="0 0 40 8" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 8 L0 3 L2 8 L4 2 L6 8 L8 3 L10 8 L12 2 L14 8 L16 3 L18 8 L20 2 L22 8 L24 3 L26 8 L28 2 L30 8 L32 3 L34 8 L36 2 L38 8 L40 3 L40 8 Z"
          fill="#1f5c40"
        />
      </svg>
    </>
  )
}
