import { test } from "@playwright/test";
import type { CDPSession } from "@playwright/test";
import "../../../../../frontend/web/tests/52-album-touch.spec";

const traces = new Map<
  string,
  { session: CDPSession; nativeEvents: unknown[] }
>();

// Both projects keep the same assertions and taps; only the gesture driver differs.
test.beforeEach(async ({ page }, info) => {
  const session = await page.context().newCDPSession(page);
  const nativeEvents: unknown[] = [];
  session.on("Tracing.dataCollected", ({ value }: { value: unknown[] }) => {
    for (const event of value) {
      if (
        typeof event === "object" &&
        event !== null &&
        "name" in event &&
        typeof event.name === "string" &&
        /Fling|Tap|Gesture|Touch/i.test(event.name)
      ) {
        nativeEvents.push(event);
        if (nativeEvents.length > 5000) nativeEvents.shift();
      }
    }
  });
  await session.send("Tracing.start", {
    categories: "input,latencyInfo",
    transferMode: "ReportEvents",
  });
  traces.set(info.testId, { session, nativeEvents });

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
  const trace = traces.get(info.testId);
  if (trace) {
    try {
      const complete = new Promise<void>((resolve) =>
        trace.session.once("Tracing.tracingComplete", () => resolve()),
      );
      await trace.session.send("Tracing.end");
      await complete;
      await info.attach(`${info.project.name}-native-gesture-events`, {
        body: JSON.stringify(trace.nativeEvents),
        contentType: "application/json",
      });
    } finally {
      traces.delete(info.testId);
      await trace.session.detach();
    }
  }

  const events: unknown = await page.evaluate(() =>
    Reflect.get(window, "__touchDiagnostic"),
  );
  await info.attach(`${info.project.name}-browser-input`, {
    body: JSON.stringify(events),
    contentType: "application/json",
  });
});
