'use client'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { AppDef } from './registry'
import type { AppId } from './view'

/** Case- and accent-insensitive, so "resume" finds "Résumé". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Spotlight, on ⌘K: find an app on the laptop by name. Adapted from the AE
 * shell, where it also listed the site's other pages; here every page is an app.
 *
 * Escape is handled here and marked handled (`preventDefault`), so the OS's own
 * Escape (which steps out of the laptop) knows to leave it alone.
 */
export function Spotlight({
  open, onClose, onGoTo, apps,
}: {
  open: boolean
  onClose: () => void
  onGoTo: (id: AppId) => void
  apps: readonly AppDef[]
}) {
  // Mounted rather than hidden, so the query and selection start empty every time.
  return open ? <Panel onClose={onClose} onGoTo={onGoTo} apps={apps} /> : null
}

function Panel({
  onClose, onGoTo, apps,
}: {
  onClose: () => void
  onGoTo: (id: AppId) => void
  apps: readonly AppDef[]
}) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  const items = useMemo(() => {
    const q = fold(query.trim())
    return q ? apps.filter((app) => fold(app.name).includes(q)) : apps
  }, [query, apps])

  useEffect(() => {
    const restore = document.activeElement as HTMLElement | null
    input.current?.focus()
    return () => { restore?.focus?.() }
  }, [])

  const choose = (app: AppDef) => {
    onClose()
    onGoTo(app.id)
  }

  const move = (delta: number) => {
    if (items.length === 0) return
    setCursor((c) => (c + delta + items.length) % items.length)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1); return }
    if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); return }
    if (event.key === 'Tab') { event.preventDefault(); move(event.shiftKey ? -1 : 1); return }
    if (event.key === 'Enter') {
      event.preventDefault()
      const app = items[cursor]
      if (app) choose(app)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(10,6,24,.32)' }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={onKeyDown}
        className="relative mt-[16vh] w-[min(620px,calc(100vw-48px))] overflow-hidden rounded-[14px]"
        style={{
          background: 'rgba(40,34,54,.66)',
          backdropFilter: 'blur(34px) saturate(180%)',
          WebkitBackdropFilter: 'blur(34px) saturate(180%)',
          border: '1px solid rgba(255,255,255,.22)',
          boxShadow: [
            'inset 0 1px 0 rgba(255,255,255,.28)',
            '0 4px 10px rgba(6,8,24,.34)',
            '0 44px 90px -22px rgba(4,6,20,.78)',
          ].join(','),
          fontFamily: 'var(--font-ui)',
        }}
      >
        <div
          className="flex items-center gap-[12px] px-[18px] py-[14px]"
          style={{ borderBottom: items.length ? '1px solid rgba(255,255,255,.14)' : 'none' }}
        >
          <svg viewBox="0 0 16 16" className="h-[19px] w-[19px] flex-none text-white/70" fill="none"
               stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.4" />
            <path d="M10.4 10.4 14 14" />
          </svg>
          <input
            ref={input}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setCursor(0) }}
            placeholder="Search the laptop"
            aria-label="Search the laptop"
            className="min-w-0 flex-1 bg-transparent text-[19px] text-white outline-none placeholder:text-white/45"
          />
          <kbd className="flex-none rounded-[5px] px-[7px] py-[3px] text-[11px] font-bold text-white/60"
               style={{ background: 'rgba(255,255,255,.12)' }}>
            esc
          </kbd>
        </div>

        {items.length > 0 ? (
          <ul className="max-h-[52vh] overflow-y-auto py-[6px]">
            {items.map((app, i) => {
              const on = i === cursor
              return (
                <li key={app.id} onMouseEnter={() => setCursor(i)}>
                  <button
                    type="button"
                    onClick={() => choose(app)}
                    tabIndex={-1}
                    className={`flex w-full items-center gap-3 px-[18px] py-[8px] text-left text-[14px] ${on ? 'text-white' : 'text-white/75'}`}
                    style={{ background: on ? 'rgba(120,110,220,.55)' : 'transparent' }}
                  >
                    <span className="truncate">{app.name}</span>
                    <span className={`ml-auto flex-none text-[11.5px] ${on ? 'text-white/70' : 'text-white/45'}`}>
                      App
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="px-[18px] pb-[16px] pt-[2px] text-[13.5px] text-white/55">
            Nothing here matches that.
          </p>
        )}
      </div>
    </div>
  )
}
