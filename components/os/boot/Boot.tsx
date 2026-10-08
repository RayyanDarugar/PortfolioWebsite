'use client'
import { useEffect, useRef } from 'react'
import { BOOT_MS, BOOT_REDUCED_MS } from './session'

/**
 * A plain Apple-style boot (spec §2.1): black, Rayyan's RD monogram (never
 * Apple's logo), and a thin bar filling beneath it, then the picker. Any click
 * or key skips it. Keys are caught in the capture phase and marked handled,
 * so an Esc meant to skip the boot doesn't also leave the laptop.
 */
export function Boot({ reduced, onDone }: { reduced: boolean; onDone: () => void }) {
  const finished = useRef(false)
  const finish = useRef(onDone)
  useEffect(() => { finish.current = onDone }, [onDone])

  useEffect(() => {
    const end = () => {
      if (finished.current) return
      finished.current = true
      finish.current()
    }
    const timer = window.setTimeout(end, reduced ? BOOT_REDUCED_MS : BOOT_MS)
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()
      end()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [reduced])

  return (
    <div
      data-testid="boot"
      className={`absolute inset-0 z-[90] flex flex-col items-center justify-center bg-black ${reduced ? 'boot-fade' : ''}`}
      onClick={() => { if (!finished.current) { finished.current = true; finish.current() } }}
    >
      <svg role="img" aria-label="RD" viewBox="0 0 120 80" className="h-[clamp(56px,7vw,92px)] w-auto">
        <text x="60" y="58" textAnchor="middle" fill="#fff" fontSize="56" fontWeight="800" letterSpacing="-2" style={{ fontFamily: 'var(--font-archivo)' }}>RD</text>
      </svg>
      {!reduced && (
        <div role="progressbar" aria-label="Starting up" className="mt-[clamp(28px,4vh,44px)] h-[5px] w-[clamp(150px,14vw,210px)] overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,.22)' }}>
          <div className="boot-fill h-full rounded-full bg-white" />
        </div>
      )}
    </div>
  )
}
