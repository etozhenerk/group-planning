import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance',
  testMatch: '**/*.perf.ts',
  workers: 1,
  retries: 0,
  timeout: 600_000,
  use: {
    baseURL: 'https://127.0.0.1:8474',
    ignoreHTTPSErrors: true,
    timezoneId: 'Europe/Moscow',
    locale: 'ru-RU',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13 Pro'], viewport: { width: 402, height: 874 } },
    },
  ],
  webServer: {
    command: 'tsx scripts/browser-server.ts',
    env: { SOMEWHERE_BROWSER_ADDR: '127.0.0.1:8474' },
    url: 'https://127.0.0.1:8474/healthz',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
