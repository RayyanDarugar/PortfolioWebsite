import { DIGEST } from './digest'
import { DYNAMO } from './dynamo'
import { TIKTOK } from './tiktok'
import type { Project } from './types'

export type { GalleryItem, Project, ProjectIcon, ProjectMedia, ProjectMetric } from './types'

const SLUG = /^[a-z][a-z0-9-]*$/

/** Sorted by `order`. Throws on anything a window could not render. */
export function validateProjects(list: readonly Project[]): readonly Project[] {
  const seen = new Set<string>()
  for (const p of list) {
    if (!SLUG.test(p.slug)) throw new Error(`content/projects: "${p.slug}": slug must be lowercase letters, digits and dashes`)
    if (seen.has(p.slug)) throw new Error(`content/projects: duplicate slug "${p.slug}"`)
    seen.add(p.slug)
    if (!p.name.trim()) throw new Error(`content/projects: ${p.slug}: needs a name`)
    if (!p.tagline.trim()) throw new Error(`content/projects: ${p.slug}: needs a tagline`)
  }
  return [...list].sort((a, b) => a.order - b.order)
}

/** Every project, in dock order. Adding one is a file here plus this list. */
export const PROJECTS = validateProjects([DYNAMO, TIKTOK, DIGEST])

/** The picker's headline strip: flagged metrics, each with the app it opens. */
export function headlineMetrics(list: readonly Project[] = PROJECTS): { value: string; label: string; app: string }[] {
  return list.flatMap((p) => (p.metrics ?? []).filter((m) => m.headline).map((m) => ({ value: m.value, label: m.label, app: p.slug })))
}
