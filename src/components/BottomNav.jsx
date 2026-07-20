import { NavLink } from 'react-router-dom'
import { ChartIcon, FlagIcon, MapIcon, TargetIcon, TrophyIcon, UsersIcon } from './icons'

const TABS = [
  { to: '/leaderboard', Icon: TrophyIcon, label: 'Leaders' },
  { to: '/scorecard', Icon: FlagIcon, label: 'Score' },
  { to: '/course', Icon: MapIcon, label: 'Course' },
  { to: '/claims', Icon: TargetIcon, label: 'Claims' },
  { to: '/stats', Icon: ChartIcon, label: 'Stats' },
  { to: '/players', Icon: UsersIcon, label: 'Players' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, Icon, label }) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
