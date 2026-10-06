import { describe, it, expect, beforeEach } from 'vitest'
import { consumeOpenedInApp, markOverlayOpenedInApp, resetOverlayDepth } from '../history'

beforeEach(() => resetOverlayDepth())

describe('overlay history', () => {
  it('goes back once per in-app step, then stops', () => {
    markOverlayOpenedInApp() // room → shelf
    markOverlayOpenedInApp() // shelf → book
    expect(consumeOpenedInApp()).toBe(true) // book → shelf
    expect(consumeOpenedInApp()).toBe(true) // shelf → room
    expect(consumeOpenedInApp()).toBe(false) // nothing left: push the room
  })

  it('forgets everything once the room is showing', () => {
    markOverlayOpenedInApp()
    resetOverlayDepth()
    expect(consumeOpenedInApp()).toBe(false)
  })
})
