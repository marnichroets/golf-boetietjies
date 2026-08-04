import { useMemo } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { computeStats } from '../utils/stats'
import { buildBanter } from '../utils/banter'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import { FlameIcon, GolfBallIcon, SnowflakeIcon, TargetIcon, TicketIcon } from '../components/icons'

export default function Stats() {
  const { players, scores, courseHoles, fines } = useGolfData()
  const stats = useMemo(() => computeStats(players, scores, courseHoles), [players, scores, courseHoles])

  // Most-fined-first leaderboard — only players with at least one fine
  // logged show up, so a clean trip doesn't clutter the list with zeros.
  const fineLeaders = useMemo(() => {
    const counts = new Map()
    for (const f of fines) counts.set(f.player_id, (counts.get(f.player_id) || 0) + 1)
    return [...counts.entries()]
      .map(([playerId, count]) => ({ player: players.find((p) => p.id === playerId), count }))
      .filter((row) => row.player)
      .sort((a, b) => b.count - a.count)
  }, [fines, players])

  // Re-rolls the random line only when the actual spotlighted stat changes
  // (a new leader, a new worst hole, a longer streak) — not on every
  // unrelated score elsewhere, which would otherwise flicker the wording
  // on screen for no reason.
  const banter = useMemo(
    () => buildBanter(stats),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      stats?.mostPars?.player?.id,
      stats?.mostPars?.count,
      stats?.blowUp?.player?.id,
      stats?.blowUp?.hole,
      stats?.blowUp?.strokes,
      stats?.blowUp?.round,
      stats?.mostConsistent?.player?.id,
      stats?.mostConsistent?.holesPlayed,
    ],
  )

  if (!stats) {
    return (
      <div>
        <h1 className="page-title">Fun Stats</h1>
        <p className="page-subtitle">The banter starts once scores hit the board.</p>
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: fineLeaders.length ? 20 : 0 }}>
          Quiet in the clubhouse. Go post a score.
        </div>
        {fineLeaders.length > 0 && <FineLeaderboard fineLeaders={fineLeaders} />}
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">Fun Stats</h1>
      <p className="page-subtitle">Auto-generated from {stats.totalHolesLogged} holes logged so far.</p>

      <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
        {stats.mostPars && (
          <StatCard Icon={TargetIcon} title="Most Pars" name={stats.mostPars.player.name} value={`${stats.mostPars.count} par${stats.mostPars.count === 1 ? '' : 's'}`} />
        )}
        {stats.blowUp && (
          <StatCard
            Icon={FlameIcon}
            title="Biggest Blow-Up Hole"
            name={`${stats.blowUp.player.name} · Hole ${stats.blowUp.hole} (R${stats.blowUp.round})`}
            value={`${stats.blowUp.strokes} strokes (par ${stats.blowUp.par})`}
          />
        )}
        {stats.mostConsistent && (
          <StatCard Icon={SnowflakeIcon} title="Most Consistent" name={stats.mostConsistent.player.name} value={`${stats.mostConsistent.holesPlayed} holes played`} />
        )}
      </div>

      <div className="ball-divider">
        <GolfBallIcon width={15} height={15} strokeWidth={1.4} />
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Clubhouse Banter</span>
          <span className="eyebrow">Unfiltered</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {banter.map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--brass)', fontFamily: 'var(--font-display)', fontWeight: 800 }}>“</span>
              <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.55 }}>{line}</div>
            </div>
          ))}
        </div>
      </div>

      {fineLeaders.length > 0 && (
        <>
          <div className="ball-divider">
            <GolfBallIcon width={15} height={15} strokeWidth={1.4} />
          </div>
          <FineLeaderboard fineLeaders={fineLeaders} />
        </>
      )}
    </div>
  )
}

function FineLeaderboard({ fineLeaders }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Fine Leaderboard</span>
        <span className="eyebrow">Most fined</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {fineLeaders.map((row, i) => (
          <div key={row.player.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="eyebrow" style={{ width: 16, flexShrink: 0 }}>
              {i + 1}
            </span>
            <span
              className="avatar"
              style={{ width: 28, height: 28, fontSize: 13, flexShrink: 0, background: row.player.photo_url ? 'transparent' : playerColor(row.player) }}
            >
              {row.player.photo_url ? <img src={row.player.photo_url} alt="" /> : playerEmoji(row.player)}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.player.name}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13.5, fontWeight: 700, color: 'var(--brass-ink)', flexShrink: 0 }}>
              <TicketIcon width={13} height={13} />
              {row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ Icon, title, name, value }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(201,162,39,0.12)',
          border: '1px solid var(--border)',
          color: 'var(--brass)',
          flexShrink: 0,
        }}
      >
        <Icon width={18} height={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="eyebrow">{title}</div>
        <div style={{ fontWeight: 700, marginTop: 2 }}>{name}</div>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brass-ink)', textAlign: 'right' }}>{value}</div>
    </div>
  )
}
