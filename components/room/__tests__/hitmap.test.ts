import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import path from 'node:path'
import sprites from '@/public/room/sprites.json'
import { HIT_SCALE, hitAt, type HitMap } from '../hitmap'

const index = (id: string) => sprites.sprites.findIndex((s) => s.id === id)

async function realMap(): Promise<HitMap> {
  const { data, info } = await sharp(path.join(process.cwd(), 'public/room/hitmap.png'))
    .removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = new Uint8Array(info.width * info.height)
  for (let i = 0; i < out.length; i++) out[i] = data[i * 3]
  return { w: info.width, h: info.height, data: out }
}

describe('hitAt', () => {
  const map: HitMap = { w: 2, h: 1, data: new Uint8Array([0, 3]) }

  it('reads the cell under an art pixel', () => {
    expect(hitAt(map, 0, 0)).toBe(-1)
    expect(hitAt(map, HIT_SCALE, 0)).toBe(2)
    expect(hitAt(map, HIT_SCALE * 2 - 0.5, HIT_SCALE - 0.5)).toBe(2)
  })

  it('is −1 off the map', () => {
    expect(hitAt(map, -1, 0)).toBe(-1)
    expect(hitAt(map, 0, HIT_SCALE)).toBe(-1)
    expect(hitAt(map, HIT_SCALE * 2, 0)).toBe(-1)
  })
})

describe('the room hit map', () => {
  it('is the art at quarter scale', async () => {
    const map = await realMap()
    expect([map.w, map.h]).toEqual([sprites.width / HIT_SCALE, sprites.height / HIT_SCALE])
  })

  it('finds objects where they are drawn, and nothing on bare wall', async () => {
    const map = await realMap()
    expect(hitAt(map, 1091, 657)).toBe(index('laptop')) // screen centre
    expect(hitAt(map, 2480, 400)).toBe(index('window'))
    expect(hitAt(map, 1800, 500)).toBe(index('bookshelf'))
    expect(hitAt(map, 650, 500)).toBe(-1) // wall between the photos and the whiteboard
  })

  it('the laptop lid wins over the whiteboard behind it', async () => {
    const map = await realMap()
    expect(hitAt(map, 1000, 600)).toBe(index('laptop'))
    expect(hitAt(map, 850, 600)).toBe(index('whiteboard'))
  })
})
