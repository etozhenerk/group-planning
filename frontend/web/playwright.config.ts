import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: '30-design-review.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: 'https://127.0.0.1:8444',
    ignoreHTTPSErrors: true,
    timezoneId: 'Europe/Moscow',
    locale: 'ru-RU',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-webkit',
      testMatch: [
        '27-mobile-scroll.spec.ts',
        '28-meeting-refresh.spec.ts',
        '29-media-refresh.spec.ts',
        '32-refresh-resilience.spec.ts',
      ],
      use: {
        ...devices['iPhone 13 Pro'],
        viewport: { width: 402, height: 874 },
      },
    },
  ],
  webServer: {
    command: 'tsx scripts/browser-server.ts',
    env: { SOMEWHERE_BROWSER_ADDR: '127.0.0.1:8444' },
    url: 'https://127.0.0.1:8444/healthz',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
