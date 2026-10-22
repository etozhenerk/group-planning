import { test, expect } from '@playwright/test';
import { login } from '@tests/helpers';
import { calendarResponse } from '@tests/calendar-helpers';

for (const width of [320, 1440]) {
  test(`empty account keeps create placement while switching filters at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await login(page, 'Саша');
    let hold = false;
    const pending: (() => void)[] = [];
    await page.route('**/api/v1/meetings?*', async (route) => {
      if (hold) {
        await new Promise<void>((resolve) => pending.push(resolve));
      }

      await route.fulfill({ json: calendarResponse([], route.request().url()) });
    });
    await page.goto('/meetings');
    await expect(page.getByTestId('home-empty')).toBeVisible();
    const header = page.getByTestId('page-heading');
    await header.evaluate((element) => {
      element.setAttribute('data-create-insertions', '0');
      new MutationObserver((records) => {
        const inserted = records.some((record) =>
          [...record.addedNodes].some(
            (node) =>
              node instanceof Element &&
              (node.matches('a[href="/meetings/new"]') ||
                node.querySelector('a[href="/meetings/new"]')),
          ),
        );

        if (inserted) {
          element.setAttribute(
            'data-create-insertions',
            String(Number(element.getAttribute('data-create-insertions')) + 1),
          );
        }
      }).observe(element, { childList: true, subtree: true });
    });

    try {
      for (const action of [
        'Календарь',
        'Прошедшие',
        'Список',
        'Предстоящие',
        'Календарь',
        'Следующий месяц',
      ]) {
        hold = true;
        await page.getByRole('button', { name: new RegExp(`^${action}`) }).click();
        // A previously visited tab may use cached data; any new request remains pending.
        await expect(header.getByRole('link', { name: 'Создать встречу' })).toHaveCount(
          0,
        );
        await expect(page.getByTestId('home-empty')).toBeVisible();
        await expect(
          page.getByRole('link', { name: 'Создать встречу', exact: true }),
        ).toHaveCount(1);
        hold = false;
        pending.splice(0).forEach((release) => release());
        await expect(header).toHaveAttribute('data-create-insertions', '0');
      }
    } finally {
      hold = false;
      pending.splice(0).forEach((release) => release());
    }
  });
}
