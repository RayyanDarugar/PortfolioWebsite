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

// A cold /books, then a book, then the browser's own Back: the step was undone
// outside the site, so Esc on the shelf must not go back again (off the site).
describe('the browser Back button', () => {
  it('undoes a step the site counted', () => {
    markOverlayOpenedInApp()
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(consumeOpenedInApp()).toBe(false)
  })

  it('is not counted twice when the site itself went back', () => {
    markOverlayOpenedInApp() // room → shelf
    markOverlayOpenedInApp() // shelf → book
    expect(consumeOpenedInApp()).toBe(true) // Esc: book → shelf, by router.back()
    window.dispatchEvent(new PopStateEvent('popstate')) // that back landing
    expect(consumeOpenedInApp()).toBe(true) // Esc: shelf → room is still a back
  })
})
