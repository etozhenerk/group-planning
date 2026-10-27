"use strict";

// openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/probe-roster.ts
var import_test = require("@playwright/test");
var import_node_crypto = require("node:crypto");
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
var root = (0, import_node_path.join)(
  process.cwd(),
  "openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat"
);
var run = async () => {
  const output = (0, import_node_path.join)(root, "render/run11-roster-focus");
  await (0, import_promises.mkdir)(output, { recursive: true });
  const browser = await import_test.chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });
  const checks = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    for (const height of [844, 430]) {
      await page.goto(
        "http://127.0.0.1:8786/revisions/2026-10-27-telegram-chat/index.html"
      );
      const frame = page.frameLocator("#preview");
      await frame.locator("#composer").waitFor();
      if (height === 430) {
        await page.locator('[data-width="390"][data-height="430"]').click();
      }
      await frame.locator("#message-input").fill("\u0412\u043E\u0437\u044C\u043C\u0443 \u043F\u0438\u0446\u0446\u0443 \u0437\u0430\u0432\u0442\u0440\u0430");
      await frame.locator('.chat-header .icon-button[data-action="open-info"]').click();
      await frame.locator("#sheet").evaluate(async (element) => {
        await Promise.all(
          element.getAnimations().map((animation) => animation.finished.catch(() => void 0))
        );
      });
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const initial = await frame.locator("body").evaluate(
        () => document.activeElement?.classList.contains("people-summary")
      );
      checks.push({
        name: `${height}: keyboard reaches compact roster`,
        passed: Boolean(initial),
        metrics: initial
      });
      await page.keyboard.press("Enter");
      for (const expanded of [true, false]) {
        const metrics = await frame.locator("body").evaluate(() => {
          const active = document.activeElement;
          const scroll = document.querySelector(
            "#sheet .sheet-scroll"
          );
          const button = active.getBoundingClientRect();
          const bounds = scroll.getBoundingClientRect();
          return {
            focusAction: active.dataset.action,
            focusedInList: Boolean(active.closest(".people-list")),
            focusedCompact: active.classList.contains("people-summary"),
            focusVisible: button.top >= bounds.top - 1 && button.bottom <= bounds.bottom + 1,
            sheetCount: [
              ...document.querySelectorAll(".sheet")
            ].filter((element) => element.getClientRects().length).length,
            draft: document.querySelector("#message-input").value,
            expanded: document.querySelector(".people-summary")?.getAttribute("aria-expanded")
          };
        });
        const holder = await page.locator("#viewport-holder").evaluate((element) => ({
          top: element.scrollTop,
          left: element.scrollLeft
        }));
        const passed = metrics.focusAction === "toggle-people" && (expanded ? metrics.focusedInList : metrics.focusedCompact) && metrics.focusVisible && metrics.sheetCount === 1 && metrics.draft === "\u0412\u043E\u0437\u044C\u043C\u0443 \u043F\u0438\u0446\u0446\u0443 \u0437\u0430\u0432\u0442\u0440\u0430" && metrics.expanded === String(expanded) && holder.top === 0 && holder.left === 0;
        checks.push({
          name: `${height}: ${expanded ? "expand focuses visible collapse" : "collapse focuses compact opener"}`,
          passed,
          metrics: { ...metrics, holder }
        });
        await page.screenshot({
          path: (0, import_node_path.join)(
            output,
            `${expanded ? "expanded" : "compact"}-390x${height}.png`
          )
        });
        if (expanded) {
          await page.keyboard.press("Enter");
        }
      }
    }
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
      (0, import_node_path.join)(output, "checks.json"),
      JSON.stringify({ inputs, checks, errors }, null, 2)
    );
    await browser.close();
    console.log(JSON.stringify({ output, checks, errors }));
  }
};
void run();
