import { defineConfig } from '@playwright/test'
import viteConfig from './vite.config.js'

const PORT = Number(process.env.PW_PORT) || 4173
const BASE = viteConfig.base ?? '/'

export default defineConfig({
  testDir: './tests',
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: 'chromium',
  },
  // Tests run against the production build, never the dev server.
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
