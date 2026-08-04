import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Bumped once before the real release so every device (including
// whoever was testing) lands back on PickPlayer instead of staying
// signed in as a leftover test pick — the old key's value is simply
// never read again. Once someone picks under this key it persists
// exactly as before for the rest of the weekend. Bump again (e.g.
// `_v3`) only if you deliberately need to force everyone to re-pick.
const STORAGE_KEY = 'gb_player_id_v2'
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
