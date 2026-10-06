import { IMPRESSIONS_PER_USER_DAY } from '@/lib/model/figures'

/**
 * The ad-load slider's domain. System Settings owns the control and the
 * Calculator reads the value, so the bounds live in neither of them — a max
 * typed in one file and a percentage computed against a different max in the
 * other is a thumb that stops halfway along its own track.
 *
 * The default is the model's own impressions-per-day figure, so a visitor who
 * never touches the slider sees exactly the payout the rest of the site
 * quotes.
 */
export const SLOTS_MIN = 0
export const SLOTS_MAX = 120
export const SLOTS_STEP = 5
export const SLOTS_DEFAULT = IMPRESSIONS_PER_USER_DAY.value
