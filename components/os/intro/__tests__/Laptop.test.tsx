import { describe, it, expect } from 'vitest'
import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { Laptop } from '../Laptop'
import type { Zoom } from '../useZoom'

/** Plain strings stand in for motion values: jsdom never animates them, and
 *  what is under test is which branch renders. */
const stub = {
  phase: 'room',
  resting: true,
  measured: true,
  scene: 'none',
  clip: 'none',
  camera: 'none',
  pixelScreen: 'none',
  pixelOpacity: 1,
  roomUi: 1,
  sceneBox: { width: 100, height: 100 },
  rest: { x: 0, y: 0, w: 100, h: 50 },
  roomX: 0,
} as unknown as Zoom

describe('Laptop', () => {
  it('renders the desktop once landed', () => {
    render(<Laptop zoom={stub} inert={false} live><p>desk</p></Laptop>)
    expect(screen.getByText('desk')).toBeTruthy()
  })

  it('before measuring, hides the desktop', () => {
    const unmeasured = { ...stub, measured: false } as Zoom
    render(<Laptop zoom={unmeasured} inert live={false}><p>desk</p></Laptop>)
    expect(screen.getByText('desk').closest('.invisible')).not.toBeNull()
  })

  // The desktop must survive hydration, landing and take-off: a remount drops
  // its state and makes a window pop in instead of springing from the dock.
  it('keeps the desktop mounted across every branch', () => {
    let mounts = 0
    function Desk() {
      useEffect(() => { mounts += 1 }, [])
      return <p>desk</p>
    }
    const unmeasured = { ...stub, measured: false } as Zoom
    const { rerender } = render(<Laptop zoom={unmeasured} inert live={false}><Desk /></Laptop>)
    rerender(<Laptop zoom={stub} inert live={false}><Desk /></Laptop>)
    rerender(<Laptop zoom={stub} inert={false} live><Desk /></Laptop>)
    rerender(<Laptop zoom={stub} inert live={false}><Desk /></Laptop>)
    expect(mounts).toBe(1)
  })

  // The pan must move the room inside a still clipping window. Panning the
  // clipping layer itself slides the window along and opens a gap at the edge.
  it('pans inside a clip that stays put', () => {
    const panned = { ...stub, roomX: 40 } as unknown as Zoom
    const { container } = render(<Laptop zoom={panned} inert live={false}><p>desk</p></Laptop>)
    const mover = [...container.querySelectorAll<HTMLElement>('*')].find((el) => el.style.transform.includes('translateX(40px)'))
    expect(mover).toBeTruthy()
    expect(mover!.classList.contains('overflow-hidden')).toBe(false)
    expect(mover!.parentElement!.classList.contains('overflow-hidden')).toBe(true)
    expect(mover!.parentElement!.style.transform).toBe('')
  })

  // The desktop is pasted over the laptop's screen. Until it has landed it must
  // not take the pointer, or the screen (the room's biggest target) is dead.
  it('lets the pointer through the screen until landed', () => {
    const { rerender } = render(<Laptop zoom={stub} inert live={false}><p>desk</p></Laptop>)
    const layer = screen.getByText('desk').parentElement!.parentElement!
    expect(layer.style.pointerEvents).toBe('none')
    rerender(<Laptop zoom={stub} inert={false} live><p>desk</p></Laptop>)
    expect(layer.style.pointerEvents).not.toBe('none')
  })

  // The room's h1 must be in the HTML whatever the URL, including /work/*.
  it('draws the room in every state, hidden once landed', () => {
    const { rerender } = render(<Laptop zoom={stub} inert live={false} room={<h1>room</h1>}><p>desk</p></Laptop>)
    expect(screen.getByRole('heading', { name: 'room' })).toBeTruthy()
    rerender(<Laptop zoom={stub} inert={false} live room={<h1>room</h1>}><p>desk</p></Laptop>)
    expect(screen.getByText('room').closest('[style*="hidden"]')).not.toBeNull()
  })
})
