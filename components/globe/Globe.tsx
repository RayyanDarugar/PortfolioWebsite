'use client'
import { geoGraticule10, geoPath } from 'd3-geo'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import land110 from 'world-atlas/land-110m.json'
import { InAppLink } from '@/components/overlays/InAppLink'
import { useReducedMotion } from '@/components/os/useReducedMotion'
import { projectPin, projection } from './project'

/** Canvas resolution: small on purpose, then scaled up pixelated (spec §4). */
const SIZE = 160
const SPIN = 0.12 // degrees per frame
const START: [number, number] = [117, -25] // facing San Diego, tilted a little

const land = feature(land110 as unknown as Topology, (land110 as unknown as Topology).objects.land as GeometryCollection)
const graticule = geoGraticule10()

/**
 * A pixel globe (spec §4): d3-geo orthographic over world-atlas land, drawn
 * on a 160 px canvas and scaled up with `image-rendering: pixelated`. It
 * spins slowly (not under reduced motion), drags to rotate, and carries a pin
 * per place; pins on the far side are hidden. A pin opens that place's card.
 */
export function Globe({ places }: { places: readonly { slug: string; name: string; lat: number; lon: number }[] }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [rotate, setRotate] = useState<[number, number]>(START)
  const drag = useRef<{ x: number; y: number; r: [number, number] } | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const path = geoPath(projection(rotate, SIZE), ctx)
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = '#2f5d8a'; ctx.fill()
    ctx.beginPath(); path(graticule); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 0.5; ctx.stroke()
    ctx.beginPath(); path(land); ctx.fillStyle = '#7fb26a'; ctx.fill()
    ctx.strokeStyle = '#3f6b33'; ctx.lineWidth = 0.6; ctx.stroke()
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.strokeStyle = '#1b2f45'; ctx.lineWidth = 1.5; ctx.stroke()
  }, [rotate])

  useEffect(() => {
    if (reduced) return
    let frame = 0
    const tick = () => {
      if (!drag.current) setRotate(([l, t]) => [(l + SPIN) % 360, t])
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduced])

  return (
    <div className="flex flex-col items-center gap-[14px] text-[#f3e3c4]">
      <h2 className="text-[14px] uppercase tracking-[.24em]" style={{ fontFamily: 'var(--font-pixel)' }}>Places I&apos;ve been</h2>
      <div
        className="relative h-[min(480px,80vw)] w-[min(480px,80vw)] cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => {
          // A press on a pin is a click on its link: capturing the pointer for
          // a drag would retarget the click to this layer and the pin would go dead.
          if ((e.target as Element).closest('a')) return
          drag.current = { x: e.clientX, y: e.clientY, r: rotate }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const k = 180 / e.currentTarget.clientWidth
          setRotate([d.r[0] + (e.clientX - d.x) * k, Math.max(-60, Math.min(60, d.r[1] - (e.clientY - d.y) * k))])
        }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
      >
        <canvas ref={canvas} width={SIZE} height={SIZE} aria-hidden className="h-full w-full" style={{ imageRendering: 'pixelated' }} />
        {places.map((p) => {
          const pin = projectPin(p.lon, p.lat, rotate, SIZE)
          if (!pin.visible) return null
          return (
            <InAppLink
              key={p.slug}
              href={`/places/${p.slug}`}
              aria-label={p.name}
              className="group absolute -translate-x-1/2 -translate-y-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd36e]"
              style={{ left: `${(pin.x / SIZE) * 100}%`, top: `${(pin.y / SIZE) * 100}%` }}
            >
              <Image src="/ui/globe-pin.png" alt="" width={22} height={36} style={{ imageRendering: 'pixelated' }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-[4px] -translate-x-1/2 whitespace-nowrap rounded-[3px] bg-[rgba(28,18,12,.9)] px-[6px] py-[2px] text-[11px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" style={{ fontFamily: 'var(--font-pixel)' }}>
                {p.name}
              </span>
            </InAppLink>
          )
        })}
      </div>
      <ul className="flex flex-wrap justify-center gap-x-[14px] gap-y-[4px] text-[11px] uppercase tracking-[.14em] text-[#d9b98a]" style={{ fontFamily: 'var(--font-pixel)' }}>
        {places.map((p) => <li key={p.slug}><InAppLink href={`/places/${p.slug}`} aria-label={`${p.name} (list)`} className="hover:underline">{p.name}</InAppLink></li>)}
      </ul>
    </div>
  )
}
