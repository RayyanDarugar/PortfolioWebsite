/**
 * Dock icon art. Each one is drawn rather than lettered, because a dock of
 * seven coloured squares with initials in them is the exact "design
 * prototype" register the rebuild is trying to leave behind.
 *
 * All seven are 24×24 viewBoxes so the tile can scale them as one, and all
 * seven are pure geometry — no external assets, nothing to fail to load.
 */

/** Ours: the free rectangle, outlined, with the ad seated inside it. The
 *  whole product in one glyph. */
export function MarkGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <rect x="2.4" y="4.4" width="19.2" height="15.2" rx="2.4"
            stroke="rgba(255,255,255,.95)" strokeWidth="1.7" strokeDasharray="3.1 2.3" />
      <rect x="6.2" y="8.2" width="11.6" height="7.6" rx="1.5" fill="#fff" />
      <rect x="7.9" y="10" width="8.2" height="1.5" rx=".75" fill="#5FAF00" />
      <rect x="7.9" y="12.6" width="5.4" height="1.5" rx=".75" fill="#96D64B" />
    </svg>
  )
}

/** Activity Monitor: the trace. */
export function PulseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path d="M1.5 15.4h3.6l2-6.6 3 12 3.1-15 2.4 9.6h5.9"
            stroke="#7BE000" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** System Settings: the gear. Teeth generated from one loop so they are
 *  evenly spaced by construction rather than by eight hand-typed rects. */
export function GearGlyph() {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <g fill="#fff">
        {teeth.map((deg) => (
          <rect key={deg} x="10.85" y="1.4" width="2.3" height="5.2" rx="1.1"
                transform={`rotate(${deg} 12 12)`} />
        ))}
      </g>
      <circle cx="12" cy="12" r="7.1" fill="#fff" />
      <circle cx="12" cy="12" r="3.1" fill="#8A929C" />
    </svg>
  )
}

/** Calculator: the keypad, with the operator column in Apple's orange. */
export function KeypadGlyph() {
  const cells = [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => ({ row, col })))
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <rect x="3.6" y="2.6" width="16.8" height="4.4" rx="1.2" fill="rgba(255,255,255,.30)" />
      <rect x="12.4" y="3.9" width="6.6" height="1.8" rx=".9" fill="#fff" />
      {cells.map(({ row, col }) => (
        <rect key={`${row}-${col}`} x={3.6 + col * 4.6} y={8.9 + row * 4.4}
              width="3.6" height="3.4" rx="1" fill="rgba(255,255,255,.88)" />
      ))}
      <rect x="17.4" y="8.9" width="3" height="12.2" rx="1.3" fill="#FF9F0A" />
    </svg>
  )
}

/** Stocks: the line, with the area under it filled. */
export function ChartGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path d="M2.2 18.6 6.6 13.4 10.4 15.6 15 8.2 18.4 11 21.8 5.4V21H2.2Z"
            fill="rgba(123,224,0,.30)" />
      <path d="M2.2 18.6 6.6 13.4 10.4 15.6 15 8.2 18.4 11 21.8 5.4"
            stroke="#7BE000" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="21.8" cy="5.4" r="2" fill="#7BE000" />
    </svg>
  )
}

/** Privacy & Security: the shield, with the keyhole cut out of it. */
export function ShieldGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path d="M12 1.8 21 5.4v6.1c0 5.6-4.4 9.2-9 10.7-4.6-1.5-9-5.1-9-10.7V5.4l9-3.6Z"
            fill="#fff" />
      <circle cx="12" cy="10.4" r="2.3" fill="#1B63C0" />
      <path d="M10.9 11.6h2.2l.7 4.6h-3.6l.7-4.6Z" fill="#1B63C0" />
    </svg>
  )
}

/** Mail: the envelope. */
export function MailGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <rect x="1.8" y="4.6" width="20.4" height="14.8" rx="2.6" fill="#fff" />
      <path d="M3.4 7 12 13.3 20.6 7" stroke="#1B63C0" strokeWidth="1.9"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** A page with a header line: the Résumé app's tile. */
export function DocGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      <path d="M10 4h14l8 8v22a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            fill="#FBFCFE" stroke="rgba(20,26,34,.35)" strokeWidth="1.2" />
      <path d="M24 4l8 8h-8Z" fill="#D8DFE8" />
      <rect x="12" y="17" width="16" height="2.4" rx="1.2" fill="#1B63C0" />
      <rect x="12" y="22" width="16" height="2.4" rx="1.2" fill="rgba(20,26,34,.25)" />
      <rect x="12" y="27" width="11" height="2.4" rx="1.2" fill="rgba(20,26,34,.25)" />
    </svg>
  )
}
