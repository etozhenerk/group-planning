import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const root = "/Users/misha/Documents/Codex/projects/group-planning";
const port = process.env.CURSOR_BASELINE_PORT ?? "8444";
const origin = `https://127.0.0.1:${port}`;
const evidence =
  process.env.CURSOR_BASELINE_OUTPUT ??
  path.join(
    root,
    "openspec/changes/chat-reliability-and-sync/qa/2026-10-27-web-cursor-baseline/run01",
  );

export default defineConfig({
  testDir: ".",
  testMatch: "cursor-race.spec.ts",
  outputDir: path.join(evidence, "results"),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["line"]],
  use: {
    baseURL: origin,
    ignoreHTTPSErrors: true,
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      path.join(
        root,
        ".cache/qa/2026-10-27-telegram-chat/android-review-live/session01/httpapi.test",
      ) + " -test.run=^TestBrowserFixture$ -test.v -test.timeout=0",
    cwd: root,
    env: {
      SOMEWHERE_BROWSER_FIXTURE: "1",
      SOMEWHERE_BROWSER_ADDR: `127.0.0.1:${port}`,
      SOMEWHERE_BROWSER_DIST: path.join(
        root,
        ".cache/qa/chat-correction-2.1.0/web-r8-demo",
      ),
      SOMEWHERE_BROWSER_DESIGN: "0",
    },
    url: `${origin}/healthz`,
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
