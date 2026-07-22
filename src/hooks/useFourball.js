import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'gb_fourball_ids'
export const MAX_GROUP = 4

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Persists the selected fourball (up to 4 player ids) to localStorage so the
// group survives reloads/app restarts and doesn't need re-picking every hole.
// Starts empty (rather than defaulting to "just me") so first-time use always
// surfaces the picker step.
export function useFourball() {
  const [groupIds, setGroupIds] = useState(() => readStored() || [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groupIds))
  }, [groupIds])

  const toggleMember = useCallback((id) => {
    setGroupIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_GROUP) return prev
      return [...prev, id]
    })
  }, [])

  const clearGroup = useCallback(() => setGroupIds([]), [])

  return { groupIds, setGroupIds, toggleMember, clearGroup }
}
