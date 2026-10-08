import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MissionControlIcon } from '../icons'
import { APPS } from '../registry'

describe('app icons', () => {
  // macOS-style: each icon is a whole tile (its own squircle, lit from above),
  // not a glyph laid on a CSS swatch.
  it('draw their own tile, for every app and Mission Control', () => {
    for (const Icon of [...APPS.map((a) => a.Icon), MissionControlIcon]) {
      const { container, unmount } = render(<Icon />)
      expect(container.querySelector('svg [data-icon-tile]')).not.toBeNull()
      unmount()
    }
  })

  // The dock and the picker show the same icon at once; shared gradient ids
  // would let one copy paint with the other's definitions.
  it('keep their gradient ids unique when shown twice', () => {
    const { container } = render(<>{APPS.map((a) => <a.Icon key={`1${a.id}`} />)}{APPS.map((a) => <a.Icon key={`2${a.id}`} />)}</>)
    const ids = [...container.querySelectorAll('[id]')].map((el) => el.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
