import type { CSSProperties, ReactNode } from 'react'
import { INK, TYPE } from './chrome'

/** Small caps label. The landing page's own, so it can sit on dark app bodies
 *  as well as light ones — `ui/Label` hardcodes a slate ink. */
export function Eyebrow({ children, tone = 'dim' }: { children: ReactNode; tone?: 'dim' | 'light' }) {
  return (
    <span
      className="text-[11.5px] font-bold uppercase tracking-[.1em]"
      style={{ fontFamily: 'var(--font-ui)', color: tone === 'light' ? 'rgba(255,255,255,.55)' : '#7A8593' }}
    >
      {children}
    </span>
  )
}

export function AppHeading({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <h2 className={`max-w-[19ch] ${TYPE.heading}`} style={{ color: dark ? '#F4F6F9' : INK.strong }}>
      {children}
    </h2>
  )
}

export function AppLead({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={`max-w-[52ch] ${TYPE.lead}`} style={{ color: dark ? 'rgba(255,255,255,.66)' : INK.body }}>
      {children}
    </p>
  )
}

/**
 * The tab strip a real app puts under its title bar. Presentational: it is
 * chrome that says which view of the app you are looking at, not a control —
 * a segmented control that changes nothing would be a lie about what the
 * window does, and a row of dead buttons is worse for a keyboard user than a
 * row of text.
 */
export function Segmented({
  items, active, dark = false,
}: { items: readonly string[]; active: string; dark?: boolean }) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-[7px] p-[2px]"
      style={{
        background: dark ? 'rgba(255,255,255,.08)' : 'linear-gradient(#E4E9EF,#D9E0E8)',
        boxShadow: dark ? 'none' : 'inset 0 1px 2px rgba(20,26,34,.16)',
      }}
    >
      {items.map((item) => {
        const on = item === active
        return (
          <span
            key={item}
            className="px-[13px] py-[4px] text-[12px] font-bold"
            style={{
              fontFamily: 'var(--font-ui)',
              borderRadius: 5,
              color: on ? (dark ? '#12141A' : '#26313D') : (dark ? 'rgba(255,255,255,.55)' : '#7A8593'),
              background: on
                ? (dark ? '#E7EAEF' : 'linear-gradient(#FFFFFF,#F1F4F8)')
                : 'transparent',
              boxShadow: on ? '0 1px 2px rgba(16,30,54,.28), inset 0 1px 0 rgba(255,255,255,.9)' : 'none',
            }}
          >
            {item}
          </span>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Charts. Pure functions over a fixed array of numbers — no randomness,
 * no measurement, no time. They render identically on the server and the
 * client, which is what keeps them out of the hydration-mismatch class of
 * bug that has cost this project twice.
 * ------------------------------------------------------------------ */

/** Maps values onto a 0..w by 0..h box and returns the polyline points. */
function points(values: readonly number[], w: number, h: number, pad: number): [number, number][] {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const step = values.length > 1 ? w / (values.length - 1) : 0
  return values.map((v, i) => [i * step, pad + (1 - (v - min) / span) * (h - pad * 2)])
}

function line(pts: readonly [number, number][]): string {
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
}

export function Sparkline({
  values, stroke, width = 62, height = 20,
}: { values: readonly number[]; stroke: string; width?: number; height?: number }) {
  const pts = points(values, width, height, 2)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="flex-none">
      <path d={line(pts)} fill="none" stroke={stroke} strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The filled trace both Activity Monitor and Stocks draw. `gradientId` has to
 * be unique per instance on a page — two <linearGradient> elements sharing an
 * id is the classic reason the second chart on a page renders unfilled.
 */
export function AreaChart({
  values, width, height, stroke, fillFrom, fillTo, gradientId, grid = 0, style,
}: {
  values: readonly number[]
  width: number
  height: number
  stroke: string
  fillFrom: string
  fillTo: string
  gradientId: string
  /** Number of horizontal rules behind the trace. 0 for none. */
  grid?: number
  style?: CSSProperties
}) {
  const pts = points(values, width, height, 6)
  const area = `${line(pts)} L${width} ${height} L0 ${height} Z`
  const last = pts[pts.length - 1]
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
      style={{ width: '100%', height, display: 'block', ...style }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillFrom} />
          <stop offset="100%" stopColor={fillTo} />
        </linearGradient>
      </defs>
      {grid > 0 && Array.from({ length: grid }, (_, i) => (
        <line key={i} x1="0" x2={width} y1={((i + 1) * height) / (grid + 1)} y2={((i + 1) * height) / (grid + 1)}
              stroke="currentColor" strokeWidth="1" opacity=".12" />
      ))}
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line(pts)} fill="none" stroke={stroke} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {last && <circle cx={last[0]} cy={last[1]} r="3.4" fill={stroke} />}
    </svg>
  )
}

/**
 * A figure and its caption, in the register the site uses for every number:
 * tabular mono, exact, never rounded up.
 *
 * `size` exists because three figures at one weight is three claims arriving
 * at once, and a visitor thirty seconds old reads none of them. The payout is
 * the hero number; everything beside it is a footnote to it, and the type has
 * to say so before the words do.
 */
export function Stat({
  value, caption, dark = false, accent = false, size = 'md',
}: {
  value: string
  caption: ReactNode
  dark?: boolean
  accent?: boolean
  size?: 'hero' | 'md'
}) {
  const hero = size === 'hero'
  return (
    <div className={hero ? 'min-w-[9ch]' : 'max-w-[24ch]'}>
      <div
        className={`tabular font-bold leading-none tracking-[-.032em] ${
          hero ? 'text-[clamp(38px,3.3vw,54px)]' : 'text-[clamp(21px,1.7vw,27px)]'
        }`}
        style={{ color: accent ? '#5FAF00' : dark ? '#FFFFFF' : INK.strong }}
      >
        {value}
      </div>
      <div
        className={`leading-[1.35] ${hero ? 'mt-[9px] text-[13px] font-bold' : 'mt-[7px] text-[12px]'}`}
        style={{
          fontFamily: 'var(--font-ui)',
          color: dark ? 'rgba(255,255,255,.55)' : hero ? '#5C6875' : '#7A8593',
        }}
      >
        {caption}
      </div>
    </div>
  )
}
