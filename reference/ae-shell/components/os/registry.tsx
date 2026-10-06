import type { ComponentType } from 'react'
import { ActivityApp } from './apps/ActivityApp'
import { AdHeroApp } from './apps/AdHeroApp'
import { AdMailApp } from './apps/AdMailApp'
import { AdPrivacyApp } from './apps/AdPrivacyApp'
import { AudienceApp } from './apps/AudienceApp'
import { BidConsoleApp } from './apps/BidConsoleApp'
import { CalculatorApp } from './apps/CalculatorApp'
import { CampaignApp } from './apps/CampaignApp'
import { HeroApp } from './apps/HeroApp'
import { MailApp } from './apps/MailApp'
import { MeasurementApp } from './apps/MeasurementApp'
import { PrivacyApp } from './apps/PrivacyApp'
import { SettingsApp } from './apps/SettingsApp'
import { StocksApp } from './apps/StocksApp'
import { PreviewCompanion, TestPlanCompanion } from './adCompanions'
import { FinderCompanion, NotesCompanion } from './companions'
import type { CampaignPlan } from './campaign'
import type { Profile } from './profiles'
import type { WindowFrame } from './stage'
import { BoardGlyph, PanelGlyph, RuleGlyph, TargetGlyph, VaultGlyph } from './adIcons'
import {
  ChartGlyph, GearGlyph, KeypadGlyph, MailGlyph, MarkGlyph, PulseGlyph, ShieldGlyph,
} from './icons'

/**
 * Everything an app window is handed.
 *
 * Two pieces of state travel between apps, one per account, and every scene
 * receives both rather than the type forking into a union: an app that does
 * not need the advertiser's plan simply does not name it in its props, which
 * TypeScript is perfectly happy with and which keeps `AppDef.Scene` a single
 * component type that one launcher can render.
 *
 *  - **`slots`** — the ad load you set in System Settings, which the
 *    Calculator works your payout out from.
 *  - **`plan`** — the campaign the Campaign window builds, which Audience
 *    slices, the Bid Console prices and Mail quotes back at you.
 */
export interface AppSceneProps {
  slots: number
  setSlots: (n: number) => void
  plan: CampaignPlan
  setPlan: (next: CampaignPlan) => void
}

/** A supporting window that opens alongside the main one. */
export interface Companion {
  Scene: ComponentType
  frame: WindowFrame
  /** Seconds after the main window before this one comes up. A companion that
   *  launches on the same frame reads as one object splitting in two. */
  delay: number
}

export interface AppDef {
  id: string
  /** Shown in the menu bar and in the dock tooltip. */
  name: string
  Glyph: ComponentType
  /** The dock tile. Glossy gradients, per spec §6.3. */
  tile: string
  /** Inset between the tile edge and the glyph, in px. Some glyphs are drawn
   *  edge to edge (the chart) and some need air (the gear). */
  inset: number
  /** Size and position on the stage. */
  frame: WindowFrame
  Scene: ComponentType<AppSceneProps>
  companion?: Companion
}

/**
 * The user account's seven apps, in scroll order. Each section of the
 * argument is delivered by the app that would really do that job on a Mac —
 * the Calculator computes the payout, Activity Monitor shows the waiting,
 * System Settings is where you set your ad load — so the metaphor explains
 * the product rather than just decorating it.
 *
 * ### Frames
 *
 * Every window used to be the same width in the same place, which is what
 * made seven distinct app windows read as one box with seven slides in it.
 * Each now opens at a size its content and its real-world counterpart argue
 * for, and no two consecutive windows share a shape or a side of the stage:
 *
 * | app | width | height | side |
 * |---|---|---|---|
 * | The Attention Exchange | 1320 | 0.88 | centre |
 * | Activity Monitor | 1060 | 0.74 | right |
 * | System Settings | 1020 | 0.86 | left, with Finder |
 * | Calculator | 880 | 0.94 | right, tall and narrow |
 * | Stocks | 1260 | 0.70 | left, wide and low |
 * | Privacy & Security | 1100 | 0.82 | right |
 * | Mail | 940 | 0.84 | left, with Notes |
 *
 * `dx`/`dy` are fractions of the stage and are clamped at runtime against the
 * free space, so none of these can put a window under the dock however short
 * the viewport gets.
 */
export const USER_APPS: readonly AppDef[] = [
  {
    id: 'exchange', name: 'The Attention Exchange', Glyph: MarkGlyph, inset: 10,
    frame: { w: 1320, h: 0.88, dx: -0.005, dy: -0.01 },
    tile: 'linear-gradient(#B6FF63,#5FBE00)',
    Scene: HeroApp,
  },
  {
    id: 'activity', name: 'Activity Monitor', Glyph: PulseGlyph, inset: 9,
    frame: { w: 1060, h: 0.74, dx: 0.055, dy: 0.03 },
    tile: 'linear-gradient(#4E5560,#22262D)',
    Scene: ActivityApp,
  },
  {
    id: 'settings', name: 'System Settings', Glyph: GearGlyph, inset: 11,
    frame: { w: 1020, h: 0.86, dx: -0.075, dy: 0 },
    tile: 'linear-gradient(#B9C2CC,#79838F)',
    Scene: SettingsApp,
    companion: {
      Scene: FinderCompanion,
      frame: { w: 330, h: 0.42, dx: 0.31, dy: 0.13 },
      delay: 0.14,
    },
  },
  {
    id: 'calculator', name: 'Calculator', Glyph: KeypadGlyph, inset: 10,
    frame: { w: 880, h: 0.94, dx: 0.085, dy: 0 },
    tile: 'linear-gradient(#3B3F46,#1B1D22)',
    Scene: CalculatorApp,
  },
  {
    id: 'stocks', name: 'Stocks', Glyph: ChartGlyph, inset: 9,
    frame: { w: 1260, h: 0.70, dx: -0.03, dy: -0.035 },
    tile: 'linear-gradient(#2B2E34,#0E0F12)',
    Scene: StocksApp,
  },
  {
    id: 'privacy', name: 'Privacy & Security', Glyph: ShieldGlyph, inset: 10,
    frame: { w: 1100, h: 0.82, dx: 0.045, dy: 0.02 },
    tile: 'linear-gradient(#7FB4F5,#1B63C0)',
    Scene: PrivacyApp,
  },
  {
    id: 'mail', name: 'Mail', Glyph: MailGlyph, inset: 10,
    frame: { w: 940, h: 0.84, dx: -0.085, dy: 0 },
    tile: 'linear-gradient(#63C4FF,#1B7FE0)',
    Scene: MailApp,
    companion: {
      Scene: NotesCompanion,
      frame: { w: 300, h: 0.40, dx: 0.315, dy: -0.11 },
      delay: 0.16,
    },
  },
]

/**
 * The advertiser account's seven. Genuinely different applications rather
 * than the user's seven recoloured: five of them do not exist on the
 * other account at all, and the two that share a name — the product's own
 * window and Mail — are the two a real Mac would also share.
 *
 * The argument runs buy-side from the top: what the asset is, how you buy it,
 * who is behind it, what it clears at, what an impression means, what you
 * receive, and the ask.
 *
 * | app | width | height | side |
 * |---|---|---|---|
 * | The Attention Exchange | 1320 | 0.88 | centre |
 * | Campaign | 1060 | 0.94 | left, tall, with Preview |
 * | Audience | 1220 | 0.78 | right |
 * | Bid Console | 1300 | 0.72 | left, wide and low |
 * | Measurement | 1000 | 0.90 | right |
 * | Privacy & Security | 1140 | 0.80 | left |
 * | Mail | 940 | 0.86 | right, with Notes |
 *
 * The side pattern is the mirror of the user account's — that one goes
 * right first, this one goes left — so a visitor who switches accounts is not
 * shown the same choreography with different words in it.
 */
export const ADVERTISER_APPS: readonly AppDef[] = [
  {
    id: 'ad-exchange', name: 'The Attention Exchange', Glyph: MarkGlyph, inset: 10,
    frame: { w: 1320, h: 0.88, dx: -0.005, dy: -0.01 },
    tile: 'linear-gradient(#B6FF63,#5FBE00)',
    Scene: AdHeroApp,
  },
  {
    id: 'campaign', name: 'Campaign', Glyph: TargetGlyph, inset: 11,
    frame: { w: 1060, h: 0.94, dx: -0.07, dy: 0 },
    tile: 'linear-gradient(#FFA870,#E0562C)',
    Scene: CampaignApp,
    companion: {
      Scene: PreviewCompanion,
      frame: { w: 340, h: 0.72, dx: 0.30, dy: 0.06 },
      delay: 0.15,
    },
  },
  {
    id: 'audience', name: 'Audience', Glyph: PanelGlyph, inset: 10,
    frame: { w: 1220, h: 0.78, dx: 0.05, dy: 0.03 },
    tile: 'linear-gradient(#C7A9FF,#6E45C8)',
    Scene: AudienceApp,
  },
  {
    id: 'bid-console', name: 'Bid Console', Glyph: BoardGlyph, inset: 9,
    frame: { w: 1300, h: 0.72, dx: -0.03, dy: -0.035 },
    tile: 'linear-gradient(#22303F,#0A1119)',
    Scene: BidConsoleApp,
  },
  {
    id: 'measurement', name: 'Measurement', Glyph: RuleGlyph, inset: 10,
    frame: { w: 1000, h: 0.90, dx: 0.08, dy: 0 },
    tile: 'linear-gradient(#8FDCD4,#1E8C86)',
    Scene: MeasurementApp,
  },
  {
    id: 'ad-privacy', name: 'Privacy & Security', Glyph: VaultGlyph, inset: 10,
    frame: { w: 1140, h: 0.80, dx: -0.05, dy: 0.02 },
    tile: 'linear-gradient(#8C9AB8,#33415C)',
    Scene: AdPrivacyApp,
  },
  {
    id: 'ad-mail', name: 'Mail', Glyph: MailGlyph, inset: 10,
    frame: { w: 940, h: 0.86, dx: 0.085, dy: 0 },
    tile: 'linear-gradient(#63C4FF,#1B7FE0)',
    Scene: AdMailApp,
    companion: {
      Scene: TestPlanCompanion,
      frame: { w: 300, h: 0.40, dx: -0.315, dy: -0.11 },
      delay: 0.16,
    },
  },
]

/**
 * The app list, as a function of who is logged in.
 *
 * This is the one change that makes two desktops out of one engine. The dock,
 * the launcher, the scroll model, Spotlight, the notifications and the
 * navigation guard all take their list from here and none of them knows which
 * account it is drawing — so there is exactly one launcher, one scroll model
 * and one set of window choreography on this page, and adding an eighth app
 * to either account is a line in an array.
 */
export function appsFor(profile: Profile): readonly AppDef[] {
  return profile === 'advertiser' ? ADVERTISER_APPS : USER_APPS
}
