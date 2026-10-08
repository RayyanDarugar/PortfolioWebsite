import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Project } from '@/content/projects'
import { ProjectApp } from '../apps/ProjectApp'

const full: Project = {
  slug: 'demo', name: 'Demo', tagline: 'A demo product.', role: 'Founder', dates: '2026', order: 1, icon: 'bolt',
  tile: '#000', liveUrl: 'https://demo.example', displayUrl: 'demo.example',
  hero: { kind: 'video', src: '/work/demo/hero.mp4', poster: '/work/demo/hero.jpg', alt: 'Demo in use' },
  metrics: [{ value: '42', label: 'teams' }],
  problem: ['It was slow.'], built: ['I made it fast.'], next: ['More.'],
  gallery: [{ src: '/work/demo/1.png', caption: 'The dashboard' }],
  stack: ['Next.js', 'Postgres'],
}

describe('ProjectApp', () => {
  it('lays out every section it has content for', () => {
    render(<ProjectApp project={full} active />)
    expect(screen.getByRole('heading', { level: 2, name: 'Demo' })).toBeTruthy()
    expect(screen.getByText('A demo product.')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Try it live/ }).getAttribute('href')).toBe('https://demo.example')
    expect(screen.getByText('42')).toBeTruthy()
    for (const heading of ['The problem', 'What I built', 'How it works', 'What’s next']) {
      expect(screen.getByRole('heading', { level: 3, name: heading })).toBeTruthy()
    }
    expect(screen.getByText('Postgres')).toBeTruthy()
    expect(screen.getAllByText('demo.example').length).toBeGreaterThan(0) // the title bar and the browser frame
  })

  it('renders only the header when a project has nothing else', () => {
    render(<ProjectApp project={{ slug: 'bare', name: 'Bare', tagline: 'Just a name.', order: 1, icon: 'news', tile: '#fff' }} active />)
    expect(screen.getByRole('heading', { level: 2, name: 'Bare' })).toBeTruthy()
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    expect(screen.queryByRole('link', { name: /Try it live/ })).toBeNull()
    expect(document.querySelector('img, video')).toBeNull()
  })

  it('loads the recording only while its window is the open one', () => {
    const { rerender, container } = render(<ProjectApp project={full} active={false} />)
    expect(container.querySelector('video')).toBeNull()
    expect(container.querySelector('img[src*="hero.jpg"]')).not.toBeNull()
    rerender(<ProjectApp project={full} active />)
    expect(container.querySelector('video')?.getAttribute('src')).toBe('/work/demo/hero.mp4')
  })

  it('Esc closes the lightbox, not the window', () => {
    const outer = vi.fn()
    window.addEventListener('keydown', outer)
    render(<ProjectApp project={full} active />)
    fireEvent.click(screen.getByRole('button', { name: /The dashboard/ }))
    const box = screen.getByRole('dialog', { name: 'The dashboard' })
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(outer).not.toHaveBeenCalled() // the OS's window listener never sees it
    window.removeEventListener('keydown', outer)
  })
})

describe('the lightbox, in a real window', () => {
  // The window body scrolls; a lightbox inside the scroller sat on its first
  // screen, out of view once the gallery was scrolled to.
  it('opens over the window, outside the part that scrolls', () => {
    render(<ProjectApp project={full} active />)
    fireEvent.click(screen.getByRole('button', { name: /The dashboard/ }))
    expect(screen.getByRole('dialog').closest('.overflow-y-auto')).toBeNull()
  })

  // Windows stay mounted when closed; a lightbox left open kept catching Esc.
  it('goes away with its window', () => {
    const { rerender } = render(<ProjectApp project={full} active />)
    fireEvent.click(screen.getByRole('button', { name: /The dashboard/ }))
    rerender(<ProjectApp project={full} active={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(<ProjectApp project={full} active />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
