import { OS } from '@/components/os/OS'

/**
 * The landing page is not a page about a desktop product. It is a desktop —
 * and, since this product has two audiences with opposite motivations, it is
 * a desktop with two accounts on it.
 *
 * Everything below this line lives in `components/os/`: the wallpaper, the
 * menu bar, the dock, the boot, the login window the boot resolves into, and
 * the seven app windows — the account's own seven — that launch out of the
 * dock and minimise back into it as you scroll. There is deliberately no
 * footer: the menu bar carries every route, and a sitemap bolted to the
 * bottom of a machine is the one thing that would break the conceit.
 *
 * `?profile=advertiser` and `?profile=user` land straight on that account's
 * desktop. They are resolved on the client, in a layout effect, so this page
 * stays statically rendered and the parameter costs nothing at build time.
 */
export default function Home() {
  return (
    <main>
      <OS />
    </main>
  )
}
