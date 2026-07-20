import { useEffect, useMemo, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { holePoints, strokesReceived, roundSummary, formatRelativePar } from '../utils/stableford'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { CheckIcon } from '../components/icons'

const POINT_LABELS = { 0: 'Blow up', 1: 'Bogey', 2: 'Par', 3: 'Birdie', 4: 'Eagle', 5: 'Albatross' }
const MAX_GROUP = 4

function shortLabel(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

function cellColor(diff) {
  if (diff <= -1) return 'var(--brass-light)'
  if (diff === 0) return 'var(--text)'
  if (diff === 1) return 'var(--text-dim)'
  return 'var(--danger)'
}

export default function Scorecard() {
  const { players, courseHoles, scores, upsertScore, isPending } = useGolfData()
  const { playerId: myId } = useLocalPlayer()
  const [round, setRound] = useState(1)
  const [nine, setNine] = useState('front')
  const [groupIds, setGroupIds] = useState(() => (myId ? [myId] : []))
  const [activeCell, setActiveCell] = useState(null)

  useEffect(() => {
    if (myId && groupIds.length === 0) setGroupIds([myId])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId])

  const allHoles = courseHoles[round] || []
  const frontHoles = useMemo(() => allHoles.filter((h) => h.hole <= 9), [allHoles])
  const backHoles = useMemo(() => allHoles.filter((h) => h.hole >= 10), [allHoles])
  const activeHoles = nine === 'front' ? frontHoles : backHoles

  const groupPlayers = groupIds.map((id) => players.find((p) => p.id === id)).filter(Boolean)

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

  const toggleGroupMember = (id) => {
    setGroupIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_GROUP) return prev
      return [...prev, id]
    })
  }

  const activeHoleInfo = activeCell && activeHoles.find((h) => h.hole === activeCell.hole)
  const activePlayer = activeCell && players.find((p) => p.id === activeCell.playerId)
  const activeStrokes = activeCell ? (scores[activeCell.playerId]?.[round]?.[activeCell.hole] ?? null) : null

  const activePoints = useMemo(() => {
    if (!activeHoleInfo || !activePlayer) return null
    return holePoints({
      strokes: activeStrokes,
      par: activeHoleInfo.par,
      handicap: activePlayer.handicap,
      strokeIndex: activeHoleInfo.stroke_index,
    })
  }, [activeStrokes, activeHoleInfo, activePlayer])

  const activeReceived =
    activeHoleInfo && activePlayer ? strokesReceived(activePlayer.handicap, activeHoleInfo.stroke_index) : 0

  const setActiveStrokes = (val) => {
    if (!activeCell) return
    const clamped = Math.max(1, Math.min(15, val))
    upsertScore(activeCell.playerId, round, activeCell.hole, clamped)

    // auto-advance to the next cell: next player on this hole, else first
    // player on the next hole in this nine — keeps bulk group entry fast.
    const playerIdx = groupIds.indexOf(activeCell.playerId)
    const holeIdx = activeHoles.findIndex((h) => h.hole === activeCell.hole)
    if (playerIdx < groupIds.length - 1) {
      setActiveCell({ playerId: groupIds[playerIdx + 1], hole: activeCell.hole })
    } else if (holeIdx < activeHoles.length - 1) {
      setActiveCell({ playerId: groupIds[0], hole: activeHoles[holeIdx + 1].hole })
    }
  }

  const pendingKey = activeCell ? `score:${activeCell.playerId}:${round}:${activeCell.hole}` : null

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

      <div className="eyebrow" style={{ margin: '2px 0 8px' }}>
        Scoring for (up to {MAX_GROUP})
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}>
        {players.map((p) => {
          const selected = groupIds.includes(p.id)
          const disabled = !selected && groupIds.length >= MAX_GROUP
          return (
            <button
              key={p.id}
              onClick={() => toggleGroupMember(p.id)}
              className={`pill ${selected ? 'pill-brass' : ''}`}
              style={{
                flexShrink: 0,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                padding: '8px 12px',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {selected && <CheckIcon width={11} height={11} strokeWidth={2.4} />}
              {p.name}
            </button>
          )
        })}
      </div>

      {groupPlayers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          Pick at least one player to start scoring.
        </div>
      ) : (
        <>
          <div className="segmented" style={{ marginBottom: 14 }}>
            <button className={nine === 'front' ? 'active' : ''} onClick={() => setNine('front')}>
              Front 9
            </button>
            <button className={nine === 'back' ? 'active' : ''} onClick={() => setNine('back')}>
              Back 9
            </button>
          </div>

          <div className="card-flush" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `44px repeat(${groupPlayers.length}, 1fr)`,
                borderBottom: '1px solid var(--border)',
                padding: '10px 10px',
                gap: 4,
              }}
            >
              <span className="eyebrow">Hole</span>
              {groupPlayers.map((p) => (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
                  <span
                    className="avatar"
                    style={{
                      width: 20,
                      height: 20,
                      fontSize: 10,
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
                    {p.id === myId ? 'You' : shortLabel(p.name)}
                  </span>
                </div>
              ))}
            </div>

            {activeHoles.map((h) => (
              <div
                key={h.hole}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `44px repeat(${groupPlayers.length}, 1fr)`,
                  alignItems: 'center',
                  padding: '7px 10px',
                  gap: 4,
                  borderBottom: '1px solid var(--border-soft)',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5 }}>{h.hole}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>
                    P{h.par} · {h.stroke_index}
                  </div>
                </div>
                {groupPlayers.map((p) => {
                  const strokes = scores[p.id]?.[round]?.[h.hole] ?? null
                  const isActive = activeCell && activeCell.playerId === p.id && activeCell.hole === h.hole
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveCell({ playerId: p.id, hole: h.hole })}
                      style={{
                        aspectRatio: '1',
                        maxHeight: 40,
                        borderRadius: 9,
                        border: isActive ? '1.5px solid var(--brass)' : '1px solid var(--border)',
                        background: isActive ? 'rgba(201,162,39,0.16)' : 'var(--surface-hi)',
                        color: strokes == null ? 'var(--text-faint)' : cellColor(strokes - h.par),
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 15,
                        cursor: 'pointer',
                      }}
                    >
                      {strokes ?? '–'}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {activeCell && activeHoleInfo && activePlayer && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="eyebrow">
                    Hole {activeCell.hole} · {activePlayer.id === myId ? 'You' : activePlayer.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 2 }}>
                    Par {activeHoleInfo.par} · SI {activeHoleInfo.stroke_index}
                    {activeReceived > 0 ? ` · +${activeReceived} shot${activeReceived > 1 ? 's' : ''}` : ''}
                  </div>
                </div>
                <span className={`sync-dot ${pendingKey && isPending(pendingKey) ? 'pending' : ''}`} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, margin: '24px 0' }}>
                <button
                  className="btn"
                  style={{ width: 54, height: 54, borderRadius: '50%', fontSize: 24, padding: 0 }}
                  onClick={() => setActiveStrokes((activeStrokes ?? activeHoleInfo.par) - 1)}
                >
                  −
                </button>
                <div style={{ textAlign: 'center', minWidth: 96 }}>
                  <div className="num-display" style={{ fontSize: 60, lineHeight: 1 }}>
                    {activeStrokes ?? '–'}
                  </div>
                  <div className="eyebrow" style={{ marginTop: 4 }}>
                    strokes
                  </div>
                </div>
                <button
                  className="btn btn-accent"
                  style={{ width: 54, height: 54, borderRadius: '50%', fontSize: 24, padding: 0 }}
                  onClick={() => setActiveStrokes((activeStrokes ?? activeHoleInfo.par) + 1)}
                >
                  +
                </button>
              </div>

              {activeStrokes == null ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[activeHoleInfo.par - 1, activeHoleInfo.par, activeHoleInfo.par + 1, activeHoleInfo.par + 2].map((val) => (
                    <button key={val} className="btn" onClick={() => setActiveStrokes(val)}>
                      {val}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <span className="pill pill-brass" style={{ fontSize: 13, padding: '6px 14px' }}>
                    {activePoints} pt{activePoints === 1 ? '' : 's'} · {POINT_LABELS[Math.min(activePoints, 5)] ?? 'Nice'}
                  </span>
                </div>
              )}
            </div>
          )}

          <RoundSummary round={round} groupPlayers={groupPlayers} frontHoles={frontHoles} backHoles={backHoles} scores={scores} myId={myId} />
        </>
      )}
    </div>
  )
}

function RoundSummary({ round, groupPlayers, frontHoles, backHoles, scores, myId }) {
  const allHoles = useMemo(() => [...frontHoles, ...backHoles], [frontHoles, backHoles])

  return (
    <div className="card-flush">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr 1fr 1fr',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span className="eyebrow">Player</span>
        <span className="eyebrow" style={{ textAlign: 'center' }}>
          Front
        </span>
        <span className="eyebrow" style={{ textAlign: 'center' }}>
          Back
        </span>
        <span className="eyebrow" style={{ textAlign: 'center' }}>
          Total
        </span>
      </div>
      {groupPlayers.map((p) => {
        const byHole = scores[p.id]?.[round] || {}
        const front = roundSummary(byHole, frontHoles, p.handicap)
        const back = roundSummary(byHole, backHoles, p.handicap)
        const total = roundSummary(byHole, allHoles, p.handicap)
        return (
          <div
            key={p.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr 1fr 1fr',
              alignItems: 'center',
              padding: '10px 14px',
              borderBottom: '1px solid var(--border-soft)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span
                className="avatar"
                style={{
                  width: 26,
                  height: 26,
                  fontSize: 12,
                  background: p.photo_url ? 'transparent' : playerColor(p),
                }}
              >
                {p.photo_url ? <img src={p.photo_url} alt="" /> : playerEmoji(p)}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.id === myId ? 'You' : p.name}
              </span>
            </div>
            <PeriodCell summary={front} />
            <PeriodCell summary={back} />
            <PeriodCell summary={total} emphasize />
          </div>
        )
      })}
    </div>
  )
}

function PeriodCell({ summary, emphasize }) {
  if (summary.holesPlayed === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>–</div>
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="num-display" style={{ fontSize: emphasize ? 19 : 16, color: emphasize ? 'var(--brass-light)' : 'var(--text)' }}>
        {summary.points}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
        {summary.grossStrokes} ({formatRelativePar(summary.toPar)})
      </div>
    </div>
  )
}
