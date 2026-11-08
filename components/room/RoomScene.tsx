'use client'
import Image from 'next/image'
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { SCENE_PX_H, SCENE_PX_W } from '@/components/os/intro/geometry'
import { ROOM_OBJECTS, spriteFor, type RoomObject } from '@/content/room'
import sprites from '@/public/room/sprites.json'
import { hitAt, loadHitMap, type HitMap } from './hitmap'
import { toArt } from './layout'
import type { Variant } from './timeOfDay'

const PIXELATED = { imageRendering: 'pixelated' } as const
const pct = (n: number, of: number) => `${(n / of) * 100}%`
const boxOf = (s: { x: number; y: number; w: number; h: number }) => ({
  left: pct(s.x, SCENE_PX_W), top: pct(s.y, SCENE_PX_H), width: pct(s.w, SCENE_PX_W), height: pct(s.h, SCENE_PX_H),
})

/** The pixel tooltip over a lit object; under it when the object touches the top. */
function Tooltip({ object }: { object: RoomObject }) {
  const s = spriteFor(object.id)
  const below = s.y < 120
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute z-10 whitespace-nowrap rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#fff3d6]"
      style={{
        left: pct(s.x + s.w / 2, SCENE_PX_W),
        top: pct(below ? s.y + s.h : s.y, SCENE_PX_H),
        transform: below ? 'translate(-50%, 8px)' : 'translate(-50%, calc(-100% - 8px))',
        background: 'rgba(28,18,12,.9)',
        border: '1px solid rgba(255,214,140,.45)',
        fontFamily: 'var(--font-pixel)',
      }}
    >
      {object.label}
    </span>
  )
}

/**
 * The room, in layers (spec §5 "room engine"): the empty base, then one
 * sprite per object in draw order, then whatever is drawn on the room
 * (`children`, the whiteboard intro), then a focusable button over each
 * object for the keyboard. It knows nothing about books or records: it lights
 * objects and reports which one was chosen.
 *
 * The pointer is resolved through the hit map rather than the buttons, which
 * are transparent to it, because the objects are irregular and overlap. It
 * fills its parent, the Laptop's room box, and reads the pointer against its
 * own on-screen box, so pan and zoom transforms are already accounted for.
 */
export function RoomScene({
  lit, disabled, onActivate, children, variant = 'sunset',
}: {
  lit: readonly string[]
  disabled: boolean
  onActivate: (id: string) => void
  children?: ReactNode
  /** The lighting. There are no day or night base layers, so those use their
   *  full picture as the base, with their own sprites on top (identical pixels).
   *  `null` while it is not yet known (the server and the first client
   *  render): no art is drawn, so a visitor at night never downloads the
   *  sunset set only to throw it away. */
  variant?: Variant | null
}) {
  const [map, setMap] = useState<HitMap | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  // The room fades in once its first set of art has loaded, rather than
  // assembling itself layer by layer. It stays shown after that: a later
  // change of lighting swaps the pictures under it. The timeout is a floor so
  // a stalled image can never leave the room blank.
  const layers = 1 + sprites.sprites.length
  const [loaded, setLoaded] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const onLayerLoad = () => setLoaded((n) => n + 1)
  useEffect(() => { if (loaded >= layers) setRevealed(true) }, [loaded, layers])
  useEffect(() => {
    if (!variant) return
    const id = window.setTimeout(() => setRevealed(true), 4000)
    return () => window.clearTimeout(id)
  }, [variant])

  useEffect(() => {
    let alive = true
    loadHitMap('/room/hitmap.png').then((m) => { if (alive) setMap(m) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const objectAt = (event: MouseEvent<HTMLElement>): string | null => {
    if (!map) return null
    const p = toArt(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())
    if (!p) return null
    const i = hitAt(map, p.u, p.v)
    return i >= 0 ? sprites.sprites[i].id : null
  }

  const shown = disabled ? null : hovered
  const isLit = (id: string) => !disabled && (id === hovered || lit.includes(id))
  const tooltip = shown ? ROOM_OBJECTS.find((o) => o.id === shown) : undefined

  return (
    <div
      className="absolute inset-0 [container-type:inline-size]"
      inert={disabled}
      style={{ cursor: shown ? 'pointer' : 'default' }}
      onPointerMove={(event) => { if (!disabled) setHovered(objectAt(event)) }}
      onPointerLeave={() => setHovered(null)}
      onClick={(event) => {
        const id = disabled ? null : objectAt(event)
        if (id) onActivate(id)
      }}
    >
      <div
        className="absolute inset-0"
        data-room-art={revealed ? 'shown' : 'loading'}
        style={{ opacity: revealed ? 1 : 0, transition: 'opacity .5s ease-out' }}
      >
        {variant && (
          <Image src={variant === 'sunset' ? '/room/base.webp' : `/room/${variant}.webp`} alt="" fill priority sizes="112vw" style={PIXELATED} onLoad={onLayerLoad} />
        )}

        {variant && sprites.sprites.map((s) => (
          <Image
            key={s.id}
            src={variant === 'sunset' ? `/room/sprites/${s.id}.webp` : `/room/sprites/${s.id}.${variant}.webp`}
            alt=""
            width={s.w}
            height={s.h}
            priority
            sizes={`${((s.w / SCENE_PX_W) * 112).toFixed(1)}vw`}
            data-sprite={s.id}
            data-lit={isLit(s.id) ? 'true' : 'false'}
            className="room-sprite pointer-events-none absolute max-w-none"
            style={{ ...boxOf(s), ...PIXELATED }}
            onLoad={onLayerLoad}
          />
        ))}

        {children}
      </div>

      {ROOM_OBJECTS.map((o) => (
        <button
          key={o.id}
          type="button"
          data-room-object={o.id}
          aria-label={`${o.label}: ${o.hint}`}
          className="pointer-events-none absolute rounded-[4px] outline-none"
          style={boxOf(spriteFor(o.id))}
          onFocus={() => setHovered(o.id)}
          onBlur={() => setHovered((h) => (h === o.id ? null : h))}
          onClick={(event) => { event.stopPropagation(); onActivate(o.id) }}
        />
      ))}

      {tooltip && <Tooltip object={tooltip} />}
    </div>
  )
}
