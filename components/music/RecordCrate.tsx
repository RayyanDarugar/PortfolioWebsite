'use client'
import Image from 'next/image'
import type { Track } from '@/content/records'
import { useNowPlaying } from './NowPlaying'

const PIXELATED = { imageRendering: 'pixelated' } as const
/** The sleeve's transparent art window, % of record-sleeve.png (512 × 504). */
const WINDOW = { left: '17.8%', top: '15.7%', width: '63.9%', height: '67.7%' }
const PIXEL_TEXT = { fontFamily: 'var(--font-pixel)' }

/**
 * The record player (spec §4): the crate opens into a fan of sleeves with
 * pixel album art; pick one and it goes on the platter and its 30-second
 * preview plays. Playback lives in NowPlaying, so it carries on after this
 * closes.
 */
export function RecordCrate({ records }: { records: readonly Track[] }) {
  const { current, playing, failed, play, toggle } = useNowPlaying()
  const mid = (records.length - 1) / 2

  return (
    <div className="flex w-[min(820px,92vw)] flex-col items-center gap-[22px] text-[#f3e3c4]">
      <h2 className="text-[14px] uppercase tracking-[.24em]" style={PIXEL_TEXT}>Seven records I love</h2>

      <div data-testid="platter" className="flex items-center gap-[18px] rounded-[14px] px-[20px] py-[14px]" style={{ background: 'rgba(22,14,9,.75)', border: '1px solid rgba(255,214,140,.22)' }}>
        <div className="relative h-[120px] w-[120px]">
          <Image src="/ui/vinyl.png" alt="" fill sizes="120px" className={current && playing ? 'vinyl-spin' : ''} style={PIXELATED} />
          {current && (
            <Image src={current.art} alt="" width={40} height={40} className={`absolute left-[40px] top-[40px] h-[40px] w-[40px] rounded-full ${playing ? 'vinyl-spin' : ''}`} style={PIXELATED} />
          )}
        </div>
        <div className="min-w-[200px]" style={PIXEL_TEXT}>
          {current ? (
            <>
              <p className="text-[11px] uppercase tracking-[.16em] text-[#d9b98a]">On the platter</p>
              <p className="mt-[4px] text-[15px]">{current.song}</p>
              <p className="text-[12px] text-[#d9b98a]">{current.artist} · {current.album}</p>
              {failed && <p className="mt-[4px] text-[11px] text-[#ffb08a]">Preview unavailable</p>}
              <div className="mt-[6px] flex items-center gap-[12px]">
                {/* Pause lives here too: the corner chip is under this overlay's backdrop. */}
                <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="rounded-[6px] border border-[rgba(255,214,140,.3)] px-[8px] py-[2px] text-[12px] hover:bg-white/10">
                  {playing ? '❚❚' : '▶'}
                </button>
                <a href={current.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] underline-offset-2 hover:underline">
                  Listen on Apple Music
                </a>
              </div>
            </>
          ) : (
            <p className="text-[12px] text-[#d9b98a]">Pick a record to put it on.</p>
          )}
        </div>
      </div>

      <ul className="flex items-end justify-center" style={{ height: 190 }}>
        {records.map((r, i) => {
          const on = current?.id === r.id
          return (
            <li key={r.id} style={{ marginLeft: i === 0 ? 0 : -34 }}>
              <button
                type="button"
                aria-label={`${r.song}, ${r.artist}`}
                aria-pressed={on}
                onClick={() => play(r)}
                className="relative block h-[150px] w-[152px] origin-bottom transition-transform duration-200 hover:z-10 hover:-translate-y-[16px] focus-visible:z-10 focus-visible:-translate-y-[16px] focus-visible:outline-none"
                style={{ transform: `rotate(${(i - mid) * 6}deg) translateY(${on ? -24 : 0}px)`, zIndex: on ? 20 : undefined }}
              >
                <span className="absolute overflow-hidden bg-[#1f160f]" style={WINDOW}>
                  <Image src={r.art} alt="" fill sizes="100px" style={PIXELATED} />
                </span>
                <Image src="/ui/record-sleeve.png" alt="" fill sizes="152px" className="pointer-events-none" style={PIXELATED} />
              </button>
            </li>
          )
        })}
      </ul>

      <ol className="sr-only">
        {records.map((r) => <li key={r.id}>{r.song} by {r.artist}</li>)}
      </ol>
    </div>
  )
}
