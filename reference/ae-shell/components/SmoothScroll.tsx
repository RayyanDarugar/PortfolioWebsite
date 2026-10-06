'use client'
import Lenis from 'lenis'
import { createContext, useContext, useEffect, useState } from 'react'

/**
 * The smooth scroll, and a handle on it.
 *
 * Lenis does not decorate the browser's scrolling — it replaces it. It cancels
 * wheel events, runs its own animation loop, and drives the document with
 * `scrollTo` on every frame. Two consequences, and both of them bit:
 *
 *  1. **`overflow: hidden` does not stop it.** The landing page locks the
 *     document while the login window is up, and Lenis carried on scrolling
 *     straight through the lock — so you could scroll the whole desktop past
 *     behind a modal that was supposed to be holding you still. Stopping the
 *     scroll means telling Lenis to stop, not telling the document to.
 *  2. **`window.scrollTo` goes around its back.** Lenis keeps its own target
 *     position, and a programmatic scroll it did not perform leaves that target
 *     stale — so the next wheel tick snaps the page back to wherever Lenis
 *     still thought it was. Every jump on this site (the dock, Spotlight, the
 *     hero's arrow, logging in) is a programmatic scroll.
 *
 * So the instance goes in a context rather than staying a local in an effect,
 * and callers use {@link useLenis} to reach it. `null` before mount and for
 * reduced-motion visitors, who never get an instance at all — every consumer
 * has to handle that, which is why the hook returns the instance rather than
 * wrapping it in methods that would quietly no-op.
 */
const LenisContext = createContext<Lenis | null>(null)

/**
 * The running Lenis instance, or `null`.
 *
 * `null` is a real answer, not an error: a reduced-motion visitor has no smooth
 * scroll, and neither does the first render. Callers fall back to
 * `window.scrollTo`, which is correct in exactly the cases where there is no
 * Lenis to keep in sync.
 */
export function useLenis(): Lenis | null {
  return useContext(LenisContext)
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const instance = new Lenis({ duration: 1.1, smoothWheel: true })
    let raf = 0
    const loop = (t: number) => { instance.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    // `react-hooks/set-state-in-effect` is guarding against effects that write
    // state derived from props and re-render in a loop. This is the other
    // thing that shape can mean: an external resource that cannot exist until
    // the client does — Lenis touches `window` in its constructor — being
    // published once so consumers can re-render *with* it. It runs once, on
    // mount, and the state it sets is not derived from anything.
    //
    // A ref would satisfy the rule and be wrong. Consumers have to re-render
    // when the instance appears: a visitor whose browser restores a scroll
    // position deep in the page arrives already landed, so the login window's
    // scroll lock runs on the first passive-effect pass — which is *before*
    // this provider's effect, since parent effects run after children's. With
    // a ref that lock would read `null`, and Lenis would start scrolling the
    // page behind the login window a frame later with nothing to stop it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance)
    return () => {
      cancelAnimationFrame(raf)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
