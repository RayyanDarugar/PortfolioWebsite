import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTACT, PROFILE, RESUME } from '@/content/profile'
import { APPS, appIndex } from '../registry'
import { APP_IDS } from '../view'
import { ContactApp } from '../apps/ContactApp'
import { ResumeApp } from '../apps/ResumeApp'

describe('the registry', () => {
  // The dock, the URL scheme and the static routes all key on these ids.
  it('lists exactly the apps the URL scheme knows, in the same order', () => {
    expect(APPS.map((app) => app.id)).toEqual([...APP_IDS])
  })

  it('finds an app by id, and nothing for no app', () => {
    expect(appIndex('contact')).toBe(1)
    expect(appIndex(null)).toBe(-1)
  })
})

describe('ResumeApp', () => {
  it('leads with the name as an h2 and lists the schools', () => {
    render(<ResumeApp />)
    expect(screen.getByRole('heading', { level: 2, name: PROFILE.name })).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    for (const entry of RESUME.education) expect(screen.getByText(entry.title)).toBeTruthy()
  })

  it('closes through its red light', () => {
    const onClose = vi.fn()
    render(<ResumeApp onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close window' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('ContactApp', () => {
  it('links every contact method', () => {
    render(<ContactApp />)
    for (const link of CONTACT) {
      expect(screen.getByRole('link', { name: new RegExp(link.label) }).getAttribute('href')).toBe(link.href)
    }
  })
})
