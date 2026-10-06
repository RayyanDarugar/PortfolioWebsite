/**
 * The campaign plan, and the arithmetic that turns it into a number.
 *
 * This is the advertiser desktop's equivalent of `slots.ts` plus the
 * Calculator's tape: one piece of state that the Campaign window owns, the
 * Audience window slices, the Bid Console prices and the Mail window quotes.
 * Every figure it produces is worked out from `lib/model` and the surfaces'
 * offsets — nothing in here is a business figure typed twice.
 *
 * It is a plain module of pure functions on purpose. The Calculator's payout
 * has a test that proves it traces to the model; this has one too, and a
 * function is testable in a way a `useMemo` inside a window is not.
 */
import { ACTIVE_DAYS_PER_YEAR, IMPRESSIONS_PER_USER_DAY } from '@/lib/model/figures'
import { pricePerImpression } from '@/lib/model/payout'
import { FLEET_DECLARED_INSTALLS } from '@/components/exchange/constants'
import { SURFACES, clearingCpm, surfaceById } from './adData'

export interface CampaignPlan {
  /** Dollars. */
  budget: number
  /** Calendar days the flight runs for. */
  flightDays: number
  /** The cap: impressions one person may be shown in a day. */
  frequency: number
  /** Surface ids, in `SURFACES` order. */
  surfaces: readonly string[]
}

/**
 * The ask this whole desktop is built around. It is a proposal, not a
 * measurement, so it carries no evidence tier and does not belong in
 * `lib/model` — the same call `components/advertisers/RateCard.tsx` made, for
 * the same reason.
 *
 * A third copy of the same $10,000 figure: `RateCard.tsx` has its own
 * `TEST_BUDGET_DOLLARS` and `TestRequestForm.tsx` hardcodes the string
 * outright. Neither file is owned by this desktop, so this is a note rather
 * than a fix — the three should collapse to one shared constant.
 */
export const TEST_BUDGET_DOLLARS = 10_000

export const BUDGET_MIN = 2_500
export const BUDGET_MAX = 50_000
export const BUDGET_STEP = 500

/** Flight lengths an advertiser would actually pick, rather than a free
 *  number field: a test that runs a fortnight and a test that runs a quarter
 *  are different tests, and everything in between is noise. */
export const FLIGHTS: readonly number[] = [14, 30, 60, 90]

export const FREQUENCY_MIN = 1
export const FREQUENCY_STEP = 1
/** A cap above what a seat opens in a day is not a cap. */
export const FREQUENCY_MAX = IMPRESSIONS_PER_USER_DAY.value

/** Calendar days in a year. A calendar fact, not a model assumption — it is
 *  what converts a flight's length into working days, which is the unit the
 *  model's active-days figure is stated in. */
const DAYS_PER_YEAR = 365

export const PLAN_DEFAULT: CampaignPlan = {
  budget: TEST_BUDGET_DOLLARS,
  flightDays: 30,
  frequency: 6,
  surfaces: SURFACES.map((surface) => surface.id),
}

export function planSurfaces(plan: CampaignPlan) {
  return SURFACES.filter((surface) => plan.surfaces.includes(surface.id))
}

/**
 * What the plan clears at, blended across the surfaces it bought. Equal
 * weight rather than a weighted average: the plan does not say how the budget
 * splits, and inventing a split to make the blend look better is exactly the
 * kind of number a demand-gen lead is right to distrust.
 *
 * Zero when nothing is selected, which every caller below treats as "no
 * campaign" rather than dividing by it.
 */
export function blendedCpm(plan: CampaignPlan): number {
  const chosen = planSurfaces(plan)
  if (chosen.length === 0) return 0
  return chosen.reduce((sum, surface) => sum + clearingCpm(surface), 0) / chosen.length
}

/** Verified impressions the budget buys at the blended clearing price. */
export function impressionsFor(plan: CampaignPlan): number {
  const cpm = blendedCpm(plan)
  if (cpm <= 0) return 0
  return Math.round(plan.budget / pricePerImpression(cpm))
}

/** Working days inside a flight of `flightDays` calendar days. Weekends and
 *  holidays come out of the model's own active-days figure rather than a
 *  five-sevenths written down here. */
export function workingDaysIn(flightDays: number): number {
  return (flightDays * ACTIVE_DAYS_PER_YEAR.value) / DAYS_PER_YEAR
}

/** The most one seat can be shown over the flight, given the cap. */
export function impressionsPerSeat(plan: CampaignPlan): number {
  const capped = Math.min(plan.frequency, IMPRESSIONS_PER_USER_DAY.value)
  return capped * workingDaysIn(plan.flightDays)
}

/**
 * The declared panel, in seats. A business figure, and one this file should
 * not really own — it belongs beside `CPM_DESIGN_POINT` in
 * `lib/model/figures.ts`, tagged with an evidence tier like everything else
 * there. It lives here instead only because this branch's file ownership
 * keeps `components/os/` from editing `lib/model`; move it at the first
 * opportunity.
 *
 * Reused rather than invented: it is `/exchange`'s own
 * `FLEET_DECLARED_INSTALLS`, the one headcount-shaped number already declared
 * anywhere on the site. Borrowing it ties the advertiser desktop's ceiling to
 * a figure that exists instead of adding a fourth unexplained constant next
 * to `CPM_DESIGN_POINT`, `IMPRESSIONS_PER_USER_DAY` and the rest.
 */
export const PANEL_SIZE_SEATS = FLEET_DECLARED_INSTALLS

/**
 * How many declared seats the plan reaches. The frequency cap is what makes
 * this a real number rather than a reach claim: at six impressions a day a
 * budget spreads across many more people than it does at forty, and the
 * slider says so as you drag it.
 *
 * Clamped at the declared panel. Impressions bought scale with budget
 * without limit — that part is honest, a bigger budget really does buy more
 * impressions — but the *people* those impressions can reach cannot exceed
 * the number of people who exist. Without the clamp, dragging the budget
 * slider to its maximum invents a panel roughly ten times the size of the
 * one at the default budget, which is the fastest way to lose a media buyer
 * doing the same division twice.
 */
export function seatsFor(plan: CampaignPlan): number {
  const perSeat = impressionsPerSeat(plan)
  if (perSeat <= 0) return 0
  return Math.min(Math.round(impressionsFor(plan) / perSeat), PANEL_SIZE_SEATS)
}

/**
 * Whether the plan has already run into the clamp above — the point past
 * which a bigger budget cannot buy more people, only more frequency against
 * the people it already reaches. The Audience window needs this as a
 * condition of its own (to decide whether to explain the frozen slider), and
 * it is exactly the kind of boolean this file's header describes: worth its
 * own test rather than a recomputation inside a `useMemo`.
 *
 * Reads as `seatsFor(plan) === PANEL_SIZE_SEATS` rather than re-deriving the
 * unclamped count, so it can never drift from what the clamp it is reporting
 * on actually does.
 */
export function reachesFullPanel(plan: CampaignPlan): boolean {
  return seatsFor(plan) === PANEL_SIZE_SEATS
}

export function costPerSeat(plan: CampaignPlan): number {
  const seats = seatsFor(plan)
  return seats > 0 ? plan.budget / seats : 0
}

export function pricePerImpressionFor(plan: CampaignPlan): number {
  const cpm = blendedCpm(plan)
  return cpm > 0 ? pricePerImpression(cpm) : 0
}

/** What a fixed budget buys on one surface alone, for the Bid Console's
 *  per-row column. */
export function impressionsOnSurface(budget: number, surfaceId: string): number {
  const surface = surfaceById(surfaceId)
  if (!surface) return 0
  return Math.round(budget / pricePerImpression(clearingCpm(surface)))
}

/** Adds or removes a surface, keeping `SURFACES` order so the plan reads the
 *  same however it was clicked together. */
export function toggleSurface(plan: CampaignPlan, id: string): CampaignPlan {
  const on = plan.surfaces.includes(id)
  const next = SURFACES
    .map((surface) => surface.id)
    .filter((surfaceId) => (surfaceId === id ? !on : plan.surfaces.includes(surfaceId)))
  return { ...plan, surfaces: next }
}
