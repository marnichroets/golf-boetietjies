// Deterministic accent color + emoji fallback per player, so everyone gets a
// consistent identity across the app without needing extra data entry.

const PALETTE = [
  '#3ddc97', '#4fb0ff', '#ff9f43', '#ff5e78', '#a78bfa',
  '#facc15', '#2dd4bf', '#f472b6', '#60a5fa', '#fb923c',
  '#34d399', '#c084fc', '#f87171', '#38bdf8',
]

const EMOJIS = ['⛳', '🏌️', '🐆', '🦁', '🐺', '🦅', '🐻', '🦊', '🐯', '🦈', '🐗', '🦏', '🐐', '🦂']

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function playerColor(player) {
  if (!player) return PALETTE[0]
  return PALETTE[hashString(player.id || player.name) % PALETTE.length]
}

export function playerEmoji(player) {
  if (!player) return '⛳'
  return EMOJIS[hashString(player.id || player.name) % EMOJIS.length]
}

export function playerInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}
