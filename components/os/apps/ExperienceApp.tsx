'use client'
import { useState } from 'react'
import { PROJECTS } from '@/content/projects'
import { ROLES, type RoleTag, type RoleView } from '@/content/roles'
import { OSWindow } from '../OSWindow'
import { INK, TYPE } from '../chrome'
import { Eyebrow } from '../parts'
import type { AppSceneProps } from '../registry'
import { rolePath } from '../view'

type Filter = 'all' | RoleTag
const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'product', label: 'Product' },
  { id: 'leadership', label: 'Leadership' },
]

function Detail({ role, onOpenApp }: { role: RoleView; onOpenApp?: (id: string) => void }) {
  const project = role.project ? PROJECTS.find((p) => p.slug === role.project) : undefined
  return (
    <section aria-label="Role" className="h-full overflow-y-auto p-[clamp(22px,2.4vw,36px)]">
      <Eyebrow>{role.dates} · {role.place}</Eyebrow>
      <h2 className={`mt-[10px] ${TYPE.heading}`} style={{ color: INK.strong }}>{role.org}</h2>
      <p className="mt-[4px] text-[15px] italic" style={{ color: INK.body }}>{role.title}</p>
      {role.orgLine && <p className="mt-[8px] text-[13.5px]" style={{ color: INK.dim }}>{role.orgLine}</p>}

      <h3 className="mt-[26px] text-[13px] font-bold uppercase tracking-[.12em]" style={{ color: INK.dim, fontFamily: 'var(--font-ui)' }}>What I did</h3>
      <ul className="mt-[10px] flex list-disc flex-col gap-[8px] pl-[18px]">
        {role.bullets.map((b, i) => (
          <li key={b} className={TYPE.body} style={{ color: INK.body }}>
            {b}
            {role.expansions?.[i] && <span className="mt-[3px] block text-[13px]" style={{ color: INK.dim }}>{role.expansions[i]}</span>}
          </li>
        ))}
      </ul>

      {role.links && role.links.length > 0 && (
        <ul className="mt-[18px] flex flex-wrap gap-[14px]">
          {role.links.map((l) => <li key={l.href}><a href={l.href} target="_blank" rel="noopener noreferrer" className="text-[13.5px] font-bold text-[#1B6FD6] hover:underline">{l.label} →</a></li>)}
        </ul>
      )}

      {role.gallery && role.gallery.length > 0 && (
        <ul className="mt-[18px] grid grid-cols-2 gap-[12px]">
          {role.gallery.map((g) => (
            <li key={g.src}>
              {/* eslint-disable-next-line @next/next/no-img-element -- content media of unknown size */}
              <img src={g.src} alt={g.caption} className="aspect-[16/10] w-full rounded-[8px] object-cover" />
            </li>
          ))}
        </ul>
      )}

      {project && (
        <div className="mt-[24px]">
          <h3 className="text-[13px] font-bold uppercase tracking-[.12em]" style={{ color: INK.dim, fontFamily: 'var(--font-ui)' }}>What came out of it</h3>
          {onOpenApp ? (
            <button type="button" onClick={() => onOpenApp(project.slug)} className="mt-[10px] block rounded-[10px] px-[16px] py-[12px] text-left" style={{ background: 'rgba(20,26,34,.05)', border: '1px solid rgba(20,26,34,.1)' }}>
              <b className="block text-[15px]" style={{ color: INK.strong }}>{project.name}</b>
              <span className="text-[13px]" style={{ color: INK.body }}>{project.tagline}</span>
            </button>
          ) : (
            <a href={`#${project.slug}`} className="mt-[10px] block text-[14px] font-bold text-[#1B6FD6]">{project.name} →</a>
          )}
        </div>
      )}
    </section>
  )
}

/**
 * Experience (spec §3.2): a Finder-style list of roles and the selected one's
 * detail. On the desktop the selection lives in the URL (`sub`, moved with
 * `onNavigate`); in the stacked layout, with no URL to move, it is local.
 */
export function ExperienceApp({ onClose, sub, onNavigate, onOpenApp }: AppSceneProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [picked, setPicked] = useState<string | null>(null)
  const shown = ROLES.filter((r) => filter === 'all' || r.tags.includes(filter))
  const selected = (onNavigate ? sub : picked) ?? ROLES[0].slug
  const role = ROLES.find((r) => r.slug === selected) ?? ROLES[0]
  const pick = (slug: string) => (onNavigate ? onNavigate(rolePath(slug)) : setPicked(slug))

  return (
    <OSWindow title="Experience" subtitle={`${ROLES.length} roles`} onClose={onClose}>
      <div className="grid h-full grid-cols-[minmax(220px,30%)_1fr]">
        <aside className="flex h-full flex-col overflow-y-auto" style={{ background: 'rgba(232,236,241,.7)', borderRight: '1px solid rgba(20,26,34,.1)' }}>
          <div className="flex flex-wrap gap-[4px] p-[10px]" role="group" aria-label="Filter">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
                      className="rounded-[6px] px-[9px] py-[3px] text-[12px] font-bold"
                      style={{ fontFamily: 'var(--font-ui)', background: filter === f.id ? '#fff' : 'transparent', color: filter === f.id ? INK.strong : INK.dim }}>
                {f.label}
              </button>
            ))}
          </div>
          <ul aria-label="Roles" className="flex flex-col px-[6px] pb-[10px]">
            {shown.map((r) => (
              <li key={r.slug}>
                <button type="button" onClick={() => pick(r.slug)} aria-current={r.slug === role.slug ? 'true' : undefined}
                        className="block w-full rounded-[7px] px-[10px] py-[8px] text-left"
                        style={{ background: r.slug === role.slug ? '#2E7FE0' : 'transparent', color: r.slug === role.slug ? '#fff' : INK.strong }}>
                  <b className="block truncate text-[13.5px]">{r.org}</b>
                  <span className="block truncate text-[11.5px] opacity-75">{r.dates}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <Detail role={role} onOpenApp={onOpenApp} />
      </div>
    </OSWindow>
  )
}
