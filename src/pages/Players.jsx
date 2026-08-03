import { useState } from 'react'
import { useGolfData } from '../context/GolfDataContext'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { playerColor, playerEmoji } from '../utils/playerVisuals'
import PlayerEditSheet from '../components/PlayerEditSheet'
import { PencilIcon, StarIcon } from '../components/icons'

export default function Players() {
  const { players, teams, ryderCupEnabled, setRyderCupEnabled, updateTeam, updatePlayer } = useGolfData()
  const { playerId } = useLocalPlayer()
  const [editing, setEditing] = useState(null)

  // Only one captain per team: setting a new one clears the flag from
  // whoever else on that team already held it.
  const setCaptain = (player) => {
    const next = !player.is_captain
    if (next) {
      for (const p of players) {
        if (p.id !== player.id && p.team_id === player.team_id && p.is_captain) {
          updatePlayer(p.id, { is_captain: false })
        }
      }
    }
    updatePlayer(player.id, { is_captain: next })
  }

  return (
    <div>
      <h1 className="page-title">The Field</h1>
      <p className="page-subtitle">14 boetietjies, 2 rounds, 1 winner.</p>

      <RyderCupSettings
        ryderCupEnabled={ryderCupEnabled}
        setRyderCupEnabled={setRyderCupEnabled}
        teams={teams}
        updateTeam={updateTeam}
      />

      <div style={{ display: 'grid', gap: 10 }}>
        {players.map((p) => {
          const team = teams.find((t) => t.id === p.team_id)
          return (
            <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
              <span
                className="avatar"
                style={{
                  width: 52,
                  height: 52,
                  fontSize: 22,
                  background: p.photo_url ? 'transparent' : playerColor(p),
                  boxShadow:
                    p.id === playerId
                      ? '0 0 0 2px var(--brass), 0 3px 8px -3px rgba(0,0,0,0.5)'
                      : 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 3px 8px -3px rgba(0,0,0,0.5)',
                }}
              >
                {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : playerEmoji(p)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {p.name}
                  {p.id === playerId && <span className="pill pill-brass">You</span>}
                  {ryderCupEnabled && p.is_captain && team && (
                    <span className="pill" style={{ borderColor: team.color, color: team.color }}>
                      <StarIcon width={10} height={10} /> Captain
                    </span>
                  )}
                </div>
                <div className="eyebrow" style={{ marginTop: 2 }}>
                  HCP {p.handicap}
                </div>
                {p.tagline && (
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: 13.5,
                      color: 'var(--text-dim)',
                      marginTop: 4,
                    }}
                  >
                    “{p.tagline}”
                  </div>
                )}
                {ryderCupEnabled && teams.length === 2 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
                    {teams.map((t) => (
                      <button
                        key={t.id}
                        className={`team-chip ${p.team_id === t.id ? 'selected' : ''}`}
                        style={{ '--chip-color': t.color }}
                        onClick={() => updatePlayer(p.id, { team_id: p.team_id === t.id ? null : t.id, is_captain: p.team_id === t.id ? false : p.is_captain })}
                      >
                        {t.name}
                      </button>
                    ))}
                    {p.team_id && (
                      <button
                        className={`captain-toggle ${p.is_captain ? 'active' : ''}`}
                        aria-label={p.is_captain ? `Remove ${p.name} as captain` : `Make ${p.name} captain`}
                        title={p.is_captain ? 'Remove as captain' : 'Make captain'}
                        onClick={() => setCaptain(p)}
                      >
                        <StarIcon width={15} height={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                className="btn"
                style={{ width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                onClick={() => setEditing(p)}
                aria-label={`Edit ${p.name}`}
              >
                <PencilIcon width={17} height={17} />
              </button>
            </div>
          )
        })}
      </div>

      {editing && <PlayerEditSheet player={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function RyderCupSettings({ ryderCupEnabled, setRyderCupEnabled, teams, updateTeam }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>Ryder Cup Mode</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
            {ryderCupEnabled ? 'On — the Cup tab and team scoring are live for everyone.' : 'Off — everyone just sees the normal individual round.'}
          </div>
        </div>
        <button
          role="switch"
          aria-checked={ryderCupEnabled}
          aria-label="Toggle Ryder Cup mode"
          className={`toggle-switch ${ryderCupEnabled ? 'on' : ''}`}
          onClick={() => setRyderCupEnabled(!ryderCupEnabled)}
        >
          <span className="toggle-knob" />
        </button>
      </div>

      {ryderCupEnabled && teams.length === 2 && (
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {teams.map((team) => (
            <TeamEditor key={team.id} team={team} updateTeam={updateTeam} />
          ))}
        </div>
      )}
      {ryderCupEnabled && teams.length !== 2 && (
        <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--text-faint)' }}>
          Run the Ryder Cup SQL migration to seed the two teams.
        </div>
      )}
    </div>
  )
}

function TeamEditor({ team, updateTeam }) {
  const [name, setName] = useState(team.name)

  return (
    <div style={{ flex: 1, minWidth: 0, padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-hi)' }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim()
          if (trimmed && trimmed !== team.name) updateTeam(team.id, { name: trimmed })
          else setName(team.name)
        }}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          color: team.color,
          padding: 0,
          marginBottom: 0,
        }}
      />
    </div>
  )
}
