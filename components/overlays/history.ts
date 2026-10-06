/**
 * How many overlay steps were taken inside the site since the room last
 * showed: room → shelf is one, shelf → book another. Closing an overlay goes
 * back while there are steps to undo, so Back afterwards leaves the room
 * instead of reopening what was just closed; with none (a pasted link) it
 * pushes the room. The OS root resets it whenever the room is showing.
 *
 * Counting too few is safe (closing pushes the room); counting too many sends
 * Esc back past the site's first page. So the browser's own Back undoes a
 * step, and the site's own back (from closing) is not counted twice.
 */

let depth = 0
let ownBacks = 0

export function markOverlayOpenedInApp(): void {
  depth += 1
}

/** True (and one step fewer) when closing should go back. */
export function consumeOpenedInApp(): boolean {
  if (depth === 0) return false
  depth -= 1
  ownBacks += 1
  return true
}

export function resetOverlayDepth(): void {
  depth = 0
  ownBacks = 0
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ownBacks > 0) ownBacks -= 1
    else depth = Math.max(0, depth - 1)
  })
}

/** A click the browser turns into a new tab or window: this tab does not move. */
export function opensElsewhere(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}
