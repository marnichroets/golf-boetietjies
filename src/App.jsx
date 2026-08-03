import { Navigate, Route, Routes } from 'react-router-dom'
import { useGolfData } from './context/GolfDataContext'
import { useLocalPlayer } from './context/LocalPlayerContext'
import BottomNav from './components/BottomNav'
import TopBar from './components/TopBar'
import PickPlayer from './pages/PickPlayer'
import Players from './pages/Players'
import Scorecard from './pages/Scorecard'
import Course from './pages/Course'
import Leaderboard from './pages/Leaderboard'
import Claims from './pages/Claims'
import Fines from './pages/Fines'
import Stats from './pages/Stats'
import RyderCup from './pages/RyderCup'
import { Crest } from './components/icons'

export default function App() {
  const { loading, ryderCupEnabled } = useGolfData()
  const { playerId } = useLocalPlayer()

  if (loading) {
    return (
      <div className="center-screen">
        <Crest size={38} style={{ color: 'var(--brass)', margin: '0 auto 14px' }} />
        <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Loading the boys' trip…</p>
      </div>
    )
  }

  if (!playerId) {
    return <PickPlayer />
  }

  return (
    <>
      <div className="app-main">
        <TopBar />
        <Routes>
          <Route path="/" element={<Navigate to="/leaderboard" replace />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/scorecard" element={<Scorecard />} />
          <Route path="/course" element={<Course />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/fines" element={<Fines />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/players" element={<Players />} />
          <Route
            path="/ryder-cup"
            element={ryderCupEnabled ? <RyderCup /> : <Navigate to="/leaderboard" replace />}
          />
          <Route path="*" element={<Navigate to="/leaderboard" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  )
}
