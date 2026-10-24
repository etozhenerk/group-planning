import { expect, test } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [320, 390, 1440]) {
  test(`poll form scroll, errors, calendar and dismissal at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Проверка формы опроса');
    await page.goto(`/meetings/${meeting.id}`);
    await page
      .getByRole('textbox', { name: 'Сообщение', exact: true })
      .fill('Строка для проверки прокрутки.\n'.repeat(40));
    await page.getByRole('button', { name: 'Отправить сообщение', exact: true }).click();
    const feed = page.getByRole('list', { name: 'Разговор встречи' }).locator('..');
    await expect
      .poll(() => feed.evaluate((element) => element.scrollHeight - element.clientHeight))
      .toBeGreaterThan(200);
    await feed.evaluate((element) => {
      element.scrollTop = 120;
    });

    const open = page.getByRole('button', { name: 'Добавить к встрече' });
    await open.click();
    await page.getByRole('button', { name: 'Предложить дату', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Новая дата встречи' });
    const body = dialog.getByTestId('poll-form-scroll');
    const footer = dialog.getByTestId('poll-form-footer');
    const submit = dialog.getByRole('button', { name: 'Создать опрос', exact: true });
    const first = dialog.getByRole('combobox', { name: 'Вариант 1', exact: true });
    const popup = dialog.locator('.g-popup').filter({ has: page.getByRole('grid') });
    await expect(dialog).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    await expect(dialog.getByRole('switch')).toHaveCount(5);
    await expect(dialog.getByRole('button', { name: /Удалить вариант/ })).toHaveCount(0);
    await expect(dialog.locator('details,summary')).toHaveCount(0);
    await expect(
      dialog
        .getByRole('group', { name: 'Даты', exact: true })
        .getByRole('button', { name: 'Очистить' }),
    ).toHaveCount(0);
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    const bounds = await dialog.boundingBox();
    expect(bounds?.height ?? 1000).toBeLessThan(width === 320 ? 829 : 800);
    await page.screenshot({
      path: `test-results/poll-compact-${width}.png`,
      animations: 'disabled',
    });

    await first.click();
    await expect(popup).toBeVisible();
    const calendarBounds = await popup.boundingBox();
    expect(calendarBounds?.x).toBeGreaterThanOrEqual(0);
    const calendar = popup.locator('.g-date-calendar');
    const calendarWidth = await calendar.boundingBox();
    expect(calendarWidth?.width ?? 0).toBeLessThanOrEqual(calendarBounds?.width ?? 0);

    expect((calendarBounds?.x ?? 0) + (calendarBounds?.width ?? 0)).toBeLessThanOrEqual(
      width,
    );
    await popup.getByRole('button', { name: /27 октября 2026/ }).click();
    await expect(popup).not.toBeVisible();
    await expect(first).toHaveValue(/27.*10.*2026/);
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Добавить вариант' }).click();
    const third = dialog.getByRole('combobox', { name: 'Вариант 3', exact: true });
    await submit.click();
    await expect(
      dialog.getByRole('alert').filter({ hasText: 'Выберите дату.' }),
    ).toBeInViewport();
    await expect(third).toBeFocused();
    await expect(third).toHaveAttribute('aria-invalid', 'true');
    await page.screenshot({
      path: `test-results/poll-error-${width}.png`,
      animations: 'disabled',
    });
    await third.click();
    await popup.getByRole('button', { name: /27 октября 2026/ }).click();
    await submit.click();
    await expect(
      dialog.getByRole('alert').filter({ hasText: 'Эта дата уже есть в опросе.' }),
    ).toBeInViewport();
    await expect(third).toBeFocused();
    const remove = dialog.getByRole('button', { name: 'Удалить вариант 3' });
    await expect(remove).toHaveCSS('cursor', 'pointer');
    await remove.click();
    await expect(third).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: /Удалить вариант/ })).toHaveCount(0);

    await page.setViewportSize({ width, height: 600 });
    await expect(footer).not.toHaveCSS('box-shadow', 'none');
    await page.screenshot({
      path: `test-results/poll-shadow-${width}.png`,
      animations: 'disabled',
    });
    const before = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
    const feedBefore = await feed.evaluate((element) => element.scrollTop);
    await page.mouse.move(4, 4);
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => page.evaluate(() => ({ x: scrollX, y: scrollY })))
      .toEqual(before);
    await body.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(footer).toHaveCSS('box-shadow', 'none');
    await expect(feed).toHaveJSProperty('scrollTop', feedBefore);
    const deadline = dialog.getByRole('combobox', { name: 'Дата', exact: true });
    const time = dialog.getByRole('textbox', { name: 'Время', exact: true });
    await expect(deadline).toBeInViewport();
    await expect(time).toBeInViewport();
    const timeBounds = await time.boundingBox();
    const footerBounds = await footer.boundingBox();
    expect((timeBounds?.y ?? 0) + (timeBounds?.height ?? 0)).toBeLessThan(
      footerBounds?.y ?? 0,
    );

    if (width >= 390) {
      const dateBounds = await deadline.boundingBox();
      expect(timeBounds?.y).toBeCloseTo(dateBounds?.y ?? 0, 0);
    }

    await page.screenshot({
      path: `test-results/poll-footer-${width}.png`,
      animations: 'disabled',
    });
    await deadline.click();
    await expect(popup).toBeVisible();
    await expect(popup.getByRole('button', { name: /^октябрь 2026$/i })).toBeInViewport({
      ratio: 1,
    });
    const deadlineCalendar = await popup.boundingBox();
    expect(deadlineCalendar?.y).toBeGreaterThanOrEqual(0);
    expect(
      (deadlineCalendar?.y ?? 0) + (deadlineCalendar?.height ?? 0),
    ).toBeLessThanOrEqual(600);
    await page.screenshot({
      path: `test-results/poll-deadline-calendar-${width}.png`,
      animations: 'disabled',
    });
    await popup.getByRole('button', { name: /27 октября 2026/ }).click();
    await expect(deadline).toHaveValue(/27.*10.*2026/);
    await deadline.press('Alt+ArrowDown');
    await expect(popup).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible();
    await expect(dialog).toBeVisible();

    await page.mouse.click(4, 4);
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await expect(open).toBeFocused();
    await open.click();
    await page.getByRole('button', { name: 'Предложить дату', exact: true }).click();
    await expect(first).toHaveValue(/27.*10.*2026/);
    await expect(deadline).toHaveValue(/27.*10.*2026/);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
}
