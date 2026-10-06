/**
 * What is on the desktop: a disk, a folder and a file, so the stage reads as
 * somebody's computer. Scenery only. Nothing here is interactive, and it sits
 * behind every window (z-10 against their 20 and 30).
 */

interface Item {
  name: string
  kind: 'disk' | 'folder' | 'doc'
}

const ITEMS: readonly Item[] = [
  { name: 'Macintosh HD', kind: 'disk' },
  { name: 'Projects', kind: 'folder' },
  { name: 'notes.txt', kind: 'doc' },
]

function Glyph({ kind }: { kind: Item['kind'] }) {
  if (kind === 'disk') {
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="desk-disk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9EEF5" />
            <stop offset="100%" stopColor="#A9B4C2" />
          </linearGradient>
        </defs>
        <rect x="6" y="12" width="36" height="24" rx="4" fill="url(#desk-disk)"
              stroke="rgba(20,26,34,.35)" strokeWidth="1" />
        <rect x="6" y="12" width="36" height="9" rx="4" fill="rgba(255,255,255,.55)" />
        <circle cx="24" cy="27" r="4.4" fill="#8E99A8" />
        <circle cx="24" cy="27" r="1.5" fill="#E9EEF5" />
      </svg>
    )
  }
  if (kind === 'folder') {
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="desk-folder" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8FD0F5" />
            <stop offset="100%" stopColor="#3D9BDE" />
          </linearGradient>
        </defs>
        <path d="M5 14a3 3 0 0 1 3-3h10.5l3.4 3.6H40a3 3 0 0 1 3 3V37a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z"
              fill="url(#desk-folder)" stroke="rgba(12,50,90,.35)" strokeWidth="1" />
        <path d="M5 19h38v3H5Z" fill="rgba(255,255,255,.35)" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      <path d="M11 7h18l8 8v26a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
            fill="#FBFCFE" stroke="rgba(20,26,34,.32)" strokeWidth="1" />
      <path d="M29 7l8 8h-8Z" fill="#D8DFE8" />
      {[19, 24, 29, 34].map((y, i) => (
        <rect key={y} x="14" y={y} width={i === 3 ? 12 : 20} height="2.4" rx="1.2"
              fill={i === 0 ? '#2E7FE0' : 'rgba(20,26,34,.22)'} />
      ))}
    </svg>
  )
}

export function DesktopItems() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div className="absolute right-[22px] top-[46px] flex flex-col items-center gap-[16px]">
        {ITEMS.map((item) => (
          <span key={item.name} className="flex w-[92px] flex-col items-center gap-[5px]">
            <span className="block h-[46px] w-[46px]" style={{ filter: 'drop-shadow(0 3px 5px rgba(6,8,24,.45))' }}>
              <Glyph kind={item.kind} />
            </span>
            <span
              className="max-w-full truncate rounded-[4px] px-[5px] py-[1px] text-[11px] font-bold text-white"
              style={{ fontFamily: 'var(--font-ui)', textShadow: '0 1px 2px rgba(0,0,0,.75)' }}
            >
              {item.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
