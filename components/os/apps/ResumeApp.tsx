import { PROFILE } from '@/content/profile'
import { RESUME, type Role } from '@/content/resume'
import { OSButton } from '../OSButton'
import { OSWindow } from '../OSWindow'
import { INK, TYPE } from '../chrome'
import { Eyebrow } from '../parts'
import type { AppSceneProps } from '../registry'

const RULE = { borderTop: '1px solid rgba(20,26,34,.10)' }

function RoleEntry({ role }: { role: Role }) {
  return (
    <li className="pt-[14px]" style={RULE}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <b className="text-[16px] font-bold" style={{ color: INK.strong }}>{role.org}</b>
        <span className="tabular text-[12px]" style={{ color: INK.dim }}>{role.dates}</span>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="text-[14px] italic" style={{ color: INK.body }}>{role.title}</span>
        <span className="text-[12.5px]" style={{ color: INK.dim }}>{role.place}</span>
      </div>
      <ul className="mt-[8px] flex list-disc flex-col gap-[5px] pl-[18px]">
        {role.bullets.map((bullet) => (
          <li key={bullet} className={TYPE.body} style={{ color: INK.body }}>{bullet}</li>
        ))}
      </ul>
    </li>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-[30px]">
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-[12px]">{children}</div>
    </section>
  )
}

/** The résumé, as a document window. An h2: the room owns the page's h1. */
export function ResumeApp({ onClose }: AppSceneProps) {
  const { education } = RESUME
  return (
    <OSWindow title="Résumé" subtitle="PDF" onClose={onClose}>
      <div className="h-full overflow-y-auto p-[clamp(24px,2.6vw,42px)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className={TYPE.heading} style={{ color: INK.strong }}>{PROFILE.name}</h2>
            <p className={`mt-[8px] ${TYPE.lead}`} style={{ color: INK.body }}>{PROFILE.headline}</p>
          </div>
          <OSButton href={RESUME.pdf}>Download PDF</OSButton>
        </div>

        <Section label="Education">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <b className="text-[16px] font-bold" style={{ color: INK.strong }}>{education.program}</b>
            <span className="tabular text-[12px]" style={{ color: INK.dim }}>{education.detail}</span>
          </div>
          <ul className="mt-[8px] flex flex-col gap-[6px]">
            {education.schools.map((school) => (
              <li key={school.name} className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className={TYPE.body} style={{ color: INK.strong }}>
                  <b className="font-bold">{school.name}</b>
                  <span style={{ color: INK.body }}>, {school.degree}</span>
                </span>
                <span className="text-[12.5px]" style={{ color: INK.dim }}>{school.place}</span>
              </li>
            ))}
          </ul>
          <p className={`mt-[8px] ${TYPE.small}`} style={{ color: INK.body }}>
            <b className="font-bold">Honors:</b> {education.honors}
          </p>
        </Section>

        <Section label="Experience">
          <ul className="flex flex-col gap-[16px]">
            {RESUME.experience.map((role) => <RoleEntry key={role.org} role={role} />)}
          </ul>
        </Section>

        <Section label="Leadership">
          <ul className="flex flex-col gap-[16px]">
            {RESUME.leadership.map((role) => <RoleEntry key={role.org} role={role} />)}
          </ul>
        </Section>

        <Section label="Additional">
          <dl className="flex flex-col gap-[6px]">
            {RESUME.skills.map((group) => (
              <div key={group.label} className={TYPE.small}>
                <dt className="inline font-bold" style={{ color: INK.strong }}>{group.label}: </dt>
                <dd className="inline" style={{ color: INK.body }}>{group.items}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </OSWindow>
  )
}
