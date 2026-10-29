import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const web = fileURLToPath(
  new URL("../../../../../frontend/web/", import.meta.url),
);

export default defineConfig({
  testDir: ".",
  testMatch: "touch-counterfactual.spec.ts",
  tsconfig: `${web}/tsconfig.json`,
  fullyParallel: false,
  workers: 1,
  repeatEach: 3,
  timeout: 30_000,
  outputDir: `${web}/test-results/touch-diagnostic`,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "https://127.0.0.1:8444",
    ignoreHTTPSErrors: true,
    timezoneId: "Europe/Moscow",
    locale: "ru-RU",
    trace: "on",
    screenshot: "on",
  },
  projects: [{ name: "baseline" }, { name: "counterfactual-photo-no-pan" }],
  webServer: {
    cwd: web,
    command: "npx --no-install tsx scripts/browser-server.ts",
    env: { SOMEWHERE_BROWSER_ADDR: "127.0.0.1:8444" },
    url: "https://127.0.0.1:8444/healthz",
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
