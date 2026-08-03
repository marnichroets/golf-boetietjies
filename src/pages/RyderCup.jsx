import { useMemo, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { computeMatchStatus, matchPoints, formatPoints } from '../utils/matchplay'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { PencilIcon } from '../components/icons'
import { ROUND_FORMAT_LABELS } from '../utils/roundFormats'

const MATCH_SLOTS = [
  { matchNumber: 1, format: 'fourball' },
  { matchNumber: 2, format: 'fourball' },
  { matchNumber: 3, format: 'fourball' },
  { matchNumber: 4, format: 'singles' },
]

function scoresByPlayerForRound(players, scores, round) {
  const map = {}
  for (const p of players) map[p.id] = scores[p.id]?.[round] || {}
  return map
}

export default function RyderCup() {
  const { players, teams, pairings, courseHoles, scores, savePairing } = useGolfData()
  const [round, setRound] = useState(1)
  const [editingSlot, setEditingSlot] = useState(null)

  const teamA = teams[0]
  const teamB = teams[1]

  // Every finished match across both rounds banks toward the cup total —
  // an in-progress match's live lean shows on its own card but isn't
  // counted here yet.
  const totals = useMemo(() => {
    if (!teamA || !teamB) return { a: 0, b: 0 }
    const acc = { a: 0, b: 0 }
    for (const r of [1, 2]) {
      const holes = courseHoles[r] || []
      const scoresByPlayer = scoresByPlayerForRound(players, scores, r)
      for (const pairing of pairings.filter((p) => p.round === r)) {
        const status = computeMatchStatus({ sideA: pairing.side_a, sideB: pairing.side_b, holes, scoresByPlayer, players })
        const pts = matchPoints(status)
        acc.a += pts.a
        acc.b += pts.b
      }
    }
    return acc
  }, [teamA, teamB, pairings, courseHoles, scores, players])

  if (!teamA || !teamB) {
    return (
      <div>
        <h1 className="page-title">Ryder Cup</h1>
        <p className="page-subtitle">Set up two teams from the Players tab first.</p>
      </div>
    )
  }

  const holes = courseHoles[round] || []
  const scoresByPlayer = scoresByPlayerForRound(players, scores, round)
  const editingFormat = editingSlot != null ? MATCH_SLOTS.find((s) => s.matchNumber === editingSlot).format : null

  return (
    <div>
      <CupHeader teamA={teamA} teamB={teamB} totals={totals} />

      <div className="segmented" style={{ marginBottom: 16 }}>
        {[1, 2].map((r) => (
          <button key={r} className={round === r ? 'active' : ''} onClick={() => setRound(r)}>
            Round {r} · {ROUND_FORMAT_LABELS[r]}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {MATCH_SLOTS.map((slot) => {
          const pairing = pairings.find((p) => p.round === round && p.match_number === slot.matchNumber) || null
          return (
            <MatchCard
              key={slot.matchNumber}
              slot={slot}
              pairing={pairing}
              teamA={teamA}
              teamB={teamB}
              players={players}
              holes={holes}
              scoresByPlayer={scoresByPlayer}
              onEdit={() => setEditingSlot(slot.matchNumber)}
            />
          )
        })}
      </div>

      {editingSlot != null && (
        <MatchEditor
          matchNumber={editingSlot}
          format={editingFormat}
          teamA={teamA}
          teamB={teamB}
          players={players}
          existing={pairings.find((p) => p.round === round && p.match_number === editingSlot)}
          onSave={(sideA, sideB) => {
            savePairing({ round, matchNumber: editingSlot, format: editingFormat, sideA, sideB })
            setEditingSlot(null)
          }}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </div>
  )
}

function CupHeader({ teamA, teamB, totals }) {
  return (
    <div className="cup-header fairway">
      <div
        className="cup-header-split"
        style={{ backgroundImage: `linear-gradient(100deg, ${teamA.color}66 0%, transparent 42%, transparent 58%, ${teamB.color}66 100%)` }}
      />
      <div className="cup-header-content">
        <div className="eyebrow" style={{ color: 'var(--brass-light)' }}>
          Ryder Cup
        </div>
        <div className="cup-score-row">
          <span className="cup-team-name" style={{ color: teamA.color }}>
            {teamA.name}
          </span>
          <span className="cup-score">
            {formatPoints(totals.a)} – {formatPoints(totals.b)}
          </span>
          <span className="cup-team-name" style={{ color: teamB.color }}>
            {teamB.name}
          </span>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ slot, pairing, teamA, teamB, players, holes, scoresByPlayer, onEdit }) {
  const formatLabel = slot.format === 'fourball' ? 'Fourball · 2 v 2' : 'Singles · 1 v 1'

  if (!pairing) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="eyebrow">
          Match {slot.matchNumber} · {formatLabel}
        </div>
        <button className="btn btn-accent" style={{ marginTop: 12 }} onClick={onEdit}>
          Set Match
        </button>
      </div>
    )
  }

  const status = computeMatchStatus({ sideA: pairing.side_a, sideB: pairing.side_b, holes, scoresByPlayer, players })
  const sideAPlayers = pairing.side_a.map((id) => players.find((p) => p.id === id)).filter(Boolean)
  const sideBPlayers = pairing.side_b.map((id) => players.find((p) => p.id === id)).filter(Boolean)
  const leading = status.diff > 0 ? 'a' : status.diff < 0 ? 'b' : null
  const statusColor = leading ? (leading === 'a' ? teamA.color : teamB.color) : 'var(--text-dim)'

  return (
    <div className="card match-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="eyebrow">
          Match {slot.matchNumber} · {formatLabel}
        </span>
        <button className="btn-clear" aria-label="Edit match" title="Edit match" onClick={onEdit}>
          <PencilIcon width={12} height={12} />
        </button>
      </div>
      <div className="match-sides">
        <MatchSide players={sideAPlayers} color={teamA.color} highlight={leading === 'a'} />
        <div className="match-status-pill" style={{ color: statusColor, borderColor: leading ? statusColor : 'var(--border)' }}>
          {status.label}
        </div>
        <MatchSide players={sideBPlayers} color={teamB.color} highlight={leading === 'b'} align="right" />
      </div>
    </div>
  )
}

function MatchSide({ players, color, highlight, align }) {
  return (
    <div className="match-side" style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {players.map((p) => (
        <span
          key={p.id}
          className="avatar"
          style={{
            width: 36,
            height: 36,
            fontSize: 15,
            marginLeft: align === 'right' ? -8 : 0,
            marginRight: align === 'right' ? 0 : -8,
            boxShadow: highlight ? `0 0 0 2px ${color}, 0 3px 8px -3px rgba(0,0,0,0.5)` : 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 3px 8px -3px rgba(0,0,0,0.5)',
            background: p.photo_url ? 'transparent' : playerColor(p),
          }}
        >
          {p.photo_url ? <img src={p.photo_url} alt="" /> : playerEmoji(p)}
        </span>
      ))}
    </div>
  )
}

function MatchEditor({ matchNumber, format, teamA, teamB, players, existing, onSave, onClose }) {
  const maxPerSide = format === 'fourball' ? 2 : 1
  const [sideA, setSideA] = useState(existing?.side_a || [])
  const [sideB, setSideB] = useState(existing?.side_b || [])
  const teamAPlayers = players.filter((p) => p.team_id === teamA.id)
  const teamBPlayers = players.filter((p) => p.team_id === teamB.id)

  const toggle = (side, setSide, id) => {
    setSide((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= maxPerSide) return prev
      return [...prev, id]
    })
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(4, 8, 5, 0.68)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 auto',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'linear-gradient(160deg, var(--surface) 0%, var(--surface-alt) 100%)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-pop)',
          padding: '18px 18px calc(22px + var(--safe-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 16px' }} />
        <div className="eyebrow">
          Match {matchNumber} · {format === 'fourball' ? 'Fourball (2 v 2)' : 'Singles (1 v 1)'}
        </div>

        <div className="section-heading" style={{ color: teamA.color, marginTop: 16 }}>
          {teamA.name} — pick {maxPerSide}
        </div>
        <div className="chip-grid">
          {teamAPlayers.map((p) => (
            <button key={p.id} className={`chip ${sideA.includes(p.id) ? 'selected' : ''}`} onClick={() => toggle(sideA, setSideA, p.id)}>
              {p.name}
            </button>
          ))}
          {teamAPlayers.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>No players on {teamA.name} yet.</div>}
        </div>

        <div className="section-heading" style={{ color: teamB.color, marginTop: 16 }}>
          {teamB.name} — pick {maxPerSide}
        </div>
        <div className="chip-grid">
          {teamBPlayers.map((p) => (
            <button key={p.id} className={`chip ${sideB.includes(p.id) ? 'selected' : ''}`} onClick={() => toggle(sideB, setSideB, p.id)}>
              {p.name}
            </button>
          ))}
          {teamBPlayers.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>No players on {teamB.name} yet.</div>}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-accent"
            style={{ flex: 2 }}
            disabled={sideA.length !== maxPerSide || sideB.length !== maxPerSide}
            onClick={() => onSave(sideA, sideB)}
          >
            Save Match
          </button>
        </div>
      </div>
    </div>
  )
}
