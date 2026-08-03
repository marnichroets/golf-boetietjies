import { useMemo, useRef, useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { TicketIcon, WheelIcon } from '../components/icons'
import { FINE_REASONS } from '../utils/fineReasons'

const CLUBS = ['Driver', '3-Wood', 'Hybrid', 'Long Iron', 'Mid Iron', 'Short Iron', 'Wedge', 'Putter']

// A little reaction per club so the shared log reads like banter, not a
// database dump — Putter/Wedge off the tee is the punishment everyone
// dreads, Driver/3-Wood barely counts as a penalty.
const CLUB_REACTIONS = {
  Driver: '😎',
  '3-Wood': '🙂',
  Hybrid: '🙂',
  'Long Iron': '😬',
  'Mid Iron': '😬',
  'Short Iron': '😅',
  Wedge: '😂',
  Putter: '💀',
}

function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function Fines() {
  const { players, fines, logFine, wheelSpins, logWheelSpin } = useGolfData()
  const { playerId: myId } = useLocalPlayer()
  const [reason, setReason] = useState(null)
  const [culprit, setCulprit] = useState(null)

  const submitFine = () => {
    if (!reason || !culprit) return
    logFine(culprit, reason)
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
      <div className="card-flush" style={{ marginBottom: 22 }}>
        {fines.length === 0 ? (
          <EmptyRow text="No fines yet. Give it time." />
        ) : (
          fines.map((f) => <FineRow key={f.id} fine={f} player={players.find((p) => p.id === f.player_id)} />)
        )}
      </div>

      <SpinTheWheel players={players} myId={myId} wheelSpins={wheelSpins} logWheelSpin={logWheelSpin} />
    </div>
  )
}

function EmptyRow({ text }) {
  return <div style={{ padding: '18px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>{text}</div>
}

function FineRow({ fine, player }) {
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
        </div>
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{timeAgo(fine.created_at)}</span>
    </div>
  )
}

// ---------- Spin the Wheel ----------

const WHEEL_SIZE = 240
const CENTER = WHEEL_SIZE / 2
const RADIUS = WHEEL_SIZE / 2 - 6
const SLICE_ANGLE = 360 / CLUBS.length
const SPIN_MS = 3400

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function describeSlice(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

function SpinTheWheel({ players, myId, wheelSpins, logWheelSpin }) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const timeoutRef = useRef(null)
  const me = players.find((p) => p.id === myId)

  const slices = useMemo(
    () =>
      CLUBS.map((club, i) => {
        const startAngle = i * SLICE_ANGLE
        const endAngle = startAngle + SLICE_ANGLE
        const mid = startAngle + SLICE_ANGLE / 2
        const labelPos = polarToCartesian(CENTER, CENTER, RADIUS * 0.66, mid)
        return {
          club,
          path: describeSlice(CENTER, CENTER, RADIUS, startAngle, endAngle),
          fill: i % 2 === 0 ? 'var(--forest)' : 'var(--brass)',
          textFill: i % 2 === 0 ? 'var(--cream)' : 'var(--ink)',
          labelPos,
          // Flip labels in the lower half 180° so they read upright rather
          // than upside-down — still radial, just legible from both sides.
          rotate: mid > 90 && mid < 270 ? mid + 180 : mid,
        }
      }),
    [],
  )

  const spin = () => {
    if (spinning || !myId) return
    const idx = Math.floor(Math.random() * CLUBS.length)
    const targetCenter = idx * SLICE_ANGLE + SLICE_ANGLE / 2
    const currentMod = ((rotation % 360) + 360) % 360
    // Land targetCenter under the fixed top pointer (0deg), always spinning
    // forward from wherever the wheel currently sits.
    const deltaToTarget = ((360 - targetCenter - currentMod) % 360 + 360) % 360
    const extraSpins = 360 * 5
    const nextRotation = rotation + extraSpins + deltaToTarget

    setSpinning(true)
    setResult(null)
    setRotation(nextRotation)

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setSpinning(false)
      setResult(CLUBS[idx])
      logWheelSpin(myId, CLUBS[idx])
    }, SPIN_MS)
  }

  return (
    <div>
      <div className="section-heading">
        <WheelIcon width={17} height={17} style={{ color: 'var(--brass)' }} />
        Spin the Wheel
      </div>
      <div className="card" style={{ textAlign: 'center', marginBottom: 18 }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-dim)' }}>
          Spin it whenever the group fancies a dare — whatever it lands on is the club you MUST play next.
        </p>

        <div style={{ position: 'relative', width: WHEEL_SIZE, height: WHEEL_SIZE, margin: '0 auto 18px' }}>
          <div className="wheel-pointer" />
          <div
            className="wheel-dial"
            style={{ transform: `rotate(${rotation}deg)`, transitionDuration: spinning ? `${SPIN_MS}ms` : '0ms' }}
          >
            <svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
              {slices.map((s) => (
                <path key={s.club} d={s.path} fill={s.fill} stroke="var(--surface)" strokeWidth="1.5" />
              ))}
              {slices.map((s) => (
                <text
                  key={`${s.club}-label`}
                  x={s.labelPos.x}
                  y={s.labelPos.y}
                  fill={s.textFill}
                  fontSize="10.5"
                  fontWeight="800"
                  fontFamily="var(--font-body)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${s.rotate}, ${s.labelPos.x}, ${s.labelPos.y})`}
                >
                  {s.club}
                </text>
              ))}
            </svg>
          </div>
          <button className="wheel-hub" disabled={spinning || !myId} onClick={spin} aria-label="Spin the wheel">
            {spinning ? '···' : 'SPIN'}
          </button>
        </div>

        {result && !spinning && (
          <div className="pill pill-brass" style={{ fontSize: 14, padding: '8px 16px', marginBottom: 4 }}>
            {me ? me.name : 'You'} got {result} {CLUB_REACTIONS[result] ?? ''}
          </div>
        )}
        {!myId && <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Pick a player to spin.</div>}
      </div>

      <div className="card-flush">
        {wheelSpins.length === 0 ? (
          <EmptyRow text="Nobody's spun yet." />
        ) : (
          wheelSpins
            .slice(0, 25)
            .map((s) => <SpinRow key={s.id} spin={s} player={players.find((p) => p.id === s.player_id)} />)
        )}
      </div>
    </div>
  )
}

function SpinRow({ spin, player }) {
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
        style={{ width: 30, height: 30, fontSize: 13, flexShrink: 0, background: player?.photo_url ? 'transparent' : playerColor(player) }}
      >
        {player?.photo_url ? <img src={player.photo_url} alt="" /> : playerEmoji(player)}
      </span>
      <div style={{ flex: 1, fontSize: 13.5 }}>
        <strong>{player?.name ?? 'Someone'}</strong> spun <strong>{spin.club}</strong>{' '}
        {CLUB_REACTIONS[spin.club] ?? ''}
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{timeAgo(spin.created_at)}</span>
    </div>
  )
}
