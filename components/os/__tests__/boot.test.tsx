import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { BOOT_KEY, BOOT_MS, hasBooted, markBooted, useBoot } from '../boot/session'
import { Boot } from '../boot/Boot'

beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('useBoot', () => {
  it('boots when the camera lands from the room on the picker', () => {
    const { result, rerender } = renderHook(({ landed, app }) => useBoot(landed, app), { initialProps: { landed: false, app: null as string | null } })
    expect(result.current.booting).toBe(false)
    rerender({ landed: true, app: null })
    expect(result.current.booting).toBe(true)
    expect(sessionStorage.getItem(BOOT_KEY)).toBe('1')
  })

  it('only once per session', () => {
    markBooted()
    const { result, rerender } = renderHook(({ landed }) => useBoot(landed, null), { initialProps: { landed: false } })
    rerender({ landed: true })
    expect(result.current.booting).toBe(false)
  })

  it('never on a deep link, or a cold load already on the laptop', () => {
    const deep = renderHook(({ landed }) => useBoot(landed, 'resume'), { initialProps: { landed: false } })
    deep.rerender({ landed: true })
    expect(deep.result.current.booting).toBe(false)
    const cold = renderHook(() => useBoot(true, null))
    expect(cold.result.current.booting).toBe(false)
  })

  it('plays when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(hasBooted()).toBe(false)
    expect(() => markBooted()).not.toThrow()
    const { result, rerender } = renderHook(({ landed }) => useBoot(landed, null), { initialProps: { landed: false } })
    rerender({ landed: true })
    expect(result.current.booting).toBe(true)
  })
})

describe('Boot', () => {
  it('shows the monogram and a progress bar, then finishes on its own', () => {
    const onDone = vi.fn()
    render(<Boot reduced={false} onDone={onDone} />)
    expect(screen.getByRole('img', { name: 'RD' })).toBeTruthy()
    expect(screen.getByRole('progressbar')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(BOOT_MS) })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('a click skips it', () => {
    const onDone = vi.fn()
    render(<Boot reduced={false} onDone={onDone} />)
    fireEvent.click(screen.getByTestId('boot'))
    expect(onDone).toHaveBeenCalled()
  })

  it('Esc skips the boot without reaching the OS', () => {
    const onDone = vi.fn()
    const os = vi.fn((e: KeyboardEvent) => e.defaultPrevented)
    window.addEventListener('keydown', os)
    render(<Boot reduced={false} onDone={onDone} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onDone).toHaveBeenCalled()
    // The OS's Esc either never hears it or hears it already handled.
    expect(os.mock.results.every((r) => r.value === true)).toBe(true)
    window.removeEventListener('keydown', os)
  })

  it('under reduced motion is a short fade with no bar', () => {
    const onDone = vi.fn()
    render(<Boot reduced onDone={onDone} />)
    expect(screen.queryByRole('progressbar')).toBeNull()
    act(() => { vi.advanceTimersByTime(300) })
    expect(onDone).toHaveBeenCalled()
  })
})
