import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './release-tests',
  workers: 1,
  timeout: 30_000,
  outputDir: 'test-results/release',
  use: { baseURL: 'http://127.0.0.1:9328', screenshot: 'only-on-failure' },
  webServer: {
    command: 'tsx scripts/release-preview-server.ts',
    url: 'http://127.0.0.1:9328',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
