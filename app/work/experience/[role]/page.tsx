import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ROLES, getRole } from '@/content/roles'

export const dynamicParams = false

export function generateStaticParams() {
  return ROLES.map((r) => ({ role: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params
  const found = getRole(role)
  return { title: found ? `${found.org} · Experience` : undefined }
}

/** Experience, open on one role. Rendered by <OS /> in the root layout. */
export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  if (!getRole(role)) notFound()
  return null
}
