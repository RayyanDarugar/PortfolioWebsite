import type { CSSProperties, ReactNode } from 'react'
import {
  PINSTRIPE, TITLE_BAR, TITLE_INK, WINDOW_FRAME, WINDOW_RADIUS, WINDOW_SHADOW,
} from './chrome'

/**
 * Traffic lights with real gloss: a coloured fill, a bright specular cap in
 * the top third, an inner ring for the rim, and a soft outer shadow. The flat
 * `background: '#FF5F57'` circles the simulator uses are correct at 12px on a
 * scaled canvas and read as three stickers at full size.
 *
 * `glyph` is the mark macOS reveals inside the dot when the pointer is
 * anywhere over the window. Its absence is one of the specific things that
 * reads as a screenshot of an interface rather than an interface.
 */
const LIGHTS: readonly { base: string; hi: string; rim: string; ink: string; glyph: ReactNode }[] = [
  {
    base: '#F5564C', hi: '#FF9C93', rim: '#C1372F', ink: '#7C0A02',
    glyph: <path d="M3.4 3.4 6.6 6.6M6.6 3.4 3.4 6.6" />,
  },
  {
    base: '#F5B32C', hi: '#FFD98A', rim: '#C58715', ink: '#8A5300',
    glyph: <path d="M3 5h4" />,
  },
  {
    base: '#2FC33F', hi: '#8AEE8C', rim: '#1E9128', ink: '#0B5313',
    // The zoom mark is two filled corners, not a plus — macOS changed it a
    // decade ago and the plus is the tell that a window was drawn from memory.
    glyph: <path d="M3 6.9V3.1h3.8L3 6.9ZM7 3.1v3.8H3.2L7 3.1Z" fill="currentColor" stroke="none" />,
  },
]

function TrafficLights() {
  return (
    <span className="flex flex-none items-center gap-[8px]" aria-hidden>
      {LIGHTS.map((light) => (
        <span
          key={light.base}
          className="relative block h-[12px] w-[12px] rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 22%, ${light.hi} 0%, ${light.base} 58%, ${light.rim} 100%)`,
            boxShadow: `inset 0 0 0 .5px ${light.rim}, inset 0 -1px 2px rgba(0,0,0,.24), 0 1px 1px rgba(16,24,40,.28)`,
          }}
        >
          <span
            className="absolute left-1/2 top-[1.5px] block h-[3.5px] w-[6px] -translate-x-1/2 rounded-full transition-opacity duration-150 group-hover/window:opacity-40"
            style={{ background: 'rgba(255,255,255,.72)', filter: 'blur(.4px)' }}
          />
          <svg
            viewBox="0 0 10 10"
            className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-150 group-hover/window:opacity-100"
            fill="none"
            stroke={light.ink}
            strokeWidth="1.4"
            strokeLinecap="round"
            style={{ color: light.ink }}
          >
            {light.glyph}
          </svg>
        </span>
      ))}
    </span>
  )
}

/**
 * The landing page's window. Aqua chrome, because every window on this page
 * is our product speaking rather than a depiction of the visitor's machine
 * (spec §6.1) — the one exception is the hero's demo display, which is not a
 * window and does not come through here.
 *
 * Three things make it read as an object rather than a panel, and all three
 * are worth the bytes:
 *
 *  - **The title bar is glass.** It is the only part of the frame the
 *    wallpaper shows through, so it is the only part that can prove there is
 *    a desktop behind the window rather than a flat backdrop.
 *  - **The body carries the fill, not the root.** A `backdrop-filter` samples
 *    what is painted behind its own element, so an opaque root would blur its
 *    own background and produce nothing.
 *  - **The frame is an overlay of insets**, lighter at the top than at the
 *    bottom, drawn over the content so the body's own fill cannot cover it.
 *
 * `toolbar` is the row under the title bar. It is what makes an app window
 * read as *that* app rather than as a generic card: Activity Monitor's tab
 * strip, Mail's mailbox header, Stocks' range selector.
 */
export function OSWindow({
  title, subtitle, toolbar, children, style, bodyStyle, className = '',
}: {
  title: string
  /** Small right-aligned text in the title bar — a path, a count, a status. */
  subtitle?: string
  toolbar?: ReactNode
  children: ReactNode
  style?: CSSProperties
  bodyStyle?: CSSProperties
  className?: string
}) {
  return (
    <div
      className={`group/window relative flex min-h-0 flex-col overflow-hidden ${className}`}
      style={{
        borderRadius: WINDOW_RADIUS,
        boxShadow: `var(--os-window-shadow, ${WINDOW_SHADOW})`,
        ...style,
      }}
    >
      <div
        className="relative flex h-[40px] flex-none items-center gap-3 px-[13px]"
        style={TITLE_BAR}
      >
        <TrafficLights />
        <b
          className="pointer-events-none absolute inset-x-0 text-center text-[13px] font-bold"
          style={TITLE_INK}
        >
          {title}
        </b>
        {subtitle && (
          <span
            className="tabular relative ml-auto text-[11px] font-bold uppercase tracking-[.07em] text-[#7C8695]"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            {subtitle}
          </span>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: PINSTRIPE, opacity: 0.55 }}
        />
      </div>

      {toolbar && (
        <div
          className="flex flex-none items-center gap-3 px-[13px] py-[9px]"
          style={{
            background: 'linear-gradient(#F7F9FC,#EDF1F6)',
            borderBottom: '1px solid rgba(20,26,34,.14)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          {toolbar}
        </div>
      )}

      <div
        className="min-h-0 flex-1 overflow-hidden"
        style={{ background: '#FBFCFD', ...bodyStyle }}
      >
        {children}
      </div>

      {/* The frame. Last child so it sits over the body's own fill; clipped to
          the root's radius, so the highlight follows the corner instead of
          cutting across it. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: WINDOW_RADIUS,
          boxShadow: `var(--os-window-frame, ${WINDOW_FRAME})`,
        }}
      />
    </div>
  )
}
