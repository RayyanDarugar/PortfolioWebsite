import { describe, it, expect } from 'vitest'
import sprites from '@/public/room/sprites.json'
import { getCards } from '../cards'
import { HOTBAR, ROOM_OBJECTS, spriteFor } from '../room'
import { isRoomOverlay } from '@/components/os/view'

describe('the room manifest', () => {
  it('describes exactly the sprites the art has', () => {
    expect(ROOM_OBJECTS.map((o) => o.id).sort()).toEqual(sprites.sprites.map((s) => s.id).sort())
  })

  it('points every card action at a card that exists', () => {
    const ids = new Set(getCards().map((c) => c.id))
    for (const o of ROOM_OBJECTS) if (o.action.kind === 'card') expect(ids.has(o.action.card), o.id).toBe(true)
  })

  it('has hotbar slots 1–9, each naming objects in the room', () => {
    expect(HOTBAR.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const s of HOTBAR) for (const id of s.objects) expect(() => spriteFor(id)).not.toThrow()
  })

  it('puts the laptop in slot 1 and both photos in slot 9', () => {
    expect(HOTBAR[0].objects).toEqual(['laptop'])
    expect(HOTBAR[8].objects).toEqual(['photo-dog', 'photo-beach'])
  })

  it('points every overlay action at a room overlay path', () => {
    const overlays = ROOM_OBJECTS.filter((o) => o.action.kind === 'overlay')
    expect(overlays.map((o) => o.id).sort()).toEqual(['bookshelf', 'globe', 'journal', 'record-player', 'window'])
    for (const o of overlays) if (o.action.kind === 'overlay') expect(isRoomOverlay(o.action.href), o.id).toBe(true)
  })
})
