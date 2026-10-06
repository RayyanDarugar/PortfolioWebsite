/**
 * Dock icon art for the advertiser account.
 *
 * Same rules as `icons.tsx` — 24×24 viewBoxes, pure geometry, no assets — and
 * five new glyphs rather than seven. The mark and the envelope are not
 * reskinned: on a Mac, Mail is Mail whoever is logged in, and the product's
 * own mark is the product's own mark. Recolouring either to prove the desktop
 * is different would be the one detail that gave away that it is a costume.
 *
 * The five that are new are the five apps that do not exist on the other
 * account at all.
 */

/** Campaign: the target. Concentric rings and a mark in the middle — the
 *  plainest possible drawing of *this audience, on purpose*. */
export function TargetGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <circle cx="12" cy="12" r="9.4" stroke="#fff" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="5.2" stroke="rgba(255,255,255,.66)" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.9" fill="#fff" />
      <path d="M12 1.4v3.1M12 19.5v3.1M1.4 12h3.1M19.5 12h3.1"
            stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** Audience: three declared seats, the middle one filled. Not a crowd — a
 *  panel, which is a countable thing. */
export function PanelGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <circle cx="5.4" cy="8.4" r="2.7" fill="rgba(255,255,255,.62)" />
      <path d="M1 19c0-2.5 2-4.3 4.4-4.3S9.8 16.5 9.8 19Z" fill="rgba(255,255,255,.62)" />
      <circle cx="18.6" cy="8.4" r="2.7" fill="rgba(255,255,255,.62)" />
      <path d="M14.2 19c0-2.5 2-4.3 4.4-4.3S23 16.5 23 19Z" fill="rgba(255,255,255,.62)" />
      <circle cx="12" cy="7" r="3.4" fill="#fff" />
      <path d="M6.4 20.4c0-3.1 2.5-5.4 5.6-5.4s5.6 2.3 5.6 5.4Z" fill="#fff" />
    </svg>
  )
}

/** Bid Console: the board. Four bids at four heights with the winning one
 *  capped — the shape of a second-price auction, not a stock chart. */
export function BoardGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <rect x="2.4" y="14.6" width="3.6" height="7" rx="1.1" fill="rgba(255,255,255,.45)" />
      <rect x="7.8" y="10.8" width="3.6" height="10.8" rx="1.1" fill="rgba(255,255,255,.62)" />
      <rect x="13.2" y="6.4" width="3.6" height="15.2" rx="1.1" fill="#FFD36E" />
      <rect x="18.6" y="3" width="3.6" height="18.6" rx="1.1" fill="#fff" />
      <path d="M17.6 4.6h6" stroke="#7BE000" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

/** Measurement: the rule. Ticks of two lengths, because the whole app is
 *  about what is and is not counted. */
export function RuleGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <rect x="1.6" y="7.4" width="20.8" height="9.2" rx="2.2" fill="#fff" />
      <g stroke="#2C3D52" strokeWidth="1.5" strokeLinecap="round">
        <path d="M5.2 7.9v4.4" />
        <path d="M8.6 7.9v2.6" />
        <path d="M12 7.9v4.4" />
        <path d="M15.4 7.9v2.6" />
        <path d="M18.8 7.9v4.4" />
      </g>
    </svg>
  )
}

/** Privacy & Security, advertiser side: the lock on the file. The other
 *  account gets a shield, because the question there is what the software can
 *  see; here the question is what leaves in the report. */
export function VaultGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path d="M7.4 10.4V7.6a4.6 4.6 0 0 1 9.2 0v2.8" stroke="#fff" strokeWidth="2"
            strokeLinecap="round" />
      <rect x="3.8" y="10.2" width="16.4" height="11.6" rx="2.8" fill="#fff" />
      <circle cx="12" cy="15.2" r="2.1" fill="#3A4B63" />
      <path d="M11.1 16.4h1.8l.6 3.2h-3Z" fill="#3A4B63" />
    </svg>
  )
}
