import type { Metadata } from 'next'
import { Archivo, Gochi_Hand, JetBrains_Mono, Lato } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { NowPlayingProvider } from '@/components/music/NowPlaying'
import { OS } from '@/components/os/OS'
import { PROFILE } from '@/content/profile'

// Named after the typeface, not the role, so they cannot collide with the
// role tokens in globals.css that point at them.
const archivo = Archivo({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-archivo' })
const lato = Lato({ subsets: ['latin'], weight: ['400', '700', '900'], variable: '--font-lato' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-jetbrains' })

/** The whiteboard's marker hand. */
const marker = Gochi_Hand({ subsets: ['latin'], weight: '400', variable: '--font-gochi' })

/** DepartureMono: self-hosted because it is not on Google Fonts. One weight. */
const pixel = localFont({
  src: '../public/fonts/DepartureMono-Regular.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-departure',
})

export const metadata: Metadata = {
  title: { default: PROFILE.name, template: `%s · ${PROFILE.name}` },
  description: PROFILE.tagline,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${lato.variable} ${mono.variable} ${pixel.variable} ${marker.variable}`}>
      {/* The room and the laptop live here, not in a page, so they survive
          navigation between /, /work and /work/[app] and can animate between
          them. The pages only make those URLs real and give them titles. */}
      <body>
        <NowPlayingProvider>
          <OS />
          {children}
        </NowPlayingProvider>
      </body>
    </html>
  )
}
