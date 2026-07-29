import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { roundSummary } from '../utils/stableford'
import { pickCommentary } from '../data/commentary'

const GolfDataContext = createContext(null)
const FEED_LIMIT = 20

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

// Combined (round 1 + round 2) Stableford leader, replicating the
// Leaderboard's "Combined" view — used to detect a change of top spot.
// Returns null if nobody has posted points yet.
function computeLeaderId(players, scoresObj, courseHoles) {
  let leader = null
  for (const p of players) {
    const r1 = roundSummary(scoresObj[p.id]?.[1] || {}, courseHoles[1] || [], p.handicap)
    const r2 = roundSummary(scoresObj[p.id]?.[2] || {}, courseHoles[2] || [], p.handicap)
    const points = r1.points + r2.points
    const holesPlayed = r1.holesPlayed + r2.holesPlayed
    if (!leader || points > leader.points || (points === leader.points && holesPlayed > leader.holesPlayed)) {
      leader = { id: p.id, points, holesPlayed }
    }
  }
  return leader && leader.points > 0 ? leader.id : null
}

export function GolfDataProvider({ children }) {
  const [players, setPlayers] = useState([])
  const [courseHoles, setCourseHoles] = useState({ 1: [], 2: [] })
  const [scores, setScores] = useState({}) // { [playerId]: { 1: {hole: strokes}, 2: {...} } }
  const [claims, setClaims] = useState({}) // { "category:round": row }
  const [feedEvents, setFeedEvents] = useState([]) // newest first, capped at FEED_LIMIT
  const [latestEvent, setLatestEvent] = useState(null) // set only by realtime inserts, for toasts
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const pendingRef = useRef(new Set())
  const [pendingVersion, setPendingVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [playersRes, holesRes, scoresRes, claimsRes, feedRes] = await Promise.all([
        supabase
          .from('players')
          .select('*')
          .order('created_at', { ascending: true })
          .order('id', { ascending: true }),
        supabase.from('course_holes').select('*'),
        supabase.from('scores').select('*'),
        supabase.from('claims').select('*'),
        supabase.from('feed_events').select('*').order('created_at', { ascending: false }).limit(FEED_LIMIT),
      ])
      if (cancelled) return
      if (playersRes.data) setPlayers(playersRes.data)
      if (holesRes.data) setCourseHoles(groupHolesByRound(holesRes.data))
      if (scoresRes.data) setScores(scoresToNested(scoresRes.data))
      if (claimsRes.data) setClaims(claimsToMap(claimsRes.data))
      if (feedRes.data) setFeedEvents(feedRes.data)
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_events' }, (payload) => {
        setFeedEvents((prev) => {
          if (prev.some((e) => e.id === payload.new.id)) return prev
          return [payload.new, ...prev].slice(0, FEED_LIMIT)
        })
        setLatestEvent(payload.new)
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

  // Fire-and-forget commentary post — never blocks or throws into caller.
  const logFeedEvent = useCallback(
    (type, playerId, extra = {}) => {
      const player = players.find((p) => p.id === playerId)
      if (!player) return
      const message = pickCommentary(type, player.name)
      if (!message) return
      supabase
        .from('feed_events')
        .insert({ type, player_id: playerId, message, ...extra })
        .then(({ error }) => {
          if (error) console.error('feed event failed', error)
        })
    },
    [players],
  )

  const upsertScore = useCallback(
    (playerId, round, hole, strokes) => {
      const key = `score:${playerId}:${round}:${hole}`
      const prevScores = scores
      const prevStrokes = prevScores[playerId]?.[round]?.[hole] ?? null

      const nextScores = { ...prevScores }
      nextScores[playerId] = { 1: { ...nextScores[playerId]?.[1] }, 2: { ...nextScores[playerId]?.[2] } }
      nextScores[playerId][round][hole] = strokes
      setScores(nextScores)

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

      // Commentary only reacts to an actual change in this cell's value —
      // re-tapping the same number shouldn't post again.
      if (prevStrokes !== strokes) {
        const holeInfo = (courseHoles[round] || []).find((h) => h.hole === hole)
        // strokes === 0 is a deliberate pick-up/no-score — it has no real
        // relationship to par, so it must never fall into the eagle/birdie/
        // blow-up diff logic below (which assumes a genuine stroke count).
        if (holeInfo && strokes === 0) {
          logFeedEvent('pickup', playerId, { round, hole, par: holeInfo.par })
        } else if (holeInfo && strokes != null) {
          const diff = strokes - holeInfo.par
          let type = null
          if (diff <= -2) type = 'eagle'
          else if (diff === -1) type = 'birdie'
          else if (diff >= 3) type = 'blowup'
          if (type) logFeedEvent(type, playerId, { round, hole, strokes, par: holeInfo.par })
        }

        const prevLeader = computeLeaderId(players, prevScores, courseHoles)
        const nextLeader = computeLeaderId(players, nextScores, courseHoles)
        if (nextLeader && nextLeader !== prevLeader) {
          logFeedEvent('new_leader', nextLeader, { round, hole })
        }
      }
    },
    [scores, players, courseHoles, markPending, logFeedEvent],
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
      supabase
        .from('scores')
        .delete()
        .eq('player_id', playerId)
        .eq('round', round)
        .eq('hole', hole)
        .then(({ error }) => {
          if (error) console.error('score clear failed', error)
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

      if (playerId) logFeedEvent(category, playerId, { round })
    },
    [markPending, logFeedEvent],
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
      feedEvents,
      latestEvent,
      loading,
      connected,
      upsertScore,
      clearScore,
      claimCategory,
      updatePlayer,
      uploadPlayerPhoto,
      isPending,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [players, courseHoles, scores, claims, feedEvents, latestEvent, loading, connected, pendingVersion],
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
