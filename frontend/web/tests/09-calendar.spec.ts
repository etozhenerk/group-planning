import { test, expect } from '@playwright/test';
import { login } from '@tests/helpers';
import { calendarItems, mockCalendar } from '@tests/calendar-helpers';

for (const width of [320, 390, 1440]) {
  test(`calendar selection, keyboard, Back and layout ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await login(page, 'Саша');
    const items = await calendarItems(page);
    await mockCalendar(page, items);
    await page.goto('/meetings');
    const periods = page.getByRole('navigation', { name: 'Период встреч' });
    const before = await periods.boundingBox();
    await page.getByRole('button', { name: 'Календарь', exact: true }).click();

    if (width === 1440) {
      expect((await periods.boundingBox())?.y).toBeCloseTo(before!.y, 0);
      await expect(page.getByTestId('page-heading')).toHaveCSS(
        'border-bottom-width',
        '0px',
      );
      await expect(page.getByTestId('page-heading')).toHaveCSS('position', 'static');
    }

    const days = page.getByRole('group', { name: 'Дни месяца' });
    const agenda = page.getByRole('region', { name: 'Встречи выбранного дня' });
    await expect(days.locator('[data-day="2026-10-24"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(agenda.getByRole('link', { name: /Суббота без спешки/ })).toBeVisible();
    await page.getByRole('button', { name: /31 октября 2026.*встреч: 2/ }).click();
    await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(2);
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await expect(
      page.getByRole('link', { name: 'Создать встречу', exact: true }),
    ).toHaveCount(1);
    await page.screenshot({
      path: `test-results/calendar-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: /26 октября 2026/ }).click();
    await expect(agenda.getByText('На этот день встреч нет.')).toBeVisible();
    await days.locator('[data-day="2026-10-26"]').press('ArrowLeft');
    await expect(days.locator('[data-day="2026-10-25"]')).toBeFocused();
    await page.getByRole('button', { name: 'Следующий месяц' }).click();
    await expect(
      page.getByRole('heading', { name: 'ноябрь 2026', exact: true }),
    ).toBeVisible();
    await expect(days.locator('[data-day="2026-11-25"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Предыдущий месяц' }).click();
    await page.getByRole('button', { name: /Прошедшие/ }).click();
    await expect(days.locator('[data-day="2026-09-20"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Список', exact: true }).click();
    await expect(page.getByTestId('meeting-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Календарь', exact: true }).click();
    await expect(days.locator('[data-day="2026-09-20"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: /Предстоящие/ }).click();
    await expect(days.locator('[data-day="2026-10-25"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: /Без даты/ }).click();
    await expect(agenda.getByRole('link', { name: /Поход/ })).toBeVisible();
    await page.getByRole('button', { name: /24 октября 2026/ }).click();
    await agenda.getByRole('link', { name: /Суббота без спешки/ }).click();
    await expect(
      page.getByRole('heading', { name: 'Суббота без спешки', exact: true }),
    ).toBeVisible();
    await page.goBack();
    await expect(days.locator('[data-day="2026-10-24"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
}

test('month/year boundaries, leap February and reduced motion', async ({ page }) => {
  await login(page, 'Лена');
  await mockCalendar(page, []);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2027-12-31');
  await expect(page.getByTestId('home-empty')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Создать встречу', exact: true }),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Следующий месяц' }).click();
  await expect(page.locator('[data-day="2028-01-31"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Следующий месяц' }).click();
  await expect(page.locator('[data-day="2028-02-29"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('group', { name: 'Дни месяца' })).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(page.getByTestId('page-heading').getByRole('link')).toHaveCount(0);
  await page.getByRole('button', { name: 'Сегодня', exact: true }).click();
  const today = page.locator('[data-today="true"]');
  await expect(today).toHaveAttribute('aria-pressed', 'true');
  await expect(today).toBeFocused();
  await page.getByRole('button', { name: 'Сегодня', exact: true }).click();
  await expect(today).toBeFocused();
});

test('calendar dates use the meeting timezone on a different device', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, 'Саша');
  const items = await calendarItems(page);
  const meeting = items[0]!;
  meeting.starts_at = '2026-10-23T15:30:00Z';
  meeting.timezone = 'Asia/Tokyo';
  meeting.local_date = '2026-10-24';
  await mockCalendar(page, [meeting]);
  await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2026-10-24');
  const agenda = page.getByRole('region', { name: 'Встречи выбранного дня' });
  await expect(agenda.locator('time')).toHaveText('00:30');
  await expect(agenda.getByTestId('agenda-meeting')).toContainText('Япония');
  await expect(page.locator('[data-day="2026-10-24"]')).toHaveAccessibleName(/встреч: 1/);
  await expect(page.locator('[data-day="2026-10-23"]')).toHaveAccessibleName(/встреч: 0/);
});
