import { chromium } from "@playwright/test";
import fs from "node:fs";
import { z } from "zod";
type ReferenceCheck = {
  id: string;
  width?: number;
  platform?: string;
  state?: string | null;
  metrics: Record<string, unknown>;
};
const root = "openspec/changes/mobile-mvp-design-refresh";
const out = root + "/preparation/reference-check";
fs.mkdirSync(out, { recursive: true });
const refs = z
  .array(
    z.object({
      id: z.string(),
      normalized: z.string(),
      selectors: z.array(z.string()),
    }),
  )
  .parse(
    JSON.parse(fs.readFileSync(root + "/preparation/references.json", "utf8")),
  );
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 874 } });
const results: ReferenceCheck[] = [];
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
for (const ref of refs) {
  const state =
    ref.id === "map"
      ? "map"
      : ref.id === "documents"
        ? "privacy"
        : ref.id === "onboarding"
          ? null
          : ref.selectors[0];
  for (const width of [320, 390, 739]) {
    await page.setViewportSize({ width, height: 874 });
    await page.goto(
      "http://127.0.0.1:8846/" +
        ref.normalized +
        (state ? "?state=" + state : ""),
    );
    await page.waitForTimeout(350);
    const metrics = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth > innerWidth,
      avatars: [...document.querySelectorAll('[data-testid="avatar"]')].length,
      initials: [...document.querySelectorAll('[data-testid="avatar"]')].filter(
        (x) => !x.querySelector("img,svg"),
      ).length,
      oldBack: [...document.querySelectorAll("a,button")].filter(
        (x) =>
          x.textContent?.trim().startsWith("←") ||
          x.textContent?.trim() === "Назад",
      ).length,
      mapActions: [...document.querySelectorAll("button")].filter(
        (x) => x.textContent?.trim() === "Выбрать на карте",
      ).length,
      title: document.title,
    }));
    if (width === 390) {
      await page.screenshot({ path: out + "/" + ref.id + ".png" });
    }
    results.push({ id: ref.id, width, state, metrics });
  }
}
for (const platform of ["web", "ios", "android"]) {
  for (const state of ["busy", "error", "cancelled", "success"]) {
    await page.setViewportSize({ width: 320, height: 600 });
    await page.goto(
      "http://127.0.0.1:8846/" +
        refs.find((x) => x.id === "onboarding")!.normalized +
        "?platform=" +
        platform +
        "&entry-state=" +
        state,
    );
    await page.waitForTimeout(400);
    results.push({
      id: "onboarding",
      platform,
      state,
      metrics: await page.evaluate(() => ({
        oldBack: [...document.querySelectorAll("button")].filter(
          (x) => x.textContent?.trim() === "← Назад",
        ).length,
        cancelButton: [...document.querySelectorAll("button")].some(
          (x) => x.textContent?.trim() === "Отменить",
        ),
        entryState: document.body.dataset.entryState,
        visibleText: document.body.innerText.slice(-250),
      })),
    });
    if (platform === "web")
      await page.screenshot({ path: out + "/entry-" + state + ".png" });
  }
}
fs.writeFileSync(
  out + "/results.json",
  JSON.stringify(
    {
      scope: "Просмотр производных макетов, не client acceptance",
      browser: browser.version(),
      errors,
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    {
      checks: results.length,
      errors,
      issues: results.filter(
        (x) =>
          x.metrics.horizontal ||
          x.metrics.initials ||
          x.metrics.oldBack ||
          x.metrics.cancelButton,
      ),
    },
    null,
    2,
  ),
);
process.exitCode =
  errors.length ||
  results.some(
    (x) =>
      x.metrics.horizontal ||
      x.metrics.initials ||
      x.metrics.oldBack ||
      x.metrics.cancelButton,
  )
    ? 1
    : 0;
await browser.close();
