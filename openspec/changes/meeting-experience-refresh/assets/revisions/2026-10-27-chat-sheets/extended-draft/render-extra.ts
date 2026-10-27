import { chromium, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const run = async () => {
  const directory = dirname(fileURLToPath(import.meta.url));
  const assets = resolve(directory, "../../..");
  const output = resolve(directory, "renders", "supplement01");
  mkdirSync(output, { recursive: true });
  const hash = (path: string) =>
    createHash("sha256").update(readFileSync(path)).digest("hex");
  const inputs = [
    "render-extra.ts",
    "date-full.html",
    "task-offered.html",
    "task-accepted.html",
    "extended.js",
    "extended.css",
    "date-source.css",
    "provenance.json",
  ].map((path) => ({ path, sha256: hash(resolve(directory, path)) }));
  const server = createServer((request, response) => {
    const path = resolve(
      assets,
      `.${new URL(request.url ?? "/", "http://localhost").pathname}`,
    );
    if (!path.startsWith(`${assets}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      response.setHeader(
        "Content-Type",
        (
          {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "text/javascript",
            ".png": "image/png",
            ".svg": "image/svg+xml",
          } as Record<string, string>
        )[extname(path)] ?? "application/octet-stream",
      );
      response.end(readFileSync(path));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Нет временного порта");
  const base = `http://127.0.0.1:${address.port}/revisions/2026-10-27-chat-sheets/extended-draft/`;
  let browser;
  const interactions: unknown[] = [];
  const captures: unknown[] = [];
  const errors: string[] = [];
  try {
    browser = await chromium.launch();
    for (const [width, height] of [
      [320, 430],
      [390, 844],
      [1440, 1000],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        locale: "ru-RU",
        timezoneId: "Europe/Moscow",
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const capture = async (name: string) => {
        const session = await context.newCDPSession(page);
        await session.send("DOM.enable");
        await session.send("CSS.enable");
        const tree = await session.send("DOM.getDocument");
        const title = await session.send("DOM.querySelector", {
          nodeId: tree.root.nodeId,
          selector: "[data-view]:not([hidden]) h1",
        });
        const fonts = await session.send("CSS.getPlatformFontsForNode", {
          nodeId: title.nodeId,
        });
        await session.detach();
        const file = `${name}-${width}x${height}.png`;
        await page.screenshot({
          path: resolve(output, file),
          fullPage: width >= 740,
        });
        captures.push({
          file,
          sha256: hash(resolve(output, file)),
          capturedAt: new Date().toISOString(),
          viewport: { width, height },
          runtime: `Chromium ${browser?.version()}; Node ${process.version}`,
          fonts: fonts.fonts,
          locale: "ru-RU",
          timezone: "Europe/Moscow",
          textScale: 1,
          deviceScaleFactor: 1,
          reducedMotion: "reduce",
          os: `${os.type()} ${os.release()} ${os.arch()}`,
        });
      };
      await page.goto(`${base}date-full.html?sample=network`);
      await page.waitForFunction(
        () => document.body.dataset.revisionReady === "true",
      );
      const date = page.locator('[data-view="date-full"]');
      const error = date.locator("[data-date-send-error]");
      const retry = date.locator("[data-submit-date]");
      await expect(error).toBeVisible();
      await expect(retry).toHaveText("Повторить");
      if (width < 740) {
        await expect(error).toBeInViewport();
        await expect(retry).toBeInViewport();
      }
      await capture("date-network");
      await retry.click();
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      interactions.push({
        at: new Date().toISOString(),
        width,
        height,
        action: "Ошибка отправки даты → Повторить",
        actual:
          "Сообщение и CTA видны; локальный переход в чат, без заявления о сетевом сохранении",
      });

      await page.goto(`${base}date-full.html`);
      await page.waitForFunction(
        () => document.body.dataset.revisionReady === "true",
      );
      await date.locator("[data-date-option]").first().fill("2026-11-20");
      if (width < 740) await page.mouse.click(5, 5);
      else await page.keyboard.press("Escape");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      await page.goForward();
      await expect(date).toBeVisible();
      await expect(date.locator("[data-date-option]").first()).toHaveValue(
        "2026-11-20",
      );
      await page.goBack();
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      interactions.push({
        at: new Date().toISOString(),
        width,
        height,
        action: "Фон на mobile / Escape на desktop → Forward → browser Back",
        actual: "Форма закрыта, ввод сохранился, история вернула тот же чат",
      });

      for (const task of ["task-offered", "task-accepted"]) {
        await page.goto(`${base}${task}.html?sample=long`);
        await page.waitForFunction(
          () => document.body.dataset.revisionReady === "true",
        );
        const view = page.locator(`[data-view="${task}"]`);
        const decline = view.getByRole("button", {
          name: "Отказаться",
          exact: true,
        });
        await decline.scrollIntoViewIfNeeded();
        await expect(decline).toBeInViewport();
        if (width < 740)
          await expect(view.locator(".revision-close")).toBeInViewport();
        await capture(`${task}-long-decline`);
        await decline.click();
        await expect(page.locator('[data-view="task-declined"]')).toBeVisible();
        await expect(
          page.locator('[data-view="task-declined"] .panel button'),
        ).toHaveCount(0);
        interactions.push({
          at: new Date().toISOString(),
          width,
          height,
          action: `${task} → Отказаться`,
          actual:
            "Действие доступно после прокрутки длинного заголовка; отказ без оставшихся активных кнопок",
        });
      }
      await context.close();
    }
  } catch (error) {
    errors.push(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    process.exitCode = 1;
  } finally {
    await browser?.close();
    await new Promise<void>((done) => server.close(() => done()));
    writeFileSync(
      resolve(output, "checks.json"),
      JSON.stringify(
        {
          kind: "draft-render-supplement",
          productAcceptance: false,
          published: false,
          base,
          inputs,
          captures,
          interactions,
          errors,
          finishedAt: new Date().toISOString(),
          serverClosed: true,
          browserClosed: true,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      JSON.stringify({
        output,
        captures: captures.length,
        interactions: interactions.length,
        errors: errors.length,
        serverClosed: true,
        browserClosed: true,
      }),
    );
  }
};
void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
