import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['63-rsvp-routing.spec.ts', '64-rsvp-realtime.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: 'https://127.0.0.1:8464',
    ignoreHTTPSErrors: true,
    timezoneId: 'Europe/Moscow',
    locale: 'ru-RU',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13 Pro'] } },
  ],
  webServer: {
    command: 'tsx scripts/browser-server.ts',
    env: {
      SOMEWHERE_BROWSER_ADDR: '127.0.0.1:8464',
      SOMEWHERE_BROWSER_CHAT_REALTIME: '1',
      SOMEWHERE_BROWSER_CHAT_READ_STATE: '1',
    },
    url: 'https://127.0.0.1:8464/healthz',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
