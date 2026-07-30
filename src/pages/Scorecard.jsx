import { useEffect, useMemo, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { useFourball, MAX_GROUP } from '../hooks/useFourball'
import { roundSummary, formatRelativePar } from '../utils/stableford'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { CheckIcon, UsersIcon } from '../components/icons'

const NUMPAD_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function shortLabel(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

// shortLabel() collides whenever two players' names reduce to the same
// "First L." form (e.g. "Player 10" and "Player 13" both shorten to
// "Player 1.") — which reads exactly like the same player got added to
// the group twice. Falls back to the full name for anyone involved in a
// collision so the group bar/header/totals never show two players as if
// they were one.
function buildLabels(groupPlayers, myId) {
  const counts = {}
  for (const p of groupPlayers) {
    if (p.id === myId) continue
    const label = shortLabel(p.name)
    counts[label] = (counts[label] || 0) + 1
  }
  const labels = {}
  for (const p of groupPlayers) {
    if (p.id === myId) {
      labels[p.id] = 'You'
    } else {
      const label = shortLabel(p.name)
      labels[p.id] = counts[label] > 1 ? p.name : label
    }
  }
  return labels
}

// strokes === 0 is the deliberate "picked up / no score" sentinel — it must
// never be run through par-diff colouring (0 - par would read as a wild
// eagle) or shown as the literal number 0.
function cellLabel(strokes) {
  if (strokes == null) return '–'
  if (strokes === 0) return 'P/U'
  return strokes
}

function cellColor(strokes, par) {
  if (strokes == null) return 'var(--text-faint)'
  if (strokes === 0) return 'var(--brass-ink)'
  const diff = strokes - par
  if (diff <= -1) return 'var(--brass-ink)'
  if (diff === 0) return 'var(--text)'
  if (diff === 1) return 'var(--text-dim)'
  return 'var(--danger)'
}

export default function Scorecard() {
  const { players, courseHoles, scores, upsertScore, clearScore, isPending } = useGolfData()
  const { playerId: myId } = useLocalPlayer()
  const { groupIds, setGroupIds, toggleMember } = useFourball()
  const [round, setRound] = useState(1)
  const [nine, setNine] = useState('front')
  const [activeCell, setActiveCell] = useState(null)
  const [editingGroup, setEditingGroup] = useState(groupIds.length === 0)

  // Pre-select "you" as a convenience starting point the very first time the
  // picker shows up empty — the group is still fully editable from there.
  // Uses an idempotent update (not toggleMember) since StrictMode double-
  // invokes mount effects in dev, which would otherwise add-then-remove.
  useEffect(() => {
    if (myId) setGroupIds((prev) => (prev.length === 0 ? [myId] : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (groupIds.length === 0) setEditingGroup(true)
  }, [groupIds.length])

  const allHoles = courseHoles[round] || []
  const frontHoles = useMemo(() => allHoles.filter((h) => h.hole <= 9), [allHoles])
  const backHoles = useMemo(() => allHoles.filter((h) => h.hole >= 10), [allHoles])
  const activeHoles = nine === 'front' ? frontHoles : backHoles

  const groupPlayers = groupIds.map((id) => players.find((p) => p.id === id)).filter(Boolean)
  const labels = useMemo(() => buildLabels(groupPlayers, myId), [groupPlayers, myId])

  useEffect(() => {
    const stillValid =
      activeCell && groupIds.includes(activeCell.playerId) && activeHoles.some((h) => h.hole === activeCell.hole)
    if (!stillValid) {
      if (groupPlayers.length > 0 && activeHoles.length > 0) {
        setActiveCell({ playerId: groupPlayers[0].id, hole: activeHoles[0].hole })
      } else {
        setActiveCell(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, nine, groupIds.join(',')])

  const activeHoleInfo = activeCell && activeHoles.find((h) => h.hole === activeCell.hole)
  const activePlayer = activeCell && players.find((p) => p.id === activeCell.playerId)
  const activeStrokes = activeCell ? (scores[activeCell.playerId]?.[round]?.[activeCell.hole] ?? null) : null

  // val === 0 is the deliberate "picked up / no score" sentinel and passes
  // through untouched; every other value clamps to the normal 1-15 range.
  const writeActiveStrokes = (val) => {
    if (!activeCell) return
    const clamped = val === 0 ? 0 : Math.max(1, Math.min(15, val))
    upsertScore(activeCell.playerId, round, activeCell.hole, clamped)
  }

  // Used by the numpad and the P/U button: write the value, then jump to
  // the next cell (next player on this hole, else first player on the next
  // hole) — keeps bulk group entry fast.
  const setActiveStrokes = (val) => {
    if (!activeCell) return
    writeActiveStrokes(val)
    const playerIdx = groupIds.indexOf(activeCell.playerId)
    const holeIdx = activeHoles.findIndex((h) => h.hole === activeCell.hole)
    if (playerIdx < groupIds.length - 1) {
      setActiveCell({ playerId: groupIds[playerIdx + 1], hole: activeCell.hole })
    } else if (holeIdx < activeHoles.length - 1) {
      setActiveCell({ playerId: groupIds[0], hole: activeHoles[holeIdx + 1].hole })
    }
  }

  // Resets the active cell to genuinely unentered — distinct from both P/U
  // (0, a deliberate no-score) and a real stroke count. Doesn't auto-advance,
  // since clearing is a correction, not entry.
  const clearActiveStrokes = () => {
    if (!activeCell) return
    clearScore(activeCell.playerId, round, activeCell.hole)
  }

  const pendingKey = activeCell ? `score:${activeCell.playerId}:${round}:${activeCell.hole}` : null

  if (editingGroup) {
    return (
      <FourballPicker
        players={players}
        groupIds={groupIds}
        toggleMember={toggleMember}
        myId={myId}
        hasExistingGroup={groupPlayers.length > 0}
        onDone={() => setEditingGroup(false)}
      />
    )
  }

  return (
    <div>
      <h1 className="page-title">Scorecard</h1>
      <p className="page-subtitle">Fast entry, big numbers, no excuses.</p>

      <div className="segmented" style={{ marginBottom: 12 }}>
        {[1, 2].map((r) => (
          <button key={r} className={round === r ? 'active' : ''} onClick={() => setRound(r)}>
            Round {r}
          </button>
        ))}
      </div>

      <GroupBar groupPlayers={groupPlayers} labels={labels} onChange={() => setEditingGroup(true)} />

      <div className="segmented" style={{ marginBottom: 14 }}>
        <button className={nine === 'front' ? 'active' : ''} onClick={() => setNine('front')}>
          Front 9
        </button>
        <button className={nine === 'back' ? 'active' : ''} onClick={() => setNine('back')}>
          Back 9
        </button>
      </div>

      <div className="card-flush" style={{ marginBottom: 14 }}>
        <GridHeaderRow groupPlayers={groupPlayers} labels={labels} />
        {activeHoles.map((h) => (
          <div
            key={h.hole}
            className="sc-grid-row"
            style={{ gridTemplateColumns: `50px repeat(${groupPlayers.length}, 1fr)` }}
          >
            <div className="sc-hole-label">
              <div className="sc-hole-num">{h.hole}</div>
              <div className="sc-hole-meta">
                P{h.par} · SI{h.stroke_index}
              </div>
              <div className="sc-hole-dist">{h.metres != null ? `${h.metres}m` : ''}</div>
            </div>
            {groupPlayers.map((p) => {
              const strokes = scores[p.id]?.[round]?.[h.hole] ?? null
              const isActive = activeCell && activeCell.playerId === p.id && activeCell.hole === h.hole
              return (
                <button
                  key={p.id}
                  className="sc-cell"
                  onClick={() => setActiveCell({ playerId: p.id, hole: h.hole })}
                  style={{
                    border: isActive ? '1.5px solid var(--brass)' : '1px solid var(--border)',
                    background: isActive ? 'rgba(201,162,39,0.16)' : 'var(--surface-hi)',
                    color: cellColor(strokes, h.par),
                    fontSize: strokes === 0 ? 12 : undefined,
                  }}
                >
                  {cellLabel(strokes)}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <NumberPad
        activeCell={activeCell}
        activeHoleInfo={activeHoleInfo}
        activePlayer={activePlayer}
        activeStrokes={activeStrokes}
        labels={labels}
        pendingKey={pendingKey}
        isPending={isPending}
        setActiveStrokes={setActiveStrokes}
        clearActiveStrokes={clearActiveStrokes}
      />

      <ScorecardTotals
        round={round}
        groupPlayers={groupPlayers}
        labels={labels}
        frontHoles={frontHoles}
        backHoles={backHoles}
        scores={scores}
      />
    </div>
  )
}

function FourballPicker({ players, groupIds, toggleMember, myId, hasExistingGroup, onDone }) {
  return (
    <div>
      <h1 className="page-title">Pick Your Fourball</h1>
      <p className="page-subtitle">
        Select up to {MAX_GROUP} players — this sticks around, so you won't have to redo it every hole.
      </p>

      <div className="pick-grid" style={{ marginBottom: 18 }}>
        {players.map((p) => {
          const selected = groupIds.includes(p.id)
          const disabled = !selected && groupIds.length >= MAX_GROUP
          return (
            <button
              key={p.id}
              className={`card pick-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && toggleMember(p.id)}
            >
              {selected && (
                <span className="pick-card-check">
                  <CheckIcon width={11} height={11} strokeWidth={2.6} />
                </span>
              )}
              <span
                className="avatar"
                style={{
                  width: 52,
                  height: 52,
                  fontSize: 22,
                  background: p.photo_url ? 'transparent' : playerColor(p),
                }}
              >
                {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : playerEmoji(p)}
              </span>
              <div className="pick-card-name">{p.id === myId ? `${p.name} (you)` : p.name}</div>
              <div className="eyebrow">HCP {p.handicap}</div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {hasExistingGroup && (
          <button className="btn" style={{ flex: 1 }} onClick={onDone}>
            Cancel
          </button>
        )}
        <button className="btn btn-accent" style={{ flex: 2 }} disabled={groupIds.length === 0} onClick={onDone}>
          {hasExistingGroup ? 'Save Group' : 'Start Scoring'} ({groupIds.length}/{MAX_GROUP})
        </button>
      </div>
    </div>
  )
}

function GroupBar({ groupPlayers, labels, onChange }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 14 }}>
      <UsersIcon width={16} height={16} style={{ color: 'var(--brass)', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexShrink: 0 }}>
        {groupPlayers.map((p, i) => (
          <span
            key={p.id}
            className="avatar"
            style={{
              width: 28,
              height: 28,
              fontSize: 13,
              marginLeft: i === 0 ? 0 : -8,
              border: '2px solid var(--surface)',
              background: p.photo_url ? 'transparent' : playerColor(p),
              zIndex: 10 - i,
            }}
          >
            {p.photo_url ? <img src={p.photo_url} alt="" /> : playerEmoji(p)}
          </span>
        ))}
      </div>
      <span
        style={{
          fontSize: 12,
          color: 'var(--text-dim)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {groupPlayers.map((p) => labels[p.id]).join(', ')}
      </span>
      <button
        className="pill pill-brass"
        style={{ cursor: 'pointer', border: 'none', flexShrink: 0, padding: '11px 16px', fontSize: 12.5, minHeight: 40 }}
        onClick={onChange}
      >
        Change
      </button>
    </div>
  )
}

function GridHeaderRow({ groupPlayers, labels }) {
  return (
    <div className="sc-grid-header" style={{ gridTemplateColumns: `50px repeat(${groupPlayers.length}, 1fr)` }}>
      <span className="eyebrow">Hole</span>
      {groupPlayers.map((p) => (
        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
          <span
            className="avatar"
            style={{
              width: 22,
              height: 22,
              fontSize: 11,
              background: p.photo_url ? 'transparent' : playerColor(p),
            }}
          >
            {p.photo_url ? <img src={p.photo_url} alt="" /> : playerEmoji(p)}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-dim)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {labels[p.id]}
          </span>
        </div>
      ))}
    </div>
  )
}

// Permanent, always-on entry pad — tap a cell in the grid above, then tap a
// digit here to write it and auto-advance. Sticks to the bottom of the
// viewport (above the bottom nav) once you scroll past it, so it stays in
// thumb's reach through a full 9/18-hole bulk-entry pass instead of forcing
// a scroll back up between every tap.
function NumberPad({
  activeCell,
  activeHoleInfo,
  activePlayer,
  activeStrokes,
  labels,
  pendingKey,
  isPending,
  setActiveStrokes,
  clearActiveStrokes,
}) {
  const hasActive = Boolean(activeCell && activeHoleInfo && activePlayer)

  return (
    <div className="card-flush numpad-panel" style={{ marginBottom: 16 }}>
      <div className="numpad-context">
        <span>
          {hasActive
            ? `Hole ${activeCell.hole} · ${labels[activePlayer.id] ?? activePlayer.name} · Par ${activeHoleInfo.par}`
            : 'Tap a cell to enter a score'}
        </span>
        <span className={`sync-dot ${pendingKey && isPending(pendingKey) ? 'pending' : ''}`} />
      </div>

      <div className="numpad">
        {NUMPAD_VALUES.map((val) => (
          <button
            key={val}
            className={`numpad-btn ${hasActive && val === activeHoleInfo.par ? 'is-par' : ''} ${val === activeStrokes ? 'is-selected' : ''}`}
            disabled={!hasActive}
            onClick={() => setActiveStrokes(val)}
          >
            {val}
          </button>
        ))}
      </div>

      <div className="numpad-actions">
        <button
          className={`btn-blank numpad-action ${activeStrokes === 0 ? 'is-selected' : ''}`}
          disabled={!hasActive}
          onClick={() => setActiveStrokes(0)}
        >
          Picked up (P/U)
        </button>
        <button
          className="numpad-action numpad-action-clear"
          disabled={!hasActive || activeStrokes == null}
          onClick={clearActiveStrokes}
        >
          Clear
        </button>
      </div>
    </div>
  )
}

function ScorecardTotals({ round, groupPlayers, labels, frontHoles, backHoles, scores }) {
  const allHoles = useMemo(() => [...frontHoles, ...backHoles], [frontHoles, backHoles])

  const rows = [
    { key: 'out', label: 'OUT', holes: frontHoles },
    { key: 'in', label: 'IN', holes: backHoles },
    { key: 'total', label: 'TOTAL', holes: allHoles, isTotal: true },
  ]

  return (
    <div className="card-flush">
      <div className="sc-grid-header" style={{ gridTemplateColumns: `50px repeat(${groupPlayers.length}, 1fr)` }}>
        <span className="eyebrow">Totals</span>
        {groupPlayers.map((p) => (
          <span
            key={p.id}
            style={{
              fontSize: 10,
              fontWeight: 700,
              textAlign: 'center',
              color: 'var(--text-dim)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {labels[p.id]}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.key}
          className={`sc-totals-row ${row.isTotal ? 'total' : ''}`}
          style={{ gridTemplateColumns: `50px repeat(${groupPlayers.length}, 1fr)` }}
        >
          <span className="sc-totals-label">{row.label}</span>
          {groupPlayers.map((p) => {
            const summary = roundSummary(scores[p.id]?.[round] || {}, row.holes, p.handicap)
            if (summary.holesPlayed === 0) {
              return (
                <div key={p.id} style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                  –
                </div>
              )
            }
            return (
              <div key={p.id} style={{ textAlign: 'center' }}>
                <div
                  className="num-display"
                  style={{ fontSize: row.isTotal ? 21 : 16, color: row.isTotal ? 'var(--brass-ink)' : 'var(--text)' }}
                >
                  {summary.points}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                  {summary.parPlayed === 0 ? 'P/U' : `${summary.grossStrokes} (${formatRelativePar(summary.toPar)})`}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
