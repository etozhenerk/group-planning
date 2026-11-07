import type { Page } from '@playwright/test';

export const holdNextGet = async (page: Page, url: string) => {
  const control: { started: () => void; finish: (status: number) => void } = {
    started: () => undefined,
    finish: () => undefined,
  };

  const requested = new Promise<void>((resolve) => {
    control.started = resolve;
  });

  const response = new Promise<number>((resolve) => {
    control.finish = resolve;
  });

  await page.route(url, async (route) => {
    control.started();
    const status = await response;

    await route.fulfill({ status, contentType: 'application/json', body: '{}' });
    await page.unroute(url);
  });

  return { requested, finish: control.finish };
};
