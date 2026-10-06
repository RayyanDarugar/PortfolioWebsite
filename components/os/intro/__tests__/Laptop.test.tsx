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
  hit: null,
  scene: 'none',
  clip: 'none',
  camera: 'none',
  pixelScreen: 'none',
  pixelOpacity: 1,
  roomUi: 1,
  sceneBox: { width: 100, height: 100 },
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
})
