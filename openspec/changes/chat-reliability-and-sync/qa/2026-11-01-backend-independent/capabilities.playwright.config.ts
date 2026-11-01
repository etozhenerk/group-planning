import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'capabilities.spec.ts',
  outputDir: './capabilities-results',
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [['list'], ['json', { outputFile: '/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/chat-reliability-and-sync/qa/2026-11-01-backend-independent/capabilities-result.json' }]],
  use: {
    baseURL: 'https://127.0.0.1:8492',
    ignoreHTTPSErrors: true,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
