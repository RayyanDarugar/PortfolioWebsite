// Paints the school lettering onto the pennants in the master and in its day
// and night relights, without touching any other pixel.
//
// The lettering came from a GPT Image edit of a crop around the flags
// (docs/mockups/masters/flags-letter-2.png). That edit redrew the whole crop,
// so it is aligned to the original crop and pasted back only inside the flags
// matte. The relights get the same pennants, relit: each pixel is scaled by
// the ratio of that relight's own (blurred) pennant colour to the master's, so
// the lettering picks up the day or night light the rest of that room has.
//
// Usage: node scripts/art/letter-flags.mjs
// Writes docs/mockups/masters/{master,day,night}-lettered.png, the inputs
// cut-room.mjs uses.

import sharp from 'sharp'

const DIR = 'docs/mockups/masters'
const CROP = { left: 100, top: 0, width: 950, height: 407 } // where the edit's crop came from
const EDIT = `${DIR}/flags-letter-2.png`
const MATTE = `${DIR}/mattes/flags.png` // its top-left sits at 0,0 in the master
const SOURCES = { master: `${DIR}/a3-dog-board-1.png`, day: `${DIR}/day-1.png`, night: `${DIR}/night-1.png` }
/** The relights are realigned to the master by cut-room.mjs, not here; this
 *  is their offset, so the pennants land on their own pixels. */
const OFFSET = { master: [0, 0], day: [1, -2], night: [1, -2] }
const ERODE = 3 // keep the original outline: paste only well inside the pennants
const BLUR = 8 // px, how far the relight ratio is smoothed

async function raw(input, w, h) {
  return sharp(input).resize(w, h, { fit: 'fill' }).removeAlpha().raw().toBuffer()
}

const W = 2688, H = 1152

async function main() {
  // The matte, eroded.
  const m = await sharp(MATTE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let mask = new Uint8Array(W * H)
  for (let y = 0; y < m.info.height; y++) for (let x = 0; x < m.info.width; x++) {
    if (m.data[(y * m.info.width + x) * 4 + 3] >= 128) mask[y * W + x] = 1
  }
  for (let k = 0; k < ERODE; k++) {
    const next = new Uint8Array(mask)
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      if (mask[i] && !(mask[i - 1] && mask[i + 1] && mask[i - W] && mask[i + W])) next[i] = 0
    }
    mask = next
  }

  // The edit, at crop size, aligned to the original crop on the pennants' edges.
  const master = await raw(SOURCES.master, W, H)
  const edit = await raw(EDIT, CROP.width, CROP.height)
  const edge = (d, w, i) => Math.abs(d[i * 3] - d[(i + 1) * 3]) + Math.abs(d[i * 3] - d[(i + w) * 3])
  let best = { e: Infinity, dx: 0, dy: 0 }
  for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
    let s = 0, n = 0
    for (let y = 10; y < 270; y += 2) for (let x = CROP.left + 10; x < CROP.left + CROP.width - 10; x += 2) {
      const ex = x - CROP.left + dx, ey = y - CROP.top + dy
      if (ex < 1 || ey < 1 || ex >= CROP.width - 1 || ey >= CROP.height - 1) continue
      s += Math.abs(edge(master, W, y * W + x) - edge(edit, CROP.width, ey * CROP.width + ex)); n++
    }
    if (s / n < best.e) best = { e: s / n, dx, dy }
  }
  console.log(`edit aligned by ${best.dx},${best.dy}`)
  const lettered = (x, y, c) => {
    const ex = Math.min(CROP.width - 1, Math.max(0, x - CROP.left + best.dx))
    const ey = Math.min(CROP.height - 1, Math.max(0, y - CROP.top + best.dy))
    return edit[(ey * CROP.width + ex) * 3 + c]
  }

  const masterBlur = await sharp(master, { raw: { width: W, height: H, channels: 3 } }).blur(BLUR).raw().toBuffer()
  for (const [name, file] of Object.entries(SOURCES)) {
    const img = await raw(file, W, H)
    const blur = await sharp(img, { raw: { width: W, height: H, channels: 3 } }).blur(BLUR).raw().toBuffer()
    const [ox, oy] = OFFSET[name]
    let painted = 0
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue
      // This pixel of the pennant, in this image's own coordinates.
      const tx = x - ox, ty = y - oy
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue
      const t = (ty * W + tx) * 3, mi = (y * W + x) * 3
      // Half per-channel, half brightness-only: per-channel alone carries the
      // night's blue cast, but on a navy pennant it also tints gold letters green.
      const lum = (d, i) => 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2] + 4
      const lumRatio = lum(blur, t) / lum(masterBlur, mi)
      for (let c = 0; c < 3; c++) {
        const chanRatio = (blur[t + c] + 4) / (masterBlur[mi + c] + 4)
        const ratio = name === 'master' ? 1 : 0.5 * chanRatio + 0.5 * lumRatio
        img[t + c] = Math.max(0, Math.min(255, Math.round(lettered(x, y, c) * ratio)))
      }
      painted++
    }
    await sharp(img, { raw: { width: W, height: H, channels: 3 } }).png().toFile(`${DIR}/${name}-lettered.png`)
    console.log(`${name.padEnd(7)} ${painted} pennant pixels lettered`)
  }
}

main()
