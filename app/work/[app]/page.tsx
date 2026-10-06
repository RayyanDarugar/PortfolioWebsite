import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { APPS } from '@/components/os/registry'
import { isAppId } from '@/components/os/view'

/** Only the registry's apps exist; anything else under /work is a 404. */
export const dynamicParams = false

export function generateStaticParams() {
  return APPS.map((app) => ({ app: app.id }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ app: string }> },
): Promise<Metadata> {
  const { app } = await params
  return { title: APPS.find((def) => def.id === app)?.name }
}

/** One app's window, open on the desktop. Rendered by <OS /> in the root layout. */
export default async function AppWindow({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params
  if (!isAppId(app)) notFound()
  return null
}
