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

    try {
      for (const [action, calendar] of [
        ['Календарь', true],
        ['Прошедшие', true],
        ['Список', false],
        ['Предстоящие', false],
        ['Календарь', true],
        ['Следующий месяц', true],
      ] as const) {
        hold = true;
        await page.getByRole('button', { name: new RegExp(`^${action}`) }).click();
        // A previously visited tab may use cached data; any new request remains pending.
        await expect(header.getByRole('link', { name: 'Создать встречу' })).toHaveCount(
          calendar && width <= 1180 ? 1 : 0,
        );
        await expect(page.getByTestId('home-empty')).toBeVisible({
          visible: !calendar || width > 1180,
        });
        await expect(
          page.getByRole('link', { name: 'Создать встречу', exact: true }),
        ).toHaveCount(1);
        hold = false;
        pending.splice(0).forEach((release) => release());
        await expect(header.getByRole('link', { name: 'Создать встречу' })).toHaveCount(
          calendar && width <= 1180 ? 1 : 0,
        );
      }
    } finally {
      hold = false;
      pending.splice(0).forEach((release) => release());
    }
  });
}
