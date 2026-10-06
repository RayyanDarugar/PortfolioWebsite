'use client'
import Image from 'next/image'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Track } from '@/content/records'

interface NowPlaying {
  current: Track | null
  playing: boolean
  play: (record: Track) => void
  toggle: () => void
  stop: () => void
}

const Ctx = createContext<NowPlaying | null>(null)

export function useNowPlaying(): NowPlaying {
  const value = useContext(Ctx)
  if (!value) throw new Error('useNowPlaying outside NowPlayingProvider')
  return value
}

/**
 * The record player's audio (spec §4). It lives in the root layout, not in the
 * /music overlay, so a preview keeps playing while you explore and the chip
 * stays in the corner. Playback only ever starts from a click.
 */
export function NowPlayingProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [current, setCurrent] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)

  const play = useCallback((record: Track) => {
    const el = audio.current
    if (!el) return
    if (el.getAttribute('src') !== record.previewUrl) el.src = record.previewUrl
    setCurrent(record)
    Promise.resolve(el.play()).then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [])

  const toggle = useCallback(() => {
    const el = audio.current
    if (!el || !current) return
    if (playing) { el.pause(); setPlaying(false) }
    else Promise.resolve(el.play()).then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [current, playing])

  const stop = useCallback(() => {
    audio.current?.pause()
    setPlaying(false)
    setCurrent(null)
  }, [])

  const value = useMemo(() => ({ current, playing, play, toggle, stop }), [current, playing, play, toggle, stop])

  return (
    <Ctx.Provider value={value}>
      {children}
      <audio ref={audio} preload="none" onEnded={() => setPlaying(false)} />
      {current && (
        <section
          aria-label="Now playing"
          className="fixed bottom-[16px] left-[16px] z-[95] flex items-center gap-[10px] rounded-[12px] py-[8px] pl-[8px] pr-[12px] text-[#f3e3c4]"
          style={{ background: 'rgba(22,14,9,.82)', border: '1px solid rgba(255,214,140,.25)', fontFamily: 'var(--font-pixel)' }}
        >
          <Image src={current.art} alt="" width={40} height={40} className={playing ? 'vinyl-spin rounded-full' : 'rounded-full'} style={{ imageRendering: 'pixelated' }} />
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-[.16em] text-[#d9b98a]">Now playing</span>
            <span className="block max-w-[220px] truncate text-[12px]">{current.song} · {current.artist}</span>
            <a href={current.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] underline-offset-2 hover:underline">
              Listen on Apple Music
            </a>
          </span>
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="ml-[4px] rounded-[6px] px-[8px] py-[4px] text-[12px] hover:bg-white/10">
            {playing ? '❚❚' : '▶'}
          </button>
          <button type="button" onClick={stop} aria-label="Stop" className="rounded-[6px] px-[6px] py-[4px] text-[12px] hover:bg-white/10">×</button>
        </section>
      )}
    </Ctx.Provider>
  )
}
