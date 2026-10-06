/**
 * Whether the overlay on screen was opened from inside the site.
 *
 * Closing such an overlay goes back in history rather than pushing `/`, so the
 * browser's Back afterwards leaves the room instead of reopening what was just
 * closed. An overlay reached from a pasted link has nothing in the site to go
 * back to, so it closes by pushing `/`. Module state: it lasts as long as the
 * page, which is exactly the span "opened inside the site" means anything in.
 */

let openedInApp = false

export function markOverlayOpenedInApp(): void {
  openedInApp = true
}

/** Reads and clears the mark: one close per open. */
export function consumeOpenedInApp(): boolean {
  const was = openedInApp
  openedInApp = false
  return was
}
