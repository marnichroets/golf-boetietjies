import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { applyQueueToScores, loadQueue, queueClear, queueUpsert, removeFromQueue } from '../utils/offlineScoreQueue'

const GolfDataContext = createContext(null)

const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
}

function groupHolesByRound(rows) {
  const byRound = { 1: [], 2: [] }
  for (const row of rows) {
    byRound[row.round]?.push(row)
  }
  byRound[1].sort((a, b) => a.hole - b.hole)
  byRound[2].sort((a, b) => a.hole - b.hole)
  return byRound
}

function scoresToNested(rows) {
  const nested = {}
  for (const row of rows) {
    nested[row.player_id] ??= { 1: {}, 2: {} }
    nested[row.player_id][row.round][row.hole] = row.strokes
  }
  return nested
}

function claimsToMap(rows) {
  const map = {}
  for (const row of rows) {
    map[`${row.category}:${row.round}`] = row
  }
  return map
}

export function GolfDataProvider({ children }) {
  const [players, setPlayers] = useState([])
  const [courseHoles, setCourseHoles] = useState({ 1: [], 2: [] })
  const [scores, setScores] = useState({}) // { [playerId]: { 1: {hole: strokes}, 2: {...} } }
  const [claims, setClaims] = useState({}) // { "category:round": row }
  // Ryder Cup layer — OFF unless the app_settings row (or table) says
  // otherwise, so a fresh/un-migrated database behaves exactly like the
  // individual-only app.
  const [ryderCupEnabled, setRyderCupEnabledState] = useState(false)
  const [teams, setTeams] = useState([])
  const [pairings, setPairings] = useState([])
  // One row per (round, group_key) fourball — see supabase/scorer_lock.sql.
  // Optional like the Ryder Cup tables: a database that hasn't run that
  // migration yet just gets an empty list back, and every group scores
  // open/unlocked exactly like before this feature existed.
  const [scorerLocks, setScorerLocks] = useState([])
  // Fines and wheel spins are optional like the tables above — a database
  // that hasn't run supabase/fines_and_wheel.sql yet just gets empty lists
  // back, and those two tabs quietly render with nothing logged.
  const [fines, setFines] = useState([]) // newest first
  const [wheelSpins, setWheelSpins] = useState([]) // newest first
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const pendingRef = useRef(new Set())
  const [pendingVersion, setPendingVersion] = useState(0)
  // Ref indirection so the mount-time load() effect (declared before
  // flushScoreQueue exists further down) and the realtime subscribe
  // callback can both trigger a flush without being in flushScoreQueue's
  // dependency array. Reassigned on every render, so it's always current
  // by the time any effect actually calls it.
  const flushScoreQueueRef = useRef(() => {})
  const isFlushingQueueRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [playersRes, holesRes, scoresRes, claimsRes, settingsRes, teamsRes, pairingsRes, scorerLocksRes, finesRes, wheelSpinsRes] =
        await Promise.all([
          supabase
            .from('players')
            .select('*')
            .order('created_at', { ascending: true })
            .order('id', { ascending: true }),
          supabase.from('course_holes').select('*'),
          supabase.from('scores').select('*'),
          supabase.from('claims').select('*'),
          // These six tables (supabase/ryder_cup.sql, supabase/scorer_lock.sql,
          // supabase/fines_and_wheel.sql) are optional — on a database that
          // hasn't run those migrations yet, these queries just error out and
          // the features quietly stay off/empty.
          supabase.from('app_settings').select('*').eq('id', 1).maybeSingle(),
          supabase.from('teams').select('*').order('created_at', { ascending: true }),
          supabase.from('pairings').select('*'),
          supabase.from('scorer_locks').select('*'),
          supabase.from('fines').select('*').order('created_at', { ascending: false }),
          supabase.from('wheel_spins').select('*').order('created_at', { ascending: false }),
        ])
      if (cancelled) return
      if (playersRes.data) setPlayers(playersRes.data)
      if (holesRes.data) setCourseHoles(groupHolesByRound(holesRes.data))
      if (scoresRes.data) {
        // Anything still sitting in the offline queue from before this
        // load (a reload while offline, or before the last flush finished)
        // represents scores the player already entered — replay them on
        // top of the server snapshot so they don't appear to vanish.
        setScores(applyQueueToScores(scoresToNested(scoresRes.data), loadQueue()))
      }
      if (claimsRes.data) setClaims(claimsToMap(claimsRes.data))
      if (settingsRes.data) setRyderCupEnabledState(!!settingsRes.data.ryder_cup_enabled)
      if (teamsRes.data) setTeams(teamsRes.data)
      if (pairingsRes.data) setPairings(pairingsRes.data)
      if (scorerLocksRes.data) setScorerLocks(scorerLocksRes.data)
      if (finesRes.data) setFines(finesRes.data)
      if (wheelSpinsRes.data) setWheelSpins(wheelSpinsRes.data)
      setLoading(false)
      flushScoreQueueRef.current()
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('golf-boetietjies-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        setPlayers((prev) => applyRowChange(prev, payload))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, (payload) => {
        const row = payload.new?.id ? payload.new : payload.old
        if (!row) return
        // Without REPLICA IDENTITY FULL on `scores` (see
        // supabase/allow_clear_scores.sql), a DELETE payload's `old` row only
        // carries the primary key — player_id/round/hole come back undefined.
        // Bail out rather than corrupting state under an `undefined` player.
        if (payload.eventType === 'DELETE' && (row.player_id == null || row.round == null || row.hole == null)) return
        setScores((prev) => {
          const next = { ...prev }
          next[row.player_id] = { 1: { ...next[row.player_id]?.[1] }, 2: { ...next[row.player_id]?.[2] } }
          if (payload.eventType === 'DELETE') {
            delete next[row.player_id][row.round][row.hole]
          } else {
            next[row.player_id][row.round][row.hole] = payload.new.strokes
          }
          return next
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, (payload) => {
        const row = payload.new?.id ? payload.new : payload.old
        if (!row) return
        setClaims((prev) => ({ ...prev, [`${row.category}:${row.round}`]: payload.new ?? row }))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, (payload) => {
        if (!payload.new) return
        setRyderCupEnabledState(!!payload.new.ryder_cup_enabled)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, (payload) => {
        setTeams((prev) => applyRowChange(prev, payload))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pairings' }, (payload) => {
        setPairings((prev) => applyRowChange(prev, payload))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fines' }, (payload) => {
        // Insert-only log — merge by id (idempotent) since the device that
        // logged it already appended the exact same real row itself, from
        // the insert's own response, and may beat this broadcast there.
        setFines((prev) => (prev.some((f) => f.id === payload.new.id) ? prev : [payload.new, ...prev]))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wheel_spins' }, (payload) => {
        setWheelSpins((prev) => (prev.some((s) => s.id === payload.new.id) ? prev : [payload.new, ...prev]))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scorer_locks' }, (payload) => {
        // Matched by (round, group_key) rather than id — the optimistic
        // insert in setScorerLock uses a placeholder id, so an id-only
        // merge would leave that placeholder behind as a duplicate once
        // the real row arrives over the wire.
        setScorerLocks((prev) => {
          if (payload.eventType === 'DELETE') {
            const row = payload.old
            return prev.filter((l) => !(l.round === row.round && l.group_key === row.group_key))
          }
          const row = payload.new
          const filtered = prev.filter((l) => !(l.round === row.round && l.group_key === row.group_key))
          return [...filtered, row]
        })
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
        // Reconnecting is exactly when a flush is most likely to actually
        // land — catches anything the 'online' event or the poll missed.
        if (status === 'SUBSCRIBED') flushScoreQueueRef.current()
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Retries the local offline queue whenever the browser tells us it's
  // back online, plus a slow poll as a safety net for browsers/OSes that
  // don't fire 'online' reliably (some mobile Safari/PWA cases). The poll
  // is a no-op read of localStorage when the queue is already empty.
  useEffect(() => {
    const handleOnline = () => flushScoreQueueRef.current()
    window.addEventListener('online', handleOnline)
    const pollId = setInterval(() => {
      if (Object.keys(loadQueue()).length > 0) flushScoreQueueRef.current()
    }, 5000)
    return () => {
      window.removeEventListener('online', handleOnline)
      clearInterval(pollId)
    }
  }, [])

  const markPending = useCallback((key, isPending) => {
    if (isPending) pendingRef.current.add(key)
    else pendingRef.current.delete(key)
    setPendingVersion((v) => v + 1)
  }, [])

  // Drains the local offline queue in order, one write at a time. Stops at
  // the first failure (network still down, or a real Supabase error) and
  // leaves the rest queued — the 'online' listener, the poll above, and
  // realtime reconnecting all call this again later, so nothing needs a
  // retry counter or backoff of its own.
  const flushScoreQueue = useCallback(async () => {
    if (isFlushingQueueRef.current) return
    isFlushingQueueRef.current = true
    try {
      const queue = loadQueue()
      for (const key of Object.keys(queue)) {
        const entry = queue[key]
        try {
          const { player_id, round, hole } = entry.payload
          const { error } =
            entry.type === 'upsert'
              ? await supabase
                  .from('scores')
                  .upsert(entry.payload, { onConflict: 'player_id,round,hole' })
              : await supabase.from('scores').delete().eq('player_id', player_id).eq('round', round).eq('hole', hole)
          if (error) {
            console.error('offline queue flush failed', error)
            break
          }
          removeFromQueue(key)
          markPending(key, false)
        } catch {
          // Fetch itself threw — still offline. Leave this and everything
          // after it queued for the next trigger.
          break
        }
      }
    } finally {
      isFlushingQueueRef.current = false
    }
  }, [markPending])

  flushScoreQueueRef.current = flushScoreQueue

  const upsertScore = useCallback(
    (playerId, round, hole, strokes) => {
      const key = `score:${playerId}:${round}:${hole}`

      setScores((prev) => {
        const next = { ...prev }
        next[playerId] = { 1: { ...next[playerId]?.[1] }, 2: { ...next[playerId]?.[2] } }
        next[playerId][round][hole] = strokes
        return next
      })

      markPending(key, true)
      queueUpsert(key, { player_id: playerId, round, hole, strokes, updated_at: new Date().toISOString() })
      flushScoreQueue()
    },
    [markPending, flushScoreQueue],
  )

  // Resets a cell back to genuinely unentered (not 0/P.U) by deleting its
  // row from Supabase entirely — there is no "unentered" strokes value to
  // upsert, since null/undefined can't be stored in the strokes column.
  const clearScore = useCallback(
    (playerId, round, hole) => {
      const key = `score:${playerId}:${round}:${hole}`

      setScores((prev) => {
        const next = { ...prev }
        next[playerId] = { 1: { ...next[playerId]?.[1] }, 2: { ...next[playerId]?.[2] } }
        delete next[playerId][round][hole]
        return next
      })

      markPending(key, true)
      queueClear(key, { player_id: playerId, round, hole })
      flushScoreQueue()
    },
    [markPending, flushScoreQueue],
  )

  const claimCategory = useCallback(
    (category, round, playerId) => {
      const key = `claim:${category}:${round}`
      const now = new Date().toISOString()
      setClaims((prev) => ({
        ...prev,
        [`${category}:${round}`]: { category, round, player_id: playerId, updated_at: now },
      }))
      markPending(key, true)
      supabase
        .from('claims')
        .upsert({ category, round, player_id: playerId, updated_at: now }, { onConflict: 'category,round' })
        .then(({ error }) => {
          if (error) console.error('claim sync failed', error)
          markPending(key, false)
        })
    },
    [markPending],
  )

  // Both merge the freshly-inserted real row into local state directly
  // (rather than an optimistic placeholder id) so the realtime INSERT
  // handler's id-based dedupe above can never end up with two copies of
  // the same log entry, regardless of which one lands first.
  const logFine = useCallback((playerId, reason) => {
    const key = `fine:${playerId}:${Date.now()}`
    markPending(key, true)
    supabase
      .from('fines')
      .insert({ player_id: playerId, reason })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('fine log failed', error)
        } else {
          setFines((prev) => (prev.some((f) => f.id === data.id) ? prev : [data, ...prev]))
        }
        markPending(key, false)
      })
  }, [markPending])

  const logWheelSpin = useCallback((playerId, club) => {
    const key = `wheel-spin:${playerId}:${Date.now()}`
    markPending(key, true)
    supabase
      .from('wheel_spins')
      .insert({ player_id: playerId, club })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('wheel spin log failed', error)
        } else {
          setWheelSpins((prev) => (prev.some((s) => s.id === data.id) ? prev : [data, ...prev]))
        }
        markPending(key, false)
      })
  }, [markPending])

  const updatePlayer = useCallback(
    (id, patch) => {
      const key = `player:${id}`
      setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      markPending(key, true)
      supabase
        .from('players')
        .update(patch)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('player sync failed', error)
          markPending(key, false)
        })
    },
    [markPending],
  )

  // Shared across every phone via the app_settings singleton row — this is
  // the one and only on/off switch for the whole Ryder Cup layer.
  const setRyderCupEnabled = useCallback((enabled) => {
    setRyderCupEnabledState(enabled)
    supabase
      .from('app_settings')
      .update({ ryder_cup_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .then(({ error }) => {
        if (error) console.error('ryder cup toggle sync failed', error)
      })
  }, [])

  const updateTeam = useCallback((id, patch) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    supabase
      .from('teams')
      .update(patch)
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('team sync failed', error)
      })
  }, [])

  // One row per (round, match_number) slot — upserting always overwrites
  // whatever pairing already lived in that slot.
  const savePairing = useCallback(({ round, matchNumber, format, sideA, sideB }) => {
    const row = { round, match_number: matchNumber, format, side_a: sideA, side_b: sideB, updated_at: new Date().toISOString() }
    setPairings((prev) => {
      const exists = prev.some((p) => p.round === round && p.match_number === matchNumber)
      if (exists) return prev.map((p) => (p.round === round && p.match_number === matchNumber ? { ...p, ...row } : p))
      return [...prev, row]
    })
    supabase
      .from('pairings')
      .upsert(row, { onConflict: 'round,match_number' })
      .then(({ error }) => {
        if (error) console.error('pairing sync failed', error)
      })
  }, [])

  // One row per (round, group_key) fourball — upserting always overwrites
  // whichever player was previously the locked scorer, which is exactly
  // how "change scorer" works: it's just choosing again.
  const setScorerLock = useCallback((round, groupKey, scorerPlayerId) => {
    setScorerLocks((prev) => {
      const exists = prev.some((l) => l.round === round && l.group_key === groupKey)
      if (exists) {
        return prev.map((l) =>
          l.round === round && l.group_key === groupKey
            ? { ...l, scorer_player_id: scorerPlayerId, updated_at: new Date().toISOString() }
            : l,
        )
      }
      return [...prev, { id: `optimistic-${round}-${groupKey}`, round, group_key: groupKey, scorer_player_id: scorerPlayerId, updated_at: new Date().toISOString() }]
    })
    supabase
      .from('scorer_locks')
      .upsert(
        { round, group_key: groupKey, scorer_player_id: scorerPlayerId, updated_at: new Date().toISOString() },
        { onConflict: 'round,group_key' },
      )
      .then(({ error }) => {
        if (error) console.error('scorer lock sync failed', error)
      })
  }, [])

  const uploadPlayerPhoto = useCallback(async (playerId, file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${playerId}-${Date.now()}.${ext}`
    // Pin the content type from the extension rather than trusting the
    // browser-reported file.type — Chromium on Windows can source that
    // from a per-extension registry lookup, which some machines have seen
    // come back empty/wrong for .jpg specifically while .jpeg works fine.
    const contentType = MIME_BY_EXTENSION[ext] || file.type || 'application/octet-stream'
    const { error: uploadError } = await supabase.storage.from('player-photos').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType,
    })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
    return data.publicUrl
  }, [])

  const isPending = useCallback((key) => pendingRef.current.has(key), [pendingVersion])

  const value = useMemo(
    () => ({
      players,
      courseHoles,
      scores,
      claims,
      loading,
      connected,
      ryderCupEnabled,
      teams,
      pairings,
      scorerLocks,
      fines,
      wheelSpins,
      upsertScore,
      clearScore,
      claimCategory,
      updatePlayer,
      uploadPlayerPhoto,
      isPending,
      setRyderCupEnabled,
      updateTeam,
      savePairing,
      setScorerLock,
      logFine,
      logWheelSpin,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [players, courseHoles, scores, claims, loading, connected, ryderCupEnabled, teams, pairings, scorerLocks, fines, wheelSpins, pendingVersion],
  )

  return <GolfDataContext.Provider value={value}>{children}</GolfDataContext.Provider>
}

function applyRowChange(list, payload) {
  if (payload.eventType === 'DELETE') {
    return list.filter((row) => row.id !== payload.old.id)
  }
  const exists = list.some((row) => row.id === payload.new.id)
  if (exists) return list.map((row) => (row.id === payload.new.id ? payload.new : row))
  return [...list, payload.new]
}

export function useGolfData() {
  const ctx = useContext(GolfDataContext)
  if (!ctx) throw new Error('useGolfData must be used within GolfDataProvider')
  return ctx
}
