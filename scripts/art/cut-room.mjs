// Splits the master room into an empty base layer and one sprite per
// interactive object (spec §6 steps 2–3).
//
// The base is the master, pixel for pixel, everywhere outside the objects, so
// the room at rest is exactly the approved picture with nothing to seam. Under
// each object, the hole is filled from an "empty room" edit, aligned locally
// and blended so its border matches the master (a seamless clone). That fill
// only shows when an object moves away in an interaction.
//
// Sprites take the master's own pixels inside each object's outline. Outlines
// come from background removal run on crops of the master (mattes in
// docs/mockups/masters/mattes/), or are plain rectangles for framed and
// rectangular things.
//
// Usage: node scripts/art/cut-room.mjs
// Writes public/room/sunset.png (the master), base.png and sprites/<id>.png,
// public/room/<variant>.png and sprites/<id>.<variant>.png (day, night), and
// public/room/sprites.json (positions in master pixels; list order is draw order).

import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

const MASTER = 'docs/mockups/masters/master-lettered.png' // a3-dog-board-1.png + letter-flags.mjs
const EMPTY = 'docs/mockups/masters/empty-4-flux.png'
const MATTES = 'docs/mockups/masters/mattes'
const OUT = 'public/room'
/** Whole-room lighting variants of the master (spec §3 window time of day).
 *  They are full edits, so each is realigned to the master and gets its own
 *  sprites cut with the master's outlines. Their base layers are not built:
 *  at rest a variant is its full image, and the base only matters once an
 *  object moves (phase 4). */
const VARIANTS = {
  day: 'docs/mockups/masters/day-lettered.png',
  night: 'docs/mockups/masters/night-lettered.png',
}

/**
 * `matte`: outline from MATTES/<id>.png, whose top-left sits at `at`.
 * `rect`: the rectangle [x0, y0, x1, y1] is the outline.
 * `stays`: drawn in the base as well; the sprite exists only for the hover glow.
 */
const OBJECTS = [
  { id: 'window', rect: [2278, 0, 2688, 852], stays: true },
  { id: 'bookshelf', rect: [1606, 0, 1990, 1060], stays: true },
  { id: 'flags', matte: true, at: [0, 0] },
  { id: 'photo-dog', rect: [336, 263, 514, 399] },
  { id: 'photo-beach', rect: [336, 421, 515, 565] },
  { id: 'whiteboard', rect: [792, 241, 1433, 620] },
  { id: 'surfboard', matte: true, at: [12, 250] },
  { id: 'record-player', matte: true, at: [222, 588] },
  { id: 'laptop', matte: true, at: [890, 556] },
  { id: 'journal', matte: true, at: [1324, 656] },
  { id: 'globe', matte: true, at: [2064, 510] },
]


/** Px each matte is grown by: the matte stops short of the drawn outline, and
 *  a hole that leaves the outline behind blends it inward as a dark smear. The
 *  sprite grows with it, so base + sprites still rebuild the master exactly. */
const GROW = 4

function grow(mask, W, H, r) {
  const out = new Uint8Array(mask.length)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mask[y * W + x]) continue
    for (let yy = Math.max(0, y - r); yy <= Math.min(H - 1, y + r); yy++)
      out.fill(1, yy * W + Math.max(0, x - r), yy * W + Math.min(W, x + r + 1))
  }
  return out
}

async function rgb(file, w, h) {
  const { data } = await sharp(file).resize(w, h, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return data
}

async function outline(obj, W, H) {
  const mask = new Uint8Array(W * H)
  if (obj.rect) {
    const [x0, y0, x1, y1] = obj.rect
    for (let y = y0; y < y1; y++) mask.fill(1, y * W + x0, y * W + x1)
    return mask
  }
  const { data, info } = await sharp(`${MATTES}/${obj.id}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const [ax, ay] = obj.at
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] >= 128) {
      const gx = ax + x, gy = ay + y
      if (gx < W && gy < H) mask[gy * W + gx] = 1
    }
  }
  return mask
}

function bounds(mask, W, H) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
  }
  return [x0, y0, x1 + 1, y1 + 1]
}

/**
 * Solves Laplace's equation for the correction field on `inside` cells, with
 * every other cell fixed, coarse to fine so large holes converge: a hole a few
 * hundred pixels across needs far more plain Jacobi sweeps than is practical.
 */
function relax(corr, inside, w, h) {
  let prev = null
  for (const f of [16, 8, 4, 2, 1]) {
    const lw = Math.ceil(w / f), lh = Math.ceil(h / f)
    const val = new Float32Array(lw * lh * 3), free = new Uint8Array(lw * lh)
    for (let Y = 0; Y < lh; Y++) for (let X = 0; X < lw; X++) {
      let fixedN = 0, insideN = 0; const sum = [0, 0, 0]
      for (let y = Y * f; y < Math.min(h, (Y + 1) * f); y++) for (let x = X * f; x < Math.min(w, (X + 1) * f); x++) {
        const li = y * w + x
        if (inside[li]) insideN++
        else { fixedN++; for (let c = 0; c < 3; c++) sum[c] += corr[li * 3 + c] }
      }
      const L = Y * lw + X
      if (fixedN > 0 && (f === 1 || fixedN >= insideN)) for (let c = 0; c < 3; c++) val[L * 3 + c] = sum[c] / fixedN
      else {
        free[L] = 1
        if (prev) {
          const P = (Math.min(prev.lh - 1, Y >> 1)) * prev.lw + Math.min(prev.lw - 1, X >> 1)
          for (let c = 0; c < 3; c++) val[L * 3 + c] = prev.val[P * 3 + c]
        }
      }
    }
    for (let it = 0; it < 400; it++) {
      for (let Y = 0; Y < lh; Y++) for (let X = 0; X < lw; X++) {
        const L = Y * lw + X
        if (!free[L]) continue
        const l = X > 0 ? L - 1 : L, r = X < lw - 1 ? L + 1 : L, u = Y > 0 ? L - lw : L, d = Y < lh - 1 ? L + lw : L
        for (let c = 0; c < 3; c++) val[L * 3 + c] = (val[l * 3 + c] + val[r * 3 + c] + val[u * 3 + c] + val[d * 3 + c]) / 4
      }
    }
    prev = { val, lw, lh }
  }
  for (let li = 0; li < w * h; li++) if (inside[li]) for (let c = 0; c < 3; c++) corr[li * 3 + c] = prev.val[li * 3 + c]
}

/**
 * Fills `hole` in `base` from the empty edit, seamlessly: patch + a smooth
 * correction that equals (master − patch) all round the hole's border. The
 * empty edit is globally aligned with the master (measured at 0–2 px), so no
 * local shift is searched: on a plain wall a search only finds false matches.
 */
function fillHole(base, empty, hole, W, H) {
  const [hx0, hy0, hx1, hy1] = bounds(hole, W, H)
  const X0 = Math.max(0, hx0 - 2), Y0 = Math.max(0, hy0 - 2), X1 = Math.min(W, hx1 + 2), Y1 = Math.min(H, hy1 + 2)
  const w = X1 - X0, h = Y1 - Y0
  const patch = new Float32Array(w * h * 3), corr = new Float32Array(w * h * 3), inside = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const g = (Y0 + y) * W + (X0 + x), li = y * w + x
    for (let c = 0; c < 3; c++) {
      patch[li * 3 + c] = empty[g * 3 + c]
      corr[li * 3 + c] = base[g * 3 + c] - empty[g * 3 + c]
    }
    inside[li] = hole[g]
  }
  relax(corr, inside, w, h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const li = y * w + x
    if (!inside[li]) continue
    const g = ((Y0 + y) * W + (X0 + x)) * 3
    for (let c = 0; c < 3; c++) base[g + c] = Math.max(0, Math.min(255, Math.round(patch[li * 3 + c] + corr[li * 3 + c])))
  }
}

/** The whole-pixel shift of `img` that best matches `ref` (edges, sampled). */
function globalShift(ref, img, W, H) {
  const edge = (d, i) => Math.abs(d[i * 3] - d[(i + 1) * 3]) + Math.abs(d[i * 3] - d[(i + W) * 3])
  let best = { e: Infinity, dx: 0, dy: 0 }
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
    let s = 0, n = 0
    for (let y = 8; y < H - 8; y += 3) for (let x = 8; x < W - 8; x += 3) {
      s += Math.abs(edge(ref, y * W + x) - edge(img, (y + dy) * W + (x + dx))); n++
    }
    if (s / n < best.e) best = { e: s / n, dx, dy }
  }
  return best
}

function shifted(img, W, H, dx, dy) {
  const out = Buffer.alloc(img.length)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = Math.min(W - 1, Math.max(0, x + dx)), sy = Math.min(H - 1, Math.max(0, y + dy))
    const a = (y * W + x) * 3, b = (sy * W + sx) * 3
    out[a] = img[b]; out[a + 1] = img[b + 1]; out[a + 2] = img[b + 2]
  }
  return out
}

async function cutSprite(src, mask, W, [x0, y0, x1, y1], file) {
  const w = x1 - x0, h = y1 - y0
  const rgba = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const g = (y0 + y) * W + (x0 + x), o = (y * w + x) * 4
    rgba[o] = src[g * 3]; rgba[o + 1] = src[g * 3 + 1]; rgba[o + 2] = src[g * 3 + 2]
    rgba[o + 3] = mask[g] ? 255 : 0
  }
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toFile(file)
}

async function main() {
  const { width: W, height: H } = await sharp(MASTER).metadata()
  const master = await rgb(MASTER, W, H)
  const empty = await rgb(EMPTY, W, H)
  const base = Buffer.from(master)
  mkdirSync(`${OUT}/sprites`, { recursive: true })
  const variants = {}
  for (const [name, file] of Object.entries(VARIANTS)) {
    const raw = await rgb(file, W, H)
    const s = globalShift(master, raw, W, H)
    variants[name] = shifted(raw, W, H, s.dx, s.dy)
    await sharp(variants[name], { raw: { width: W, height: H, channels: 3 } }).png().toFile(`${OUT}/${name}.png`)
    console.log(`${name.padEnd(14)} realigned by ${s.dx},${s.dy}`)
  }
  const manifest = { width: W, height: H, sprites: [] }

  for (const obj of OBJECTS) {
    let mask = await outline(obj, W, H)
    if (obj.matte) mask = grow(mask, W, H, GROW)
    const [x0, y0, x1, y1] = bounds(mask, W, H)
    const w = x1 - x0, h = y1 - y0
    await cutSprite(master, mask, W, [x0, y0, x1, y1], `${OUT}/sprites/${obj.id}.png`)
    for (const [name, img] of Object.entries(variants)) {
      await cutSprite(img, mask, W, [x0, y0, x1, y1], `${OUT}/sprites/${obj.id}.${name}.png`)
    }
    manifest.sprites.push({ id: obj.id, x: x0, y: y0, w, h })

    let note = 'stays in base'
    if (!obj.stays) {
      fillHole(base, empty, mask, W, H)
      note = 'hole filled'
    }
    console.log(`${obj.id.padEnd(14)} ${w}x${h} at ${x0},${y0}  ${note}`)
  }

  await sharp(base, { raw: { width: W, height: H, channels: 3 } }).png().toFile(`${OUT}/base.png`)
  // The flattened room, for anything that draws the room as one picture.
  await sharp(master, { raw: { width: W, height: H, channels: 3 } }).png().toFile(`${OUT}/sunset.png`)
  writeFileSync(`${OUT}/sprites.json`, JSON.stringify(manifest, null, 2) + '\n')

  // Check: base + sprites in draw order must rebuild the master exactly.
  const rebuilt = await sharp(`${OUT}/base.png`)
    .composite(manifest.sprites.map((s) => ({ input: `${OUT}/sprites/${s.id}.png`, left: s.x, top: s.y })))
    .removeAlpha().raw().toBuffer()
  let off = 0
  for (let i = 0; i < rebuilt.length; i++) if (rebuilt[i] !== master[i]) off++
  console.log(`rebuild: ${off} of ${rebuilt.length} channel values differ from the master (${(100 * off / rebuilt.length).toFixed(3)}%)`)
}

main()
