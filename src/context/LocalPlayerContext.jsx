import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'gb_player_id'
const LocalPlayerContext = createContext(null)

export function LocalPlayerProvider({ children }) {
  const [playerId, setPlayerIdState] = useState(() => localStorage.getItem(STORAGE_KEY))

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setPlayerIdState(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setPlayerId = useCallback((id) => {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
    setPlayerIdState(id)
  }, [])

  return (
    <LocalPlayerContext.Provider value={{ playerId, setPlayerId }}>{children}</LocalPlayerContext.Provider>
  )
}

export function useLocalPlayer() {
  const ctx = useContext(LocalPlayerContext)
  if (!ctx) throw new Error('useLocalPlayer must be used within LocalPlayerProvider')
  return ctx
}
