import { Archivo, Instrument_Sans, Lato, JetBrains_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { SmoothScroll } from '@/components/SmoothScroll'

// Named after the typeface, not after the role. Naming these --font-display /
// --font-ui / --font-mono collided with the theme tokens of the same name in
// globals.css, which then had to reference themselves — `--font-display:
// var(--font-display), system-ui` — and only resolved because next/font's
// unlayered rule beat Tailwind's layered one. One ordering change away from
// every font silently falling back to system-ui.
const archivo = Archivo({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-archivo' })
const lato = Lato({ subsets: ['latin'], weight: ['400','700','900'], variable: '--font-lato' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','500','700'], variable: '--font-jetbrains' })
/* ------------------------------------------------------------------ *
 * The landing hero's two faces. Nothing else on the site uses them: the
 * machine's own chrome stays Lucida-ish, because that is the joke.
 * ------------------------------------------------------------------ */

/**
 * The hero's sans, standing in for cofounder.co's TT Neoris.
 *
 * Neoris is a commercial TypeType licence and cannot be shipped, so this is a
 * substitute rather than a match: a variable geometric grotesque, drawn in the
 * same contemporary register. It is the one deliberate deviation from the
 * reference. Swapping it later is one import — every size and weight the hero
 * uses is expressed against `TYPE`, not against the family.
 */
const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument' })

/**
 * Departure Mono, and this is the piece that actually carries the character.
 *
 * It is a genuine bitmap face — the letterforms are drawn on a pixel grid, so
 * it belongs to the room behind it rather than merely coordinating with it, and
 * it is the same font cofounder.co uses for its tracked-out labels. Free under
 * the SIL Open Font License (`public/fonts/DepartureMono-LICENSE.txt`), which
 * is why it can be here at all.
 *
 * Self-hosted because it is not on Google Fonts. One weight is all it has and
 * all it needs; a bitmap face has no business being interpolated.
 */
const pixel = localFont({
  src: '../public/fonts/DepartureMono-Regular.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-departure',
})

export const metadata = {
  title: 'The Attention Exchange',
  description:
    'There is empty space on your screen all day. That space is inventory, and right ' +
    'now you give it away for nothing. A user-installed macOS instrument that measures ' +
    'it, and pays you a share of what it clears.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${sans.variable} ${pixel.variable} ${lato.variable} ${mono.variable}`}>
      {/* The startup used to be a global overlay mounted here, which meant it
          also played on a deep link straight to /privacy — a boot screen in
          front of a document nobody asked to boot. It now belongs to the
          landing page's laptop, where a real machine's startup belongs, and
          lives in components/os/intro/ScreenWake.tsx. */}
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  )
}
