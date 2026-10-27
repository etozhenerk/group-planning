import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const root = '/Users/misha/Documents/Codex/projects/group-planning';
const evidence = path.join(root, 'openspec/changes/meeting-experience-refresh/qa/2026-10-27-emoji-motion-web');

export default defineConfig({
  testDir: path.join(root, 'frontend/web/tests'),
  testMatch: ['34-telegram-chat.spec.ts', '35-emoji-motion.spec.ts'],
  grep: /emoji/,
  outputDir: path.join(evidence, 'results-run03'),
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'playwright-run03.json') }]],
  use: {
    baseURL: 'https://127.0.0.1:8444',
    ignoreHTTPSErrors: true,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13 Pro'] } },
  ],
  webServer: {
    command: path.join(root, '.cache/qa/2026-10-27-telegram-chat-1.4.1-r3/httpapi.test') + ' -test.run=^TestBrowserFixture$ -test.v -test.timeout=0',
    cwd: root,
    env: {
      SOMEWHERE_BROWSER_FIXTURE: '1',
      SOMEWHERE_BROWSER_ADDR: '127.0.0.1:8444',
      SOMEWHERE_BROWSER_DIST: path.join(root, '.cache/qa/chat-correction-2.2.0/web-r10-demo'),
      SOMEWHERE_BROWSER_DESIGN: '0',
    },
    url: 'https://127.0.0.1:8444/healthz',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
