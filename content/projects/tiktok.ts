import type { Project } from './types'

/** Shipped at super{set}; the numbers are the résumé's. */
export const TIKTOK: Project = {
  slug: 'tiktok',
  name: 'TikTok Platform',
  tagline: 'A fully automated B2C social marketing platform.',
  role: 'GTM Engineer, super{set}',
  dates: 'Summer 2026',
  order: 2,
  icon: 'phone',
  tile: 'linear-gradient(#3A3F4B,#101218)',
  metrics: [
    { value: '~20,000', label: 'TikTok views in a week', headline: true },
    { value: '~600', label: 'engagements in a week' },
  ],
  built: [
    'Built and shipped at super{set}: a fully automated platform that runs B2C social marketing on TikTok.',
  ],
}
