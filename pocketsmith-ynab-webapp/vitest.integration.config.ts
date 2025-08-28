import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    name: 'integration',
    root: './src',
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.integration.test.{js,ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    },
    testTimeout: 30000, // Longer timeout for integration tests
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})