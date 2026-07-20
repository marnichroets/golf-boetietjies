import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const GolfDataContext = createContext(null)

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
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const pendingRef = useRef(new Set())
  const [pendingVersion, setPendingVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [playersRes, holesRes, scoresRes, claimsRes] = await Promise.all([
        supabase
          .from('players')
          .select('*')
          .order('created_at', { ascending: true })
          .order('id', { ascending: true }),
        supabase.from('course_holes').select('*'),
        supabase.from('scores').select('*'),
        supabase.from('claims').select('*'),
      ])
      if (cancelled) return
      if (playersRes.data) setPlayers(playersRes.data)
      if (holesRes.data) setCourseHoles(groupHolesByRound(holesRes.data))
      if (scoresRes.data) setScores(scoresToNested(scoresRes.data))
      if (claimsRes.data) setClaims(claimsToMap(claimsRes.data))
      setLoading(false)
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
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const markPending = useCallback((key, isPending) => {
    if (isPending) pendingRef.current.add(key)
    else pendingRef.current.delete(key)
    setPendingVersion((v) => v + 1)
  }, [])

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
      supabase
        .from('scores')
        .upsert(
          { player_id: playerId, round, hole, strokes, updated_at: new Date().toISOString() },
          { onConflict: 'player_id,round,hole' },
        )
        .then(({ error }) => {
          if (error) console.error('score sync failed', error)
          markPending(key, false)
        })
    },
    [markPending],
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

  const uploadPlayerPhoto = useCallback(async (playerId, file) => {
    const ext = file.name.split('.').pop()
    const path = `${playerId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('player-photos').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
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
      upsertScore,
      claimCategory,
      updatePlayer,
      uploadPlayerPhoto,
      isPending,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [players, courseHoles, scores, claims, loading, connected, pendingVersion],
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
