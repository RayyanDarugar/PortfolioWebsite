/**
 * Scene data for the advertiser desktop.
 *
 * Same rule as `data.ts`: the load-bearing business figures are **not** here.
 * The clearing CPM, the observed comparisons, the impressions a seat opens in
 * a day and the working year all come from `lib/model`, so the Campaign
 * window's estimate and the Bid Console's board cannot contradict each other
 * or the user desktop. What lives here is the world those figures describe —
 * the three surfaces, the declared panel's composition, the delivery report's
 * shape.
 *
 * The one arithmetic rule worth stating: this module does not price a
 * surface itself. `/exchange` already defines these same three named
 * surfaces (`components/exchange/constants.ts`) with a `priceIndex` weighted
 * to blend back to `CPM_DESIGN_POINT`, and `board.test.ts` asserts that
 * identity. Pricing the advertiser path off anything else — an offset typed
 * here, a different multiplier — would give the desktop and the board two
 * disagreeing numbers for the same slot, and the hero links straight from one
 * to the other. So every price below is read off the exchange's own
 * `priceIndex`; this file only supplies the desktop-specific presentation
 * (name, size, note, sparkline shape) for the three surfaces it already owns.
 */
import { CPM_DESIGN_POINT } from '@/lib/model/figures'
import type { CreativeSize } from '@/components/creatives/Creative'
import {
  surfaceById as exchangeSurfaceById,
  type SurfaceId as ExchangeSurfaceId,
} from '@/components/exchange/constants'

/* ------------------------------------------------------------------ *
 * The surfaces
 * ------------------------------------------------------------------ */

export interface Surface {
  id: string
  /** The site's own names for these, unchanged — `/advertisers` sells the
   *  same three and two names for one surface is how a product starts
   *  sounding like two products. */
  name: string
  size: CreativeSize
  /** 1–3, ascending intrusion and ascending attention. */
  intensity: 1 | 2 | 3
  note: string
  /** The `/exchange` surface this is presenting. Both boards price off this
   *  one's `priceIndex`, so they cannot quote two different clearing prices
   *  for what is, underneath, the same slot. */
  exchangeId: ExchangeSurfaceId
  /** Clearing price through the session, indexed, for the board's sparkline.
   *  Shapes, not dollars — the dollar figure beside them is derived. */
  spark: readonly number[]
}

export const SURFACES: readonly Surface[] = [
  {
    id: 'ambient',
    name: 'Ambient strip',
    size: '728x90',
    intensity: 1,
    note: 'A thin strip in the free margin around whatever is open. Present, low friction.',
    exchangeId: 'ambient',
    spark: [11, 12, 11, 13, 12, 13, 12, 13],
  },
  {
    id: 'card',
    name: 'Side card',
    size: '300x250',
    intensity: 2,
    note: 'A card docked in space the open window is not using. Room for a headline and a line under it.',
    exchangeId: 'side',
    spark: [16, 16, 17, 18, 17, 19, 18, 19],
  },
  {
    id: 'wait',
    name: 'Wait-state unit',
    size: '300x600',
    intensity: 3,
    note: 'The unit that renders while a model is generating. Nothing else on screen is moving.',
    exchangeId: 'wait',
    spark: [21, 22, 21, 23, 24, 23, 25, 25],
  },
]

/** What one surface clears at, in dollars per thousand — read off the
 *  exchange's own `priceIndex` and rounded exactly the way `board.ts` rounds
 *  its at-rest price, so this figure and the board's are the same number, not
 *  two numbers that happen to agree today. */
export function clearingCpm(surface: Surface): number {
  const { priceIndex } = exchangeSurfaceById(surface.exchangeId)
  return Math.round(CPM_DESIGN_POINT.value * priceIndex * 100) / 100
}

export function surfaceById(id: string): Surface | undefined {
  return SURFACES.find((surface) => surface.id === id)
}

/** Surfaces, priciest first — the order a bid is tested against so it lands
 *  on the best surface it clears rather than the first one it happens to
 *  beat. */
const SURFACES_BY_PRICE_DESC = [...SURFACES].sort((a, b) => clearingCpm(b) - clearingCpm(a))

/**
 * The one placement rule for the whole advertiser path: the highest-priced
 * surface a bid strictly clears, or `undefined` if it clears none. Strictly —
 * a bid that only matches a surface's price does not win it, the same
 * second-price tie-break `/exchange` itself uses.
 *
 * `BidConsoleApp` and `AdSlot` used to each carry their own copy of this
 * rule, phrased differently ("the best surface this bid clears" versus "bid
 * beats the side card's price"). Two phrasings of one rule is how a bid ends
 * up placed on the side card in one window and the wait-state unit in the
 * other the moment bids rise past the side card's price. Routing both
 * windows through this one function is what makes that disagreement
 * structurally impossible rather than merely untested.
 */
export function bestSurfaceFor(bid: number): Surface | undefined {
  return SURFACES_BY_PRICE_DESC.find((surface) => bid > clearingCpm(surface))
}

/**
 * Every advertiser whose best-clearing surface is `surfaceId`, highest bid
 * first. Generic and structural on purpose — `adData.ts` prices surfaces, it
 * does not know a brand's name, colour or headline, so the caller's own
 * advertiser list comes in as a parameter typed only by the one field this
 * function reads (`bid`) rather than by an import of
 * `components/creatives/advertisers`. That keeps this module free of scene
 * data and free of a dependency edge back into it.
 */
export function advertisersOn<T extends { readonly bid: number }>(
  surfaceId: string,
  advertisers: readonly T[],
): T[] {
  return advertisers
    .filter((advertiser) => bestSurfaceFor(advertiser.bid)?.id === surfaceId)
    .sort((a, b) => b.bid - a.bid)
}

/* ------------------------------------------------------------------ *
 * The declared panel
 * ------------------------------------------------------------------ */

export type Authority = 'Approves spend' | 'Recommends' | 'No budget authority'

export interface Cohort {
  role: string
  stage: string
  setting: string
  /** Everything this cohort declared using. A tools filter matches if any
   *  selected tool is in here — the field that ties targeting to what is
   *  actually on screen, not to a job title alone. */
  tools: readonly string[]
  authority: Authority
  /** Fraction of the declared panel. Shares rather than head counts: the
   *  panel's absolute size is not a claim this site is in a position to make,
   *  and the number an advertiser actually needs — how many seats *their*
   *  budget reaches — is derived from their plan instead. */
  share: number
}

/**
 * The population is people who use AI tools on a computer — students,
 * freelancers and professionals across functions, not one occupation. Two
 * student rows sit first on purpose: students are the likely beachhead, not
 * an afterthought, and their combined 0.19 share is the largest single slice
 * of the panel.
 */
export const COHORTS: readonly Cohort[] = [
  { role: 'Student', stage: 'Student', setting: 'Studying', tools: ['AI chat', 'Docs & notes'], authority: 'No budget authority', share: 0.11 },
  { role: 'Student', stage: 'Student', setting: 'Studying', tools: ['AI chat', 'Presentation', 'Spreadsheets'], authority: 'No budget authority', share: 0.08 },
  { role: 'Software', stage: 'Early career', setting: 'Startup', tools: ['AI coding', 'AI chat'], authority: 'Recommends', share: 0.09 },
  { role: 'Software', stage: 'Experienced', setting: 'Company', tools: ['AI coding', 'AI chat', 'Docs & notes'], authority: 'Recommends', share: 0.08 },
  { role: 'Design', stage: 'Experienced', setting: 'Freelance', tools: ['Design', 'Image generation'], authority: 'Approves spend', share: 0.07 },
  { role: 'Writing', stage: 'Early career', setting: 'Freelance', tools: ['AI chat', 'Docs & notes'], authority: 'No budget authority', share: 0.07 },
  { role: 'Marketing', stage: 'Experienced', setting: 'Company', tools: ['AI chat', 'Image generation', 'Presentation'], authority: 'Recommends', share: 0.07 },
  { role: 'Marketing', stage: 'Lead / manager', setting: 'Company', tools: ['AI chat', 'Design', 'Video'], authority: 'Approves spend', share: 0.06 },
  { role: 'Research', stage: 'Experienced', setting: 'Large org', tools: ['AI chat', 'Docs & notes', 'Spreadsheets'], authority: 'Recommends', share: 0.06 },
  { role: 'Operations', stage: 'Lead / manager', setting: 'Company', tools: ['Spreadsheets', 'Docs & notes', 'AI chat'], authority: 'Approves spend', share: 0.06 },
  { role: 'Founder', stage: 'Executive', setting: 'Startup', tools: ['AI chat', 'Docs & notes', 'Design'], authority: 'Approves spend', share: 0.09 },
  { role: 'Finance & legal', stage: 'Experienced', setting: 'Large org', tools: ['Spreadsheets', 'AI chat'], authority: 'Recommends', share: 0.06 },
  { role: 'Software', stage: 'Lead / manager', setting: 'Large org', tools: ['AI coding', 'AI chat'], authority: 'Approves spend', share: 0.10 },
]

/** Summed rather than typed. A panel whose shares do not add to one is a
 *  panel whose every derived count is wrong, and a retyped total is how that
 *  goes unnoticed. */
export const COHORT_SHARE_TOTAL = COHORTS.reduce((sum, cohort) => sum + cohort.share, 0)

/** The four declared fields, in the order the install flow asks them. Each is
 *  a facet of the inspector and a targeting dimension of the campaign. */
export const FACETS = ['role', 'stage', 'setting', 'authority'] as const
export type Facet = (typeof FACETS)[number]

export const FACET_LABELS: Readonly<Record<Facet, string>> = {
  role: 'What they do',
  stage: 'Stage',
  setting: 'Setting',
  authority: 'Buying authority',
}

/** Facet values in a stated order rather than in discovery order, so the
 *  stage column reads Student → Executive instead of however the cohorts
 *  happen to be listed. */
export const FACET_VALUES: Readonly<Record<Facet, readonly string[]>> = {
  role: ['Student', 'Software', 'Design', 'Writing', 'Marketing', 'Research', 'Operations', 'Finance & legal', 'Founder'],
  stage: ['Student', 'Early career', 'Experienced', 'Lead / manager', 'Executive'],
  setting: ['Studying', 'Freelance', 'Startup', 'Company', 'Large org'],
  authority: ['Approves spend', 'Recommends', 'No budget authority'],
}

/** Every tool a cohort declared using, deduplicated and ordered for the
 *  filter. Deliberately not real product names — the same line the nine
 *  advertisers hold, kept off the targeting panel too. */
export const TOOLS: readonly string[] = [
  'AI chat', 'AI coding', 'Image generation', 'Design', 'Docs & notes', 'Spreadsheets', 'Presentation', 'Video',
]

/* ------------------------------------------------------------------ *
 * The delivery report
 * ------------------------------------------------------------------ */

export interface ReportRow {
  day: string
  surfaceId: string
  impressions: number
  /** Median seconds the unit was fully on screen and unobstructed. The
   *  measurement the surface exists to be able to report. */
  dwellSeconds: number
}

/**
 * A week of the file an advertiser actually receives. Aggregate rows, one per
 * surface per day, and nothing else — which is the point the Privacy &
 * Security window is making by showing the file rather than describing it.
 */
export const REPORT_ROWS: readonly ReportRow[] = [
  { day: '2026-07-27', surfaceId: 'wait', impressions: 18420, dwellSeconds: 11.4 },
  { day: '2026-07-27', surfaceId: 'card', impressions: 24180, dwellSeconds: 6.2 },
  { day: '2026-07-27', surfaceId: 'ambient', impressions: 31650, dwellSeconds: 4.1 },
  { day: '2026-07-28', surfaceId: 'wait', impressions: 19870, dwellSeconds: 12.1 },
  { day: '2026-07-28', surfaceId: 'card', impressions: 25340, dwellSeconds: 6.0 },
  { day: '2026-07-28', surfaceId: 'ambient', impressions: 33120, dwellSeconds: 4.3 },
]

/** What is in the file, and what is not. Two lists, because the second one is
 *  the claim: an advertiser who cannot see what is missing has to take the
 *  first list on trust. */
export interface Field {
  name: string
  detail: string
  included: boolean
}

export const REPORT_FIELDS: readonly Field[] = [
  { name: 'day', detail: 'The delivery date, to the day. Never a timestamp.', included: true },
  { name: 'surface', detail: 'Which of the three surfaces served it.', included: true },
  { name: 'impressions', detail: 'Verified impressions, counted once each.', included: true },
  { name: 'dwell_median_s', detail: 'Median seconds fully on screen and unobstructed.', included: true },
  { name: 'clearing_cpm', detail: 'What the slot cleared at — the runner-up bid, not yours.', included: true },
  { name: 'declared_segment', detail: 'The declared cohort, aggregated. Suppressed below a hundred seats.', included: true },
  { name: 'user_id', detail: 'There is no per-person row to join to. Not hashed — absent.', included: false },
  { name: 'device_id / ip', detail: 'Never collected, so never shared and never leaked.', included: false },
  { name: 'screen_content', detail: 'The software reads geometry. It cannot read a pixel.', included: false },
  { name: 'browsing_history', detail: 'No pixel, no SDK, no cookie, nothing to build a graph from.', included: false },
  { name: 'retargeting_segment', detail: 'You target what people declared, not what they were followed doing.', included: false },
]

/* ------------------------------------------------------------------ *
 * Measurement
 * ------------------------------------------------------------------ */

export interface Comparison {
  dimension: string
  elsewhere: string
  here: string
}

export const MEASUREMENT_ROWS: readonly Comparison[] = [
  {
    dimension: 'What counts as viewable',
    elsewhere: 'Half the pixels, for one second, in a browser tab that may be behind another window',
    here: 'The whole unit, unobstructed, on the display the person is working on',
  },
  {
    dimension: 'Who decides the space was empty',
    elsewhere: 'Nobody — the page sold the slot whether or not anything else was in it',
    here: 'An instrument on the machine, before the creative is ever requested',
  },
  {
    dimension: 'What is between your ad and the person',
    elsewhere: 'The article, the video, the answer they came for',
    here: 'Nothing. It renders where there was nothing to look at',
  },
  {
    dimension: 'When the impression is recorded',
    elsewhere: 'On render, or on a beacon that fires before anyone has seen it',
    here: 'After the dwell threshold, and once per person per cap',
  },
  {
    dimension: 'What you can audit',
    elsewhere: 'A number in a dashboard',
    here: 'A geometry record per impression, exportable as rows',
  },
]

/** The chain a single impression goes through, in order. Numbered because the
 *  order is the argument: the slot is verified before it is sold, not after
 *  it is reported. */
export const VERIFICATION_STEPS: readonly { title: string; body: string }[] = [
  {
    title: 'The rectangle is classified on the machine',
    body: 'Window geometry only. The classification never leaves the Mac, and the pixels never do either.',
  },
  {
    title: 'The slot is offered before a creative exists',
    body: 'The auction runs on a verified empty rectangle. There is no way to bid on space that was not there.',
  },
  {
    title: 'The unit has to stay whole and uncovered',
    body: 'Obstructed, off-screen, asleep or locked and the impression is never recorded. There is no partial credit.',
  },
  {
    title: 'The record settles per impression',
    body: 'Day, surface, dwell, clearing price. It is the same row you are billed on and the same row you can audit.',
  },
]
