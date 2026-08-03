// Durable local queue for score writes that haven't been confirmed synced
// to Supabase yet — the thing that actually keeps a score entered mid-round
// from vanishing if the connection drops before the write lands. Backed by
// localStorage (not just in-memory state) so it survives a page reload too.
//
// Keyed by the same `score:${playerId}:${round}:${hole}` cell key used for
// the pending-sync dot, so a second edit to the same cell while offline
// just replaces the queued write instead of piling up stale ones.

const STORAGE_KEY = 'golf-boetietjies-offline-score-queue-v1'

export function loadQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveQueue(queue) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // Storage full/unavailable (private browsing, etc.) — the in-memory
    // state and the immediate write attempt still work, it just won't
    // survive a reload while offline.
  }
}

export function queueUpsert(key, payload) {
  const queue = loadQueue()
  queue[key] = { type: 'upsert', payload }
  saveQueue(queue)
}

export function queueClear(key, payload) {
  const queue = loadQueue()
  queue[key] = { type: 'clear', payload }
  saveQueue(queue)
}

export function removeFromQueue(key) {
  const queue = loadQueue()
  if (key in queue) {
    delete queue[key]
    saveQueue(queue)
  }
}

// Replays whatever's still queued on top of freshly-fetched server rows, so
// a reload while offline (or before the queue has flushed) doesn't show
// stale/blank cells for scores the player already entered.
export function applyQueueToScores(nested, queue) {
  const next = { ...nested }
  for (const entry of Object.values(queue)) {
    const { player_id, round, hole, strokes } = entry.payload
    next[player_id] = { 1: { ...next[player_id]?.[1] }, 2: { ...next[player_id]?.[2] } }
    if (entry.type === 'clear') {
      delete next[player_id][round][hole]
    } else {
      next[player_id][round][hole] = strokes
    }
  }
  return next
}
