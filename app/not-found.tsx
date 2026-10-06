import Link from 'next/link'
import { Overlay } from '@/components/overlays/Overlay'

/**
 * A mistyped link. Shown as an overlay over the room, like every other page:
 * a plain 404 under a path the OS reads as an overlay leaves the room inert
 * with nothing to close.
 */
export default function NotFound() {
  return (
    <Overlay label="Not found">
      <div className="flex flex-col items-center gap-[10px] rounded-[14px] px-[28px] py-[22px] text-center text-[#f3e3c4]"
           style={{ background: 'rgba(22,14,9,.85)', border: '1px solid rgba(255,214,140,.22)', fontFamily: 'var(--font-pixel)' }}>
        <h2 className="text-[14px] uppercase tracking-[.24em]">Nothing here</h2>
        <p className="text-[12px] text-[#d9b98a]">That page isn&apos;t in the room.</p>
        <Link href="/" scroll={false} className="text-[12px] underline-offset-2 hover:underline">Back to the room</Link>
      </div>
    </Overlay>
  )
}
