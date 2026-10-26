import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const output = resolve(directory, "render-compact");
const files = [
  "action-date.html",
  "revision.css",
  "revision-tokens.css",
  "revision.js",
];
const inputs = files.map((path) => ({
  path,
  sha256: createHash("sha256")
    .update(readFileSync(resolve(directory, path)))
    .digest("hex"),
}));
const results: Record<string, unknown>[] = [];
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();

try {
  for (const width of [320, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      locale: "ru-RU",
      timezoneId: "Europe/Moscow",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(
      "http://127.0.0.1:8784/revisions/2026-10-27-chat-sheets/action-date.html",
    );
    await page.waitForFunction(
      () => document.body.dataset.revisionReady === "true",
    );
    await page.setViewportSize({ width, height: 430 });
    const panel = page.locator('[data-view="date"] .panel');
    const close = page.locator('[data-view="date"] .revision-close');
    const submit = panel.getByText("Создать опрос", { exact: true });
    await submit.scrollIntoViewIfNeeded();
    await expect(close).toBeInViewport();
    await expect(submit).toBeInViewport();
    await expect(close).toBeVisible();
    const measured = await page.evaluate(() => {
      const panel = document.querySelector('[data-view="date"] .panel')!;
      const bounds = document.querySelector("dialog")!.getBoundingClientRect();
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        panelScrollTop: panel.scrollTop,
        sheetTop: bounds.top,
        sheetBottom: bounds.bottom,
      };
    });
    expect(measured.height).toBe(430);
    expect(measured.scrollWidth).toBeLessThanOrEqual(width);
    expect(measured.panelScrollTop).toBeGreaterThan(0);
    expect(measured.sheetBottom).toBeLessThanOrEqual(430);
    await page.screenshot({
      path: resolve(output, `action-date-${width}x430.png`),
      animations: "disabled",
    });
    await close.click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    results.push(measured);
    await context.close();
  }

  writeFileSync(
    resolve(output, "checks.json"),
    JSON.stringify(
      {
        browser: browser.version(),
        capturedAt: new Date().toISOString(),
        inputs,
        results,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
