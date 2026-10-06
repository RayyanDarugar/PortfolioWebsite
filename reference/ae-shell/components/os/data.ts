/**
 * Scene data for the landing page's app windows.
 *
 * The load-bearing business figures are NOT here — the clearing CPM, the
 * impressions per day, the revenue share and the payout all come from
 * `lib/model`, which stays the single source so the page cannot contradict
 * itself between the Calculator and the exchange. What lives here is scene
 * detail: the names of the things you wait on, the categories bidding, the
 * two permission lists. Those describe the world the product sits in rather
 * than the model's arithmetic.
 */
import { CPM_DESIGN_POINT } from '@/lib/model/figures'

/* ------------------------------------------------------------------ *
 * Activity Monitor
 * ------------------------------------------------------------------ */

export interface WaitRow {
  /** What is running. */
  process: string
  /** What it is doing while you sit there. */
  detail: string
  /** Minutes per working day spent waiting on it. */
  minutes: number
}

export const WAIT_ROWS: readonly WaitRow[] = [
  { process: 'Claude Code',     detail: 'generating',        minutes: 64 },
  { process: 'GitHub Actions',  detail: 'running CI',        minutes: 33 },
  { process: 'Cursor',          detail: 'indexing workspace', minutes: 28 },
  { process: 'Docker',          detail: 'building image',    minutes: 21 },
  { process: 'Figma',           detail: 'exporting frames',  minutes: 16 },
  { process: 'npm',             detail: 'installing',        minutes: 12 },
]

/** Summed, never typed twice. The window prints this total and the rows that
 *  make it up on the same screen, and a retyped total is the classic way the
 *  two stop agreeing after somebody edits one row. */
export const WAIT_MINUTES_TOTAL = WAIT_ROWS.reduce((sum, row) => sum + row.minutes, 0)

/** An eight-hour working day, in minutes. The denominator for the share. */
export const WORKING_DAY_MINUTES = 8 * 60

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

/**
 * Minutes spent waiting in each hour of a 09:00–21:00 day, for the graph.
 * Hand-authored rather than generated: the shape is the point — a slow
 * morning, a peak either side of lunch, and the long 3am tail the rest of
 * the site's jokes are built on.
 */
export const WAIT_CURVE: readonly number[] = [4, 9, 14, 19, 12, 6, 15, 22, 18, 13, 21, 26, 17]
export const WAIT_CURVE_START_HOUR = 9

/* ------------------------------------------------------------------ *
 * Stocks — the exchange
 * ------------------------------------------------------------------ */

export interface BidRow {
  /** Advertiser categories, not company names. The board is real inventory
   *  clearing against real demand segments; naming actual companies would be
   *  a claim about who buys from us that we are not in a position to make. */
  category: string
  ticker: string
  /** Bid CPM, in dollars. */
  bid: number
  /** Change against the previous clear, in percent. */
  change: number
  /** Sparkline shape, newest last. Values are indexed, not dollars. */
  spark: readonly number[]
}

/**
 * A second-price board. The top row wins the slot; the runner-up's bid is
 * what the winner actually pays, and that runner-up bid is the model's
 * clearing CPM — so the price printed here is the same $25.00 the Calculator
 * divides by, read from `lib/model` rather than typed.
 */
export const BID_ROWS: readonly BidRow[] = [
  { category: 'AI tools', ticker: 'AI-TOOLS', bid: 31.1, change: 4.2,
    spark: [18, 21, 20, 24, 23, 27, 29, 31] },
  { category: 'Productivity tools', ticker: 'PRODUCT', bid: CPM_DESIGN_POINT.value, change: 1.8,
    spark: [19, 20, 22, 21, 23, 24, 24, 25] },
  { category: 'Cloud storage', ticker: 'STORAGE', bid: 22.4, change: -0.6,
    spark: [24, 25, 23, 24, 22, 23, 22, 22] },
  { category: 'Security', ticker: 'SECOPS', bid: 19.8, change: 2.4,
    spark: [15, 16, 17, 17, 18, 18, 19, 20] },
  { category: 'Design tools', ticker: 'DESIGN', bid: 17.25, change: -1.9,
    spark: [21, 20, 19, 19, 18, 18, 17, 17] },
  { category: 'Personal finance', ticker: 'FINANCE', bid: 14.6, change: 0.9,
    spark: [13, 13, 14, 14, 15, 14, 14, 15] },
]

/** The winning bid and the price it clears at. Derived from the board so the
 *  board and the commentary cannot disagree. */
export const WINNING_BID = BID_ROWS[0]
export const CLEARING_BID = BID_ROWS[1]

/** The clearing price through the session, for the big chart. Indexed
 *  dollars-per-thousand, ending at the clearing CPM. */
export const CLEARING_CURVE: readonly number[] = [
  18.4, 19.1, 18.6, 20.3, 21.0, 20.4, 22.1, 23.4, 22.8, 24.2, 23.9, 25.0,
]

/* ------------------------------------------------------------------ *
 * Privacy & Security
 * ------------------------------------------------------------------ */

export const READS: readonly string[] = [
  'The position and size of every open window',
  'Which application is frontmost',
  'Whether something on screen is generating',
  'Your display resolution and scale factor',
  'The profile you declared when you signed up',
]

export const NEVER_READS: readonly string[] = [
  'The pixels inside any window',
  'Text, code or messages on your screen',
  'Keystrokes, clipboard or passwords',
  'Files, folders or browsing history',
  'Microphone, camera or location',
]

/* ------------------------------------------------------------------ *
 * The menu bar
 * ------------------------------------------------------------------ *
 *
 * `APP_MENUS` used to live here: a per-app list of `File Edit View Window
 * Help` titles for the bar to swap between. They are gone. Five words that
 * open nothing were occupying the one part of the bar a Mac user actually
 * reads, while the site's real routes sat in the status area beside the
 * battery. The menu titles are now the routes themselves — see `OSMenuBar` —
 * which is both more faithful to the metaphor and, unlike the menus, useful.
 */
