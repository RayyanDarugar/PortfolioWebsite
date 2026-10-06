import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useZoom } from '../useZoom'

describe('useZoom', () => {
  it('starts in the room, at rest, with the laptop hit area measured', () => {
    const { result } = renderHook(() => useZoom(false, false))
    expect(result.current.phase).toBe('room')
    expect(result.current.resting).toBe(true)
    expect(result.current.measured).toBe(true)
    expect(result.current.hit).not.toBeNull()
  })

  it('starts landed when the URL is already inside the laptop', () => {
    const { result } = renderHook(() => useZoom(true, false))
    expect(result.current.phase).toBe('desktop')
    expect(result.current.resting).toBe(false)
  })

  it('cuts straight to the desktop under reduced motion', async () => {
    const { result, rerender } = renderHook(({ zoomed }) => useZoom(zoomed, true), {
      initialProps: { zoomed: false },
    })
    rerender({ zoomed: true })
    await waitFor(() => expect(result.current.phase).toBe('desktop'))
  })

  it('stays in the room until the flight lands, then lands', async () => {
    const { result, rerender } = renderHook(({ zoomed }) => useZoom(zoomed, false), {
      initialProps: { zoomed: false },
    })
    rerender({ zoomed: true })
    expect(result.current.phase).toBe('room')
    await waitFor(() => expect(result.current.phase).toBe('desktop'), { timeout: 4000 })
  })

  it('leaves the desktop the moment the laptop is closed', () => {
    const { result, rerender } = renderHook(({ zoomed }) => useZoom(zoomed, false), {
      initialProps: { zoomed: true },
    })
    rerender({ zoomed: false })
    expect(result.current.phase).toBe('room')
  })

  it('reversing mid-flight never lands', async () => {
    const { result, rerender } = renderHook(({ zoomed }) => useZoom(zoomed, false), {
      initialProps: { zoomed: false },
    })
    rerender({ zoomed: true })
    await new Promise((resolve) => setTimeout(resolve, 200))
    rerender({ zoomed: false })
    await waitFor(() => expect(result.current.resting).toBe(true), { timeout: 4000 })
    expect(result.current.phase).toBe('room')
  })
})
