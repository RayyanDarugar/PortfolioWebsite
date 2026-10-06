import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { getCard, getCards, siblings } from '../cards'

describe('the cards', () => {
  it('all parse, with unique ids and the required fields', () => {
    const cards = getCards()
    expect(cards.length).toBe(12)
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length)
    for (const c of cards) {
      expect(c.tag && c.title && c.photo).toBeTruthy()
      expect(c.body.length).toBeGreaterThan(0)
    }
  })

  it('point at photos that exist', () => {
    for (const c of getCards()) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', c.photo)), c.photo).toBe(true)
    }
  })

  it('keep the schools in order, as one set', () => {
    const usc = getCard('school-usc')!
    expect(siblings(usc).next?.id).toBe('school-hkust')
    expect(siblings(getCard('school-hkust')!).next?.id).toBe('school-bocconi')
  })

  it('has no neighbour past either end, or outside a set', () => {
    expect(siblings(getCard('school-usc')!).prev).toBeNull()
    expect(siblings(getCard('school-bocconi')!).next).toBeNull()
    expect(siblings(getCard('dog')!)).toEqual({ prev: null, next: null })
  })
})
