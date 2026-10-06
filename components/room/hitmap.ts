/**
 * Which object is under the pointer. The room's objects are irregular and
 * overlap (the laptop lid stands in front of the whiteboard), so bounding
 * boxes are wrong. `public/room/hitmap.png` is the art at quarter scale with
 * each pixel's red channel holding the topmost object's index + 1, written by
 * `scripts/art/cut-room.mjs` from the same outlines as the sprites.
 */

export interface HitMap {
  w: number
  h: number
  /** One byte per cell: 0 for none, i + 1 for sprite i of `sprites.json`. */
  data: Uint8Array
}

export const HIT_SCALE = 4

/** The sprite index at art pixel (u, v), or −1. */
export function hitAt(map: HitMap, u: number, v: number): number {
  const x = Math.floor(u / HIT_SCALE)
  const y = Math.floor(v / HIT_SCALE)
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return -1
  return map.data[y * map.w + x] - 1
}

/** Decodes the hit map in the browser. Rejects where there is no 2D canvas
 *  (jsdom), and the room then simply has no pointer hover. */
export async function loadHitMap(src: string): Promise<HitMap> {
  const img = new Image()
  img.src = src
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('no 2d canvas')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0)
  const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const data = new Uint8Array(canvas.width * canvas.height)
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4]
  return { w: canvas.width, h: canvas.height, data }
}
