'use client'
import { useEffect } from 'react'
import type { GalleryItem } from '@/content/projects'

/**
 * A gallery image, large, over its window. Esc and a click outside close it.
 * Esc is caught in the capture phase and marked handled, so the OS's own Esc
 * (close the window) never sees it.
 */
export function Lightbox({ items, index, onClose }: { items: readonly GalleryItem[]; index: number; onClose: () => void }) {
  const item = items[index]
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
  if (!item) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-[10px] p-[28px]"
      style={{ background: 'rgba(10,12,16,.82)' }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- sized by the window, not known ahead */}
      <img src={item.src} alt={item.caption} className="max-h-[85%] max-w-full rounded-[8px] object-contain" onClick={(e) => e.stopPropagation()} />
      <p className="text-[13px] text-white/80" style={{ fontFamily: 'var(--font-ui)' }}>{item.caption}</p>
    </div>
  )
}
