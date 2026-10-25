import { test, expect } from '@playwright/test';
import { login, expectDate, setDate } from '@tests/helpers';
import { calendarItems, calendarResponse, mockCalendar } from '@tests/calendar-helpers';

for (const width of [320, 1440]) {
  test(`empty calendar keeps creation visible when selecting a day and scrolling at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width <= 1180 ? 680 : 950 });
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
    const placement =
      width <= 1180
        ? page.getByTestId('page-heading')
        : page.getByRole('region', { name: 'Встречи выбранного дня' });

    const create = placement.getByRole('link', { name: 'Создать встречу' });

    const agenda = page.getByRole('region', { name: 'Встречи выбранного дня' });
    await expect(create).toBeInViewport({ ratio: 1 });
    const controls = page.getByTestId('meetings-controls');
    const heading = page.getByTestId('page-heading');
    await expect(heading).toHaveCSS('border-bottom-width', '0px');
    await expect(heading).toHaveCSS('box-shadow', 'none');
    await expect(controls).toHaveCSS('box-shadow', 'none');
    await page.screenshot({ path: `test-results/calendar-controls-top-${width}.png` });
    await expect(agenda.getByText('0 встреч', { exact: true })).toBeVisible();
    await expect(page.getByTestId('home-empty')).toBeVisible({ visible: width > 1180 });

    try {
      await page.locator('[data-day="2026-10-24"]').click();
      await expect.poll(() => requested).toBe(true);
      await expect(create).toBeInViewport({ ratio: 1 });
      release();
      await expect(agenda.getByText('0 встреч', { exact: true })).toBeVisible();

      if (width <= 1180) {
        await page.evaluate(() => window.scrollTo(0, 340));
        await expect(controls).toHaveAttribute('data-pinned', 'true');
        const bounds = await controls.boundingBox();
        expect(bounds!.x).toBe(0);
        expect(bounds!.width).toBe(width);
        await expect(controls).toHaveCSS('border-radius', '0px 0px 18px 18px');
        await expect(controls).toHaveCSS('box-shadow', 'none');
        await expect
          .poll(() =>
            controls.evaluate((element) => getComputedStyle(element, '::after').opacity),
          )
          .toBe('1');
        await expect(
          page.getByRole('navigation', { name: 'Основная навигация' }),
        ).toBeInViewport({ ratio: 1 });
        await expect(
          controls.getByRole('button', { name: 'Календарь', exact: true }),
        ).toHaveCount(0);
        const filters = page.getByRole('navigation', { name: 'Вид встреч' });
        expect((await filters.boundingBox())!.y).toBeLessThan(
          (await controls.boundingBox())!.y,
        );
        await expect(heading).toHaveCSS('box-shadow', 'none');
      }

      await expect(create).toBeInViewport({ ratio: 1 });
      await expect(create).toHaveAttribute('href', '/meetings/new?date=2026-10-24');
      await expect(
        page.getByRole('link', { name: 'Создать встречу', exact: true }),
      ).toHaveCount(1);
      await page.screenshot({ path: `test-results/calendar-create-${width}.png` });

      if (width <= 1180) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect(controls).toHaveAttribute('data-pinned', 'false');
        await expect(controls).toHaveCSS('box-shadow', 'none');
        await expect(controls).toHaveCSS('border-radius', '0px');
      }
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
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
});
