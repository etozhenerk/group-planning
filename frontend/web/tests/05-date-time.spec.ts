import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { expectDate, login, setDate } from '@tests/helpers';

for (const width of [320, 390, 1440]) {
  test(`custom date calendar and independent time at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, 'Саша');
    await page.goto('/meetings/new');
    await page.getByLabel('Название', { exact: true }).fill('Дата и время');
    await setDate(page, '24.10.2026');
    const date = page.getByRole('combobox', { name: 'Дата', exact: true });
    const time = page.getByRole('textbox', { name: 'Время', exact: true });
    await time.pressSequentially('1900');
    await expect(time).toHaveValue('19:00');
    const dateField = page.locator('.g-date-date-picker__field');
    const timeField = page.getByTestId('time-input');
    const iconSlots = [
      {
        field: dateField,
        icon: dateField.getByRole('button', { name: 'Календарь' }).locator('svg.g-icon'),
      },
      { field: timeField.locator('.g-text-input'), icon: timeField.locator('svg') },
    ];

    for (const { field, icon } of iconSlots) {
      const bounds = await field.boundingBox();
      const glyph = await icon.boundingBox();
      expect(glyph?.x ?? 0).toBeGreaterThan((bounds?.x ?? 0) + 12);
      expect((glyph?.x ?? 0) + (glyph?.width ?? 0) / 2 - (bounds?.x ?? 0)).toBeCloseTo(
        23,
        0,
      );
    }

    await expect(page.getByLabel('Часовой пояс', { exact: true })).toHaveCount(0);
    await expect(
      page.locator(
        'input[type="date"],input[type="datetime-local"],input[type="time"],select',
      ),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Календарь', exact: true }).click();
    const popup = page.locator('.g-popup').filter({ has: page.getByRole('grid') });
    await expect(popup).toBeVisible();
    await expect(popup.getByRole('grid')).toHaveAttribute('aria-label', /октябрь 2026/);
    const bounds = await popup.boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/date-picker-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await popup.getByRole('button', { name: 'Вперёд', exact: true }).click();
    await expect(popup.getByRole('grid')).toHaveAttribute('aria-label', /ноябрь 2026/);
    await popup.getByRole('button', { name: 'Назад', exact: true }).click();
    await popup.getByRole('button', { name: /25 октября 2026/ }).click();
    await expect(popup).not.toBeVisible();
    await expectDate(page, '25.10.2026');
    await expect(time).toHaveValue('19:00');
    await date.press('Alt+ArrowDown');
    await expect(popup).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible();
    await expect(date).toBeFocused();
    await date.click();
    await expect(popup).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible();
    const content = dateField.locator('.g-text-input__content');
    const contentBounds = await content.boundingBox();
    await content.click({
      position: {
        x: (contentBounds?.width ?? 0) - 4,
        y: (contentBounds?.height ?? 0) / 2,
      },
    });
    await expect(popup).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.screenshot({
      path: `test-results/date-time-fields-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  });
}

test.describe('automatic browser timezone', () => {
  test.use({ timezoneId: 'Asia/Yekaterinburg' });

  test('requires date and time, then sends the selected local instant and actual zone', async ({
    page,
  }) => {
    await login(page, 'Саша');
    await page.goto('/meetings/new');
    await page.getByLabel('Название', { exact: true }).fill('Встреча на Урале');
    let posts = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/api/v1/meetings')) {
        posts++;
      }
    });
    const time = page.getByRole('textbox', { name: 'Время', exact: true });
    await time.fill('19:00');
    await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Выберите дату');
    expect(posts).toBe(0);
    await setDate(page, '24.10.2026');
    await time.fill('');
    await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
    await expect(time).toBeFocused();
    expect(posts).toBe(0);
    await time.fill('19:00');
    const request = page.waitForRequest(
      (value) => value.method() === 'POST' && value.url().endsWith('/api/v1/meetings'),
    );

    await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
    const raw: unknown = (await request).postDataJSON();
    const body = z.object({ timezone: z.string(), starts_at: z.string() }).parse(raw);
    expect(body.timezone).toBe('Asia/Yekaterinburg');
    expect(body.starts_at).toBe('2026-10-24T19:00:00+05:00');
    await expect(page.getByRole('heading', { name: 'Встреча создана' })).toBeVisible();
  });
});

test.describe('repeated local time', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('requires an explicit DST choice in the custom select', async ({ page }) => {
    await login(page, 'Саша');
    await page.goto('/meetings/new');
    await page.getByLabel('Название', { exact: true }).fill('Повторяющийся час');
    await setDate(page, '01.11.2026');
    await page.getByRole('textbox', { name: 'Время', exact: true }).fill('01:30');
    await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('встречается дважды');
    await page.getByLabel('Повторяющееся время', { exact: true }).click();
    await page
      .getByRole('option', { name: 'Поздний вариант — после перевода часов' })
      .click();
    const request = page.waitForRequest(
      (value) => value.method() === 'POST' && value.url().endsWith('/api/v1/meetings'),
    );

    await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
    const raw: unknown = (await request).postDataJSON();
    const body = z.object({ timezone: z.string(), starts_at: z.string() }).parse(raw);
    expect(body.timezone).toBe('America/New_York');
    expect(body.starts_at).toBe('2026-11-01T01:30:00-05:00');
    await expect(page.getByRole('heading', { name: 'Встреча создана' })).toBeVisible();
  });
});
