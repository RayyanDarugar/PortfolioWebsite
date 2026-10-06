import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), usePathname: () => '/places' }))
import { projectPin } from '../project'
import { Globe } from '../Globe'

describe('projectPin', () => {
  it('puts the point the globe faces at its centre, visible', () => {
    const p = projectPin(-117, 32, [117, -32], 160)
    expect(p.x).toBeCloseTo(80, 0)
    expect(p.y).toBeCloseTo(80, 0)
    expect(p.visible).toBe(true)
  })

  it('hides a pin on the far side', () => {
    expect(projectPin(63, -32, [117, -32], 160).visible).toBe(false)
  })
})

describe('Globe', () => {
  it('pins the places that face you, as links to their cards', () => {
    render(<Globe places={[
      { slug: 'san-diego', name: 'San Diego', lat: 32.7, lon: -117.2 },
      { slug: 'hong-kong', name: 'Hong Kong', lat: 22.3, lon: 114.3 },
    ]} />)
    expect(screen.getByRole('link', { name: 'San Diego' }).getAttribute('href')).toBe('/places/san-diego')
    expect(screen.queryByRole('link', { name: 'Hong Kong' })).toBeNull()
  })
})
