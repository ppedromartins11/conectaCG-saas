import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
    setupFiles: ['./setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '../backend/src') },
  },
})
