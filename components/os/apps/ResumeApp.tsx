import { PROFILE, RESUME, type ResumeEntry } from '@/content/profile'
import { OSButton } from '../OSButton'
import { OSWindow } from '../OSWindow'
import { INK, TYPE } from '../chrome'
import { Eyebrow } from '../parts'
import type { AppSceneProps } from '../registry'

function Section({ label, entries }: { label: string; entries: readonly ResumeEntry[] }) {
  return (
    <section className="mt-[28px]">
      <Eyebrow>{label}</Eyebrow>
      <ul className="mt-[10px] flex flex-col gap-[12px]">
        {entries.map((entry) => (
          <li key={entry.title}>
            <b className="block text-[16px] font-bold" style={{ color: INK.strong }}>{entry.title}</b>
            <span className={TYPE.body} style={{ color: INK.body }}>{entry.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The résumé, as a document window. An h2: the room owns the page's h1. */
export function ResumeApp({ onClose }: AppSceneProps) {
  return (
    <OSWindow title="Résumé" subtitle={RESUME.pdf ? 'PDF' : 'Draft'} onClose={onClose}>
      <div className="h-full overflow-y-auto p-[clamp(24px,2.6vw,42px)]">
        <h2 className={TYPE.heading} style={{ color: INK.strong }}>{PROFILE.name}</h2>
        <p className={`mt-[10px] ${TYPE.lead}`} style={{ color: INK.body }}>{PROFILE.tagline}</p>
        {RESUME.pdf && (
          <div className="mt-[18px]">
            <OSButton href={RESUME.pdf}>Download PDF</OSButton>
          </div>
        )}
        <Section label="Building" entries={RESUME.building} />
        <Section label="Education" entries={RESUME.education} />
      </div>
    </OSWindow>
  )
}
