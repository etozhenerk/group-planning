import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['37-chat-persistence.spec.ts', '38-chat-sync.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: 'https://127.0.0.1:8458',
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
      use: { ...devices['iPhone 13 Pro'], viewport: { width: 402, height: 874 } },
    },
  ],
  webServer: {
    command: 'tsx scripts/chat-browser-server.ts',
    url: 'https://127.0.0.1:8458/healthz',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
