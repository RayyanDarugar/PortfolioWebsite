/** A project case study on the laptop (spec §3.1). Every optional field's
 *  section renders only when it is set: nothing is invented to fill one. */

export type ProjectIcon = 'bolt' | 'phone' | 'news'

export interface ProjectMetric {
  value: string
  label: string
  /** Shown in the picker's headline strip. */
  headline?: boolean
}

export interface ProjectMedia {
  kind: 'video' | 'image'
  /** Under public/work/<slug>/. */
  src: string
  /** First frame, for a video: shown until its window is open. */
  poster?: string
  alt: string
}

export interface GalleryItem {
  src: string
  caption: string
}

export interface Project {
  slug: string
  name: string
  /** One plain line: what it is. Also the picker tile's description. */
  tagline: string
  role?: string
  dates?: string
  /** Dock and picker order among projects. */
  order: number
  icon: ProjectIcon
  /** The dock tile's fill. */
  tile: string
  liveUrl?: string
  /** The address shown in the hero's browser frame. */
  displayUrl?: string
  hero?: ProjectMedia
  /** The picker tile's image; falls back to the hero's image or poster. */
  preview?: string
  metrics?: readonly ProjectMetric[]
  problem?: readonly string[]
  built?: readonly string[]
  next?: readonly string[]
  gallery?: readonly GalleryItem[]
  stack?: readonly string[]
  diagram?: { src: string; alt: string }
}
