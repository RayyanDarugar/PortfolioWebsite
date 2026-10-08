'use client'
import type { AppDef } from '../registry'

/**
 * The laptop's home screen (spec §2.2), Mission Control style: every app as a
 * large tile with a preview and one plain line on what it is, under a strip of
 * headline numbers. It is `/work`, so it is what a recruiter sees first.
 */
export function Picker({
  apps, headlines, onOpen,
}: {
  apps: readonly AppDef[]
  headlines: readonly { value: string; label: string; app: string }[]
  onOpen: (id: string) => void
}) {
  return (
    <section
      aria-label="Mission Control"
      data-os-scroll
      className="absolute inset-x-0 bottom-[118px] top-[34px] z-[40] overflow-y-auto px-[clamp(20px,4vw,64px)] py-[clamp(16px,2.4vh,30px)]"
      style={{ background: 'rgba(8,10,20,.42)', backdropFilter: 'blur(14px) saturate(1.2)', WebkitBackdropFilter: 'blur(14px) saturate(1.2)' }}
    >
      {headlines.length > 0 && (
        <ul aria-label="Highlights" className="mb-[clamp(16px,2.4vh,28px)] flex flex-wrap justify-center gap-[10px]">
          {headlines.map((h) => (
            <li key={`${h.app}-${h.label}`}>
              <button type="button" onClick={() => onOpen(h.app)}
                      className="rounded-full px-[14px] py-[6px] text-[13px] text-white"
                      style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)', fontFamily: 'var(--font-ui)' }}>
                <b className="tabular">{h.value}</b> {h.label} →
              </button>
            </li>
          ))}
        </ul>
      )}

      <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-[clamp(14px,1.6vw,24px)] lg:grid-cols-4">
        {apps.map((app) => (
          <li key={app.id}>
            <button type="button" onClick={() => onOpen(app.id)}
                    className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <span className="block aspect-[16/10] overflow-hidden rounded-[12px] transition-transform duration-200 group-hover:-translate-y-[3px] group-hover:scale-[1.02]"
                    style={{ boxShadow: '0 14px 34px -12px rgba(0,0,0,.7), inset 0 0 0 1px rgba(255,255,255,.18)' }}>
                {app.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- content media of unknown size
                  <img src={app.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: app.tile }}>
                    {/* The icon's own colour, softened, so the icon sits on it rather than in it. */}
                    <span aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 38%, rgba(255,255,255,.28), rgba(0,0,0,.28))' }} />
                    <span className="relative block h-[58%] aspect-square" style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.35))' }}><app.Icon /></span>
                  </span>
                )}
              </span>
              <b className="mt-[10px] block text-[15px] text-white" style={{ fontFamily: 'var(--font-ui)', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>{app.name}</b>
              <span className="mt-[2px] block text-[12.5px] leading-[1.35] text-white/75" style={{ fontFamily: 'var(--font-ui)' }}>{app.blurb}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
