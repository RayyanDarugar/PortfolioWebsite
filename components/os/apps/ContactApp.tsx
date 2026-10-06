import { CONTACT } from '@/content/profile'
import { OSWindow } from '../OSWindow'
import { INK, TYPE } from '../chrome'
import type { AppSceneProps } from '../registry'

export function ContactApp({ onClose }: AppSceneProps) {
  return (
    <OSWindow title="Contact" onClose={onClose}>
      <div className="p-[clamp(24px,2.6vw,42px)]">
        <h2 className={TYPE.heading} style={{ color: INK.strong }}>Say hello.</h2>
        <ul className="mt-[22px] flex flex-col">
          {CONTACT.map((link) => {
            const external = link.href.startsWith('http')
            return (
              <li key={link.label} style={{ borderTop: '1px solid rgba(20,26,34,.10)' }}>
                <a
                  href={link.href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="flex items-baseline gap-[14px] py-[12px] hover:underline"
                >
                  <span className="w-[72px] flex-none text-[12.5px] font-bold text-[#9AA4B0]"
                        style={{ fontFamily: 'var(--font-ui)' }}>
                    {link.label}
                  </span>
                  <span className="text-[15px]" style={{ color: INK.strong, fontFamily: 'var(--font-ui)' }}>
                    {link.detail}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </OSWindow>
  )
}
