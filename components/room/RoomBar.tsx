import Link from 'next/link'
import { pathFor } from '@/components/os/view'

/** The Résumé link, fixed in a corner from the first frame (spec §1, §3). */
export function RoomBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-[clamp(12px,2vw,24px)]">
      <Link
        href={pathFor({ zoomed: true, app: 'resume' })}
        scroll={false}
        className="pointer-events-auto rounded-[8px] px-[14px] py-[8px] text-[12px] uppercase tracking-[.24em] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0802C]"
        style={{ background: 'rgba(246,239,227,.92)', color: '#241B12', fontFamily: 'var(--font-pixel)' }}
      >
        Résumé
      </Link>
    </div>
  )
}
