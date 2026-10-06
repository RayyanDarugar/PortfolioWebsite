'use client'
import Image from 'next/image'
import { HOTBAR, spriteFor, type HotbarSlot } from '@/content/room'

const PIXEL_TEXT = { fontFamily: 'var(--font-pixel)', textShadow: '1px 1px 0 rgba(0,0,0,.85)' }

/**
 * The Minecraft-style hotbar (spec §3), floating over the bottom of the room:
 * nine slots, each an object, labelled
 * without hovering. It is nav, legend and keyboard access at once. Hovering
 * or focusing a slot lights its object(s); clicking acts exactly like clicking
 * the object. Number keys are handled by the OS root, which knows when the
 * room is the thing being looked at.
 */
export function Hotbar({
  onHighlight, onActivate,
}: {
  onHighlight: (ids: readonly string[] | null) => void
  onActivate: (slot: HotbarSlot) => void
}) {
  return (
    <nav
      aria-label="Hotbar"
      className="pointer-events-auto absolute bottom-[14px] left-1/2 -translate-x-1/2 rounded-[14px] px-[10px] pb-[6px] pt-[8px]"
      style={{
        background: 'rgba(22,14,9,.5)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,214,140,.18)',
      }}
    >
      <ol className="flex items-start gap-[6px]">
        {HOTBAR.map((slot) => {
          const s = spriteFor(slot.objects[0])
          return (
            <li key={slot.slot}>
              <button
                type="button"
                aria-label={`${slot.slot}: ${slot.label}`}
                aria-keyshortcuts={String(slot.slot)}
                onMouseEnter={() => onHighlight(slot.objects)}
                onMouseLeave={() => onHighlight(null)}
                onFocus={() => onHighlight(slot.objects)}
                onBlur={() => onHighlight(null)}
                onClick={() => onActivate(slot)}
                className="group relative flex w-[68px] flex-col items-center gap-[5px] outline-none"
              >
                <span className="relative block h-[58px] w-[58px]">
                  <Image src="/ui/hotbar-slot.png" alt="" fill sizes="58px" style={{ imageRendering: 'pixelated' }} />
                  <Image
                    src={`/room/sprites/${s.id}.png`}
                    alt=""
                    width={36}
                    height={36}
                    className="absolute left-[11px] top-[11px] h-[36px] w-[36px] object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <Image
                    src="/ui/hotbar-selected.png"
                    alt=""
                    width={66}
                    height={66}
                    className="absolute -left-[4px] -top-[4px] max-w-none opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                  <span aria-hidden className="absolute left-[6px] top-[3px] text-[11px] text-[#fff3d6]" style={PIXEL_TEXT}>
                    {slot.slot}
                  </span>
                </span>
                <span aria-hidden className="text-[10px] uppercase tracking-[.12em] text-[#f3e3c4]" style={PIXEL_TEXT}>
                  {slot.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
