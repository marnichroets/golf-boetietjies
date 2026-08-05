import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Bumped once before the real release so every device (including
// whoever was testing) lands back on PickPlayer instead of staying
// signed in as a leftover test pick — the old key's value is simply
// never read again. Once someone picks under this key it persists
// exactly as before for the rest of the weekend. Bump again (e.g.
// `_v3`) only if you deliberately need to force everyone to re-pick.
const STORAGE_KEY = 'gb_player_id_v2'
// Tracks whether this device has ever opened the Rulebook (from either
// entry point — the TopBar icon or the one-time prompt) — drives the
// unread-style badge dot on the TopBar icon so it's gone for good the
// first time anyone actually looks.
const RULEBOOK_OPENED_KEY = 'gb_rulebook_opened'
const LocalPlayerContext = createContext(null)

export function LocalPlayerProvider({ children }) {
  const [playerId, setPlayerIdState] = useState(() => localStorage.getItem(STORAGE_KEY))
  // True only for the render(s) right after an explicit pick action —
  // never true for a returning player auto-logged-in from a stored id on
  // mount. Lets a "new here?" prompt fire once right after picking without
  // reappearing on every ordinary reopen.
  const [justPicked, setJustPicked] = useState(false)
  const [hasOpenedRulebook, setHasOpenedRulebook] = useState(() => localStorage.getItem(RULEBOOK_OPENED_KEY) === 'true')

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
    setJustPicked(!!id)
  }, [])

  const clearJustPicked = useCallback(() => setJustPicked(false), [])

  const markRulebookOpened = useCallback(() => {
    localStorage.setItem(RULEBOOK_OPENED_KEY, 'true')
    setHasOpenedRulebook(true)
  }, [])

  return (
    <LocalPlayerContext.Provider
      value={{ playerId, setPlayerId, justPicked, clearJustPicked, hasOpenedRulebook, markRulebookOpened }}
    >
      {children}
    </LocalPlayerContext.Provider>
  )
}

export function useLocalPlayer() {
  const ctx = useContext(LocalPlayerContext)
  if (!ctx) throw new Error('useLocalPlayer must be used within LocalPlayerProvider')
  return ctx
}
