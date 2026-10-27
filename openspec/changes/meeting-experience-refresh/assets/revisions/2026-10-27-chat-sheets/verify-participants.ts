import { chromium, expect } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const directory = dirname(fileURLToPath(import.meta.url));
const output = resolve(
  directory,
  "render-participants",
  process.env.SOMEWHERE_PARTICIPANTS_RUN ?? "run01",
);
const base = "http://127.0.0.1:8784/revisions/2026-10-27-chat-sheets/";
const inputNames = [
  "meeting-participants-organizer.html",
  "meeting-participants-member.html",
  "participants.css",
  "participants.js",
  "participants.ts",
  "revision.css",
  "revision-tokens.css",
  "revision.js",
  "../../styles.css",
  "verify-participants.ts",
];
const inputs = inputNames.map((path) => ({
  path,
  sha256: createHash("sha256")
    .update(readFileSync(resolve(directory, path)))
    .digest("hex"),
}));
const captures: Record<string, unknown>[] = [];
const browser = await chromium.launch();
mkdirSync(output, { recursive: true });
let currentPage;

try {
  for (const role of ["organizer", "member"]) {
    for (const [width, height] of [
      [320, 844],
      [390, 844],
      [768, 1024],
      [1440, 1000],
      [320, 430],
      [390, 430],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        locale: "ru-RU",
        timezoneId: "Europe/Moscow",
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      currentPage = page;
      await page.goto(`${base}meeting-participants-${role}.html`);
      await page.waitForFunction(
        () => document.body.dataset.revisionReady === "true",
      );
      await page.evaluate(() => document.fonts.ready);
      const info = page.locator('[data-view="info"]');
      const panel = info.locator(".panel");
      const heading = info.locator("h1");
      const close = info.locator(
        width < 740 ? ".revision-close" : ".revision-back",
      );
      const collapse = info.locator("[data-participants-collapse]");
      const toggle = info.locator("[data-participants-toggle]");
      const full = info.locator("[data-participants-expanded]");
      const actions =
        role === "organizer"
          ? info.getByRole("button", {
              name: "Изменить настройки",
              exact: true,
            })
          : info.getByRole("button", { name: "Не смогу", exact: true });
      await expect(info).toBeVisible();
      await expect(full.locator("li")).toHaveCount(6);
      await expect(page.locator("dialog[open]")).toHaveCount(1);
      await expect(page.locator("dialog:modal")).toHaveCount(
        width < 740 ? 1 : 0,
      );
      await expect(
        info.locator(".cover, .site-footer, .bottom-nav"),
      ).toHaveCount(0);
      await expect(
        info.getByText("Пригласить друзей", { exact: true }),
      ).toHaveCount(role === "organizer" ? 1 : 0);
      const session = await context.newCDPSession(page);
      await session.send("DOM.enable");
      await session.send("CSS.enable");
      const document = await session.send("DOM.getDocument");
      const node = await session.send("DOM.querySelector", {
        nodeId: document.root.nodeId,
        selector: '[data-view="info"] h1',
      });
      const fonts = await session.send("CSS.getPlatformFontsForNode", {
        nodeId: node.nodeId,
      });
      await session.detach();
      const capture = async (state: string) => {
        const layout = await page.evaluate(() => {
          const sheet = document.querySelector("dialog")!;
          const view = document.querySelector('[data-view="info"]')!;
          const panel = view.querySelector(".panel")!;
          const rect = (element: Element) => {
            const r = element.getBoundingClientRect();
            return {
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              bottom: r.bottom,
            };
          };
          return {
            viewport: { width: innerWidth, height: innerHeight },
            scrollWidth: document.documentElement.scrollWidth,
            sheet: rect(sheet),
            panel: rect(panel),
            scrollTop: panel.scrollTop,
            scrollHeight: panel.scrollHeight,
            heading: rect(view.querySelector("h1")!),
            close: rect(
              view.querySelector(
                innerWidth < 740 ? ".revision-close" : ".revision-back",
              )!,
            ),
            fontFamily: getComputedStyle(view).fontFamily,
            focus:
              document.activeElement?.getAttribute("aria-label") ??
              document.activeElement?.textContent?.trim(),
          };
        });
        expect(layout.viewport).toEqual({ width, height });
        expect(layout.scrollWidth).toBeLessThanOrEqual(width);
        if (width < 740) {
          expect(layout.close.y).toBeGreaterThanOrEqual(0);
          expect(layout.close.bottom).toBeLessThanOrEqual(height);
          expect(layout.heading.y).toBeGreaterThanOrEqual(0);
          expect(layout.heading.bottom).toBeLessThanOrEqual(height);
          expect(layout.sheet.bottom).toBeLessThanOrEqual(height);
        }
        const name = `${role}-${state}-${width}x${height}.png`;
        await page.screenshot({
          path: resolve(output, name),
          fullPage: width >= 740,
          animations: "disabled",
        });
        captures.push({
          role,
          state,
          file: name,
          sha256: createHash("sha256")
            .update(readFileSync(resolve(output, name)))
            .digest("hex"),
          fonts: fonts.fonts,
          ...layout,
        });
      };

      await capture("expanded-top");
      await actions.scrollIntoViewIfNeeded();
      await expect(actions).toBeInViewport();
      if (width < 740) await expect(close).toBeInViewport();
      await capture("expanded-bottom");
      await collapse.scrollIntoViewIfNeeded();
      await collapse.click();
      await expect(full).toBeHidden();
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(
        info.getByRole("heading", { name: "Кто придёт", exact: true }),
      ).toBeVisible();
      await expect(actions).toBeVisible();
      await capture("compact");
      await toggle.click();
      await expect(full).toBeVisible();
      await expect(collapse).toBeFocused();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(
        info.getByRole("heading", { name: "Участники", exact: true }),
      ).toBeVisible();
      await close.click();
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      const composer = page.getByLabel("Сообщение", { exact: true });
      await composer.fill("Черновик после просмотра состава");
      await page.getByLabel("О встрече", { exact: true }).click();
      await expect(info).toBeVisible();
      await expect(full).toBeVisible();
      if (role === "organizer") {
        await info.getByText("Пригласить друзей", { exact: true }).click();
        const share = page.locator('[data-view="share"]');
        await expect(share).toBeVisible();
        await expect(info).toBeHidden();
        await expect(page.locator("dialog[open]")).toHaveCount(1);
        await share
          .locator(width < 740 ? ".revision-close" : ".revision-back")
          .click();
        await expect(info).toBeVisible();
      }
      await close.click();
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      await expect(composer).toHaveValue("Черновик после просмотра состава");
      await expect(page.getByLabel("О встрече", { exact: true })).toBeFocused();
      await context.close();
    }
  }
  writeFileSync(
    resolve(output, "checks.json"),
    JSON.stringify(
      {
        status:
          "rendered-interactions-checked-awaiting-independent-visual-inspection",
        capturedAt: new Date().toISOString(),
        browser: browser.version(),
        node: process.version,
        os: { platform: os.platform(), release: os.release() },
        locale: "ru-RU",
        timezone: "Europe/Moscow",
        deviceScaleFactor: 1,
        textScale: 1,
        reducedMotion: "reduce",
        notes: [
          "Реальный заданный viewport 320/390 × 430; это не проверка IME или browser zoom.",
          "Кнопки настроек/RSVP в макете не имитируют API; проверяется доступность состава действий.",
          "12 цепочек expanded → compact → expanded → chat → info → chat; для organizer также Share → info.",
        ],
        inputs,
        captures,
      },
      null,
      2,
    ) + "\n",
  );
} catch (error) {
  await currentPage?.screenshot({
    path: resolve(output, "failure.png"),
    fullPage: true,
  });
  writeFileSync(
    resolve(output, "failure.json"),
    JSON.stringify({ message: String(error), captures, inputs }, null, 2) +
      "\n",
  );
  throw error;
} finally {
  await browser.close();
}
