import { useEffect } from 'react'
import { FINE_REASONS } from '../utils/fineReasons'
import { useLocalPlayer } from '../context/LocalPlayerContext'

const FORMAT_ITEMS = [
  {
    label: 'Round 1 — Individual',
    text: 'Everyone plays their own ball, full 18. Stableford scoring.',
  },
  {
    label: 'Round 2 — Driver Scramble',
    text: 'Pick the best drive as a fourball, then everyone plays their own ball in from there. Individual scores still count.',
  },
  {
    label: 'Ryder Cup (if on)',
    text: 'Red vs Blue, captains draft the teams, 3 fourball matches + 1 singles per round, matchplay — runs across BOTH rounds using the same scores.',
  },
]

const POINTS_ROW = [
  { term: 'Bogey', pts: 1 },
  { term: 'Par', pts: 2 },
  { term: 'Birdie', pts: 3 },
  { term: 'Eagle', pts: 4 },
]

export default function Rulebook({ onClose }) {
  const { markRulebookOpened } = useLocalPlayer()

  // Single source of truth for "has this device ever seen the Rulebook" —
  // fires regardless of which entry point (TopBar icon or the one-time
  // prompt banner) rendered this modal.
  useEffect(() => {
    markRulebookOpened()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 8, 5, 0.68)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 auto',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'linear-gradient(160deg, var(--surface) 0%, var(--surface-alt) 100%)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-pop)',
          padding: '18px 18px calc(22px + var(--safe-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 16px' }} />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/logo-full-transparent-clean.png" alt="Golf Boetietjies" style={{ height: 30, margin: '0 auto 10px' }} />
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            ⛳ The Zebula Cup
          </div>
          <h2 className="page-title" style={{ fontSize: 21, margin: 0 }}>
            Official Rulebook
          </h2>
        </div>

        <RuleSection title="The Format">
          <p style={ruleIntro}>14 boetietjies, 2 rounds, 1 winner.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {FORMAT_ITEMS.map((item) => (
              <div key={item.label} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </RuleSection>

        <RuleSection title="Friday Night — The Draft">
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, margin: '0 0 8px' }}>
            Two captains have already been chosen. Friday night, they'll be revealed and go head-to-head in a
            draft, picking their teams one player at a time until all 14 are split into Red and Blue. No hiding,
            no trades — whoever gets picked, gets picked.
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
            Once teams are set, they're locked for the whole weekend across both rounds.
          </p>
        </RuleSection>

        <RuleSection title="Scoring — Stableford, Explained Once So Nobody Argues">
          <p style={ruleIntro}>Highest points wins — NOT fewest strokes.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {POINTS_ROW.map((p) => (
              <div
                key={p.term}
                className="pill"
                style={{ border: '1px solid var(--border)', fontSize: 12.5, padding: '6px 12px' }}
              >
                <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--brass-ink)' }}>{p.pts}</strong>
                {p.term}
              </div>
            ))}
          </div>
          <p style={{ ...ruleIntro, fontStyle: 'italic', color: 'var(--text-faint)' }}>
            (climbing from there if you're doing something ridiculous)
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: 'var(--text)' }}>P/U (Picked Up)</strong> — couldn't finish? Log it, counts as
            zero, keep moving.
          </p>
        </RuleSection>

        <RuleSection title="House Rules — The Fines">
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, margin: '0 0 10px' }}>
            Catch someone in the act? Open the <strong style={{ color: 'var(--text)' }}>Fines</strong> tab, tap the
            offence, tap who did it, hit <strong style={{ color: 'var(--text)' }}>Log Fine</strong>. It's logged
            live for everyone to see, with your name attached as the one who called it out.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FINE_REASONS.map((reason) => (
              <span
                key={reason}
                className="pill"
                style={{ border: '1px solid var(--border)', fontSize: 12, padding: '6px 12px' }}
              >
                {reason}
              </span>
            ))}
          </div>
        </RuleSection>

        <RuleSection title="Claims — Longest Drive & Nearest the Pin">
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
            Bombed one off the tee or stuck it close? Head to the <strong style={{ color: 'var(--text)' }}>Claims</strong> tab
            and tap <strong style={{ color: 'var(--text)' }}>I've got this</strong> under Longest Drive or Nearest
            the Pin for that round — one holder per category, per round, self-declared and up for grabs the whole
            round. Attach a photo if you want proof, and reclaim or unclaim any time someone tops you (or you
            fessed up too early).
          </p>
        </RuleSection>

        <RuleSection title="The Scorer Lock">
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
            First time your fourball opens the <strong style={{ color: 'var(--text)' }}>Scorecard</strong>, you'll
            be asked who's keeping score. Only that person's phone can enter strokes for the group that round —
            everyone else watches the same scorecard update live, read-only, so nobody's numbers get overwritten
            by accident. Any of you can tap <strong style={{ color: 'var(--text)' }}>Change scorer</strong> to hand
            it to someone else mid-round.
          </p>
        </RuleSection>

        <RuleSection title="Trophies" last>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span>🏆</span>
              <span>
                <strong>The Zebula Cup</strong> — overall individual champion
              </span>
            </div>
            <div style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span>🥄</span>
              <span>
                <strong>The Wooden Spoon</strong> — last place, carries the spoon
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)', fontStyle: 'italic' }}>
              Plus joke awards voted on at the end
            </div>
          </div>
        </RuleSection>

        <button className="btn btn-block" onClick={onClose} style={{ marginTop: 6 }}>
          Close
        </button>
      </div>
    </div>
  )
}

function RuleSection({ title, children, last }) {
  return (
    <div style={{ marginBottom: last ? 20 : 26 }}>
      <div className="section-heading">{title}</div>
      {children}
    </div>
  )
}

const ruleIntro = {
  fontSize: 13,
  fontWeight: 700,
  margin: '0 0 10px',
}
