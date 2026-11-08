/**
 * Re-encode the site's art as WebP, in place, and delete the PNGs.
 *
 * The site is a static export on GitHub Pages, so there is no image optimizer
 * between these files and the visitor: what is in public/ is what they
 * download. The art is painted (hundreds of thousands of colours), not true
 * pixel art, so lossy WebP at q90 is visually identical and ~10–17x smaller.
 *
 * Run after `scripts/art/cut-room.mjs` (which writes PNGs) or after adding any
 * art:  node scripts/art/to-webp.mjs
 *
 * Kept as PNG on purpose:
 *  - room/hitmap.png: its red channel is data (object index per pixel), and
 *    lossy encoding would corrupt it.
 *  - records/: small album covers written by scripts/content/resolve-records.mjs.
 */
import { mkdir, readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const PUBLIC = path.join(process.cwd(), 'public')
const DIRS = ['room', 'room/sprites', 'ui', 'hero', 'wallpaper']
const KEEP = new Set(['room/hitmap.png'])
const WEBP = { quality: 90, alphaQuality: 100, smartSubsample: true, effort: 6 }

let before = 0
let after = 0

for (const dir of DIRS) {
  for (const name of await readdir(path.join(PUBLIC, dir))) {
    const rel = `${dir}/${name}`
    if (!/\.(png|jpe?g)$/i.test(name) || KEEP.has(rel)) continue
    const src = path.join(PUBLIC, rel)
    const out = src.replace(/\.(png|jpe?g)$/i, '.webp')
    before += (await stat(src)).size
    const info = await sharp(src).webp(WEBP).toFile(out)
    after += info.size
    await unlink(src)
    console.log(`${rel} -> ${path.basename(out)} (${Math.round(info.size / 1024)} KB)`)
  }
}

// The blurred room behind the letterbox bands is drawn at 26px blur, so a
// small copy of the base art looks identical and costs a few KB.
const backdrop = await sharp(path.join(PUBLIC, 'room/base.webp'))
  .resize({ width: 640 })
  .webp({ quality: 70 })
  .toFile(path.join(PUBLIC, 'room/backdrop.webp'))
after += backdrop.size

// The hotbar draws each object at 36px; full sprites there would cost up to
// ~90 KB each. 108px covers a 3x screen.
await mkdir(path.join(PUBLIC, 'room/icons'), { recursive: true })
for (const name of await readdir(path.join(PUBLIC, 'room/sprites'))) {
  if (!/^[a-z-]+\.webp$/.test(name)) continue // the sunset sprite only, not .day/.night
  const icon = await sharp(path.join(PUBLIC, 'room/sprites', name))
    .resize({ width: 108, height: 108, fit: 'inside' })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(PUBLIC, 'room/icons', name))
  after += icon.size
}

console.log(`\n${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`)
