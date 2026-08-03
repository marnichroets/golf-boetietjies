import { NavLink } from 'react-router-dom'
import { useGolfData } from '../context/GolfDataContext'
import { ChartIcon, FlagIcon, MapIcon, ShieldIcon, TargetIcon, TicketIcon, TrophyIcon, UsersIcon } from './icons'

const TABS = [
  { to: '/leaderboard', Icon: TrophyIcon, label: 'Leaders' },
  { to: '/scorecard', Icon: FlagIcon, label: 'Score' },
  { to: '/course', Icon: MapIcon, label: 'Course' },
  { to: '/claims', Icon: TargetIcon, label: 'Claims' },
  { to: '/fines', Icon: TicketIcon, label: 'Fines' },
  { to: '/stats', Icon: ChartIcon, label: 'Stats' },
  { to: '/players', Icon: UsersIcon, label: 'Players' },
]

// The Cup tab only exists in this array — and therefore only ever renders —
// when Ryder Cup mode is on, so the individual-round nav is untouched when
// it's off (the default).
const CUP_TAB = { to: '/ryder-cup', Icon: ShieldIcon, label: 'Cup' }

export default function BottomNav() {
  const { ryderCupEnabled } = useGolfData()
  const tabs = ryderCupEnabled ? [...TABS.slice(0, 1), CUP_TAB, ...TABS.slice(1)] : TABS

  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, Icon, label }) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-pill">
            <Icon />
            <span>{label}</span>
          </span>
        </NavLink>
      ))}
    </nav>
  )
}
