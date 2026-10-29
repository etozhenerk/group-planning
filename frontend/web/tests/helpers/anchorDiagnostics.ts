import type { Page } from '@playwright/test';

export const recordAnchorDiagnostics = async (page: Page) => {
  await page.addInitScript(() => {
    const samples: unknown[] = [];
    const record = (view: Element, cause: string, stack?: string) => {
      const top = view.getBoundingClientRect().top;
      const row = [...view.querySelectorAll<HTMLElement>('[data-entry-id]')].find(
        (element) =>
          element.dataset.protected !== 'true' &&
          element.getBoundingClientRect().bottom > top,
      );

      samples.push({
        time: performance.now(),
        cause,
        stack,
        scrollTop: view.scrollTop,
        height: view.clientHeight,
        row: row?.dataset.entryId,
        offset: row ? row.getBoundingClientRect().top - top : null,
        transform: row?.style.transform,
        focused: document.activeElement?.tagName,
        visibility: document.visibilityState,
      });
      document.documentElement.dataset.anchorDiagnostics = JSON.stringify(
        samples.slice(-100),
      );
    };

    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
    const nativeSetter: unknown = descriptor ? Reflect.get(descriptor, 'set') : undefined;

    if (descriptor && typeof nativeSetter === 'function') {
      Object.defineProperty(Element.prototype, 'scrollTop', {
        ...descriptor,
        set: new Proxy(nativeSetter as (value: number) => void, {
          apply: (target, receiver: Element, args) => {
            const tracked = receiver.matches('[data-server-count]');

            if (tracked) {
              record(receiver, `set-before:${String(args[0])}`, new Error().stack);
            }

            Reflect.apply(target, receiver, args);

            if (tracked) {
              record(receiver, 'set-after');
            }
          },
        }),
      });
    }

    document.addEventListener(
      'scroll',
      (event) => {
        if (
          event.target instanceof Element &&
          event.target.matches('[data-server-count]')
        ) {
          record(event.target, 'scroll-event');
        }
      },
      true,
    );
  });
};
