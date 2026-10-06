'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { userPayoutPerMonth } from '@/lib/model/payout'
import { ROUTES } from '@/components/shell/routes'
import { TYPE } from '../chrome'
import type { Intro } from './useIntro'

/**
 * The primer.
 *
 * Three people looked at this site and independently said the same thing: it
 * is beautiful, it is interesting, and on first look it is *unusual*. Not
 * confusing — unusual. The page's problem was never the metaphor; it was that
 * the first screen a stranger met asked them a segmentation question ("which
 * side of the screen are you on?") before anything had made a claim.
 *
 * So this goes in front, and its job is to be the first view a stranger has of
 * a company — not the opening screen of a demo. That distinction is the whole
 * brief, and the first two attempts failed it in the same way twice.
 *
 * ### What was wrong before, so it does not come back
 *
 * The first version had no background at all and white type on white. The
 * second had a background and still read, in the owner's words, "super AI" —
 * because it was assembled out of the exact parts every generated landing page
 * is assembled out of:
 *
 *  - a 78px near-black headline over a grey subhead over one lime pill;
 *  - three big figures in a row underneath, which is the most templated hero
 *    device in existence;
 *  - pastel gradient blooms in the corners;
 *  - and no navigation, no footer, no structure — a poster, not a site.
 *
 * All four are gone. What replaces them is furniture: a real nav reading the
 * site's own route table, grouped into capsules that float on the picture, type
 * at a size that does not shout, and one primary action beside one text link.
 * The page now claims the company has *more* — which is what a homepage is
 * actually for.
 *
 * ### The headline
 *
 * It states the offer, plainly, in the active voice: you get paid. An earlier
 * draft named the market instead ("the empty space on your screen is worth
 * money"), which was right when the login window asked "which side are you on"
 * a beat later — a hero that had already made the seller's pitch would have
 * made that question redundant. A professional front door leads with the offer,
 * so the two sentences swapped places: this one moved out here, and the market
 * framing moved inside to `apps/HeroApp.tsx`, which is where the argument gets
 * made rather than opened.
 */

const COPY = {
  wordmark: 'The Attention Exchange',
  headline: 'Get paid for the empty space on your screen.',
  /** The payout lives in the sentence rather than in a stat tile. Same figure,
   *  still read from the model, without the device that made the page look
   *  generated. */
  subhead: (payout: string) =>
    `A free macOS app that rents the parts of your desktop nothing is using. `
    + `About ${payout} a month, paid in AI credits, and never over your work.`,
} as const

/**
 * The hero's ink, and it is deliberately **warm**.
 *
 * Everything else on this site is cool: `INK.strong` is #141A22, `INK.dim` is
 * #6C7889, both tuned to sit on the white chrome of a Mac window. Dropped onto
 * a warm amber pixel room they read as a screenshot of a different site pasted
 * over a photograph — the type and the picture visibly do not share a light.
 * These are the same values rotated into the room's own hue, which is the whole
 * difference between copy that sits in a scene and copy that sits on one.
 *
 * The muted tone is also much darker than its cool equivalent. The wall it
 * stands on is a mid-value beige, not white, so a grey that was comfortable at
 * 60% contrast on #FBFCFD is unreadable here.
 */
const INK_WARM = '#241B12'
const MUTED = '#5C4E3E'

/* ------------------------------------------------------------------ *
 * The bar
 * ------------------------------------------------------------------ */

/**
 * The glass a nav group is made of.
 *
 * Dark and translucent rather than light, because the top-right of the room is
 * a bookshelf and a sunset window — the busiest, warmest corner of the picture.
 * A pale capsule there would disappear into the light; a dark one reads against
 * anything. The blur is what stops the bookshelf's verticals striping through
 * the labels behind them.
 *
 * Held deliberately dark: at 42% the bookshelf's grain still read through the
 * labels as texture. The point of the glass is that the room is *present*
 * behind it, not that it is legible through it.
 */
const CAPSULE: CSSProperties = {
  background: 'rgba(30,20,12,.58)',
  backdropFilter: 'blur(14px) saturate(140%)',
  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  border: '1px solid rgba(255,246,232,.14)',
}

/**
 * The hero's button.
 *
 * Deliberately **not** `OSButton`. That component is the machine's Aqua
 * lozenge — a glossy capsule with a specular sweep, a coloured bloom and a hard
 * gloss break at its midpoint — and it is exactly right inside a macOS window
 * and exactly wrong in front of one. Two visual languages were meeting on the
 * same screen and the seam showed on the one element that appears in both
 * places.
 *
 * Flat fill and a hairline was the first attempt and it looked unfinished —
 * that is the shape of an *unstyled* button, not a minimal one. This one is
 * built the way the room builds a raised object: a stepped two-tone face rather
 * than a gradient, a thick warm-black keyline in the same ink as every other
 * outline in the picture, and a hard under-edge with no blur so the thing has a
 * physical bottom. Pressing it moves it down onto that edge.
 *
 * The green is warmed and deepened from the brand's raw `#7BE000`. Acid green
 * is a screen colour and this is a room lit by a sunset; the raw value fought
 * every other hue in the frame. It is still unmistakably the same accent, and
 * still the only saturated object in the bar.
 *
 * `OSButton` is untouched and still carries every button inside the machine,
 * where the Aqua gloss is the joke rather than a mismatch.
 */
function HeroButton({
  href, onClick, children, size = 'md',
}: {
  href?: string
  onClick?: () => void
  children: ReactNode
  size?: 'md' | 'lg'
}) {
  const cls =
    'group relative inline-flex items-center justify-center rounded-full font-semibold '
    + 'tracking-[0.005em] transition-[transform,box-shadow,filter] duration-100 ease-out '
    + 'hover:brightness-[1.06] '
    // Pressing drops the face onto its own under-edge, which is why the shadow
    // shrinks by exactly the distance the button travels.
    + 'active:translate-y-[3px] active:shadow-[0_1px_0_#3D6E00] '
    + 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] '
    + 'focus-visible:outline-[#2E2118] '
    + (size === 'lg'
      ? 'px-[24px] py-[13px] text-[16px]'
      : 'px-[clamp(15px,1.4vw,21px)] py-[10px] text-[14.5px]')

  const style: CSSProperties = {
    fontFamily: 'var(--font-hero)',
    color: '#16280A',
    // A hard stop, not a ramp: a sprite shades in steps because it has a fixed
    // palette, and stepping is what makes a shape read as drawn.
    background: 'linear-gradient(#93DD4A 0%,#93DD4A 52%,#77C516 52%,#77C516 100%)',
    border: '2px solid #2E2118',
    boxShadow: '0 4px 0 #3D6E00',
  }

  return href
    ? <Link href={href} className={cls} style={style}>{children}</Link>
    : <button type="button" onClick={onClick} className={cls} style={style}>{children}</button>
}

const NAV_LINK =
  'px-[clamp(11px,1.1vw,18px)] py-[9px] text-[14.5px] font-medium tracking-[0.01em] '
  + 'text-[rgba(255,247,236,.72)] transition-colors hover:text-white '
  + 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 '
  + 'focus-visible:outline-[#B6FF63] rounded-full'

/** The hairline between two links inside a group. Drawn rather than bordered so
 *  it can stop short of the capsule's rounded ends. */
function Divider() {
  return (
    <span
      aria-hidden
      className="my-[9px] w-px flex-none"
      style={{ background: 'rgba(255,246,232,.20)' }}
    />
  )
}

/**
 * The bar.
 *
 * It reads {@link ROUTES} — the same table the OS menu bar and the footer use —
 * so a page added to the site cannot go missing from here.
 *
 * ### Why three groups rather than one row
 *
 * The grouping is the information. Four content sections ride together in one
 * capsule with hairlines between them, so they read as a set; `/demo` sits in
 * its own capsule because it is a thing you *do* rather than a thing you read;
 * and `/join` is a solid pill, the only opaque object in the bar, because it is
 * the one action the page wants. A flat row of six links says all six are
 * equally important, which is a nav that does not know what it wants.
 *
 * ### Why it floats
 *
 * There is no rule under it and no header band behind it. The room is the page,
 * and a bar with its own background would sit *on* the picture rather than in
 * it. The wordmark is dark because the top-left of the room is a pale wall; the
 * capsules are dark-on-light for the same reason in reverse. Both depend on the
 * picture, so both move if the picture does.
 */
function Bar() {
  const grouped = ROUTES.filter((r) => r.href !== '/join' && r.href !== '/demo')
  const demo = ROUTES.find((r) => r.href === '/demo')

  return (
    <header className="flex items-center justify-between gap-[clamp(12px,2vw,32px)]">
      {/* The wordmark, at the size a wordmark deserves. It was 12px, which is a
          caption, not an identity. */}
      <span
        className="text-[clamp(15px,1.5vw,20px)] uppercase leading-none tracking-[0.1em]"
        style={{ fontFamily: 'var(--font-pixel)', color: INK_WARM }}
      >
        {COPY.wordmark}
      </span>

      <nav aria-label="Site" className="flex items-center gap-[8px]">
        {/* Gated at `md`, not `lg`. The desktop path starts at MIN_WIDTH =
            1000px, so anything above `md` (768px) is always shown there — an
            `lg` gate would have blanked the four section links on any viewport
            between 1000 and 1024, which is a nav that disappears on exactly the
            screens most likely to be borderline. Below `md` the page is in
            stacked mode anyway. */}
        <div className="hidden items-stretch rounded-full md:flex" style={CAPSULE}>
          {grouped.map((route, i) => (
            <Fragment key={route.href}>
              {i > 0 && <Divider />}
              <Link href={route.href} className={NAV_LINK}>{route.menu}</Link>
            </Fragment>
          ))}
        </div>

        {demo && (
          <Link
            href={demo.href}
            className={`hidden rounded-full sm:block ${NAV_LINK}`}
            style={CAPSULE}
          >
            {demo.menu}
          </Link>
        )}

        {/* The only opaque thing in the bar, and the only saturated one, which
            is the whole point of it. */}
        <HeroButton href="/join">Get the app</HeroButton>
      </nav>
    </header>
  )
}

/** The words. Shared by the scroll-driven hero and the stacked one. */
function Copy({ onAdvertisers }: { onAdvertisers: () => void }) {
  return (
    <div className="max-w-[600px]">
      <h1 className={TYPE.hero} style={{ color: INK_WARM, fontFamily: 'var(--font-hero)' }}>
        {COPY.headline}
      </h1>

      <p
        className={`mt-[clamp(16px,2vh,22px)] max-w-[46ch] ${TYPE.heroBody}`}
        style={{ color: MUTED, fontFamily: 'var(--font-hero)' }}
      >
        {COPY.subhead(`$${userPayoutPerMonth().toFixed(0)}`)}
      </p>

      {/* One primary action and one text link. Two pills side by side made
          them compete and made neither read as the thing to do. */}
      <div className="mt-[clamp(20px,2.8vh,30px)] flex flex-wrap items-center gap-[20px]">
        <HeroButton href="/join" size="lg">Get the app</HeroButton>
        <button
          type="button"
          onClick={onAdvertisers}
          className="text-[15px] font-semibold tracking-[0.01em] transition-colors hover:text-[#241B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4E9C00]"
          style={{ fontFamily: 'var(--font-hero)', color: MUTED }}
        >
          For advertisers &rarr;
        </button>
      </div>

    </div>
  )
}

/**
 * The scroll-driven hero, over the desk.
 *
 * It stays mounted for the whole page rather than unmounting at the landing:
 * its `<h1>` and its sentence are the best crawlable content this page has ever
 * had, and they belong in the server HTML. What changes at the landing is
 * `aria-hidden` and `inert` — one boolean each, flipped from React state at most
 * twice per crossing — so neither a screen reader nor a Tab key is offered a
 * headline that is visually gone. Pointer events come off through a motion
 * value, because a hero at zero opacity that still swallows clicks is a dock
 * nobody can press.
 *
 * The illustrated room it stands in is **not** in here. It is mounted behind
 * the laptop by the OS root and fades on its own later value, because an opaque
 * backdrop at this element's `z-80` painted straight over the machine.
 */
export function Hero({
  intro, hidden, onEnter, onAdvertisers,
}: { intro: Intro; hidden: boolean; onEnter: () => void; onAdvertisers: () => void }) {
  return (
    <motion.div
      aria-hidden={hidden}
      inert={hidden}
      className="absolute inset-0 z-[80]"
      style={{ opacity: intro.heroOpacity, pointerEvents: intro.heroPointer }}
    >
      <motion.div
        className="absolute inset-0 flex flex-col px-[clamp(24px,4.4vw,72px)] pt-[clamp(18px,2.6vh,30px)]"
        style={{ y: intro.heroLift }}
      >
        <Bar />

        <div className="mt-[clamp(34px,8vh,96px)]">
          <Copy onAdvertisers={onAdvertisers} />

          {/*
            The scroll cue.

            It was a 12px label pinned to the bottom-left corner — where scroll
            hints conventionally live and, on this page, nowhere near anything
            the visitor is reading. It sat outside the reading path and people
            did not find it. This page needs one more than most, because
            scrolling here does something a scroll does not normally do.

            So it sits directly under the buttons, where the eye already is
            after the call to action, and it names the outcome rather than the
            gesture: "open the desktop" says what happens, where "scroll" only
            says what to do with your hand.

            A real control, not decoration. Pressing it runs the same flight the
            scroll does, which is the only way in for anyone on a keyboard.
          */}
          <motion.button
            type="button"
            onClick={onEnter}
            style={{ opacity: intro.arrowOpacity, color: MUTED, fontFamily: 'var(--font-pixel)' }}
            className={`mt-[clamp(22px,3vh,34px)] flex w-fit items-center gap-[11px] rounded-full py-[6px] transition-colors hover:text-[#241B12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[4px] focus-visible:outline-[#4E9C00] ${TYPE.pixelLabel}`}
          >
            {/* The arrow falls down a short track rather than bobbing in place.
                A bob says "I am animated"; something falling down a line says
                "this direction". */}
            <span aria-hidden className="relative block h-[22px] w-[13px] flex-none overflow-hidden">
              <span
                className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
                style={{ background: 'currentColor', opacity: 0.3 }}
              />
              <motion.span
                className="absolute left-1/2 block -translate-x-1/2"
                animate={{ y: [0, 13, 13], opacity: [0, 1, 0] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut', times: [0, 0.65, 1] }}
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M4.5 0v7M1 4.5l3.5 3.5L8 4.5" stroke="currentColor" strokeWidth="1.6"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
            </span>
            Scroll to open the desktop
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * The stacked-mode hero: the same words with none of the machinery.
 *
 * No scroll control, because nothing is going to open, and no picture of a
 * laptop either — a static rendering of a desktop directly above the same
 * desktop's contents is decoration, and it would cost the most layout on
 * exactly the narrowest viewports that can least afford it. It brings its own
 * light panel, because the stacked page draws the wallpaper behind everything
 * and dark ink on that aurora is unreadable.
 */
export function StaticHero({ onAdvertisers }: { onAdvertisers: () => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-[18px] px-[clamp(22px,4vw,48px)] pb-[clamp(28px,5vh,48px)] pt-[clamp(20px,3vh,30px)]"
      style={{ background: '#F6EFE3', border: '1px solid rgba(64,48,32,.16)' }}
    >
      <Bar />
      <div className="mt-[clamp(26px,4vh,44px)]">
        <Copy onAdvertisers={onAdvertisers} />
      </div>
    </div>
  )
}
