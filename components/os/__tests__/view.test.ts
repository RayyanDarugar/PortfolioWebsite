import { describe, it, expect } from 'vitest'
import { APP_IDS, DESKTOP, ROOM, isAppId, pathFor, viewFromPath } from '../view'

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
