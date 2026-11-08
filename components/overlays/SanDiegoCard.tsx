'use client'
import { sanDiegoClock } from '@/components/room/timeOfDay'
import { useTimeOfDay } from '@/components/room/useTimeOfDay'
import { GameCard } from './GameCard'

const LINE = {
  day: 'Sun up over the Pacific.',
  sunset: 'My favorite golden skies',
  night: 'Nighttime waves',
} as const

/** The window's card (spec §4): San Diego right now, in its own light. The
 *  server and first render show the timeless line; the clock arrives after. */
export function SanDiegoCard() {
  const { variant, now } = useTimeOfDay()
  const photo = variant === 'sunset' ? '/room/sprites/window.webp' : `/room/sprites/window.${variant}.webp`
  return (
    <GameCard
      card={{
        id: 'san-diego',
        tag: 'PLACE · SAN DIEGO · NOW',
        title: 'San Diego',
        photo,
        stat: now ? `${sanDiegoClock(now)} in San Diego` : undefined,
        body: now ? ['Home as seen from my window', LINE[variant]] : ['Home as seen from my window'],
      }}
      prev={null}
      next={null}
    />
  )
}
