import { useNavigate } from 'react-router-dom'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { Crest } from './icons'

export default function TopBar() {
  const { connected, players } = useGolfData()
  const { playerId, setPlayerId } = useLocalPlayer()
  const navigate = useNavigate()
  const me = players.find((p) => p.id === playerId)

  return (
    <div className="top-bar">
      <div className="brand">
        <Crest size={22} style={{ color: 'var(--brass)' }} />
        <span className="brand-word">Golf Boetietjies</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="conn-pill">
          <span className={`sync-dot ${connected ? '' : 'pending'}`} />
          {connected ? 'Live' : 'Offline'}
        </div>
        {me && (
          <button
            className="pill"
            style={{ border: '1px solid var(--border)', cursor: 'pointer' }}
            onClick={() => {
              setPlayerId(null)
              navigate('/')
            }}
          >
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
          </button>
        )}
      </div>
    </div>
  )
}
