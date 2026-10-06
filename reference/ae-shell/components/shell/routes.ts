/**
 * The site's route table, in one place. The menu bar and the footer both link
 * to every route, and a page added to one but not the other is the classic way
 * a nav goes stale — so they read the same list rather than each keeping their
 * own copy.
 *
 * `menu` is the label in the menu-bar nav (Lucida Grande register, short).
 * `footer` is the longer label the footer can afford. `group` is the footer's
 * column. `/` is excluded from both nav lists: it is reached by the mark.
 */
export interface Route {
  href: string
  menu: string
  footer: string
  group: 'Product' | 'Market' | 'Trust'
}

// Menu order is the argument's order: what the asset is, what it clears, who
// buys it, what it costs you, then see it and sign up. `/attention` is labelled
// "Inventory" rather than "Attention" because the mark immediately to its left
// already says Attention, and two of the same word adjacent in a menu bar reads
// as a rendering bug.
export const ROUTES: readonly Route[] = [
  { href: '/attention',  menu: 'Inventory',   footer: 'What attention is worth', group: 'Product' },
  { href: '/exchange',   menu: 'Exchange',    footer: 'The auction board',       group: 'Market' },
  { href: '/advertisers',menu: 'Advertisers', footer: 'For advertisers',         group: 'Market' },
  { href: '/privacy',    menu: 'Privacy',     footer: 'What the software sees',  group: 'Trust' },
  { href: '/demo',       menu: 'Demo',        footer: 'The live simulator',      group: 'Product' },
  { href: '/join',       menu: 'Join',        footer: 'Join the waitlist',       group: 'Trust' },
]

export const FOOTER_GROUPS: readonly Route['group'][] = ['Product', 'Market', 'Trust']

/** The evidence disclosure, quoted verbatim in the footer and available to any
 *  page that needs to repeat it. */
export const EVIDENCE_DISCLOSURE =
  "Figures on this site are simulated at the model's design point."

export const PROTOTYPE_NOTE =
  'This is a working prototype. The desktop, the auction and the settlement are ' +
  'real code running in your browser; the waitlist posts nowhere yet.'

/**
 * True when `pathname` should light up the nav entry for `href`. Exact match
 * for the mark, prefix match for everything else so a future `/attention/x`
 * still highlights its parent.
 */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
