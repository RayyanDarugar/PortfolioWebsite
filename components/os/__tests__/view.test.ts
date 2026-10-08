import { describe, it, expect } from 'vitest'
import { APP_IDS, DESKTOP, ROOM, cardPath, isAppId, isRoomOverlay, pathFor, rolePath, viewFromPath } from '../view'

describe('viewFromPath', () => {
  it('reads the room, the desktop and an open app', () => {
    expect(viewFromPath('/')).toEqual(ROOM)
    expect(viewFromPath('/work')).toEqual(DESKTOP)
    expect(viewFromPath('/work/resume')).toEqual({ zoomed: true, app: 'resume' })
    expect(viewFromPath('/work/contact')).toEqual({ zoomed: true, app: 'contact' })
  })

  it('tolerates a trailing slash', () => {
    expect(viewFromPath('/work/')).toEqual(DESKTOP)
    expect(viewFromPath('/work/resume/')).toEqual({ zoomed: true, app: 'resume' })
  })

  it('owns nothing outside its scheme', () => {
    expect(viewFromPath('/music')).toBeNull()
    expect(viewFromPath('/work/nope')).toBeNull()
    expect(viewFromPath('/work/resume/extra')).toBeNull()
    expect(viewFromPath('/Work')).toBeNull()
  })
})

describe('pathFor', () => {
  it('round-trips every view', () => {
    for (const view of [ROOM, DESKTOP, ...APP_IDS.map((app) => ({ zoomed: true, app }))]) {
      expect(viewFromPath(pathFor(view))).toEqual(view)
    }
  })

  it('ignores the app when the laptop is not open', () => {
    expect(pathFor({ zoomed: false, app: 'resume' })).toBe('/')
  })
})

describe('isAppId', () => {
  it('accepts only known apps', () => {
    expect(isAppId('resume')).toBe(true)
    expect(isAppId('projects')).toBe(false)
  })
})

describe('room overlays', () => {
  it('are the overlay paths and nothing else', () => {
    for (const p of ['/cards/dog', '/cards/dog/', '/music', '/books', '/books/contact', '/journal',
      '/journal/on-beauty', '/places', '/places/milan', '/san-diego']) expect(isRoomOverlay(p), p).toBe(true)
    for (const p of ['/cards', '/', '/work/resume', '/books/a/b', '/musics']) expect(isRoomOverlay(p), p).toBe(false)
  })

  it('round-trip through cardPath', () => {
    expect(isRoomOverlay(cardPath('school-usc'))).toBe(true)
  })
})

describe('projects and roles', () => {
  it('open every project as an app', () => {
    expect(viewFromPath('/work/dynamo')).toEqual({ zoomed: true, app: 'dynamo' })
    expect(viewFromPath('/work/digest')).toEqual({ zoomed: true, app: 'digest' })
    expect(isAppId('experience')).toBe(true)
  })

  it('open a role inside Experience', () => {
    expect(viewFromPath('/work/experience')).toEqual({ zoomed: true, app: 'experience' })
    expect(viewFromPath('/work/experience/kana')).toEqual({ zoomed: true, app: 'experience', sub: 'kana' })
    expect(viewFromPath(rolePath('kana'))).toEqual({ zoomed: true, app: 'experience', sub: 'kana' })
    expect(pathFor({ zoomed: true, app: 'experience', sub: 'deca' })).toBe('/work/experience/deca')
  })

  // A mistyped role must be a 404 (an overlay over the room), not a laptop
  // view the OS half-opens.
  it('rejects unknown roles, and sub-paths of other apps', () => {
    expect(viewFromPath('/work/experience/nope')).toBeNull()
    expect(viewFromPath('/work/dynamo/kana')).toBeNull()
  })
})
