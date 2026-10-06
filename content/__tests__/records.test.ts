import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import source from '../records.json'
import { RECORDS } from '../records'

describe('the records', () => {
  it('every record resolved to its own artist, with a preview and an Apple Music link', () => {
    expect(RECORDS.map((r) => r.id)).toEqual(source.map((r) => r.id))
    for (const r of RECORDS) {
      expect(r.previewUrl, r.id).toMatch(/^https:\/\//)
      expect(r.appleMusicUrl, r.id).toMatch(/^https:\/\/music\.apple\.com\//)
      expect(fs.existsSync(path.join(process.cwd(), 'public', r.art)), r.art).toBe(true)
    }
  })
})
