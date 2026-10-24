import type { Page, Route } from '@playwright/test';

export const holdRequests = async (page: Page, pattern: string) => {
  const pending: Route[] = [];
  await page.route(pattern, (route) => {
    pending.push(route);
  });

  return async () => {
    await Promise.all(
      pending
        .filter((route) => !route.request().failure())
        .map((route) => route.continue()),
    );
    await page.unroute(pattern);
  };
};
