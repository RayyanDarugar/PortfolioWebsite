import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    environment: 'jsdom',
    globals: true,
    // reference/ is a frozen copy of another repo; its tests import code that
    // does not exist here.
    exclude: [...configDefaults.exclude, 'reference/**'],
    // jsdom renders whole React trees with no compositor; on a busy machine the
    // default five seconds fails before the code does. See the AE snapshot's
    // vitest.config.ts for the history.
    testTimeout: 20_000,
  },
})
