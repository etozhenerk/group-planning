import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const output = resolve(directory, "render-final");
const base = "http://127.0.0.1:8784/revisions/2026-10-27-chat-sheets/";
const files = [
  "action-date",
  "action-place",
  "action-task",
  "upload",
  "upload-one",
  "upload-file",
  "upload-error",
  "share",
  "share-copied",
  "meeting-details",
];
const captures: Record<string, unknown>[] = [];
const inputs = readdirSync(directory)
  .filter((name) => /\.(html|css|ts|js|json)$/.test(name))
  .sort()
  .map((name) => ({
    path: name,
    sha256: createHash("sha256")
      .update(readFileSync(resolve(directory, name)))
      .digest("hex"),
  }));
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();

try {
  for (const width of [320, 390, 768, 1440]) {
    const height = width < 740 ? 844 : width === 768 ? 1024 : 1000;
    const context = await browser.newContext({
      viewport: { width, height },
      locale: "ru-RU",
      timezoneId: "Europe/Moscow",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const ready = async () => {
      await page.waitForFunction(
        () => document.body.dataset.revisionReady === "true",
      );
      await page.evaluate(() => document.fonts.ready);
    };

    for (const file of files) {
      await page.goto(`${base}${file}.html`);
      await ready();
      const view = page.locator("[data-view]:not([hidden])");
      await expect(view).toHaveCount(1);
      await expect(page.locator("dialog[open]")).toHaveCount(1);
      await expect(page.locator("dialog:modal")).toHaveCount(
        width < 740 ? 1 : 0,
      );
      await expect(
        page.locator(".bottom-nav, .site-footer, .review-link"),
      ).toHaveCount(0);
      await expect(page.locator(".sidebar-support")).toHaveCount(1);
      await expect(view.locator('a[href*="report.html"]')).toHaveCount(0);
      const layout = await page.evaluate(() => {
        const sheet = document.querySelector("dialog")!;
        const view = document.querySelector("[data-view]:not([hidden])")!;
        const bounds = sheet.getBoundingClientRect();
        return {
          scrollWidth: document.documentElement.scrollWidth,
          sheetScrollWidth: sheet.scrollWidth,
          sheetClientWidth: sheet.clientWidth,
          sheet: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          },
          heading: view.querySelector("h1")?.textContent,
          font: getComputedStyle(view).fontFamily,
        };
      });
      expect(layout.scrollWidth).toBeLessThanOrEqual(width);
      expect(layout.sheetScrollWidth).toBeLessThanOrEqual(
        layout.sheetClientWidth,
      );
      await page.screenshot({
        path: resolve(output, `${file}-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
      captures.push({ file, width, height, ...layout });
    }

    await page.goto(`${base}chat.html`);
    await ready();
    const composer = page.getByLabel("Сообщение", { exact: true });
    await composer.fill("Черновик остаётся в чате");
    await page
      .getByRole("link", { name: "Добавить к встрече", exact: true })
      .click();
    await page
      .locator("[data-revision-menu]")
      .getByText("Предложить место", { exact: true })
      .click();
    const place = page.locator('[data-view="place"]');
    await place.getByLabel("Почему здесь").fill("Большой стол");
    await place
      .locator(width < 740 ? ".revision-close" : ".revision-back")
      .click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(composer).toHaveValue("Черновик остаётся в чате");
    await page.goForward();
    await expect(place.getByLabel("Почему здесь")).toHaveValue("Большой стол");
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await page.getByLabel("О встрече", { exact: true }).click();
    const info = page.locator('[data-view="info"]');
    await info.getByText("Пригласить друзей", { exact: true }).click();
    await expect(page.locator('[data-view="share"]')).toBeVisible();
    await expect(info).not.toBeVisible();
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await page
      .locator('[data-view="share"]')
      .locator(width < 740 ? ".revision-close" : ".revision-back")
      .click();
    await expect(info).toBeVisible();
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await page.goBack();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(composer).toHaveValue("Черновик остаётся в чате");
    if (width < 740) {
      await page.goto(`${base}action-date.html`);
      await ready();
      await page.evaluate(() => {
        const dialog = document.querySelector<HTMLDialogElement>("dialog")!;
        dialog.style.setProperty("--revision-viewport-height", "430px");
        const content = document.querySelector<HTMLElement>(
          '[data-view="date"] .panel',
        )!;
        content.style.fontSize = "200%";
        content.scrollTop = content.scrollHeight;
      });
      const close = page.locator('[data-view="date"] .revision-close');
      await expect(close).toBeInViewport();
      await expect(close).toBeVisible();
      expect(
        await page
          .locator('[data-view="date"] .panel')
          .evaluate((node) => node.scrollTop),
      ).toBeGreaterThan(0);
      await page.screenshot({
        path: resolve(output, `action-date-constrained-${width}.png`),
        animations: "disabled",
      });
      await close.click();
      await expect(page.locator("dialog[open]")).toHaveCount(0);
    }
    await context.close();
  }

  writeFileSync(
    resolve(output, "checks.json"),
    JSON.stringify(
      {
        status: "rendered-behavior-checked-awaiting-visual-inspection",
        capturedAt: new Date().toISOString(),
        browser: browser.version(),
        node: process.version,
        platform: process.platform,
        locale: "ru-RU",
        timezone: "Europe/Moscow",
        deviceScaleFactor: 1,
        textScale: 1,
        inputs,
        captures,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
