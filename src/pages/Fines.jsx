import { useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { TicketIcon, TrashIcon } from '../components/icons'
import { FINE_REASONS } from '../utils/fineReasons'

// Under a minute: "just now". Under an hour: relative ("2m ago") since
// that's the useful window mid-round. Beyond that, a clock time ("14:32")
// is more useful than "3h ago" across a long day on the course.
function fineTimestamp(iso) {
  const date = new Date(iso)
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function Fines() {
  const { players, fines, logFine, deleteFine } = useGolfData()
  const { playerId: myId } = useLocalPlayer()
  const [reason, setReason] = useState(null)
  const [culprit, setCulprit] = useState(null)

  const submitFine = () => {
    if (!reason || !culprit) return
    logFine(culprit, reason, myId)
    setReason(null)
    setCulprit(null)
  }

  return (
    <div>
      <h1 className="page-title">Fines</h1>
      <p className="page-subtitle">House rules. Nobody's exempt.</p>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="section-heading">
          <TicketIcon width={17} height={17} style={{ color: 'var(--brass)' }} />
          Log a Fine
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Offence
        </div>
        <div className="chip-grid" style={{ marginBottom: 16 }}>
          {FINE_REASONS.map((r) => (
            <button key={r} className={`chip ${reason === r ? 'selected' : ''}`} onClick={() => setReason(r)}>
              {r}
            </button>
          ))}
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Who?
        </div>
        <div className="chip-grid" style={{ marginBottom: 16 }}>
          {players.map((p) => (
            <button key={p.id} className={`chip ${culprit === p.id ? 'selected' : ''}`} onClick={() => setCulprit(p.id)}>
              {p.name}
            </button>
          ))}
        </div>

        <button className="btn btn-accent btn-block" disabled={!reason || !culprit} onClick={submitFine}>
          Log Fine
        </button>
      </div>

      <div className="section-heading">Fine Log</div>
      <div className="card-flush">
        {fines.length === 0 ? (
          <EmptyRow text="No fines yet. Give it time." />
        ) : (
          fines.map((f) => (
            <FineRow
              key={f.id}
              fine={f}
              player={players.find((p) => p.id === f.player_id)}
              loggedBy={players.find((p) => p.id === f.logged_by_player_id)}
              canDelete={!!myId && f.logged_by_player_id === myId}
              onDelete={() => deleteFine(f.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function EmptyRow({ text }) {
  return <div style={{ padding: '18px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>{text}</div>
}

function FineRow({ fine, player, loggedBy, canDelete, onDelete }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '11px 14px',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <span
        className="avatar"
        style={{ width: 34, height: 34, fontSize: 15, flexShrink: 0, background: player?.photo_url ? 'transparent' : playerColor(player) }}
      >
        {player?.photo_url ? <img src={player.photo_url} alt="" /> : playerEmoji(player)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player?.name ?? 'Unknown'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fine.reason}
          {loggedBy && <span style={{ color: 'var(--text-faint)' }}> · logged by {loggedBy.name}</span>}
        </div>
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{fineTimestamp(fine.created_at)}</span>
      {canDelete && (
        <button
          className="btn-clear"
          aria-label="Delete fine"
          title="Delete fine"
          onClick={onDelete}
          style={{ flexShrink: 0 }}
        >
          <TrashIcon width={14} height={14} />
        </button>
      )}
    </div>
  )
}
