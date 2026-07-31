import { useMemo } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { computeStats } from '../utils/stats'
import { FlameIcon, GolfBallIcon, SnowflakeIcon, TargetIcon } from '../components/icons'

export default function Stats() {
  const { players, scores, courseHoles } = useGolfData()
  const stats = useMemo(() => computeStats(players, scores, courseHoles), [players, scores, courseHoles])

  if (!stats) {
    return (
      <div>
        <h1 className="page-title">Fun Stats</h1>
        <p className="page-subtitle">The banter starts once scores hit the board.</p>
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          Quiet in the clubhouse. Go post a score.
        </div>
      </div>
    )
  }

  const banter = []
  if (stats.mostPars) {
    banter.push(`${stats.mostPars.player.name} is the most reliable in the group with ${stats.mostPars.count} par${stats.mostPars.count === 1 ? '' : 's'}.`)
  }
  if (stats.blowUp) {
    banter.push(
      `Biggest blow-up: ${stats.blowUp.player.name} carded a ${stats.blowUp.strokes} on hole ${stats.blowUp.hole} (par ${stats.blowUp.par}, Round ${stats.blowUp.round}). Rough day at the office.`,
    )
  }
  if (stats.mostConsistent) {
    banter.push(`Iceman award: ${stats.mostConsistent.player.name} — barely a wobble in the scoring, hole after hole.`)
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
