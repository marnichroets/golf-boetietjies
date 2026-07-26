// Short relative-time labels for the live feed ("2m ago", "Just now"...).

export function timeAgo(isoString) {
  const then = new Date(isoString).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000))

  if (seconds < 15) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
