import { createHash } from "node:crypto";
import { chromium, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const output = join(
  root,
  "openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/render",
  process.argv.includes("--fit-only")
    ? "run05"
    : process.argv.includes("--participants-only")
      ? "run04"
      : process.argv.includes("--workbench-only")
        ? "run03"
        : "run02",
);
const base = "http://127.0.0.1:8786/revisions/2026-10-27-telegram-chat/";
const checks: { name: string; passed: boolean; detail?: unknown }[] = [];
const errors: string[] = [];

const check = (name: string, passed: boolean, detail?: unknown): void => {
  checks.push({ name, passed, detail });
};

const open = async (page: Page, view = "chat"): Promise<void> => {
  await page.goto(`${base}chat.html?view=${view}`);
  await page.locator("#composer").waitFor();

  if (view !== "chat") {
    await page.waitForTimeout(200);
  }
};

const inspectBounds = async (page: Page, label: string): Promise<void> => {
  const bounds = await page.evaluate(() => {
    const rect = (selector: string): DOMRect =>
      document.querySelector(selector)!.getBoundingClientRect();
    const send = rect("#send-button");
    const picker = document.querySelector<HTMLElement>("#reaction-host");
    const overflow = [
      ...document.querySelectorAll<HTMLElement>(
        ".sheet-scroll, .emoji-results, .message-list",
      ),
    ]
      .filter(
        (element) =>
          element.getClientRects().length &&
          element.scrollWidth > element.clientWidth + 1,
      )
      .map((element) => element.className);
    return {
      width: innerWidth,
      height: innerHeight,
      sendBottom: send.bottom,
      sendRight: send.right,
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      pickerBottom:
        picker && !picker.hidden ? picker.getBoundingClientRect().bottom : null,
      conversationBottom: rect("#conversation").bottom,
      overflow,
    };
  });
  check(
    `${label}: нет горизонтального overflow`,
    !bounds.pageOverflow && !bounds.overflow.length,
    bounds.overflow,
  );
  check(
    `${label}: отправка в viewport`,
    bounds.sendBottom <= bounds.height + 1 &&
      bounds.sendRight <= bounds.width + 1,
    bounds,
  );

  if (bounds.pickerBottom !== null) {
    check(
      `${label}: реакции не перекрывают composer`,
      bounds.pickerBottom <= bounds.conversationBottom + 1,
      bounds,
    );
  }
};

const workbenchCheck = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}index.html`);
  await page.frameLocator("#preview").locator("#composer").waitFor();
  await page.locator("details summary").click();
  await page.locator("#place-poll").uncheck();
  await page.locator('[data-scenario="place"]').click();
  const frame = page.frameLocator("#preview");
  await frame.locator('input[name="place"]').fill("В кафе у парка");
  await frame
    .locator('textarea[name="why"]')
    .fill("Большой стол и тихая веранда");
  await frame
    .locator('button[type="submit"]')
    .filter({ hasText: "Создать опрос" })
    .click();
  check(
    "Доступное создание места",
    await frame
      .locator("#message-list")
      .innerText()
      .then(
        (value) =>
          value.includes("В кафе у парка") && value.includes("Большой стол"),
      ),
  );
  await page.screenshot({ path: join(output, "workbench-1440x1000.png") });
};

const participantsCheck = async (page: Page): Promise<void> => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 320, height: 760 },
    { width: 390, height: 430 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await open(page, "info");
    const label = `${size.width}x${size.height}`;
    check(
      `${label}: текущий состав = 4`,
      (await page.locator(".people-section .section-label").innerText())
        .trim()
        .endsWith("4"),
    );
    check(
      `${label}: оставшийся участник +1`,
      (await page.locator(".people-more").innerText()) === "+1",
    );
    await inspectBounds(page, `info-compact-${label}`);
    await page.screenshot({ path: join(output, `info-compact-${label}.png`) });
    await page.locator(".people-summary").click();
    check(
      `${label}: все шесть ответов раскрыты`,
      (await page.locator(".people-list .person-row").count()) === 6,
    );
    check(
      `${label}: полный список включает Возможно и Не смогу`,
      await page
        .locator(".people-list")
        .innerText()
        .then(
          (value) => value.includes("Возможно") && value.includes("Не смогу"),
        ),
    );
    await inspectBounds(page, `info-expanded-${label}`);
    await page.screenshot({ path: join(output, `info-expanded-${label}.png`) });
    await page.locator(".people-list .text-button").click();
    check(
      `${label}: сворачивание возвращает 4`,
      (await page.locator(".people-section .section-label").innerText())
        .trim()
        .endsWith("4"),
    );
  }
};

const fitCheck = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${base}index.html`);
  const frame = page.frameLocator("#preview");
  await frame.locator("#composer").waitFor();
  await page.locator('[data-scenario="emoji"]').click();
  const size = await frame
    .locator("body")
    .evaluate(() => ({ width: innerWidth, height: innerHeight }));
  check(
    "Workbench сохраняет реальный viewport 390×844",
    size.width === 390 && size.height === 844,
    size,
  );
  const bounds = await page.locator("#viewport-holder").boundingBox();
  check(
    "Workbench целиком помещается в 1280×720",
    Boolean(
      bounds &&
      bounds.y + bounds.height <= 720 &&
      bounds.x + bounds.width <= 1280,
    ),
    bounds,
  );
  check(
    "Масштаб указан",
    (await page.locator("#scale-label").innerText()).includes("%"),
  );
  await page.screenshot({ path: join(output, "workbench-fit-1280x720.png") });
  await page.locator('[data-width="320"]').click();
  const narrow = await frame
    .locator("body")
    .evaluate(() => ({ width: innerWidth, height: innerHeight }));
  check(
    "Workbench меняет реальный viewport на 320×760",
    narrow.width === 320 && narrow.height === 760,
    narrow,
  );
  await page.screenshot({
    path: join(output, "workbench-fit-320-1280x720.png"),
  });
};

const run = async (): Promise<void> => {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    if (process.argv.includes("--fit-only")) {
      await fitCheck(page);
      return;
    }

    if (process.argv.includes("--participants-only")) {
      await participantsCheck(page);
      return;
    }

    if (process.argv.includes("--workbench-only")) {
      await workbenchCheck(page);
      return;
    }

    await open(page);
    const input = page.locator("#message-input");
    await input.fill("До тест после");
    await input.evaluate((element: HTMLTextAreaElement) =>
      element.setSelectionRange(3, 7),
    );
    await page.locator("#emoji-button").click();
    await page.locator('[data-emoji-search="composer"]').fill("пицца");
    await page.locator('[data-action="insert-emoji"][data-emoji="🍕"]').click();
    check(
      "Замена выделения без отправки",
      (await input.inputValue()) === "До 🍕 после" &&
        (await page.locator(".message").count()) === 3,
    );
    await page.locator("#emoji-button").click();
    const selection = await input.evaluate((element: HTMLTextAreaElement) => [
      element.selectionStart,
      element.selectionEnd,
    ]);
    check(
      "Возврат курсора после emoji",
      selection[0] === 5 && selection[1] === 5,
      selection,
    );
    await input.fill("Семья ");
    await page.locator("#emoji-button").click();
    await page.locator('[data-emoji-search="composer"]').fill("семья");
    await page.locator('[data-action="insert-emoji"][data-emoji="👨‍👩‍👧"]').click();
    await page.locator('[data-action="emoji-backspace"]').click();
    check(
      "Backspace удаляет составной grapheme",
      (await input.inputValue()) === "Семья ",
    );
    await page.locator('[data-emoji-search="composer"]').fill("ыыыыы");
    check(
      "Пустой русский поиск",
      await page.locator(".emoji-empty").isVisible(),
    );
    await page.locator('[data-action="clear-emoji-search"]').click();
    check(
      "Очистка поиска сохраняет сообщение",
      (await input.inputValue()) === "Семья ",
    );
    await page.locator("#emoji-button").click();
    await page.locator('[data-action="open-info"]').last().click();
    await page.locator('#sheet [data-action="info-share"]').click();
    check(
      "Одна панель в info→Share",
      (await page.locator(".sheet:visible").count()) === 1,
    );
    await page.locator('[data-action="close-sheet"]').last().click();
    await page
      .locator("#sheet-title")
      .filter({ hasText: "Вечер без планов" })
      .waitFor();
    await page.keyboard.press("Escape");
    await page.locator("#sheet-overlay").waitFor({ state: "hidden" });
    check(
      "Черновик после info→Share→info→chat",
      (await input.inputValue()) === "Семья ",
    );
    await page
      .locator('[data-action="reaction-open"][data-message-id="m3"]')
      .click();
    await page.locator('[data-action="expand-reaction"]').click();
    await page.locator('[data-emoji-search="reaction"]').fill("сердце");
    await page
      .locator('[data-action="pick-reaction"][data-emoji="❤️"]')
      .click();
    check(
      "Реакция отражается на выбранном bubble",
      (await page
        .locator('[data-message="m3"] [data-emoji="❤️"]')
        .getAttribute("aria-pressed")) === "true",
    );
    await page.locator('[data-message="m3"] [data-emoji="❤️"]').click();
    check(
      "Повтор снимает свою реакцию",
      (await page.locator('[data-message="m3"] [data-emoji="❤️"]').count()) ===
        0,
    );
    await page
      .locator('[data-action="reactors"][data-message-id="m3"]')
      .click();
    check(
      "Имена людей доступны",
      await page
        .locator(".reactor-list")
        .innerText()
        .then((value) => value.includes("Лена") && value.includes("Маша")),
    );
    await page.keyboard.press("Escape");
    await page.locator("#sheet-overlay").waitFor({ state: "hidden" });
    await page.locator('[data-action="open-task"]').click();
    await page.locator("#sheet [data-action='task-accept']").click();
    check(
      "Явное принятие задачи",
      (await page.locator(".task-state").innerText()) === "Исполняет Саша",
    );
    await page.locator("#sheet [data-action='task-complete']").click();
    check(
      "Задачу выполняет исполнитель",
      (await page.locator(".task-state").innerText()) === "Выполнено",
    );
    await open(page, "date");
    check(
      "Пять настроек даты",
      (await page.locator(".switch-row").count()) === 5,
    );
    check(
      "При двух датах нет удаления",
      (await page.locator('[data-action="remove-date"]').count()) === 0,
    );
    await page.locator('[data-action="add-date"]').click();
    check(
      "После третьей даты есть удаление",
      (await page.locator('[data-action="remove-date"]').count()) === 3,
    );
    await page.locator('[data-target="date-0"]').click();
    await page.locator('[data-action="pick-date"]').first().click();
    check(
      "Дата показана по-русски",
      /[а-я]/.test(await page.locator("#date-0-value").innerText()),
    );

    for (const size of [
      { width: 390, height: 844 },
      { width: 320, height: 760 },
      { width: 390, height: 430 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(size);

      for (const view of [
        "chat",
        "emoji",
        "quick",
        "reactions",
        "info",
        "settings",
        "task",
        "date",
      ]) {
        await open(page, view);
        const label = `${view}-${size.width}x${size.height}`;
        await inspectBounds(page, label);
        await page.screenshot({ path: join(output, `${label}.png`) });

        if (view === "emoji") {
          const dimensions = await page
            .locator(".emoji-choice")
            .evaluateAll((elements) =>
              elements.map((element) => ({
                width: element.getBoundingClientRect().width,
                height: element.getBoundingClientRect().height,
              })),
            );
          check(
            `${label}: emoji target ≥44`,
            dimensions.every((item) => item.width >= 44 && item.height >= 44),
            dimensions,
          );
        }
      }
    }

    await workbenchCheck(page);
  } catch (error) {
    errors.push(String(error));
    await page.screenshot({ path: join(output, "failure.png") });
  } finally {
    check("Браузерный сценарий без ошибок", errors.length === 0, errors);
    const bundleHash = createHash("sha256")
      .update(
        await readFile(
          join(
            root,
            "openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/generated/chat.js",
          ),
        ),
      )
      .digest("hex");
    await writeFile(
      join(output, "checks.json"),
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          scope: "prototype-only",
          bundleSha256: bundleHash,
          browser: await browser.version(),
          checks,
          errors,
        },
        null,
        2,
      ),
    );
    await browser.close();
    console.log(
      JSON.stringify({
        checks: checks.length,
        failures: checks.filter((item) => !item.passed),
        output,
      }),
    );
  }
};

void run();
