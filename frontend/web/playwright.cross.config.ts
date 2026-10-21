import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

const configPath = process.env.SOMEWHERE_CROSS_CONFIG;

if (!configPath || !process.env.SOMEWHERE_CROSS_PROGRESS) {
  throw new Error(
    'Set private SOMEWHERE_CROSS_CONFIG and SOMEWHERE_CROSS_PROGRESS paths',
  );
}

const config = JSON.parse(readFileSync(configPath, 'utf8')) as { origin: string };
const origin = new URL(config.origin);

if (origin.protocol !== 'https:' || origin.hostname !== '127.0.0.1') {
  throw new Error('Cross-platform fixture must use loopback HTTPS');
}

export default defineConfig({
  testDir: './tests',
  testMatch: '08-cross-platform.spec.ts',
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1000 },
    baseURL: origin.origin,
    ignoreHTTPSErrors: true,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
  },
});
