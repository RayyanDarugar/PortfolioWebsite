import { PROJECTS } from './projects'
import type { GalleryItem } from './projects'
import { RESUME } from './resume'

/** The Experience app's roles (spec §3.2). Title, dates, place and bullets
 *  come from the résumé by org, so the two never disagree; this adds what a
 *  recruiter needs beside them. */

export type RoleTag = 'engineering' | 'product' | 'leadership'

export interface RoleExtra {
  slug: string
  /** Exactly as in content/resume.ts. */
  org: string
  /** One line on what the org is, for the ones a recruiter won't know. */
  orgLine?: string
  tags: readonly RoleTag[]
  logo?: string
  /** A project that came out of this role. */
  project?: string
  links?: readonly { label: string; href: string }[]
  gallery?: readonly GalleryItem[]
  /** A short expansion under a bullet, by the bullet's index. */
  expansions?: Readonly<Record<number, string>>
}

export interface RoleView extends RoleExtra {
  title: string
  dates: string
  place: string
  bullets: readonly string[]
}

/** Newest first. */
const ROLE_EXTRAS: readonly RoleExtra[] = [
  { slug: 'superset', org: 'super{set} Venture Studio', orgLine: 'A San Francisco venture studio that founds and builds companies.', tags: ['engineering', 'product'], project: 'tiktok' },
  { slug: 'kana', org: 'Kana', tags: ['engineering'] },
  { slug: 'troylabs', org: 'TroyLabs', tags: ['product', 'leadership'] },
  { slug: 'btg', org: 'USC Business Technology Group', orgLine: 'A USC student consultancy working with tech companies.', tags: ['product'] },
  { slug: 'hemut', org: 'Hemut (YC X25)', orgLine: 'A Y Combinator (X25) startup.', tags: ['engineering'] },
  { slug: 'supervisor', org: 'Office of Supervisor Joel Anderson', orgLine: 'The District 2 office of San Diego Supervisor Joel Anderson.', tags: ['leadership'] },
  { slug: 'deca', org: 'California DECA', orgLine: 'The California association of DECA, the high-school business and marketing organization.', tags: ['leadership'] },
]

type Resume = Pick<typeof RESUME, 'experience' | 'leadership'>

/** Joins each role to its résumé entry. Throws on an org the résumé lacks or
 *  a project that does not exist. */
export function joinRoles(extras: readonly RoleExtra[], resume: Resume = RESUME): RoleView[] {
  const all = [...resume.experience, ...resume.leadership]
  return extras.map((extra) => {
    const entry = all.find((r) => r.org === extra.org)
    if (!entry) throw new Error(`content/roles: ${extra.slug}: no résumé entry for "${extra.org}"`)
    if (extra.project && !PROJECTS.some((p) => p.slug === extra.project)) {
      throw new Error(`content/roles: ${extra.slug}: unknown project "${extra.project}"`)
    }
    return { ...extra, title: entry.title, dates: entry.dates, place: entry.place, bullets: entry.bullets }
  })
}

export const ROLES: readonly RoleView[] = joinRoles(ROLE_EXTRAS)

export function getRole(slug: string): RoleView | undefined {
  return ROLES.find((r) => r.slug === slug)
}
