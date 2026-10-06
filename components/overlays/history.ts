/**
 * How many overlay steps were taken inside the site since the room last
 * showed: room → shelf is one, shelf → book another. Closing an overlay goes
 * back while there are steps to undo, so Back afterwards leaves the room
 * instead of reopening what was just closed; with none (a pasted link) it
 * pushes the room. The OS root resets it whenever the room is showing.
 */

let depth = 0

export function markOverlayOpenedInApp(): void {
  depth += 1
}

/** True (and one step fewer) when closing should go back. */
export function consumeOpenedInApp(): boolean {
  if (depth === 0) return false
  depth -= 1
  return true
}

export function resetOverlayDepth(): void {
  depth = 0
}
