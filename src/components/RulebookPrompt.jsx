import { useState } from 'react'
import { useLocalPlayer } from '../context/LocalPlayerContext'
import { BookIcon } from './icons'
import Rulebook from './Rulebook'

// Shown once per device, only right after an explicit PickPlayer pick
// (never on an ordinary reopen where the player was already signed in) —
// a nudge toward the Rulebook, since the TopBar icon alone is easy to
// miss on a first visit.
const SEEN_KEY = 'gb_rulebook_prompt_seen'

export default function RulebookPrompt() {
  const { justPicked, clearJustPicked } = useLocalPlayer()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(SEEN_KEY) === 'true')
  const [showRulebook, setShowRulebook] = useState(false)

  if (dismissed || !justPicked) return null

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, 'true')
    setDismissed(true)
    clearJustPicked()
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowRulebook(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 12px',
          marginBottom: 16,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-strong)',
          background: 'linear-gradient(160deg, rgba(171,124,30,0.12) 0%, var(--surface-alt) 100%)',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
        }}
      >
        <BookIcon width={18} height={18} strokeWidth={1.8} style={{ color: 'var(--brass)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, lineHeight: 1.4, color: 'var(--text-dim)' }}>
          <strong style={{ color: 'var(--text)' }}>New here?</strong> Check the Rulebook to see how everything works.
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            dismiss()
          }}
          aria-label="Dismiss"
          style={{
            appearance: 'none',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-faint)',
            fontSize: 18,
            lineHeight: 1,
            padding: 4,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
      {showRulebook && (
        <Rulebook
          onClose={() => {
            setShowRulebook(false)
            dismiss()
          }}
        />
      )}
    </>
  )
}
