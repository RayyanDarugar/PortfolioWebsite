import { ABOUT } from '@/content/about'
import { OSWindow } from '../OSWindow'
import { INK, TYPE } from '../chrome'
import { Eyebrow } from '../parts'
import type { AppSceneProps } from '../registry'

/** The mission, large, and the story of where it comes from under it. */
export function AboutApp({ onClose }: AppSceneProps) {
  return (
    <OSWindow title="About" subtitle="Mission" onClose={onClose}>
      <div className="h-full overflow-y-auto p-[clamp(28px,3vw,52px)]">
        <Eyebrow>Mission</Eyebrow>
        <h2 className={`mt-[14px] max-w-[18ch] ${TYPE.display}`} style={{ color: INK.strong }}>
          {ABOUT.mission}
        </h2>
        <div className="mt-[clamp(22px,2.4vw,34px)] flex max-w-[60ch] flex-col gap-[14px]">
          {ABOUT.story.map((paragraph) => (
            <p key={paragraph} className={TYPE.lead} style={{ color: INK.body }}>{paragraph}</p>
          ))}
        </div>
      </div>
    </OSWindow>
  )
}
