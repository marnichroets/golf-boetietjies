// Minimal line-icon set — keeps the UI free of emoji everywhere except the
// player avatar fallback, which is an intentional feature, not decoration.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function TrophyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 14v3" />
      <path d="M9 20h6" />
      <path d="M10 17h4l.5 3h-5l.5-3Z" />
    </svg>
  )
}

export function FlagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6 3v17" />
      <path d="M6 4h11l-2.5 3.5L17 11H6" />
      <ellipse cx="6" cy="20.5" rx="4" ry="1" />
    </svg>
  )
}

export function TargetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" />
    </svg>
  )
}

export function ChartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
      <path d="M3 20h18" />
    </svg>
  )
}

export function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19c0-3.2 2.6-5.5 5.5-5.5s5.5 2.3 5.5 5.5" />
      <circle cx="17.25" cy="9" r="2.5" />
      <path d="M15.8 13.7c2.4.3 4.2 2.3 4.2 5.3" />
    </svg>
  )
}

export function PencilIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 20l.8-3.6L16 5.2a1.8 1.8 0 0 1 2.5 0l.3.3a1.8 1.8 0 0 1 0 2.5L7.6 19.2 4 20Z" />
      <path d="M14.3 6.9l2.8 2.8" />
    </svg>
  )
}

export function CameraIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5H8l1-2h6l1 2h2.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  )
}

export function ChevronLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  )
}

export function ChevronRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </svg>
  )
}

export function MapIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </svg>
  )
}

export function SwapIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 8h13" />
      <path d="M14 4.5 17.5 8 14 11.5" />
      <path d="M20 16H7" />
      <path d="M10 12.5 6.5 16 10 19.5" />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M5 12.5 9.5 17 19 6.5" />
    </svg>
  )
}

export function FlameIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 2.5c1 2.3-.4 3.6-1.5 4.8-1.4 1.5-2.6 3-2.6 5.3a4.6 4.6 0 0 0 9.2 0c0-1.6-.7-2.7-1.5-3.7.2 1.6-.4 2.6-1.2 3-.5-2-1.9-3-2-5.1-.5.7-1 1.6-1 2.7 0 .9.4 1.5.9 2.1-.9-.2-2-1-2-2.7 0-2.6 1.9-4.2 1.7-6.4Z" />
    </svg>
  )
}

export function SnowflakeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 2v20" />
      <path d="M4.5 6.5l15 11" />
      <path d="M19.5 6.5l-15 11" />
      <path d="M9 3.5 12 6l3-2.5" />
      <path d="M9 20.5 12 18l3 2.5" />
    </svg>
  )
}

export function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 3 19 5.5V11c0 5-3 8.5-7 10-4-1.5-7-5-7-10V5.5Z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  )
}

export function StarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 3.5 14.6 9 20.5 9.8 16.2 13.8 17.3 19.7 12 16.9 6.7 19.7 7.8 13.8 3.5 9.8 9.4 9 12 3.5Z" />
    </svg>
  )
}

export function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  )
}

// Dimpled golf-ball motif — used sparingly as a decorative flourish (section
// dividers, the leaderboard leader's badge), never as a generic bullet.
export function GolfBallIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
      {[
        [9, 9], [12, 8], [15, 9],
        [9, 12], [12, 12], [15, 12],
        [9, 15], [12, 16], [15, 15],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.65" fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}

// ---------- hole-shape indicators (Course tab) ----------

export function StraightHoleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 20V5" />
      <path d="M8.5 8.5 12 5 15.5 8.5" />
    </svg>
  )
}

export function DoglegRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6 20V11a5 5 0 0 1 5-5h6" />
      <path d="M13.5 3 18 6l-4.5 3" />
    </svg>
  )
}

export function SplitFairwayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 21v-8" />
      <path d="M12 13 6 4" />
      <path d="M12 13l6-9" />
    </svg>
  )
}

export function WaterHazardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M3 8.5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
      <path d="M3 13.5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
      <path d="M3 18.5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
    </svg>
  )
}

export function BookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 5.5A2 2 0 0 1 6 4h5v16H6a2 2 0 0 1-2-2V5.5Z" />
      <path d="M20 5.5A2 2 0 0 0 18 4h-5v16h5a2 2 0 0 0 2-2V5.5Z" />
      <path d="M11 4v16" />
    </svg>
  )
}

export function TicketIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a1.5 1.5 0 0 0 0 3v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a1.5 1.5 0 0 0 0-3V8Z" />
      <path d="M9 6v12" strokeDasharray="2.2 2.2" />
    </svg>
  )
}

export function WheelIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M12 3.5v5.5" />
      <path d="M12 15v5.5" />
      <path d="M3.5 12h5.5" />
      <path d="M15 12h5.5" />
      <path d="M6 6l3.5 3.5" />
      <path d="M14.5 14.5 18 18" />
      <path d="M18 6l-3.5 3.5" />
      <path d="M9.5 14.5 6 18" />
    </svg>
  )
}

export function Crest({ size = 22, ...rest }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className="crest"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...rest}
    >
      <path d="M16 4 27 8.5V16C27 22.5 22 27 16 29 10 27 5 22.5 5 16V8.5Z" />
      <path d="M16 10V22" strokeWidth="1.2" />
      <path d="M16 10 22 12.6 16 15.2Z" fill="currentColor" stroke="none" />
    </svg>
  )
}
