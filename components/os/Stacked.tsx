'use client'
import Image from 'next/image'
import { PROFILE } from '@/content/profile'
import { TYPE } from './chrome'
import { SCENE_SRC } from './intro/Laptop'
import { APPS } from './registry'
import { Wallpaper } from './Wallpaper'

/**
 * The fallback for viewports too small for the desktop: the room as a picture,
 * then every app's window in document order. Nothing is hidden behind a click.
 * Phase 5 replaces this with the real phone layout (a drag-to-pan room).
 */
export function Stacked() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0"><Wallpaper /></div>
      <div className="relative mx-auto flex w-full max-w-[880px] flex-col gap-[28px] px-[16px] pb-[60px] pt-[16px]">
        <header className="overflow-hidden rounded-[14px]" style={{ background: '#F6EFE3', color: '#241B12' }}>
          <div className="relative aspect-[1376/768] w-full">
            <Image
              src={SCENE_SRC}
              alt="Rayyan's room, drawn in pixel art: a desk with a laptop, shelves and a window"
              fill
              priority
              sizes="(max-width: 880px) 100vw, 880px"
              style={{ objectFit: 'cover', imageRendering: 'pixelated' }}
            />
          </div>
          <div className="p-[18px]">
            <h1 className={TYPE.pixelLabel} style={{ fontFamily: 'var(--font-pixel)' }}>{PROFILE.name}</h1>
            <p className="mt-[6px] text-[15px] leading-[1.45]" style={{ fontFamily: 'var(--font-ui)' }}>
              {PROFILE.tagline}
            </p>
          </div>
        </header>
        {APPS.map((app) => (
          <section key={app.id} id={app.id} aria-label={app.name}>
            <app.Scene />
          </section>
        ))}
      </div>
    </div>
  )
}
