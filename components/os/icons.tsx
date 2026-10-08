'use client'
import { useId, type ReactNode } from 'react'

/**
 * App icons, in the macOS style: each is a whole tile (a continuous-corner
 * squircle lit from above, with a sheen and a rim) holding one object drawn
 * with depth and a soft shadow. Pure SVG on a 100×100 grid, nothing to load.
 *
 * Every instance takes its own gradient and filter ids (`useId`): the dock and
 * the picker show the same icon at once, and shared ids would let one copy
 * paint with the other's definitions.
 */

/** The macOS icon shape: a squircle, not a rounded rectangle. */
const TILE = 'M50 4C84.5 4 96 15.5 96 50S84.5 96 50 96 4 84.5 4 50 15.5 4 50 4Z'

function useIconId(): string {
  return `i${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/** Gradient stops as [offset, colour] pairs, top to bottom. */
type Stops = readonly (readonly [number, string])[]

function Grad({ id, stops, x2 = 0, y2 = 1 }: { id: string; stops: Stops; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
    </linearGradient>
  )
}

/** The tile: background, sheen and rim around the object. `clip` keeps a
 *  scene (the sunset) inside the tile's shape. */
function Tile({ id, bg, defs, clip = false, children }: { id: string; bg: Stops; defs?: ReactNode; clip?: boolean; children: ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <defs>
        <Grad id={`${id}bg`} stops={bg} />
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".38" />
          <stop offset=".46" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}drop`} x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="2.4" stdDeviation="2.2" floodColor="#000" floodOpacity=".34" />
        </filter>
        <clipPath id={`${id}clip`}><path d={TILE} /></clipPath>
        {defs}
      </defs>
      <path data-icon-tile d={TILE} fill={`url(#${id}bg)`} />
      {clip ? <g clipPath={`url(#${id}clip)`}>{children}</g> : children}
      <path d={TILE} fill={`url(#${id}sheen)`} pointerEvents="none" />
      <path d={TILE} fill="none" stroke="rgba(255,255,255,.42)" strokeWidth=".9" />
      <path d={TILE} fill="none" stroke="rgba(0,0,0,.22)" strokeWidth=".5" transform="translate(50 50) scale(1.006) translate(-50 -50)" />
    </svg>
  )
}

/** Mission Control: four windows spread on a slate desk. */
export function MissionControlIcon() {
  const id = useIconId()
  const wins = [
    { x: 15, y: 20, c: '#3B8CF2' }, { x: 52, y: 20, c: '#FF9F43' },
    { x: 15, y: 53, c: '#34C77B' }, { x: 52, y: 53, c: '#A66CFF' },
  ]
  return (
    <Tile id={id} bg={[[0, '#68738A'], [1, '#222736']]} defs={<Grad id={`${id}w`} stops={[[0, '#FFFFFF'], [1, '#DCE3EC']]} />}>
      {wins.map((w) => (
        <g key={w.c} filter={`url(#${id}drop)`}>
          <rect x={w.x} y={w.y} width="33" height="26" rx="3.6" fill={`url(#${id}w)`} />
          <rect x={w.x} y={w.y} width="33" height="6" rx="3" fill="rgba(20,26,34,.12)" />
          <rect x={w.x + 4} y={w.y + 10} width="25" height="11.5" rx="1.8" fill={w.c} />
        </g>
      ))}
    </Tile>
  )
}

/** Résumé: a sheet with a header and lines, set slightly askew on blue. */
export function ResumeIcon() {
  const id = useIconId()
  return (
    <Tile
      id={id}
      bg={[[0, '#86C2FF'], [1, '#2C6BDF']]}
      defs={(
        <>
          <Grad id={`${id}p`} stops={[[0, '#FFFFFF'], [1, '#E7ECF3']]} />
          <Grad id={`${id}a`} stops={[[0, '#5AA8FF'], [1, '#1F5FD1']]} />
        </>
      )}
    >
      <g transform="rotate(-6 50 50)" filter={`url(#${id}drop)`}>
        <path d="M27 14h36l11 11v61a3 3 0 0 1-3 3H27a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3Z" fill={`url(#${id}p)`} />
        <path d="M63 14v8a3 3 0 0 0 3 3h8Z" fill="#CDD6E2" />
        <circle cx="35.5" cy="28" r="5.5" fill={`url(#${id}a)`} />
        <rect x="44" y="24.5" width="17" height="3.4" rx="1.7" fill="#1C2430" />
        <rect x="44" y="30" width="11" height="2.4" rx="1.2" fill="#9AA6B6" />
        <rect x="30" y="40" width="38" height="2.6" rx="1.3" fill="#2E7FE0" />
        {[46, 51, 56, 63, 68, 73, 78].map((y, i) => (
          <rect key={y} x="30" y={y} width={[38, 34, 29, 38, 31, 36, 22][i]} height="2.2" rx="1.1" fill="#B7C1CE" />
        ))}
      </g>
    </Tile>
  )
}

/** Agent Dynamo: a glossy bolt with a glow behind it. */
export function DynamoIcon() {
  const id = useIconId()
  return (
    <Tile
      id={id}
      bg={[[0, '#FFB44C'], [1, '#E2451B']]}
      defs={(
        <>
          <radialGradient id={`${id}glow`}><stop offset="0" stopColor="#FFF6C8" stopOpacity=".7" /><stop offset="1" stopColor="#FFF6C8" stopOpacity="0" /></radialGradient>
          <Grad id={`${id}b`} stops={[[0, '#FFF8C2'], [0.45, '#FFD43B'], [1, '#FF9A1A']]} x2={0.4} />
        </>
      )}
    >
      <circle cx="50" cy="50" r="34" fill={`url(#${id}glow)`} />
      <path d="M58 11 27 55h19.5l-6 35L73 43H53.5l4.5-32Z" fill={`url(#${id}b)`} stroke="#A9460A" strokeWidth="1.8" strokeLinejoin="round" filter={`url(#${id}drop)`} />
      <path d="M55.5 17.5 33 50.5" stroke="#fff" strokeOpacity=".75" strokeWidth="1.8" strokeLinecap="round" />
    </Tile>
  )
}

/** The TikTok platform: a phone playing something bright. Not TikTok's mark. */
export function TikTokIcon() {
  const id = useIconId()
  return (
    <Tile
      id={id}
      bg={[[0, '#3D4352'], [1, '#0C0E13']]}
      defs={(
        <>
          <Grad id={`${id}body`} stops={[[0, '#F4F6F9'], [1, '#AEB6C2']]} />
          <Grad id={`${id}scr`} stops={[[0, '#FF4F8E'], [0.5, '#7B5CFF'], [1, '#2DE0E6']]} x2={1} />
        </>
      )}
    >
      <g filter={`url(#${id}drop)`}>
        <rect x="29" y="11" width="42" height="78" rx="9" fill={`url(#${id}body)`} />
        <rect x="32.5" y="16" width="35" height="68" rx="5.6" fill={`url(#${id}scr)`} />
        <rect x="44" y="12.8" width="12" height="1.8" rx=".9" fill="#7A828F" />
      </g>
      <path d="M45 39.5v21l17-10.5Z" fill="#fff" />
      <path d="M61.5 70.6c-1.9-1.5-4-3.2-4-5 0-1.2.9-2.1 2-2.1.8 0 1.5.4 2 1.1.5-.7 1.2-1.1 2-1.1 1.1 0 2 .9 2 2.1 0 1.8-2.1 3.5-4 5Z" fill="#fff" />
      {[0, 1, 2].map((i) => <rect key={i} x={36.5 + i * 5} y={77 - i * 3} width="3" height={3 + i * 3} rx="1" fill="#fff" fillOpacity=".85" />)}
    </Tile>
  )
}

/** The News Digest: a folded paper with a masthead, a photo and columns. */
export function DigestIcon() {
  const id = useIconId()
  return (
    <Tile
      id={id}
      bg={[[0, '#FCF7EC'], [1, '#D6C6A6']]}
      defs={(
        <>
          <Grad id={`${id}p`} stops={[[0, '#FFFDF7'], [1, '#EEE6D4']]} />
          <Grad id={`${id}ph`} stops={[[0, '#9CC2E3'], [1, '#4A77A3']]} />
        </>
      )}
    >
      <rect x="25" y="19" width="52" height="64" rx="2" fill="#E2D8C3" transform="rotate(5 51 51)" filter={`url(#${id}drop)`} />
      <g filter={`url(#${id}drop)`}>
        <rect x="23" y="15" width="54" height="66" rx="2.2" fill={`url(#${id}p)`} />
      </g>
      <rect x="28" y="20" width="44" height="8" rx="1" fill="#24201A" />
      <rect x="28" y="30.5" width="44" height=".8" fill="#24201A" />
      <rect x="28" y="34" width="44" height="3.6" rx="1" fill="#3A342B" />
      <rect x="28" y="40" width="30" height="3.6" rx="1" fill="#3A342B" />
      <rect x="28" y="47" width="20" height="17" rx="1" fill={`url(#${id}ph)`} />
      <circle cx="42" cy="52" r="2.6" fill="#FFE29A" />
      <path d="M28 64l7-7 5 5 3-3 5 5v0H28Z" fill="#2F5579" />
      {[47, 51, 55, 59, 63].map((y) => <rect key={y} x="51.5" y={y} width="20.5" height="2" rx="1" fill="#A99F8D" />)}
      {[68, 72, 76].map((y, i) => <rect key={y} x="28" y={y} width={[44, 40, 30][i]} height="2" rx="1" fill="#A99F8D" />)}
    </Tile>
  )
}

/** Experience: a leather briefcase with a brass clasp. */
export function ExperienceIcon() {
  const id = useIconId()
  return (
    <Tile
      id={id}
      bg={[[0, '#6AA8FF'], [1, '#2350C6']]}
      defs={(
        <>
          <Grad id={`${id}l`} stops={[[0, '#D79A5A'], [1, '#7E4C1C']]} />
          <Grad id={`${id}g`} stops={[[0, '#FFEAA8'], [1, '#C4952C']]} />
        </>
      )}
    >
      <path d="M39 31v-5.5a6 6 0 0 1 6-6h10a6 6 0 0 1 6 6V31" fill="none" stroke="#4E2D10" strokeWidth="4.6" />
      <g filter={`url(#${id}drop)`}>
        <rect x="16" y="30" width="68" height="50" rx="8" fill={`url(#${id}l)`} />
      </g>
      <path d="M16 50h68" stroke="#5E3814" strokeWidth="1.6" />
      <rect x="19.5" y="33.5" width="61" height="43" rx="5.5" fill="none" stroke="rgba(255,226,180,.55)" strokeWidth=".9" strokeDasharray="2.2 1.8" />
      <rect x="16" y="30" width="68" height="12" rx="8" fill="#fff" fillOpacity=".16" />
      <rect x="44" y="45" width="12" height="10" rx="2" fill={`url(#${id}g)`} stroke="#7F5E13" strokeWidth=".9" />
      <rect x="48.5" y="49" width="3" height="3" rx=".8" fill="#7F5E13" />
    </Tile>
  )
}

/** Videos: a clapperboard, its sticks open. */
export function VideosIcon() {
  const id = useIconId()
  const stripes = [0, 1, 2, 3, 4]
  return (
    <Tile
      id={id}
      bg={[[0, '#555C6B'], [1, '#14161B']]}
      defs={<Grad id={`${id}b`} stops={[[0, '#3A3E47'], [1, '#121418']]} />}
    >
      <g filter={`url(#${id}drop)`}>
        <rect x="18" y="44" width="64" height="40" rx="4.5" fill={`url(#${id}b)`} />
        <rect x="18" y="44" width="64" height="9" rx="2" fill="#F4F5F7" />
        {stripes.map((i) => <path key={i} d={`M${21 + i * 13} 44h6.5l-5 9H${16 + i * 13}Z`} fill="#1B1D22" />)}
        <g transform="rotate(-14 18 42)">
          <rect x="18" y="31" width="64" height="9" rx="2" fill="#F4F5F7" />
          {stripes.map((i) => <path key={i} d={`M${24 + i * 13} 31h6.5l-5 9H${19 + i * 13}Z`} fill="#1B1D22" />)}
        </g>
        <circle cx="20.5" cy="42.5" r="2.4" fill="#9AA1AD" />
      </g>
      <path d="M45 59v17l14-8.5Z" fill="#fff" fillOpacity=".92" />
    </Tile>
  )
}

/** About: the sun going down over the Pacific. */
export function AboutIcon() {
  const id = useIconId()
  return (
    <Tile
      id={id}
      clip
      bg={[[0, '#FFD37A'], [0.55, '#FF8A4C'], [1, '#C9437A']]}
      defs={(
        <>
          <radialGradient id={`${id}sun`}><stop offset="0" stopColor="#FFFBE2" /><stop offset=".7" stopColor="#FFD25A" /><stop offset="1" stopColor="#FFB23A" /></radialGradient>
          <radialGradient id={`${id}halo`}><stop offset="0" stopColor="#FFF4C4" stopOpacity=".75" /><stop offset="1" stopColor="#FFF4C4" stopOpacity="0" /></radialGradient>
          <Grad id={`${id}sea`} stops={[[0, '#6C8FE0'], [1, '#22357F']]} />
        </>
      )}
    >
      <circle cx="50" cy="60" r="34" fill={`url(#${id}halo)`} />
      <circle cx="50" cy="60" r="19" fill={`url(#${id}sun)`} />
      <rect x="0" y="60" width="100" height="40" fill={`url(#${id}sea)`} />
      <rect x="0" y="60" width="100" height="1.2" fill="#FFE6A8" fillOpacity=".8" />
      {[[36, 65, 28], [40, 70, 20], [44, 75, 12], [47, 80, 6]].map(([x, y, w]) => (
        <rect key={y} x={x} y={y} width={w} height="1.8" rx=".9" fill="#FFD884" fillOpacity=".85" />
      ))}
      <path d="M24 30q3-3 6 0q3-3 6 0M64 22q2.4-2.4 4.8 0q2.4-2.4 4.8 0" fill="none" stroke="#7A3A3A" strokeOpacity=".55" strokeWidth="1.2" strokeLinecap="round" />
    </Tile>
  )
}

/** Contact: a sealed envelope with a stamp. */
export function ContactIcon() {
  const id = useIconId()
  return (
    <Tile
      id={id}
      bg={[[0, '#72D0FF'], [1, '#1C74E6']]}
      defs={(
        <>
          <Grad id={`${id}e`} stops={[[0, '#FFFFFF'], [1, '#DCE5F0']]} />
          <Grad id={`${id}f`} stops={[[0, '#FFFFFF'], [1, '#EEF3F9']]} />
        </>
      )}
    >
      <g filter={`url(#${id}drop)`}>
        <rect x="16" y="28" width="68" height="46" rx="5" fill={`url(#${id}e)`} />
      </g>
      <path d="M17.5 72 42 51M82.5 72 58 51" stroke="#C7D2E0" strokeWidth="1.4" />
      <path d="M17 30.5 50 56l33-25.5" fill={`url(#${id}f)`} stroke="#C2CEDD" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="66" y="33" width="11" height="13" rx="1" fill="#FF5A5F" />
      <rect x="67.4" y="34.4" width="8.2" height="10.2" rx=".6" fill="none" stroke="#fff" strokeWidth=".8" strokeDasharray="1.4 1" />
    </Tile>
  )
}
