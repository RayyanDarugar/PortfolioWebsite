'use client'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ROUTES } from '@/components/shell/routes'
import type { AppDef } from './registry'

interface Item {
  key: string
  label: string
  /** The right-hand kind label, the way Spotlight names what a hit is. */
  kind: string
  /** A section of this page, or another page of the site. */
  go: { section: number } | { href: string }
}

/**
 * Everything Spotlight can reach: the seven sections of this page, then the
 * six routes. Sections first because the visitor is on this page and the
 * thing they most likely want is somewhere further down it.
 *
 * The sections are **the logged-in account's**, handed down rather than
 * imported, so an advertiser searching for "Audience" finds it and is not
 * offered a Calculator that is not on their desktop. The routes are the
 * site's and are the same for both accounts, because the pages are.
 */
function catalogue(apps: readonly AppDef[]): Item[] {
  return [
    ...apps.map((app, i) => ({
      key: `section:${app.id}`,
      label: app.name,
      kind: 'Section',
      go: { section: i } as const,
    })),
    ...ROUTES.map((route) => ({
      key: `page:${route.href}`,
      label: route.footer,
      kind: 'Page',
      go: { href: route.href } as const,
    })),
  ]
}

/**
 * Spotlight, on ⌘K.
 *
 * It is theatre and it is also the honest answer to a landing page that is
 * seven viewports of scroll: a visitor who wants the privacy section should
 * not have to scroll past four windows to find out where it is. The dock does
 * the same job graphically; this does it by name.
 *
 * Keyboard behaviour is the whole point of the thing, so it is complete:
 * arrows and Tab move the selection, Enter opens it, Escape closes and hands
 * focus back to whatever had it. Tab is trapped rather than allowed to walk
 * out of an open modal into the page behind it — with one text field and a
 * moving selection there is nowhere else in here for it to legitimately go.
 */
export function Spotlight({
  open, onClose, onGoTo, apps,
}: {
  open: boolean
  onClose: () => void
  onGoTo: (index: number) => void
  apps: readonly AppDef[]
}) {
  // The panel is mounted rather than hidden, so its query and its selection
  // start empty every time by construction. Keeping it mounted and clearing
  // the fields in an effect on open is the same thing done worse: a render of
  // last time's search results before the effect wipes them.
  return open ? <Panel onClose={onClose} onGoTo={onGoTo} apps={apps} /> : null
}

function Panel({
  onClose, onGoTo, apps,
}: {
  onClose: () => void
  onGoTo: (index: number) => void
  apps: readonly AppDef[]
}) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const rows = useRef<(HTMLElement | null)[]>([])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = catalogue(apps)
    if (!q) return all
    return all.filter((item) => item.label.toLowerCase().includes(q))
  }, [query, apps])

  useEffect(() => {
    const restore = document.activeElement as HTMLElement | null
    input.current?.focus()
    return () => { restore?.focus?.() }
  }, [])

  const move = (delta: number) => {
    if (items.length === 0) return
    setCursor((c) => (c + delta + items.length) % items.length)
  }

  /** Only sections come through here. A page is a real `<Link>` and navigates
   *  itself; routing it through a handler would cost the anchor. */
  const chooseSection = (index: number) => {
    onClose()
    onGoTo(index)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1); return }
    if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); return }
    if (event.key === 'Tab') { event.preventDefault(); move(event.shiftKey ? -1 : 1); return }
    if (event.key === 'Enter') {
      event.preventDefault()
      const item = items[cursor]
      if (!item) return
      if ('section' in item.go) { onClose(); onGoTo(item.go.section) }
      else rows.current[cursor]?.click()
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
        <div className="flex items-center gap-[12px] px-[18px] py-[14px]"
             style={{ borderBottom: items.length ? '1px solid rgba(255,255,255,.14)' : 'none' }}>
          <svg viewBox="0 0 16 16" className="h-[19px] w-[19px] flex-none text-white/70" fill="none"
               stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.4" />
            <path d="M10.4 10.4 14 14" />
          </svg>
          <input
            ref={input}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setCursor(0) }}
            placeholder="Search The Attention Exchange"
            aria-label="Search The Attention Exchange"
            className="min-w-0 flex-1 bg-transparent text-[19px] text-white outline-none placeholder:text-white/45"
          />
          <kbd className="flex-none rounded-[5px] px-[7px] py-[3px] text-[11px] font-bold text-white/60"
               style={{ background: 'rgba(255,255,255,.12)' }}>
            esc
          </kbd>
        </div>

        {items.length > 0 && (
          <ul className="max-h-[52vh] overflow-y-auto py-[6px]">
            {items.map((item, i) => {
              const on = i === cursor
              const inner = (
                <>
                  <span className="truncate">{item.label}</span>
                  <span className={`ml-auto flex-none text-[11.5px] ${on ? 'text-white/70' : 'text-white/45'}`}>
                    {item.kind}
                  </span>
                </>
              )
              const className = `flex w-full items-center gap-3 px-[18px] py-[8px] text-left text-[14px] ${
                on ? 'text-white' : 'text-white/75'
              }`
              const style = { background: on ? 'rgba(120,110,220,.55)' : 'transparent' }
              // Pulled out of the JSX so the discriminated union is narrowed
              // once, here, rather than inside two closures TypeScript would
              // have to re-narrow.
              const href = 'href' in item.go ? item.go.href : null
              const section = 'section' in item.go ? item.go.section : 0
              return (
                <li key={item.key} onMouseEnter={() => setCursor(i)}>
                  {href !== null ? (
                    <Link
                      ref={(el) => { rows.current[i] = el }}
                      href={href}
                      onClick={onClose}
                      tabIndex={-1}
                      className={className}
                      style={style}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      ref={(el) => { rows.current[i] = el }}
                      onClick={() => chooseSection(section)}
                      tabIndex={-1}
                      className={className}
                      style={style}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {items.length === 0 && (
          <p className="px-[18px] pb-[16px] pt-[2px] text-[13.5px] text-white/55">
            Nothing here matches that.
          </p>
        )}
      </div>
    </div>
  )
}
