import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PROFILE } from '@/content/profile'
import { ROOM_OBJECTS } from '@/content/room'
import { RoomScene } from '../RoomScene'
import { WhiteboardIntro } from '../WhiteboardIntro'

const litIds = (container: HTMLElement) =>
  [...container.querySelectorAll('img[data-lit="true"]')].map((img) => img.getAttribute('data-sprite'))

describe('RoomScene', () => {
  it('gives every object a named button', () => {
    render(<RoomScene lit={[]} disabled={false} onActivate={() => {}} />)
    for (const o of ROOM_OBJECTS) {
      expect(screen.getByRole('button', { name: `${o.label}: ${o.hint}` })).toBeTruthy()
    }
  })

  it('lights an object and names it while it has focus', () => {
    const { container } = render(<RoomScene lit={[]} disabled={false} onActivate={() => {}} />)
    fireEvent.focus(screen.getByRole('button', { name: /^Globe:/ }))
    expect(litIds(container)).toEqual(['globe'])
    expect(screen.getByRole('tooltip').textContent).toBe('Globe')
  })

  it('opens an object from its button', () => {
    const onActivate = vi.fn()
    render(<RoomScene lit={[]} disabled={false} onActivate={onActivate} />)
    fireEvent.click(screen.getByRole('button', { name: /^Laptop:/ }))
    expect(onActivate).toHaveBeenCalledWith('laptop')
  })

  it('lights what it is told to', () => {
    const { container } = render(<RoomScene lit={['photo-dog', 'photo-beach']} disabled={false} onActivate={() => {}} />)
    expect(litIds(container).sort()).toEqual(['photo-beach', 'photo-dog'])
  })

  it('takes no input and lights nothing while disabled', () => {
    const { container } = render(<RoomScene lit={['laptop']} disabled onActivate={() => {}} />)
    expect(litIds(container)).toEqual([])
    expect(container.firstElementChild?.hasAttribute('inert')).toBe(true)
  })
})

describe('WhiteboardIntro', () => {
  it('is the h1, and says who this is', () => {
    render(<WhiteboardIntro />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(PROFILE.name)
  })
})

describe('RoomScene at night', () => {
  it('draws the night art', () => {
    const { container } = render(<RoomScene lit={[]} disabled={false} onActivate={() => {}} variant="night" />)
    const srcs = [...container.querySelectorAll('img')].map((i) => decodeURIComponent(i.getAttribute('src') ?? ''))
    expect(srcs.some((s) => s.includes('/room/night.png'))).toBe(true)
    expect(srcs.some((s) => s.includes('/room/sprites/laptop.night.png'))).toBe(true)
  })
})
