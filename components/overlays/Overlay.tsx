'use client'
import { MotionConfig, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * The overlay host (spec §4, §5): a modal over the room. Every overlay is a
 * route whose page renders one of these, so it is server-rendered and has its
 * own URL; the room stays mounted underneath in the root layout. It closes
 * with Esc, a click outside, or the back button (which is just navigation),
 * and keeps keyboard focus inside while open. The OS root returns focus to
 * the object that opened it.
 */
export function Overlay({ label, children }: { label: string; children: ReactNode }) {
  const router = useRouter()
  const dialog = useRef<HTMLDivElement>(null)
  const close = useCallback(() => router.push('/', { scroll: false }), [router])

  useEffect(() => { dialog.current?.focus() }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key === 'Escape') { event.preventDefault(); close(); return }
      if (event.key !== 'Tab' || !dialog.current) return
      const focusable = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (focusable.length === 0) { event.preventDefault(); return }
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="absolute inset-0 cursor-default"
          style={{ background: 'rgba(12,8,6,.55)' }}
        />
        <motion.div
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className="relative outline-none"
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        >
          {children}
        </motion.div>
      </div>
    </MotionConfig>
  )
}
