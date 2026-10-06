/**
 * Mirrors brand-files/attention_exchange_model.xlsx. Every value carries the
 * evidence tier it was tagged with there. Figures are copied deliberately —
 * nothing in site/ imports from research/ or brand-files/.
 */
export type Tier = 'OBSERVED' | 'DERIVED' | 'ASSUMED'

export interface Figure {
  value: number
  tier: Tier
  note: string
}

export const CPM_DESIGN_POINT: Figure = {
  value: 25.0,
  tier: 'ASSUMED',
  note: 'Model design point. Nothing observed in this market clears $2.80.',
}

export const CPM_KICKBACKS_TOP4: Figure = {
  value: 2.8,
  tier: 'OBSERVED',
  note: 'Kickbacks.ai top-4 bid average, observed July 2026.',
}

export const CPM_KICKBACKS_BLENDED: Figure = {
  value: 1.21,
  tier: 'DERIVED',
  note: 'Derived blend across Kickbacks surfaces from reported fleet volume.',
}

export const IMPRESSIONS_PER_USER_DAY: Figure = {
  value: 55,
  tier: 'ASSUMED',
  note: 'Delivered impressions per user per day. The instrument exists to replace this.',
}

export const ACTIVE_DAYS_PER_YEAR: Figure = {
  value: 250,
  tier: 'ASSUMED',
  note: 'Working days per year.',
}

export const USER_REVENUE_SHARE: Figure = {
  value: 0.7,
  tier: 'ASSUMED',
  note: 'Starting split, matching AdSense at launch.',
}
