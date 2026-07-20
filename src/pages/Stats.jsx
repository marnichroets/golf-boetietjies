import { useMemo } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { computeStats } from '../utils/stats'
import { playerEmoji } from '../utils/playerVisuals'

export default function Stats() {
  const { players, scores, courseHoles } = useGolfData()
  const stats = useMemo(() => computeStats(players, scores, courseHoles), [players, scores, courseHoles])

  if (!stats) {
    return (
      <div>
        <h1 className="page-title">Fun Stats</h1>
        <p className="page-subtitle">Once scores start rolling in, the banter starts here.</p>
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          No scores logged yet ⛳
        </div>
      </div>
    )
  }

  const banter = []
  if (stats.mostPars) {
    banter.push(`🎯 ${stats.mostPars.player.name} is the most reliable in the group with ${stats.mostPars.count} par${stats.mostPars.count === 1 ? '' : 's'}.`)
  }
  if (stats.blowUp) {
    banter.push(
      `💀 Biggest blow-up: ${stats.blowUp.player.name} carded a ${stats.blowUp.strokes} on hole ${stats.blowUp.hole} (par ${stats.blowUp.par}, Round ${stats.blowUp.round}). Rough day at the office.`,
    )
  }
  if (stats.mostConsistent) {
    banter.push(`🧊 Iceman award: ${stats.mostConsistent.player.name} — barely a wobble in the scoring, hole after hole.`)
  }

  return (
    <div>
      <h1 className="page-title">Fun Stats</h1>
      <p className="page-subtitle">Auto-generated from {stats.totalHolesLogged} holes logged so far.</p>

      <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
        {stats.mostPars && (
          <StatCard
            icon={playerEmoji(stats.mostPars.player)}
            title="Most Pars"
            name={stats.mostPars.player.name}
            value={`${stats.mostPars.count} par${stats.mostPars.count === 1 ? '' : 's'}`}
          />
        )}
        {stats.blowUp && (
          <StatCard
            icon="💥"
            title="Biggest Blow-Up Hole"
            name={`${stats.blowUp.player.name} · Hole ${stats.blowUp.hole} (R${stats.blowUp.round})`}
            value={`${stats.blowUp.strokes} strokes (par ${stats.blowUp.par})`}
          />
        )}
        {stats.mostConsistent && (
          <StatCard
            icon="🧊"
            title="Most Consistent"
            name={stats.mostConsistent.player.name}
            value={`${stats.mostConsistent.holesPlayed} holes played`}
          />
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 10 }}>🗣️ Banter</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {banter.map((line, i) => (
            <div key={i} style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, name, value }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700 }}>{title.toUpperCase()}</div>
        <div style={{ fontWeight: 700 }}>{name}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', textAlign: 'right' }}>{value}</div>
    </div>
  )
}
