import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5179',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node --max-old-space-size=1024 ./node_modules/vite/bin/vite.js --config vite.config.mjs --host 127.0.0.1 --port 5179 --strictPort',
    cwd: '../../Frontend/dashboard',
    url: 'http://127.0.0.1:5179',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
