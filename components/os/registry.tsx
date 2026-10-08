import type { ComponentType } from 'react'
import { PROJECTS, type Project, type ProjectIcon } from '@/content/projects'
import { ROLES } from '@/content/roles'
import { AboutApp } from './apps/AboutApp'
import { ContactApp } from './apps/ContactApp'
import { ExperienceApp } from './apps/ExperienceApp'
import { ProjectApp } from './apps/ProjectApp'
import { ResumeApp } from './apps/ResumeApp'
import { VideosApp } from './apps/VideosApp'
import { AboutIcon, ContactIcon, DigestIcon, DynamoIcon, ExperienceIcon, ResumeIcon, TikTokIcon, VideosIcon } from './icons'
import type { WindowFrame } from './stage'
import type { AppId } from './view'

/** Everything an app window is handed. In the stacked fallback there is no
 *  desktop, so none of these are passed: no close, no routing, never active. */
export interface AppSceneProps {
  onClose?: () => void
  /** The window is the one open on the desktop. Heavy media waits for this. */
  active?: boolean
  /** Experience's selected role, from the URL. */
  sub?: string
  /** Replace the URL without adding history (Experience's sidebar). */
  onNavigate?: (path: string) => void
  /** Open another app's window (a role's related project). */
  onOpenApp?: (id: string) => void
}

export interface AppDef {
  id: AppId
  /** Shown in the menu bar, the dock tooltip, Spotlight and the picker. */
  name: string
  /** The picker tile's one plain line: what this is. */
  blurb: string
  /** The picker tile's image. Without one the tile shows the glyph. */
  preview?: string
  /** The app's icon: a whole macOS-style tile (see icons.tsx). */
  Icon: ComponentType
  /** The icon's colour, as a CSS background: washes the picker tile behind
   *  the icon when there is no screenshot. */
  tile: string
  /** Size and position on the stage. See stage.ts. */
  frame: WindowFrame
  Scene: ComponentType<AppSceneProps>
}

const PROJECT_ICONS: Record<ProjectIcon, ComponentType> = { bolt: DynamoIcon, phone: TikTokIcon, news: DigestIcon }

/** A project's dock app: its case study, framed large. */
function projectApp(p: Project): AppDef {
  function ProjectScene(props: AppSceneProps) {
    return <ProjectApp project={p} {...props} />
  }
  return {
    id: p.slug, name: p.name, blurb: p.tagline, Icon: PROJECT_ICONS[p.icon], tile: p.tile,
    preview: p.preview ?? (p.hero?.kind === 'image' ? p.hero.src : p.hero?.poster),
    frame: { w: 1180, h: 0.9, dx: 0, dy: 0 },
    Scene: ProjectScene,
  }
}

const RESUME_APP: AppDef = {
  id: 'resume', name: 'Résumé', blurb: 'The one-page version, with the PDF.', Icon: ResumeIcon,
  frame: { w: 980, h: 0.9, dx: -0.04, dy: 0 },
  tile: 'linear-gradient(#86C2FF,#2C6BDF)',
  Scene: ResumeApp,
}

/**
 * The laptop's apps, in dock order: the résumé, every project (from
 * content/projects), then Experience, Videos, About and Contact. A new
 * project is a content file; it needs nothing here.
 */
export const APPS: readonly AppDef[] = [
  RESUME_APP,
  ...PROJECTS.map(projectApp),
  {
    id: 'experience', name: 'Experience', blurb: `${ROLES.length} roles, from GTM engineering to politics.`, Icon: ExperienceIcon,
    frame: { w: 1080, h: 0.86, dx: 0.02, dy: 0 },
    tile: 'linear-gradient(#6AA8FF,#2350C6)',
    Scene: ExperienceApp,
  },
  {
    id: 'videos', name: 'Videos', blurb: 'Films I shot and cut.', Icon: VideosIcon,
    frame: { w: 1240, h: 0.9, dx: -0.02, dy: -0.01 },
    tile: 'linear-gradient(#555C6B,#14161B)',
    Scene: VideosApp,
  },
  {
    id: 'about', name: 'About', blurb: 'Why I build: making the world more beautiful.', Icon: AboutIcon,
    frame: { w: 880, h: 0.82, dx: 0.05, dy: 0.01 },
    tile: 'linear-gradient(#FFD37A,#C9437A)',
    Scene: AboutApp,
  },
  {
    id: 'contact', name: 'Contact', blurb: 'Email and links.', Icon: ContactIcon,
    frame: { w: 760, h: 0.7, dx: 0.06, dy: 0.02 },
    tile: 'linear-gradient(#72D0FF,#1C74E6)',
    Scene: ContactApp,
  },
]

export function appIndex(id: AppId | null): number {
  return id === null ? -1 : APPS.findIndex((app) => app.id === id)
}
