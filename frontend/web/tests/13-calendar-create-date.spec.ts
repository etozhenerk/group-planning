import { test, expect } from '@playwright/test';
import { login, expectDate, setDate } from '@tests/helpers';
import { calendarItems, calendarResponse, mockCalendar } from '@tests/calendar-helpers';

for (const width of [320, 1440]) {
  test(`empty calendar keeps the create block still when selecting a day at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await login(page, 'Саша');
    const releases: (() => void)[] = [];
    const pending = new Promise<void>((resolve) => releases.push(resolve));
    const release = () => releases.splice(0).forEach((resolve) => resolve());

    let requested = false;
    await page.route('**/api/v1/meetings?*', async (route) => {
      const url = new URL(route.request().url());

      if (
        url.searchParams.get('from') === '2026-10-24' &&
        url.searchParams.get('to') === '2026-10-25'
      ) {
        requested = true;
        await pending;
      }

      await route.fulfill({ json: calendarResponse([], route.request().url()) });
    });
    await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2026-10-22');
    const empty = page.getByTestId('home-empty');
    const agenda = page.getByRole('region', { name: 'Встречи выбранного дня' });
    await expect(empty).toBeVisible();
    await expect(agenda.getByText('0 встреч', { exact: true })).toBeVisible();
    const top = () =>
      empty.evaluate((node) => node.getBoundingClientRect().top + window.scrollY);

    const before = await top();

    try {
      await page.locator('[data-day="2026-10-24"]').click();
      await expect.poll(() => requested).toBe(true);
      expect(Math.abs((await top()) - before)).toBeLessThan(1);
      release();
      await expect(agenda.getByText('0 встреч', { exact: true })).toBeVisible();
      expect(Math.abs((await top()) - before)).toBeLessThan(1);
    } finally {
      release();
    }
  });
}

test('creation from a calendar day prefills its date and keeps edits after reload', async ({
  page,
}) => {
  await login(page, 'Лена');
  await page.route('**/api/v1/meetings?*', async (route) => {
    await route.fulfill({ json: calendarResponse([], route.request().url()) });
  });
  await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2026-10-22');
  await expect(page.getByTestId('home-empty')).toBeVisible();
  await page.locator('[data-day="2026-10-24"]').click();
  await page.getByRole('link', { name: 'Создать встречу', exact: true }).click();
  await expectDate(page, '24.10.2026');
  await expect(page.getByRole('textbox', { name: 'Время', exact: true })).toHaveValue('');
  await page.getByLabel('Название', { exact: true }).fill('Встреча из календаря');
  await setDate(page, '25.10.2026');
  await page.getByRole('textbox', { name: 'Время', exact: true }).fill('19:30');
  await page.reload();
  await expectDate(page, '25.10.2026');
  await expect(page.getByLabel('Название', { exact: true })).toHaveValue(
    'Встреча из календаря',
  );
});

test('header creation uses the calendar day but list and undated creation do not', async ({
  page,
}) => {
  await login(page, 'Саша');
  await mockCalendar(page, await calendarItems(page));
  await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2026-10-31');
  const create = page
    .getByTestId('page-heading')
    .getByRole('link', { name: 'Создать встречу' });

  await expect(create).toHaveAttribute('href', '/meetings/new?date=2026-10-31');
  await page.getByRole('button', { name: 'Список', exact: true }).click();
  await expect(create).toHaveAttribute('href', '/meetings/new');
  await page.getByRole('button', { name: 'Календарь', exact: true }).click();
  await page.getByRole('button', { name: /Без даты/ }).click();
  await expect(create).toHaveAttribute('href', '/meetings/new');
  await page.locator('[data-day="2026-10-31"]').click();
  await create.click();
  await expectDate(page, '31.10.2026');
  await page.getByLabel('Название', { exact: true }).fill('Пицца в субботу');
  await page.getByRole('textbox', { name: 'Время', exact: true }).fill('18:30');
  await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Встреча создана' })).toBeVisible();
});
