"use strict";

// openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/probe-fit.ts
var import_test = require("@playwright/test");
var import_node_crypto = require("node:crypto");
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
var root = (0, import_node_path.join)(
  process.cwd(),
  "openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat"
);
var runName = process.argv[2] ?? "run06-before";
var run = async () => {
  const output = (0, import_node_path.join)(root, "render", runName);
  await (0, import_promises.mkdir)(output, { recursive: true });
  const browser = await import_test.chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });
  const metrics = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(
      "http://127.0.0.1:8786/revisions/2026-10-27-telegram-chat/index.html"
    );
    const frame = page.frameLocator("#preview");
    const input = frame.locator("#message-input");
    await input.waitFor();
    const snapshot = async (step) => {
      const parent = await page.evaluate(() => {
        const holder = document.querySelector("#viewport-holder");
        const preview = document.querySelector("#preview");
        return {
          scrollY,
          bodyScroll: document.body.scrollTop,
          htmlScroll: document.documentElement.scrollTop,
          holderScrollTop: holder.scrollTop,
          holderScrollLeft: holder.scrollLeft,
          holderScrollHeight: holder.scrollHeight,
          holderClientHeight: holder.clientHeight,
          holderRect: holder.getBoundingClientRect().toJSON(),
          frameRect: preview.getBoundingClientRect().toJSON()
        };
      });
      const child = await frame.locator("body").evaluate(() => {
        const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect().toJSON();
        return {
          draft: document.querySelector("#message-input").value,
          innerHeight,
          scrollY,
          bodyScroll: document.body.scrollTop,
          htmlScroll: document.documentElement.scrollTop,
          viewport: visualViewport ? {
            height: visualViewport.height,
            offsetTop: visualViewport.offsetTop,
            pageTop: visualViewport.pageTop,
            scale: visualViewport.scale
          } : null,
          visibleHeight: getComputedStyle(
            document.documentElement
          ).getPropertyValue("--visible-height"),
          app: rect(".chat-app"),
          header: rect(".chat-header"),
          sheet: rect("#sheet"),
          focusFilter: document.activeElement?.getAttribute("data-filter"),
          filterStates: [
            ...document.querySelectorAll(
              ".reactor-filters button"
            )
          ].map((button) => ({
            filter: button.dataset.filter,
            pressed: button.getAttribute("aria-pressed")
          })),
          focused: document.activeElement?.outerHTML.slice(0, 200)
        };
      });
      metrics.push({ step, parent, child });
      if (runName !== "run06-before" && (parent.holderScrollTop !== 0 || parent.holderScrollLeft !== 0 || Math.abs(parent.frameRect.y - parent.holderRect.y - 1) > 1)) {
        errors.push(`${step}: scaled frame moved inside holder`);
      }
    };
    await snapshot("start");
    await input.fill("\u0412\u043E\u0437\u044C\u043C\u0443 \u043F\u0438\u0446\u0446\u0443 \u0437\u0430\u0432\u0442\u0440\u0430");
    await input.press("Home");
    for (let index = 0; index < 7; index += 1) {
      await input.press("ArrowRight");
    }
    for (let index = 0; index < 5; index += 1) {
      await input.press("Shift+ArrowRight");
    }
    await snapshot("typed-and-selected");
    await frame.locator("#emoji-button").click();
    await snapshot("emoji-open");
    await frame.locator('[data-emoji-search="composer"]').fill("\u043F\u0438\u0446\u0446\u0430");
    await snapshot("emoji-search");
    await frame.locator('[data-action="insert-emoji"][data-emoji="\u{1F355}"]').click();
    await snapshot("emoji-inserted");
    await frame.locator("#emoji-button").click();
    await snapshot("keyboard-return");
    await frame.locator('[data-action="reaction-open"][data-message-id="m3"]').click();
    await snapshot("quick-reactions");
    await frame.locator('[data-action="pick-reaction"][data-emoji="\u{1F44D}"]').click();
    await snapshot("reaction-added");
    await frame.locator('[data-action="reactors"][data-message-id="m3"]').click();
    await snapshot("reactors-open");
    if (runName === "run08-focus" || runName === "run09-final") {
      for (let index = 0; index < 4; index += 1) {
        await page.keyboard.press("Tab");
      }
      const before = await frame.locator("body").evaluate(() => document.activeElement?.getAttribute("data-filter"));
      if (before !== "\u{1F355}") {
        errors.push(`Keyboard did not reach pizza filter: ${before}`);
      }
      await page.keyboard.press("Enter");
      const selected = await frame.locator("body").evaluate(() => ({
        filter: document.activeElement?.getAttribute("data-filter"),
        pressed: document.activeElement?.getAttribute("aria-pressed"),
        count: document.querySelectorAll(
          '.reactor-filters [aria-pressed="true"]'
        ).length
      }));
      if (selected.filter !== "\u{1F355}" || selected.pressed !== "true" || selected.count !== 1) {
        errors.push(
          `Filter focus/selected state failed: ${JSON.stringify(selected)}`
        );
      }
    } else {
      await frame.locator('[data-action="reactor-filter"][data-filter="\u{1F355}"]').click();
    }
    await frame.locator("#sheet").evaluate(async (element) => {
      await Promise.all(
        element.getAnimations().map((animation) => animation.finished.catch(() => void 0))
      );
    });
    await snapshot("pizza-filter");
    await page.screenshot({ path: (0, import_node_path.join)(output, "reactors-fit-chain.png") });
    await frame.locator('#sheet [data-action="close-sheet"]').click();
    await frame.locator("#sheet-overlay").waitFor({ state: "hidden" });
    await snapshot("closed");
    await page.screenshot({ path: (0, import_node_path.join)(output, "chat-after-close.png") });
  } catch (error) {
    errors.push(String(error));
    await page.screenshot({ path: (0, import_node_path.join)(output, "failure.png") });
  } finally {
    const inputs = Object.fromEntries(
      await Promise.all(
        ["generated/chat.js", "generated/workbench.js", "workbench.css"].map(
          async (file) => [
            file,
            (0, import_node_crypto.createHash)("sha256").update(await (0, import_promises.readFile)((0, import_node_path.join)(root, file))).digest("hex")
          ]
        )
      )
    );
    await (0, import_promises.writeFile)(
      (0, import_node_path.join)(output, "metrics.json"),
      JSON.stringify({ inputs, metrics, errors }, null, 2)
    );
    await browser.close();
    console.log(JSON.stringify({ output, errors, metrics }));
  }
};
void run();
