import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '30-design-review.spec.ts',
  outputDir: './test-results/visual-run',
  timeout: 120_000,
  workers: 1,
  use: {
    baseURL: 'https://127.0.0.1:8444',
    ignoreHTTPSErrors: true,
    timezoneId: 'Europe/Moscow',
    locale: 'ru-RU',
  },
  webServer: {
    command: 'tsx scripts/browser-server.ts',
    env: { SOMEWHERE_BROWSER_ADDR: '127.0.0.1:8444' },
    url: 'https://127.0.0.1:8444/healthz',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
