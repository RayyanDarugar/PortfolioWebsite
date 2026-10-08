import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ABOUT } from '@/content/about'
import { CONTACT, PROFILE } from '@/content/profile'
import { RESUME } from '@/content/resume'
import { VIDEOS } from '@/content/videos'
import { APPS, appIndex } from '../registry'
import { APP_IDS } from '../view'
import { AboutApp } from '../apps/AboutApp'
import { ContactApp } from '../apps/ContactApp'
import { ResumeApp } from '../apps/ResumeApp'
import { VideosApp } from '../apps/VideosApp'

describe('the registry', () => {
  // The dock, the URL scheme and the static routes all key on these ids.
  // Same set, not same order: the dock puts the projects after the Résumé.
  it('lists exactly the apps the URL scheme knows', () => {
    expect(APPS.map((app) => app.id).sort()).toEqual([...APP_IDS].sort())
  })

  it('finds an app by id, and nothing for no app', () => {
    expect(appIndex('contact')).toBe(APPS.length - 1)
    expect(appIndex(null)).toBe(-1)
  })
})

describe('ResumeApp', () => {
  it('leads with the name as an h2', () => {
    render(<ResumeApp />)
    expect(screen.getByRole('heading', { level: 2, name: PROFILE.name })).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('lists every school, job and leadership role', () => {
    render(<ResumeApp />)
    for (const school of RESUME.education.schools) expect(screen.getByText(school.name)).toBeTruthy()
    for (const role of [...RESUME.experience, ...RESUME.leadership]) {
      expect(screen.getAllByText(role.org).length).toBeGreaterThan(0)
      for (const bullet of role.bullets) expect(screen.getByText(bullet)).toBeTruthy()
    }
  })

  it('offers the PDF', () => {
    render(<ResumeApp />)
    expect(screen.getByRole('link', { name: /Download PDF/ }).getAttribute('href')).toBe(RESUME.pdf)
  })

  it('closes through its red light', () => {
    const onClose = vi.fn()
    render(<ResumeApp onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close window' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('AboutApp', () => {
  it('leads with the mission and tells the story under it', () => {
    render(<AboutApp />)
    expect(screen.getByRole('heading', { level: 2, name: ABOUT.mission })).toBeTruthy()
    for (const paragraph of ABOUT.story) expect(screen.getByText(paragraph)).toBeTruthy()
  })
})

describe('VideosApp', () => {
  it('plays every video in the portfolio, titled', () => {
    const { container } = render(<VideosApp />)
    const sources = [...container.querySelectorAll('video')].map((v) => v.getAttribute('src'))
    expect(sources).toEqual(VIDEOS.map((video) => video.src))
    for (const video of VIDEOS) expect(screen.getByText(video.title)).toBeTruthy()
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
