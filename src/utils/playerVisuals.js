// Deterministic accent color + emoji fallback per player, so everyone gets a
// consistent identity across the app without needing extra data entry.

// Jewel-toned, club-appropriate palette — rich rather than neon.
const PALETTE = [
  '#2f7d5c', '#3f6fa8', '#a8652f', '#8a3a4c', '#6b5b95',
  '#3a8f8a', '#a4522d', '#5c6b4f', '#c17a3f', '#4a5d7a',
  '#7a3f5c', '#5f8f5c', '#8f5c3f', '#4f7d8f',
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
