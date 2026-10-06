/**
 * Who is logged in.
 *
 * The product has two audiences with opposite motivations — the person
 * renting out their screen and the advertiser buying that space — and a
 * landing page that addresses both at once addresses neither. macOS already
 * solves this: a machine boots to a login window, and the desktop you get is
 * the one configured for the account you picked.
 *
 * So the profile is not a toggle bolted onto a page. It is an account, and
 * everything downstream of it — the dock, the seven apps, the desktop items,
 * the wallpaper's cast, Spotlight's catalogue, the notifications — is a
 * function of it. Nothing forks; one engine, two datasets.
 *
 * Everything in this file is pure. Nothing here reads the DOM, `window` or
 * storage during render — the two accessors that touch `sessionStorage` are
 * written to be called from an effect and to survive a browser that has
 * storage disabled, because a private-browsing visitor must get a login
 * screen rather than an exception.
 */
import type { ComponentType } from 'react'

export type Profile = 'user' | 'advertiser'

/** Session-scoped, deliberately. A profile that outlived the tab would mean a
 *  visitor who once clicked *Advertiser* never seeing the other half of the
 *  product again, and this is a site people are sent links to. */
export const PROFILE_KEY = 'ax-os-profile'

/** The query parameter that preselects an account and skips the login screen.
 *  `?profile=advertiser` is how an advertiser is sent straight to their own
 *  desktop, which is the whole reason it exists. */
export const PROFILE_PARAM = 'profile'

export function isProfile(value: string | null | undefined): value is Profile {
  return value === 'user' || value === 'advertiser'
}

/** Reads the account out of a query string. Pure, so it can be tested without
 *  a `location`, and tolerant of a leading `?` or the absence of one. */
export function profileFromSearch(search: string): Profile | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const value = params.get(PROFILE_PARAM)
  return isProfile(value) ? value : null
}

/** Never called during render. See the note in `OS.tsx` about why. */
export function readStoredProfile(): Profile | null {
  try {
    const value = sessionStorage.getItem(PROFILE_KEY)
    return isProfile(value) ? value : null
  } catch {
    return null
  }
}

/** `null` clears it — that is Switch User. */
export function storeProfile(profile: Profile | null): void {
  try {
    if (profile === null) sessionStorage.removeItem(PROFILE_KEY)
    else sessionStorage.setItem(PROFILE_KEY, profile)
  } catch {
    // Storage disabled. The choice still applies to this render; it just will
    // not survive a navigation, which is a smaller failure than throwing.
  }
}

/* ------------------------------------------------------------------ *
 * The accounts
 * ------------------------------------------------------------------ */

export interface Account {
  id: Profile
  /** The account name, under the picture. Roles rather than invented people:
   *  the visitor has to recognise themselves in under a second, and "Rayyan"
   *  tells them nothing about which half of the product they are in. */
  name: string
  /** The line under the name. macOS puts a password hint there; this is the
   *  same slot doing the same job — it disambiguates the choice. */
  hint: string
  /** The account picture's fill. */
  tile: string
  Avatar: ComponentType
}

/** The account picture for the person renting their screen out: the free
 *  rectangle on a display, which is the thing they are selling. */
function UserAvatar() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      <rect x="6" y="10" width="36" height="24" rx="3.4" fill="rgba(255,255,255,.94)" />
      <rect x="9.4" y="13.4" width="16" height="17.2" rx="2" fill="#5FAF00" opacity=".22" />
      <rect x="12" y="16.4" width="10.6" height="1.9" rx=".95" fill="#3F7C00" />
      <rect x="12" y="20" width="7.4" height="1.9" rx=".95" fill="#5FAF00" />
      <rect x="12" y="23.6" width="9" height="1.9" rx=".95" fill="#8DC93A" />
      <rect x="27.4" y="13.4" width="11.2" height="17.2" rx="2" fill="none"
            stroke="#5FAF00" strokeWidth="1.7" strokeDasharray="3 2.2" />
      <path d="M18 34h12l1.6 5H16.4Z" fill="rgba(255,255,255,.94)" />
    </svg>
  )
}

/** The advertiser's: a bid landing in that rectangle. Same rectangle, seen
 *  from the other side of the auction, which is the whole conceit of the
 *  login screen in one drawing. */
function AdvertiserAvatar() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      <rect x="7" y="9" width="34" height="26" rx="3.2" fill="none"
            stroke="rgba(255,255,255,.9)" strokeWidth="1.8" strokeDasharray="3.4 2.4" />
      <rect x="12.4" y="14" width="23.2" height="16" rx="2.2" fill="rgba(255,255,255,.94)" />
      <rect x="15.4" y="17.4" width="14" height="2.2" rx="1.1" fill="#2F5C8A" />
      <rect x="15.4" y="21.6" width="9.6" height="2.2" rx="1.1" fill="#7FA6CE" />
      <rect x="15.4" y="25.4" width="6.2" height="2.2" rx="1.1" fill="#B4CBE3" />
      <path d="M24 36.4 20.6 41h6.8Z" fill="rgba(255,255,255,.9)" />
      <path d="M31.8 33.6 38 39.4M38 39.4l-.4-4M38 39.4l-4-.4" fill="none"
            stroke="rgba(255,255,255,.9)" strokeWidth="1.9" strokeLinecap="round"
            strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The two accounts, in the order they appear on the login window. The person
 * with the screen comes first because they are the majority of arrivals and
 * because the supply side is what the product *is*; the advertiser is the
 * account you are sent a link to.
 */
export const ACCOUNTS: readonly Account[] = [
  {
    id: 'user',
    name: 'User',
    hint: 'Rent the empty space on your screen. Paid in AI credits.',
    tile: 'linear-gradient(#7FBE28,#3E7A00)',
    Avatar: UserAvatar,
  },
  {
    id: 'advertiser',
    name: 'Advertiser',
    hint: "Buy the space beside whatever they're waiting on AI to finish.",
    tile: 'linear-gradient(#5B7CC4,#20386E)',
    Avatar: AdvertiserAvatar,
  },
]

export function accountFor(profile: Profile): Account {
  // Non-null by construction: `Profile` has exactly two members and both are
  // in ACCOUNTS. The fallback exists so the type is honest rather than
  // asserted with a `!`.
  return ACCOUNTS.find((account) => account.id === profile) ?? ACCOUNTS[0]
}
