import sprites from '@/public/room/sprites.json'

/**
 * The room manifest (spec §5): what each object is called, what it does, and
 * which hotbar slot it lives in. Positions come from the art pipeline
 * (public/room/sprites.json), so moving an object is re-cutting the art, not
 * editing here.
 *
 * Phase 3: the record player, bookshelf, journal, globe and window open a
 * game card saying what is coming. Phase 4 points them at their own overlays.
 */

export type RoomAction = { kind: 'zoom' } | { kind: 'card'; card: string }

export interface RoomObject {
  id: string
  /** The tooltip, and the start of the button's accessible name. */
  label: string
  /** What it opens, in a few words. */
  hint: string
  action: RoomAction
}

export interface HotbarSlot {
  slot: number
  label: string
  /** Lit when the slot is hovered; the first one is what the slot opens. */
  objects: readonly string[]
}

export const ROOM_OBJECTS: readonly RoomObject[] = [
  { id: 'laptop', label: 'Laptop', hint: 'Work, résumé and contact', action: { kind: 'zoom' } },
  { id: 'journal', label: 'Journal', hint: 'Things I think about', action: { kind: 'card', card: 'journal' } },
  { id: 'record-player', label: 'Record player', hint: 'Songs I love', action: { kind: 'card', card: 'music' } },
  { id: 'bookshelf', label: 'Bookshelf', hint: 'Books I recommend', action: { kind: 'card', card: 'books' } },
  { id: 'globe', label: 'Globe', hint: "Places I've been", action: { kind: 'card', card: 'travel' } },
  { id: 'whiteboard', label: 'Whiteboard', hint: "What I'm building", action: { kind: 'card', card: 'building' } },
  { id: 'flags', label: 'Flags', hint: 'USC, HKUST and Bocconi', action: { kind: 'card', card: 'school-usc' } },
  { id: 'surfboard', label: 'Surfboard', hint: 'The board', action: { kind: 'card', card: 'surfboard' } },
  { id: 'photo-dog', label: 'Photo', hint: 'My dog', action: { kind: 'card', card: 'dog' } },
  { id: 'photo-beach', label: 'Photo', hint: 'San Diego', action: { kind: 'card', card: 'beach' } },
  { id: 'window', label: 'Window', hint: 'San Diego, right now', action: { kind: 'card', card: 'san-diego' } },
]

export const HOTBAR: readonly HotbarSlot[] = [
  { slot: 1, label: 'Work', objects: ['laptop'] },
  { slot: 2, label: 'Journal', objects: ['journal'] },
  { slot: 3, label: 'Music', objects: ['record-player'] },
  { slot: 4, label: 'Books', objects: ['bookshelf'] },
  { slot: 5, label: 'Travel', objects: ['globe'] },
  { slot: 6, label: 'Building', objects: ['whiteboard'] },
  { slot: 7, label: 'Schools', objects: ['flags'] },
  { slot: 8, label: 'Surf', objects: ['surfboard'] },
  { slot: 9, label: 'Photos', objects: ['photo-dog', 'photo-beach'] },
]

export function spriteFor(id: string): { id: string; x: number; y: number; w: number; h: number } {
  const s = sprites.sprites.find((sprite) => sprite.id === id)
  if (!s) throw new Error(`no sprite "${id}" in public/room/sprites.json`)
  return s
}
