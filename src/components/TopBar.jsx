import { useNavigate } from 'react-router-dom'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerEmoji } from '../utils/playerVisuals'

export default function TopBar() {
  const { connected, players } = useGolfData()
  const { playerId, setPlayerId } = useLocalPlayer()
  const navigate = useNavigate()
  const me = players.find((p) => p.id === playerId)

  return (
    <div className="top-bar">
      <div className="brand">🏌️ Golf Boetietjies</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="conn-pill">
          <span className={`sync-dot ${connected ? '' : 'pending'}`} />
          {connected ? 'Live' : 'Offline'}
        </div>
        {me && (
          <button
            className="pill"
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => {
              setPlayerId(null)
              navigate('/')
            }}
          >
            {playerEmoji(me)} {me.name}
          </button>
        )}
      </div>
    </div>
  )
}
