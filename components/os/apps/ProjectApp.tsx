'use client'
import { useCallback, useState, type ReactNode } from 'react'
import type { Project, ProjectMedia } from '@/content/projects'
import { OSWindow } from '../OSWindow'
import { INK, TYPE } from '../chrome'
import { Eyebrow, Stat } from '../parts'
import type { AppSceneProps } from '../registry'
import { useReducedMotion } from '../useReducedMotion'
import { Lightbox } from './Lightbox'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-[34px]">
      <h3 className="text-[13px] font-bold uppercase tracking-[.12em]" style={{ color: INK.dim, fontFamily: 'var(--font-ui)' }}>{title}</h3>
      <div className="mt-[12px]">{children}</div>
    </section>
  )
}

function Prose({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div className="flex max-w-[64ch] flex-col gap-[12px]">
      {paragraphs.map((p) => <p key={p} className={TYPE.lead} style={{ color: INK.body }}>{p}</p>)}
    </div>
  )
}

/** The product in a browser frame, with its real address in the bar. */
function BrowserFrame({ url, media, live }: { url?: string; media: ProjectMedia; live: boolean }) {
  const still = media.kind === 'image' ? media.src : media.poster
  return (
    <figure className="overflow-hidden rounded-[10px]" style={{ boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 12px 30px -10px rgba(16,24,40,.45)', border: '1px solid rgba(20,26,34,.14)' }}>
      <div className="flex items-center gap-[10px] px-[12px] py-[8px]" style={{ background: 'linear-gradient(#F4F6F9,#E3E8EE)' }}>
        <span aria-hidden className="flex gap-[6px]">{['#F5564C', '#F5B32C', '#2FC33F'].map((c) => <span key={c} className="h-[9px] w-[9px] rounded-full" style={{ background: c }} />)}</span>
        {url && <span className="truncate rounded-[6px] bg-white px-[10px] py-[2px] text-[12px]" style={{ color: INK.dim, fontFamily: 'var(--font-ui)' }}>{url}</span>}
      </div>
      {media.kind === 'video' && live ? (
        <video src={media.src} poster={media.poster} autoPlay muted loop playsInline aria-label={media.alt} className="block aspect-video w-full bg-black object-cover" />
      ) : still ? (
        // eslint-disable-next-line @next/next/no-img-element -- content media of unknown size
        <img src={still} alt={media.alt} className="block aspect-video w-full bg-black object-cover" />
      ) : null}
    </figure>
  )
}

/**
 * A project's case study (spec §3.1): hero, numbers, the problem, what was
 * built, how it works, what's next. Each section renders only with content.
 * The recording plays only while this window is the open one (`active`), and
 * never under reduced motion.
 */
export function ProjectApp({ project: p, onClose, active }: AppSceneProps & { project: Project }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState<number | null>(null)
  // Windows stay mounted when closed: a lightbox left open would outlive its
  // window and keep catching Esc, so closing the window closes it.
  const [wasActive, setWasActive] = useState(active)
  if (active !== wasActive) {
    setWasActive(active)
    if (!active) setShown(null)
  }
  const closeLightbox = useCallback(() => setShown(null), [])
  const meta = [p.role, p.dates].filter(Boolean).join(' · ')
  const works = (p.stack && p.stack.length > 0) || p.diagram

  return (
    <OSWindow title={p.name} subtitle={p.displayUrl ?? 'Project'} onClose={onClose}>
      <div className="relative h-full">
      <div className="h-full overflow-y-auto p-[clamp(24px,2.6vw,42px)]">
        <div className={`grid items-center gap-[clamp(20px,2.4vw,36px)] ${p.hero ? 'lg:grid-cols-[1.25fr_1fr]' : ''}`}>
          {p.hero && <BrowserFrame url={p.displayUrl} media={p.hero} live={Boolean(active) && !reduced} />}
          <div>
            {meta && <Eyebrow>{meta}</Eyebrow>}
            <h2 className={`mt-[10px] ${TYPE.heading}`} style={{ color: INK.strong }}>{p.name}</h2>
            <p className={`mt-[8px] ${TYPE.lead}`} style={{ color: INK.body }}>{p.tagline}</p>
            {p.liveUrl && (
              <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                 className="mt-[16px] inline-block rounded-[8px] px-[14px] py-[7px] text-[13px] font-bold text-white"
                 style={{ background: 'linear-gradient(#3B93F0,#1B6FD6)', fontFamily: 'var(--font-ui)' }}>
                Try it live →
              </a>
            )}
          </div>
        </div>

        {p.metrics && p.metrics.length > 0 && (
          <div className="mt-[30px] flex flex-wrap gap-[clamp(20px,3vw,48px)]">
            {p.metrics.map((m) => <Stat key={m.label} value={m.value} caption={m.label} size="hero" />)}
          </div>
        )}

        {p.problem && <Section title="The problem"><Prose paragraphs={p.problem} /></Section>}

        {(p.built || p.gallery) && (
          <Section title="What I built">
            {p.built && <Prose paragraphs={p.built} />}
            {p.gallery && (
              <ul className="mt-[16px] grid grid-cols-2 gap-[12px] lg:grid-cols-3">
                {p.gallery.map((g, i) => (
                  <li key={g.src}>
                    <button type="button" onClick={() => setShown(i)} aria-label={`Enlarge: ${g.caption}`} className="block w-full overflow-hidden rounded-[8px]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- content media of unknown size */}
                      <img src={g.src} alt="" className="aspect-[16/10] w-full object-cover" />
                    </button>
                    <span className="mt-[4px] block text-[12px]" style={{ color: INK.dim }}>{g.caption}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {works && (
          <Section title="How it works">
            {p.stack && (
              <ul className="flex flex-wrap gap-[8px]">
                {p.stack.map((s) => (
                  <li key={s} className="rounded-full px-[10px] py-[3px] text-[12.5px] font-bold" style={{ background: 'rgba(20,26,34,.07)', color: INK.body, fontFamily: 'var(--font-ui)' }}>{s}</li>
                ))}
              </ul>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- content media of unknown size */}
            {p.diagram && <img src={p.diagram.src} alt={p.diagram.alt} className="mt-[16px] max-w-full rounded-[8px]" />}
          </Section>
        )}

        {p.next && <Section title="What’s next"><Prose paragraphs={p.next} /></Section>}

      </div>
      {/* Outside the scroller, so it covers the window wherever it is scrolled. */}
      {shown !== null && p.gallery && <Lightbox items={p.gallery} index={shown} onClose={closeLightbox} />}
      </div>
    </OSWindow>
  )
}
