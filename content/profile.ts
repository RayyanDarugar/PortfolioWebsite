/**
 * Who this site is about, and how to reach him.
 *
 * DRAFT. Rayyan replaces this copy with his own (spec §9), and confirms the
 * contact links before the preview URL is shared. No component hardcodes any
 * of it.
 */

export const PROFILE = {
  name: 'Rayyan Darugar',
  tagline: 'Student at USC. Building The Attention Exchange.',
} as const

export interface ContactLink {
  label: string
  href: string
  /** What the visitor sees: the address itself, not "click here". */
  detail: string
}

export const CONTACT: readonly ContactLink[] = [
  { label: 'Email', href: 'mailto:rayyandarugar@gmail.com', detail: 'rayyandarugar@gmail.com' },
  { label: 'GitHub', href: 'https://github.com/RayyanDarugar', detail: 'github.com/RayyanDarugar' },
]

export interface ResumeEntry {
  title: string
  detail: string
}

export const RESUME: {
  /** Path under /public once Rayyan supplies the PDF; null hides the button. */
  pdf: string | null
  building: readonly ResumeEntry[]
  education: readonly ResumeEntry[]
} = {
  pdf: null,
  building: [
    {
      title: 'The Attention Exchange',
      detail: 'Rents out the empty space on your screen and pays you for it.',
    },
  ],
  education: [
    { title: 'University of Southern California', detail: 'Los Angeles' },
    { title: 'HKUST', detail: 'Hong Kong · 2025' },
    { title: 'Bocconi University', detail: 'Milan' },
  ],
}
