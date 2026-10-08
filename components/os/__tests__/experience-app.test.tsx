import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ROLES } from '@/content/roles'
import { ExperienceApp } from '../apps/ExperienceApp'

const detail = () => screen.getByRole('region', { name: 'Role' })

describe('ExperienceApp', () => {
  it('opens on the newest role', () => {
    render(<ExperienceApp />)
    expect(within(detail()).getByRole('heading', { level: 2 }).textContent).toBe(ROLES[0].org)
  })

  it('shows the role in the URL and moves the URL when another is picked', () => {
    const onNavigate = vi.fn()
    render(<ExperienceApp sub="kana" onNavigate={onNavigate} />)
    expect(within(detail()).getByRole('heading', { level: 2 }).textContent).toBe('Kana')
    fireEvent.click(screen.getByRole('button', { name: /California DECA/ }))
    expect(onNavigate).toHaveBeenCalledWith('/work/experience/deca')
  })

  it('picks locally where there is no URL to move (the stacked layout)', () => {
    render(<ExperienceApp />)
    fireEvent.click(screen.getByRole('button', { name: /Hemut/ }))
    expect(within(detail()).getByRole('heading', { level: 2 }).textContent).toBe('Hemut (YC X25)')
  })

  it('filters the list by kind of work', () => {
    render(<ExperienceApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Leadership' }))
    const list = screen.getByRole('list', { name: 'Roles' })
    expect(within(list).getAllByRole('button').map((b) => b.textContent)).toEqual(
      ROLES.filter((r) => r.tags.includes('leadership')).map((r) => expect.stringContaining(r.org)),
    )
  })

  it('links a role to the project that came out of it', () => {
    const onOpenApp = vi.fn()
    render(<ExperienceApp sub="superset" onNavigate={() => {}} onOpenApp={onOpenApp} />)
    fireEvent.click(within(detail()).getByRole('button', { name: /TikTok Platform/ }))
    expect(onOpenApp).toHaveBeenCalledWith('tiktok')
  })
})

// The stacked fallback is phone width: a 220px sidebar left the detail ~80px.
describe('Experience on a small screen', () => {
  it('stacks the list over the detail where there is no desktop', () => {
    const { container } = render(<ExperienceApp />)
    expect(container.querySelector('.grid-cols-1')).not.toBeNull()
    expect(container.innerHTML).not.toContain('grid-cols-[minmax(220px,30%)_1fr]')
  })
})
