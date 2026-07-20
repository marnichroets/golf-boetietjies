import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/leaderboard', icon: '🏆', label: 'Leaders' },
  { to: '/scorecard', icon: '⛳', label: 'Scorecard' },
  { to: '/claims', icon: '🎯', label: 'Claims' },
  { to: '/stats', icon: '📊', label: 'Stats' },
  { to: '/players', icon: '👥', label: 'Players' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
