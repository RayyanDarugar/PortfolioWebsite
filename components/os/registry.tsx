import type { ComponentType } from 'react'
import { AboutApp } from './apps/AboutApp'
import { ContactApp } from './apps/ContactApp'
import { ResumeApp } from './apps/ResumeApp'
import { VideosApp } from './apps/VideosApp'
import { DocGlyph, FilmGlyph, MailGlyph, SunGlyph } from './icons'
import type { WindowFrame } from './stage'
import type { AppId } from './view'

/** Everything an app window is handed. `onClose` is absent in the stacked
 *  fallback, where there is no desktop to close a window onto. */
export interface AppSceneProps {
  onClose?: () => void
}

export interface AppDef {
  id: AppId
  /** Shown in the menu bar, the dock tooltip and Spotlight. */
  name: string
  Glyph: ComponentType
  /** The dock tile's fill. */
  tile: string
  /** Inset between the tile edge and the glyph, in px. */
  inset: number
  /** Size and position on the stage. See stage.ts. */
  frame: WindowFrame
  Scene: ComponentType<AppSceneProps>
}

/**
 * The laptop's apps, in dock order. Projects and The Attention Exchange are
 * still to come; adding one is an entry here plus its id in view.ts.
 */
export const APPS: readonly AppDef[] = [
  {
    id: 'resume', name: 'Résumé', Glyph: DocGlyph, inset: 10,
    frame: { w: 980, h: 0.9, dx: -0.04, dy: 0 },
    tile: 'linear-gradient(#FFFFFF,#C9D3DF)',
    Scene: ResumeApp,
  },
  {
    id: 'about', name: 'About', Glyph: SunGlyph, inset: 11,
    frame: { w: 880, h: 0.82, dx: 0.05, dy: 0.01 },
    tile: 'linear-gradient(#FFC36E,#E0682C)',
    Scene: AboutApp,
  },
  {
    id: 'videos', name: 'Videos', Glyph: FilmGlyph, inset: 11,
    frame: { w: 1240, h: 0.9, dx: -0.02, dy: -0.01 },
    tile: 'linear-gradient(#4E5560,#22262D)',
    Scene: VideosApp,
  },
  {
    id: 'contact', name: 'Contact', Glyph: MailGlyph, inset: 10,
    frame: { w: 760, h: 0.7, dx: 0.06, dy: 0.02 },
    tile: 'linear-gradient(#63C4FF,#1B7FE0)',
    Scene: ContactApp,
  },
]

export function appIndex(id: AppId | null): number {
  return id === null ? -1 : APPS.findIndex((app) => app.id === id)
}
