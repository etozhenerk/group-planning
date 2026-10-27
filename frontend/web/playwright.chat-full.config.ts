import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: [
    '30-design-review.spec.ts',
    '38-chat-sync.spec.ts',
    '39-chat-window.spec.ts',
    '40-chat-history-error.spec.ts',
    '41-chat-read-state.spec.ts',
    '42-chat-first-unread.spec.ts',
    '43-chat-read-visibility.spec.ts',
  ],
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
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
      testMatch: [
        '27-mobile-scroll.spec.ts',
        '28-meeting-refresh.spec.ts',
        '29-media-refresh.spec.ts',
        '32-refresh-resilience.spec.ts',
        '33-chat-action-sheets.spec.ts',
        '34-telegram-chat.spec.ts',
        '35-emoji-motion.spec.ts',
        '36-action-menu-motion.spec.ts',
        '37-chat-persistence.spec.ts',
      ],
      use: {
        ...devices['iPhone 13 Pro'],
        viewport: { width: 402, height: 874 },
      },
    },
  ],
  webServer: {
    command: 'tsx scripts/chat-browser-server.ts',
    env: { SOMEWHERE_BROWSER_CHAT_REALTIME: '0', SOMEWHERE_BROWSER_CHAT_READ_STATE: '0' },
    url: 'https://127.0.0.1:8458/healthz',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
