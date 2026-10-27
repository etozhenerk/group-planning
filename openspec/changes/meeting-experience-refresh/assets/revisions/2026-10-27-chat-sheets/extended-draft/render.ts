import { chromium, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const run = async () => {
  const directory = dirname(fileURLToPath(import.meta.url));
  const assets = resolve(directory, "../../..");
  const output = resolve(
    directory,
    "renders",
    process.env.SOMEWHERE_DRAFT_RUN ?? "run01",
  );
  mkdirSync(output, { recursive: true });
  const sha = (path: string) =>
    createHash("sha256").update(readFileSync(path)).digest("hex");
  const inputs = readdirSync(directory)
    .filter((name) => /\.(?:ts|js|css|html|json)$/.test(name))
    .sort()
    .map((name) => ({ path: name, sha256: sha(resolve(directory, name)) }));
  const sourceProvenance = JSON.parse(
    readFileSync(resolve(directory, "provenance.json"), "utf8"),
  );
  const startedAt = new Date().toISOString();
  const captures: Record<string, unknown>[] = [];
  const interactions: Record<string, unknown>[] = [];
  const errors: string[] = [];
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(
      new URL(request.url ?? "/", "http://localhost").pathname,
    );
    const path = resolve(assets, `.${pathname}`);

    if (!path.startsWith(`${assets}${sep}`)) {
      response.writeHead(403).end();

      return;
    }

    try {
      response.setHeader(
        "Content-Type",
        (
          {
            ".html": "text/html; charset=utf-8",
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
    throw new Error("Нет адреса локального сервера");

  const base = `http://127.0.0.1:${address.port}/revisions/2026-10-27-chat-sheets/extended-draft/`;
  let browser;
  let currentPage: Page | undefined;
  let runtime = "not launched";
  const record = (scenario: string, action: string, actual: unknown) =>
    interactions.push({
      at: new Date().toISOString(),
      scenario,
      action,
      actual,
    });
  const activeView = (page: Page) => page.locator("[data-view]:not([hidden])");
  const capture = async (page: Page, name: string) => {
    const view = activeView(page);
    const layout = await view.evaluate((node) => {
      const panel = node.querySelector(".panel");
      const close = node.querySelector(
        innerWidth < 740 ? ".revision-close" : ".revision-back",
      );

      const bounds = [];
      for (const element of [
        document.querySelector("dialog"),
        panel,
        node.querySelector("h1"),
        close,
        node.querySelector(".sheet-footer"),
      ]) {
        if (!element) {
          bounds.push(null);
          continue;
        }
        const r = element.getBoundingClientRect();
        bounds.push({
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          bottom: r.bottom,
          right: r.right,
        });
      }

      return {
        viewport: { width: innerWidth, height: innerHeight },
        pageScrollWidth: document.documentElement.scrollWidth,
        pageScrollHeight: document.documentElement.scrollHeight,
        sheet: bounds[0],
        panel: bounds[1],
        panelScrollTop: panel?.scrollTop,
        panelScrollHeight: panel?.scrollHeight,
        title: bounds[2],
        close: bounds[3],
        dateFooter: bounds[4],
        computedFont: getComputedStyle(node).fontFamily,
        focus:
          document.activeElement?.getAttribute("aria-label") ??
          document.activeElement?.textContent?.trim(),
      };
    });
    const context = page.context();
    const session = await context.newCDPSession(page);
    await session.send("DOM.enable");
    await session.send("CSS.enable");
    const cdpDocument = await session.send("DOM.getDocument");
    const title = await session.send("DOM.querySelector", {
      nodeId: cdpDocument.root.nodeId,
      selector: "[data-view]:not([hidden]) h1",
    });
    const fonts = await session.send("CSS.getPlatformFontsForNode", {
      nodeId: title.nodeId,
    });
    await session.detach();
    const image = `${name}.png`;
    await page.screenshot({
      path: resolve(output, image),
      fullPage: layout.viewport.width >= 740,
      animations: "disabled",
    });
    const metadata = {
      file: image,
      sha256: sha(resolve(output, image)),
      capturedAt: new Date().toISOString(),
      url: page.url(),
      runtime,
      os: `${os.type()} ${os.release()} ${os.arch()}`,
      locale: "ru-RU",
      timezone: "Europe/Moscow",
      deviceScaleFactor: 1,
      textScale: 1,
      reducedMotion: "reduce",
      fonts: fonts.fonts,
      ...layout,
    };
    writeFileSync(
      resolve(output, `${name}.json`),
      JSON.stringify(metadata, null, 2) + "\n",
    );
    captures.push(metadata);
    expect(
      layout.pageScrollWidth,
      `${name}: horizontal overflow`,
    ).toBeLessThanOrEqual(layout.viewport.width);

    if (layout.viewport.width < 740) {
      for (const [label, bounds] of [
        ["title", layout.title],
        ["close", layout.close],
        ["sheet", layout.sheet],
        ["date CTA", layout.dateFooter],
      ] as const) {
        if (bounds) {
          expect(
            bounds.y,
            `${name}: ${label} above viewport`,
          ).toBeGreaterThanOrEqual(-1);
          expect(
            bounds.bottom,
            `${name}: ${label} below viewport`,
          ).toBeLessThanOrEqual(layout.viewport.height + 1);
        }
      }
    }
  };

  try {
    browser = await chromium.launch();
    runtime = `Chromium ${browser.version()}; Node ${process.version}`;
    const jobs: {
      view: string;
      width: number;
      height: number;
      sample?: string;
    }[] = [];

    for (const view of [
      "date-full",
      "file-error",
      "settings",
      "reaction-people",
    ]) {
      for (const [width, height] of [
        [320, 844],
        [390, 844],
        [768, 1024],
        [1440, 1000],
      ])
        jobs.push({ view, width, height });
    }
    for (const view of [
      "task-offered",
      "task-accepted",
      "task-organizer",
      "task-declined",
      "task-completed",
      "task-cancelled",
    ]) {
      for (const [width, height] of [
        [390, 844],
        [1440, 1000],
      ])
        jobs.push({ view, width, height });
    }
    for (const view of ["date-full", "settings", "task-accepted"]) {
      for (const width of [320, 390])
        jobs.push({
          view,
          width,
          height: 430,
          ...(view === "task-accepted" ? { sample: "long" } : {}),
        });
    }

    for (const job of jobs) {
      const { view: id, width, height, sample } = job;
      const name = `${id}-${width}x${height}${sample ? `-${sample}` : ""}`;
      const context = await browser.newContext({
        viewport: { width, height },
        locale: "ru-RU",
        timezoneId: "Europe/Moscow",
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      currentPage = page;
      page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
      await page.goto(`${base}${id}.html${sample ? `?sample=${sample}` : ""}`);
      await page.waitForFunction(
        () => document.body.dataset.revisionReady === "true",
      );
      await page.evaluate(() => document.fonts.ready);
      const view = page.locator(`[data-view="${id}"]`);
      await expect(view).toBeVisible();
      await expect(page.locator("dialog[open]")).toHaveCount(1);
      await expect(page.locator("dialog:modal")).toHaveCount(
        width < 740 ? 1 : 0,
      );
      await expect(view.locator(".site-footer, .bottom-nav")).toHaveCount(0);
      record(name, "Открыта форма по ссылке", {
        active: id,
        modal: width < 740,
      });
      await capture(page, `${name}-initial`);

      if (id === "date-full") {
        const dates = view.locator("[data-date-option]");
        await expect(dates).toHaveCount(3);
        await expect(view.locator('[role="switch"]')).toHaveCount(5);
        await view.getByLabel("Удалить вариант 3", { exact: true }).click();
        await expect(dates).toHaveCount(2);
        await expect(view.locator("[data-remove-date]:visible")).toHaveCount(0);
        await view.locator("[data-add-date]").click();
        await expect(dates).toHaveCount(3);
        await expect(view.locator("[data-remove-date]:visible")).toHaveCount(3);
        await expect(dates.nth(2)).toBeFocused();
        await dates.nth(2).fill("2026-11-02");
        record(
          name,
          "Удалить третий вариант и добавить снова",
          "3 → 2 → 3; удаление скрыто при двух, фокус в добавленном поле",
        );
        await dates.nth(0).fill("");
        await view.locator("[data-submit-date]").click();
        await expect(dates.nth(0)).toBeFocused();
        await expect(
          view.getByText("Выберите дату", { exact: true }),
        ).toBeVisible();
        await capture(page, `${name}-missing-error`);
        await dates.nth(0).fill("2026-11-01");
        await view.locator("[data-submit-date]").click();
        await expect(dates.nth(1)).toBeFocused();
        await expect(
          view.getByText("Такая дата уже есть", { exact: true }),
        ).toBeVisible();
        record(
          name,
          "Пустая и повторная дата при отправке",
          "Ошибка под полем; фокус первого ошибочного поля; форма остаётся открыта",
        );
        await dates.nth(0).fill("2026-10-31");
        for (let index = 3; index < 9; index++) {
          await view.locator("[data-add-date]").click();
          await dates
            .nth(index)
            .fill(`2026-11-${String(index + 1).padStart(2, "0")}`);
        }
        const body = view.locator(".sheet-content");
        await body.evaluate((node) => {
          node.scrollTop = 0;
          node.dispatchEvent(new Event("scroll"));
        });
        if (width < 740)
          await expect(view.locator(".sheet-footer")).toHaveAttribute(
            "data-more",
            "true",
          );
        await body.evaluate((node) => {
          node.scrollTop = node.scrollHeight;
          node.dispatchEvent(new Event("scroll"));
        });
        await expect(view.locator(".sheet-footer")).toHaveAttribute(
          "data-more",
          "false",
        );
        await capture(page, `${name}-long-bottom`);
        await view
          .locator(width < 740 ? ".revision-close" : ".revision-back")
          .click();
        await expect(page.locator("dialog[open]")).toHaveCount(0);
        const composer = page.getByLabel("Сообщение", { exact: true });
        await composer.fill("Сохранённый черновик чата");
        await page.getByRole("link", { name: "Добавить к встрече", exact: true }).click();
        await page
          .locator("[data-revision-menu]")
          .getByText("Предложить дату", { exact: true })
          .click();
        await expect(dates).toHaveCount(9);
        await expect(dates.nth(0)).toHaveValue("2026-10-31");
        await expect(composer).toHaveValue("Сохранённый черновик чата");
        await page.keyboard.press("Escape");
        await expect(page.locator("dialog[open]")).toHaveCount(0);
        record(
          name,
          "Прокрутка/CTA, закрытие, повторное открытие и Escape",
          "9 дат и черновик чата сохранены; header/X и CTA проверены в mobile кадрах; тень исчезла в конце тела",
        );
      } else if (id === "settings") {
        await view
          .getByLabel("Название", { exact: true })
          .fill("Настолки и пицца у Саши");
        await view.locator("[data-remove-cover]").click();
        await expect(view.locator(".upload-grid")).toBeHidden();
        await view.locator("[data-cover-choice]").click();
        await expect(view.locator(".upload-grid")).toBeVisible();
        await view
          .getByRole("button", { name: "Сохранить", exact: true })
          .scrollIntoViewIfNeeded();
        await capture(page, `${name}-actions`);
        await view
          .locator(width < 740 ? ".revision-close" : ".revision-back")
          .click();
        await expect(page.locator("dialog[open]")).toHaveCount(0);
        await page.goForward();
        await expect(view).toBeVisible();
        await expect(view.getByLabel("Название", { exact: true })).toHaveValue(
          "Настолки и пицца у Саши",
        );
        await view.getByRole("button", { name: "Отмена", exact: true }).click();
        await expect(page.locator("dialog[open]")).toHaveCount(0);
        record(
          name,
          "Правка названия, убрать/вернуть cover, X, Forward, Отмена",
          "Тот же демонстрационный cover и черновик остаются; системный picker/API отсутствуют",
        );
      } else if (id === "file-error") {
        const caption = view.getByLabel("Подпись", { exact: true });
        await caption.fill("Правила к нашей встрече");
        await expect(view.getByRole("alert")).toHaveText(
          "Не удалось загрузить файл. Попробуйте ещё раз.",
        );
        await expect(caption).toHaveAttribute("maxlength", "2000");
        await view
          .locator(width < 740 ? ".revision-close" : ".revision-back")
          .click();
        await page.getByRole("link", { name: "Добавить к встрече", exact: true }).click();
        await page
          .locator("[data-revision-menu]")
          .getByText("Файл", { exact: true })
          .click();
        await expect(caption).toHaveValue("Правила к нашей встрече");
        await view.getByText("Повторить", { exact: true }).click();
        await expect(page.locator("dialog[open]")).toHaveCount(0);
        record(
          name,
          "Ввод подписи, закрытие/открытие через Файл, Повторить",
          "Подпись сохранена до повтора; повтор только закрывает макет, не имитирует загрузку",
        );
      } else if (id === "reaction-people") {
        await expect(view.locator("li")).toHaveCount(3);
        await expect(view.locator("li")).toHaveText([
          "ССаша",
          "ЛЛена",
          "ММиша",
        ]);
        await expect(view.locator(".panel a, .panel button")).toHaveCount(0);
        await page.keyboard.press("Escape");
        await expect(page.locator("dialog[open]")).toHaveCount(0);
        record(
          name,
          "Просмотр списка по 👍 и Escape",
          "Три имени, без контактов или новых действий; возврат в тот же чат",
        );
      } else {
        const targets = {
          "task-offered": ["Принять задачу", "task-accepted"],
          "task-accepted": ["Отметить выполненной", "task-completed"],
          "task-organizer": ["Отменить задачу", "task-cancelled"],
        } as Record<string, string[]>;
        const target = targets[id];
        if (target) {
          await view
            .getByRole("button", { name: target[0], exact: true })
            .scrollIntoViewIfNeeded();
          if (height === 430) await capture(page, `${name}-actions`);
          await view
            .getByRole("button", { name: target[0], exact: true })
            .click();
          await expect(
            page.locator(`[data-view="${target[1]}"]`),
          ).toBeVisible();
          await expect(page.locator("dialog[open]")).toHaveCount(1);
          record(
            name,
            target[0],
            `Локальное состояние ${target[1]}, без API и смены прав`,
          );
        } else {
          await expect(view.locator(".panel button")).toHaveCount(0);
          record(name, "Терминальное состояние", "Действий изменения нет");
        }
      }
      await context.close();
      currentPage = undefined;
      console.log(`Проверен черновик: ${name}`);
    }
    expect(errors).toEqual([]);
  } catch (error) {
    errors.push(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    if (currentPage && !currentPage.isClosed()) {
      await currentPage
        .screenshot({ path: resolve(output, "failure.png"), fullPage: true })
        .catch(() => {});
      writeFileSync(
        resolve(output, "failure.html"),
        await currentPage.content(),
      );
    }
    process.exitCode = 1;
  } finally {
    await browser?.close();
    await new Promise<void>((done) => server.close(() => done()));
    writeFileSync(
      resolve(output, "checks.json"),
      JSON.stringify(
        {
          kind: "draft-render-and-interaction",
          productAcceptance: false,
          published: false,
          startedAt,
          finishedAt: new Date().toISOString(),
          base,
          runtime,
          os: `${os.type()} ${os.release()} ${os.arch()}`,
          inputs,
          sourceProvenance,
          captures,
          interactions,
          errors,
          limitations: [
            "Статичные черновики, не живое приложение и не API",
            "Системная клавиатура/VoiceOver/TalkBack не проверены",
            "HTML date input не утверждает календарь сервиса",
            "PNG не являются pixel regression",
          ],
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
