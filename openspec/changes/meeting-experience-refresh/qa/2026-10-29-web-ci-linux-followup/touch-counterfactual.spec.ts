import { test } from "@playwright/test";
import "../../../../../frontend/web/tests/52-album-touch.spec";

// The original test and every assertion run unchanged in both projects.
test.beforeEach(async ({ page }, info) => {
  if (info.project.name === "counterfactual-photo-no-pan") {
    await page.addInitScript(() => {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          const style = document.createElement("style");
          style.dataset["touchDiagnostic"] = "photo-no-pan";
          style.textContent =
            'dialog[aria-label="Фото встречи"] > div { touch-action: none !important; }';
          document.head.append(style);
        },
        { once: true },
      );
    });
  }

  await page.addInitScript(() => {
    const events: unknown[] = [];
    Reflect.set(window, "__touchDiagnostic", events);
    for (const type of [
      "touchstart",
      "touchend",
      "touchcancel",
      "click",
      "scroll",
      "scrollend",
    ]) {
      document.addEventListener(
        type,
        (event) => {
          const target = event.target;
          queueMicrotask(() =>
            events.push({
              type,
              time: performance.now(),
              trusted: event.isTrusted,
              defaultPrevented: event.defaultPrevented,
              target: target instanceof Element ? target.tagName : null,
              action:
                target instanceof Element
                  ? target.closest("button")?.getAttribute("aria-label")
                  : null,
              touchAction:
                target instanceof Element
                  ? getComputedStyle(target).touchAction
                  : null,
              scrollY,
            }),
          );
        },
        { capture: true, passive: true },
      );
    }
  });
});

test.afterEach(async ({ page }, info) => {
  const events: unknown = await page.evaluate(() =>
    Reflect.get(window, "__touchDiagnostic"),
  );
  await info.attach(`${info.project.name}-browser-input`, {
    body: JSON.stringify(events),
    contentType: "application/json",
  });
});
