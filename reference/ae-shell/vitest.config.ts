import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    environment: 'jsdom',
    globals: true,
    /**
     * Twenty seconds, not vitest's default five.
     *
     * This suite renders whole React trees into jsdom — the full desktop with
     * its fourteen windows, the join flow, the ad unit — and jsdom has no
     * compositor, so building one of those costs real CPU. Unloaded the
     * heaviest test takes about 560ms, comfortably inside five seconds; but
     * five seconds leaves no headroom, and on a machine doing anything else
     * (a dev server compiling, CI running suites in parallel, several workers
     * on one box) the same render takes an order of magnitude longer and the
     * budget fails before the code does.
     *
     * That produced tests which passed alone and failed at random together,
     * always with `Test timed out in 5000ms` and never with a wrong assertion.
     * It was chased file by file first — profiles, then JoinFlow, then AdUnit —
     * which is whack-a-mole: the fact is about the suite, not about any file
     * in it, so it is stated once here.
     *
     * The cost is that a genuinely hung test takes twenty seconds to say so
     * rather than five. That is the right trade against a suite that goes red
     * for reasons unrelated to the code under test, because a flaky suite
     * stops being read at all.
     */
    testTimeout: 20_000,
  },
})
