import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: [
    '02-reliability.spec.ts',
    '04-resilience.spec.ts',
    '28-meeting-refresh.spec.ts',
    '32-refresh-resilience.spec.ts',
    '37-chat-persistence.spec.ts',
    '34-telegram-chat.spec.ts',
  ],
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
    env: { SOMEWHERE_BROWSER_CHAT_REALTIME: '0' },
    url: 'https://127.0.0.1:8458/healthz',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
