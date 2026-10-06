/**
 * Who this site is about, and how to reach him. No component hardcodes any of it.
 */

export const PROFILE = {
  name: 'Rayyan Darugar',
  /** Written on the whiteboard: the page's h1. Draft; Rayyan writes the real line. */
  intro: "Hi, I'm Rayyan Darugar.",
  /** The line under his name in the room. */
  tagline: 'Trying to make the world more beautiful.',
  /** The line under his name on the résumé. */
  headline: 'World Bachelor in Business at USC, HKUST and Bocconi.',
} as const

export interface ContactLink {
  label: string
  href: string
  /** What the visitor sees: the address itself, not "click here". */
  detail: string
}

export const CONTACT: readonly ContactLink[] = [
  { label: 'Email', href: 'mailto:rayyandarugar@gmail.com', detail: 'rayyandarugar@gmail.com' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rayyandarugar', detail: 'linkedin.com/in/rayyandarugar' },
  { label: 'GitHub', href: 'https://github.com/RayyanDarugar', detail: 'github.com/RayyanDarugar' },
]
