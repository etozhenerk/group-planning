import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(
  process.cwd(),
  "openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat",
);

const run = async (): Promise<void> => {
  const output = join(root, "render/run11-roster-focus");
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  const checks: { name: string; passed: boolean; metrics: unknown }[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    for (const height of [844, 430]) {
      await page.goto(
        "http://127.0.0.1:8786/revisions/2026-10-27-telegram-chat/index.html",
      );
      const frame = page.frameLocator("#preview");
      await frame.locator("#composer").waitFor();

      if (height === 430) {
        await page.locator('[data-width="390"][data-height="430"]').click();
      }

      await frame.locator("#message-input").fill("Возьму пиццу завтра");
      await frame
        .locator('.chat-header .icon-button[data-action="open-info"]')
        .click();
      await frame.locator("#sheet").evaluate(async (element) => {
        await Promise.all(
          element
            .getAnimations()
            .map((animation) => animation.finished.catch(() => undefined)),
        );
      });
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const initial = await frame
        .locator("body")
        .evaluate(() =>
          document.activeElement?.classList.contains("people-summary"),
        );
      checks.push({
        name: `${height}: keyboard reaches compact roster`,
        passed: Boolean(initial),
        metrics: initial,
      });
      await page.keyboard.press("Enter");

      for (const expanded of [true, false]) {
        const metrics = await frame.locator("body").evaluate(() => {
          const active = document.activeElement as HTMLElement;
          const scroll = document.querySelector<HTMLElement>(
            "#sheet .sheet-scroll",
          )!;
          const button = active.getBoundingClientRect();
          const bounds = scroll.getBoundingClientRect();
          return {
            focusAction: active.dataset.action,
            focusedInList: Boolean(active.closest(".people-list")),
            focusedCompact: active.classList.contains("people-summary"),
            focusVisible:
              button.top >= bounds.top - 1 &&
              button.bottom <= bounds.bottom + 1,
            sheetCount: [
              ...document.querySelectorAll<HTMLElement>(".sheet"),
            ].filter((element) => element.getClientRects().length).length,
            draft: (
              document.querySelector("#message-input") as HTMLTextAreaElement
            ).value,
            expanded: document
              .querySelector(".people-summary")
              ?.getAttribute("aria-expanded"),
          };
        });
        const holder = await page
          .locator("#viewport-holder")
          .evaluate((element) => ({
            top: element.scrollTop,
            left: element.scrollLeft,
          }));
        const passed =
          metrics.focusAction === "toggle-people" &&
          (expanded ? metrics.focusedInList : metrics.focusedCompact) &&
          metrics.focusVisible &&
          metrics.sheetCount === 1 &&
          metrics.draft === "Возьму пиццу завтра" &&
          metrics.expanded === String(expanded) &&
          holder.top === 0 &&
          holder.left === 0;
        checks.push({
          name: `${height}: ${expanded ? "expand focuses visible collapse" : "collapse focuses compact opener"}`,
          passed,
          metrics: { ...metrics, holder },
        });
        await page.screenshot({
          path: join(
            output,
            `${expanded ? "expanded" : "compact"}-390x${height}.png`,
          ),
        });

        if (expanded) {
          await page.keyboard.press("Enter");
        }
      }
    }
  } catch (error) {
    errors.push(String(error));
    await page.screenshot({ path: join(output, "failure.png") });
  } finally {
    const inputs = Object.fromEntries(
      await Promise.all(
        ["generated/chat.js", "generated/workbench.js", "workbench.css"].map(
          async (file) => [
            file,
            createHash("sha256")
              .update(await readFile(join(root, file)))
              .digest("hex"),
          ],
        ),
      ),
    );
    await writeFile(
      join(output, "checks.json"),
      JSON.stringify({ inputs, checks, errors }, null, 2),
    );
    await browser.close();
    console.log(JSON.stringify({ output, checks, errors }));
  }
};

void run();
