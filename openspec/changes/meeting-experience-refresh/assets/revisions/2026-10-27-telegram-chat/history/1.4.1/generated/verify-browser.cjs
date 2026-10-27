"use strict";

// openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/verify-browser.ts
var import_node_crypto = require("node:crypto");
var import_test = require("@playwright/test");
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
var root = process.cwd();
var output = (0, import_node_path.join)(
  root,
  "openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/render",
  process.argv.includes("--fit-only") ? "run05" : process.argv.includes("--participants-only") ? "run04" : process.argv.includes("--workbench-only") ? "run03" : "run02"
);
var base = "http://127.0.0.1:8786/revisions/2026-10-27-telegram-chat/";
var checks = [];
var errors = [];
var check = (name, passed, detail) => {
  checks.push({ name, passed, detail });
};
var open = async (page, view = "chat") => {
  await page.goto(`${base}chat.html?view=${view}`);
  await page.locator("#composer").waitFor();
  if (view !== "chat") {
    await page.waitForTimeout(200);
  }
};
var inspectBounds = async (page, label) => {
  const bounds = await page.evaluate(() => {
    const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
    const send = rect("#send-button");
    const picker = document.querySelector("#reaction-host");
    const overflow = [
      ...document.querySelectorAll(
        ".sheet-scroll, .emoji-results, .message-list"
      )
    ].filter(
      (element) => element.getClientRects().length && element.scrollWidth > element.clientWidth + 1
    ).map((element) => element.className);
    return {
      width: innerWidth,
      height: innerHeight,
      sendBottom: send.bottom,
      sendRight: send.right,
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      pickerBottom: picker && !picker.hidden ? picker.getBoundingClientRect().bottom : null,
      conversationBottom: rect("#conversation").bottom,
      overflow
    };
  });
  check(
    `${label}: \u043D\u0435\u0442 \u0433\u043E\u0440\u0438\u0437\u043E\u043D\u0442\u0430\u043B\u044C\u043D\u043E\u0433\u043E overflow`,
    !bounds.pageOverflow && !bounds.overflow.length,
    bounds.overflow
  );
  check(
    `${label}: \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u0432 viewport`,
    bounds.sendBottom <= bounds.height + 1 && bounds.sendRight <= bounds.width + 1,
    bounds
  );
  if (bounds.pickerBottom !== null) {
    check(
      `${label}: \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u043D\u0435 \u043F\u0435\u0440\u0435\u043A\u0440\u044B\u0432\u0430\u044E\u0442 composer`,
      bounds.pickerBottom <= bounds.conversationBottom + 1,
      bounds
    );
  }
};
var workbenchCheck = async (page) => {
  await page.setViewportSize({ width: 1440, height: 1e3 });
  await page.goto(`${base}index.html`);
  await page.frameLocator("#preview").locator("#composer").waitFor();
  await page.locator("details summary").click();
  await page.locator("#place-poll").uncheck();
  await page.locator('[data-scenario="place"]').click();
  const frame = page.frameLocator("#preview");
  await frame.locator('input[name="place"]').fill("\u0412 \u043A\u0430\u0444\u0435 \u0443 \u043F\u0430\u0440\u043A\u0430");
  await frame.locator('textarea[name="why"]').fill("\u0411\u043E\u043B\u044C\u0448\u043E\u0439 \u0441\u0442\u043E\u043B \u0438 \u0442\u0438\u0445\u0430\u044F \u0432\u0435\u0440\u0430\u043D\u0434\u0430");
  await frame.locator('button[type="submit"]').filter({ hasText: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043E\u043F\u0440\u043E\u0441" }).click();
  check(
    "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043C\u0435\u0441\u0442\u0430",
    await frame.locator("#message-list").innerText().then(
      (value) => value.includes("\u0412 \u043A\u0430\u0444\u0435 \u0443 \u043F\u0430\u0440\u043A\u0430") && value.includes("\u0411\u043E\u043B\u044C\u0448\u043E\u0439 \u0441\u0442\u043E\u043B")
    )
  );
  await page.screenshot({ path: (0, import_node_path.join)(output, "workbench-1440x1000.png") });
};
var participantsCheck = async (page) => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 320, height: 760 },
    { width: 390, height: 430 },
    { width: 844, height: 390 }
  ]) {
    await page.setViewportSize(size);
    await open(page, "info");
    const label = `${size.width}x${size.height}`;
    check(
      `${label}: \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u0441\u043E\u0441\u0442\u0430\u0432 = 4`,
      (await page.locator(".people-section .section-label").innerText()).trim().endsWith("4")
    );
    check(
      `${label}: \u043E\u0441\u0442\u0430\u0432\u0448\u0438\u0439\u0441\u044F \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A +1`,
      await page.locator(".people-more").innerText() === "+1"
    );
    await inspectBounds(page, `info-compact-${label}`);
    await page.screenshot({ path: (0, import_node_path.join)(output, `info-compact-${label}.png`) });
    await page.locator(".people-summary").click();
    check(
      `${label}: \u0432\u0441\u0435 \u0448\u0435\u0441\u0442\u044C \u043E\u0442\u0432\u0435\u0442\u043E\u0432 \u0440\u0430\u0441\u043A\u0440\u044B\u0442\u044B`,
      await page.locator(".people-list .person-row").count() === 6
    );
    check(
      `${label}: \u043F\u043E\u043B\u043D\u044B\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0438 \u041D\u0435 \u0441\u043C\u043E\u0433\u0443`,
      await page.locator(".people-list").innerText().then(
        (value) => value.includes("\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E") && value.includes("\u041D\u0435 \u0441\u043C\u043E\u0433\u0443")
      )
    );
    await inspectBounds(page, `info-expanded-${label}`);
    await page.screenshot({ path: (0, import_node_path.join)(output, `info-expanded-${label}.png`) });
    await page.locator(".people-list .text-button").click();
    check(
      `${label}: \u0441\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 4`,
      (await page.locator(".people-section .section-label").innerText()).trim().endsWith("4")
    );
  }
};
var fitCheck = async (page) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${base}index.html`);
  const frame = page.frameLocator("#preview");
  await frame.locator("#composer").waitFor();
  await page.locator('[data-scenario="emoji"]').click();
  const size = await frame.locator("body").evaluate(() => ({ width: innerWidth, height: innerHeight }));
  check(
    "Workbench \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0439 viewport 390\xD7844",
    size.width === 390 && size.height === 844,
    size
  );
  const bounds = await page.locator("#viewport-holder").boundingBox();
  check(
    "Workbench \u0446\u0435\u043B\u0438\u043A\u043E\u043C \u043F\u043E\u043C\u0435\u0449\u0430\u0435\u0442\u0441\u044F \u0432 1280\xD7720",
    Boolean(
      bounds && bounds.y + bounds.height <= 720 && bounds.x + bounds.width <= 1280
    ),
    bounds
  );
  check(
    "\u041C\u0430\u0441\u0448\u0442\u0430\u0431 \u0443\u043A\u0430\u0437\u0430\u043D",
    (await page.locator("#scale-label").innerText()).includes("%")
  );
  await page.screenshot({ path: (0, import_node_path.join)(output, "workbench-fit-1280x720.png") });
  await page.locator('[data-width="320"]').click();
  const narrow = await frame.locator("body").evaluate(() => ({ width: innerWidth, height: innerHeight }));
  check(
    "Workbench \u043C\u0435\u043D\u044F\u0435\u0442 \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0439 viewport \u043D\u0430 320\xD7760",
    narrow.width === 320 && narrow.height === 760,
    narrow
  );
  await page.screenshot({
    path: (0, import_node_path.join)(output, "workbench-fit-320-1280x720.png")
  });
};
var run = async () => {
  await (0, import_promises.mkdir)(output, { recursive: true });
  const browser = await import_test.chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1
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
    await input.fill("\u0414\u043E \u0442\u0435\u0441\u0442 \u043F\u043E\u0441\u043B\u0435");
    await input.evaluate(
      (element) => element.setSelectionRange(3, 7)
    );
    await page.locator("#emoji-button").click();
    await page.locator('[data-emoji-search="composer"]').fill("\u043F\u0438\u0446\u0446\u0430");
    await page.locator('[data-action="insert-emoji"][data-emoji="\u{1F355}"]').click();
    check(
      "\u0417\u0430\u043C\u0435\u043D\u0430 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u044F \u0431\u0435\u0437 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438",
      await input.inputValue() === "\u0414\u043E \u{1F355} \u043F\u043E\u0441\u043B\u0435" && await page.locator(".message").count() === 3
    );
    await page.locator("#emoji-button").click();
    const selection = await input.evaluate((element) => [
      element.selectionStart,
      element.selectionEnd
    ]);
    check(
      "\u0412\u043E\u0437\u0432\u0440\u0430\u0442 \u043A\u0443\u0440\u0441\u043E\u0440\u0430 \u043F\u043E\u0441\u043B\u0435 emoji",
      selection[0] === 5 && selection[1] === 5,
      selection
    );
    await input.fill("\u0421\u0435\u043C\u044C\u044F ");
    await page.locator("#emoji-button").click();
    await page.locator('[data-emoji-search="composer"]').fill("\u0441\u0435\u043C\u044C\u044F");
    await page.locator('[data-action="insert-emoji"][data-emoji="\u{1F468}\u200D\u{1F469}\u200D\u{1F467}"]').click();
    await page.locator('[data-action="emoji-backspace"]').click();
    check(
      "Backspace \u0443\u0434\u0430\u043B\u044F\u0435\u0442 \u0441\u043E\u0441\u0442\u0430\u0432\u043D\u043E\u0439 grapheme",
      await input.inputValue() === "\u0421\u0435\u043C\u044C\u044F "
    );
    await page.locator('[data-emoji-search="composer"]').fill("\u044B\u044B\u044B\u044B\u044B");
    check(
      "\u041F\u0443\u0441\u0442\u043E\u0439 \u0440\u0443\u0441\u0441\u043A\u0438\u0439 \u043F\u043E\u0438\u0441\u043A",
      await page.locator(".emoji-empty").isVisible()
    );
    await page.locator('[data-action="clear-emoji-search"]').click();
    check(
      "\u041E\u0447\u0438\u0441\u0442\u043A\u0430 \u043F\u043E\u0438\u0441\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435",
      await input.inputValue() === "\u0421\u0435\u043C\u044C\u044F "
    );
    await page.locator("#emoji-button").click();
    await page.locator('[data-action="open-info"]').last().click();
    await page.locator('#sheet [data-action="info-share"]').click();
    check(
      "\u041E\u0434\u043D\u0430 \u043F\u0430\u043D\u0435\u043B\u044C \u0432 info\u2192Share",
      await page.locator(".sheet:visible").count() === 1
    );
    await page.locator('[data-action="close-sheet"]').last().click();
    await page.locator("#sheet-title").filter({ hasText: "\u0412\u0435\u0447\u0435\u0440 \u0431\u0435\u0437 \u043F\u043B\u0430\u043D\u043E\u0432" }).waitFor();
    await page.keyboard.press("Escape");
    await page.locator("#sheet-overlay").waitFor({ state: "hidden" });
    check(
      "\u0427\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u043F\u043E\u0441\u043B\u0435 info\u2192Share\u2192info\u2192chat",
      await input.inputValue() === "\u0421\u0435\u043C\u044C\u044F "
    );
    await page.locator('[data-action="reaction-open"][data-message-id="m3"]').click();
    await page.locator('[data-action="expand-reaction"]').click();
    await page.locator('[data-emoji-search="reaction"]').fill("\u0441\u0435\u0440\u0434\u0446\u0435");
    await page.locator('[data-action="pick-reaction"][data-emoji="\u2764\uFE0F"]').click();
    check(
      "\u0420\u0435\u0430\u043A\u0446\u0438\u044F \u043E\u0442\u0440\u0430\u0436\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u043C bubble",
      await page.locator('[data-message="m3"] [data-emoji="\u2764\uFE0F"]').getAttribute("aria-pressed") === "true"
    );
    await page.locator('[data-message="m3"] [data-emoji="\u2764\uFE0F"]').click();
    check(
      "\u041F\u043E\u0432\u0442\u043E\u0440 \u0441\u043D\u0438\u043C\u0430\u0435\u0442 \u0441\u0432\u043E\u044E \u0440\u0435\u0430\u043A\u0446\u0438\u044E",
      await page.locator('[data-message="m3"] [data-emoji="\u2764\uFE0F"]').count() === 0
    );
    await page.locator('[data-action="reactors"][data-message-id="m3"]').click();
    check(
      "\u0418\u043C\u0435\u043D\u0430 \u043B\u044E\u0434\u0435\u0439 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B",
      await page.locator(".reactor-list").innerText().then((value) => value.includes("\u041B\u0435\u043D\u0430") && value.includes("\u041C\u0430\u0448\u0430"))
    );
    await page.keyboard.press("Escape");
    await page.locator("#sheet-overlay").waitFor({ state: "hidden" });
    await page.locator('[data-action="open-task"]').click();
    await page.locator("#sheet [data-action='task-accept']").click();
    check(
      "\u042F\u0432\u043D\u043E\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438",
      await page.locator(".task-state").innerText() === "\u0418\u0441\u043F\u043E\u043B\u043D\u044F\u0435\u0442 \u0421\u0430\u0448\u0430"
    );
    await page.locator("#sheet [data-action='task-complete']").click();
    check(
      "\u0417\u0430\u0434\u0430\u0447\u0443 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442 \u0438\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C",
      await page.locator(".task-state").innerText() === "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E"
    );
    await open(page, "date");
    check(
      "\u041F\u044F\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A \u0434\u0430\u0442\u044B",
      await page.locator(".switch-row").count() === 5
    );
    check(
      "\u041F\u0440\u0438 \u0434\u0432\u0443\u0445 \u0434\u0430\u0442\u0430\u0445 \u043D\u0435\u0442 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F",
      await page.locator('[data-action="remove-date"]').count() === 0
    );
    await page.locator('[data-action="add-date"]').click();
    check(
      "\u041F\u043E\u0441\u043B\u0435 \u0442\u0440\u0435\u0442\u044C\u0435\u0439 \u0434\u0430\u0442\u044B \u0435\u0441\u0442\u044C \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435",
      await page.locator('[data-action="remove-date"]').count() === 3
    );
    await page.locator('[data-target="date-0"]').click();
    await page.locator('[data-action="pick-date"]').first().click();
    check(
      "\u0414\u0430\u0442\u0430 \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u0430 \u043F\u043E-\u0440\u0443\u0441\u0441\u043A\u0438",
      /[а-я]/.test(await page.locator("#date-0-value").innerText())
    );
    for (const size of [
      { width: 390, height: 844 },
      { width: 320, height: 760 },
      { width: 390, height: 430 },
      { width: 844, height: 390 }
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
        "date"
      ]) {
        await open(page, view);
        const label = `${view}-${size.width}x${size.height}`;
        await inspectBounds(page, label);
        await page.screenshot({ path: (0, import_node_path.join)(output, `${label}.png`) });
        if (view === "emoji") {
          const dimensions = await page.locator(".emoji-choice").evaluateAll(
            (elements) => elements.map((element) => ({
              width: element.getBoundingClientRect().width,
              height: element.getBoundingClientRect().height
            }))
          );
          check(
            `${label}: emoji target \u226544`,
            dimensions.every((item) => item.width >= 44 && item.height >= 44),
            dimensions
          );
        }
      }
    }
    await workbenchCheck(page);
  } catch (error) {
    errors.push(String(error));
    await page.screenshot({ path: (0, import_node_path.join)(output, "failure.png") });
  } finally {
    check("\u0411\u0440\u0430\u0443\u0437\u0435\u0440\u043D\u044B\u0439 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u0431\u0435\u0437 \u043E\u0448\u0438\u0431\u043E\u043A", errors.length === 0, errors);
    const bundleHash = (0, import_node_crypto.createHash)("sha256").update(
      await (0, import_promises.readFile)(
        (0, import_node_path.join)(
          root,
          "openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/generated/chat.js"
        )
      )
    ).digest("hex");
    await (0, import_promises.writeFile)(
      (0, import_node_path.join)(output, "checks.json"),
      JSON.stringify(
        {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          scope: "prototype-only",
          bundleSha256: bundleHash,
          browser: await browser.version(),
          checks,
          errors
        },
        null,
        2
      )
    );
    await browser.close();
    console.log(
      JSON.stringify({
        checks: checks.length,
        failures: checks.filter((item) => !item.passed),
        output
      })
    );
  }
};
void run();
