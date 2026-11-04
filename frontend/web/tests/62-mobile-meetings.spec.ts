import { expect, test } from '@playwright/test';
import { login } from '@tests/helpers';
import { mobileMeetingsFixture } from '@tests/helpers/mobileMeetingsFixture';

for (const width of [320, 390, 739]) {
  test(`mobile meetings retain independent view offsets and expose all 20 cards at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 700 });
    await login(page, 'Саша');
    await mobileMeetingsFixture(page);
    await page.goto('/meetings?view=list&period=upcoming&upcoming=2099-10-24');
    const viewport = page.getByTestId('meetings-scroll');
    const heading = page.getByRole('heading', { name: 'Мои встречи', exact: true });
    const top = await heading.boundingBox();
    const cards = page.getByTestId('meeting-card');
    await expect(cards).toHaveCount(20);
    await expect(cards.first()).toHaveAttribute('data-weekend', 'true');
    await expect(
      page.getByRole('button', { name: 'Показать календарь', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel('0 непрочитанных сообщений', { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByLabel('100 непрочитанных сообщений', { exact: true }).first(),
    ).toHaveText('99+ непрочитанных');
    await expect(
      page
        .getByLabel('9007199254741021 непрочитанное сообщение', { exact: true })
        .first(),
    ).toHaveText('99+ непрочитанных');
    const target = cards.filter({ hasText: 'Проверка возврата' });
    await target.scrollIntoViewIfNeeded();
    const listOffset = await viewport.evaluate((node) => node.scrollTop);
    expect(listOffset).toBeGreaterThan(300);
    await target.getByRole('link').first().click();
    await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
    await page.goBack();
    await expect(viewport).toBeVisible();
    await expect
      .poll(() => viewport.evaluate((node) => node.scrollTop), {
        message: 'Return from the real chat restores the list offset',
      })
      .toBeCloseTo(listOffset, 0);
    await page.getByRole('button', { name: 'Показать календарь', exact: true }).click();
    const calendar = page.getByRole('region', { name: 'Календарь встреч' });
    await expect(calendar.locator('[data-day="2099-10-24"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const eventDay = calendar.locator('[data-day="2099-10-24"]');
    await expect(eventDay).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    expect(
      await eventDay.evaluate((node) => ({
        width: getComputedStyle(node, '::before').width,
        height: getComputedStyle(node, '::before').height,
      })),
    ).toEqual({ width: '36px', height: '36px' });
    await calendar.locator('[data-day="2099-10-25"]').click();
    await expect(eventDay).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await eventDay.click();
    await expect(page.getByTestId('agenda-meeting')).toHaveCount(20);
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(0);
    await viewport.evaluate((node) => {
      node.scrollTop = 300;
    });
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(300);
    await page.getByRole('button', { name: 'Показать список', exact: true }).click();
    await expect
      .poll(() => viewport.evaluate((node) => node.scrollTop), {
        message:
          'A shorter calendar must not overwrite the list offset during effect cleanup',
      })
      .toBeCloseTo(listOffset, 0);
    await page.reload();
    await expect(cards).toHaveCount(20);
    await expect
      .poll(() => viewport.evaluate((node) => node.scrollTop))
      .toBeCloseTo(listOffset, 0);
    await page.getByRole('button', { name: 'Показать календарь', exact: true }).click();
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(300);
    await page.getByRole('button', { name: /^Прошедшие/ }).click();
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(0);
    await page.getByRole('button', { name: /^Предстоящие/ }).click();
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(0);
    await cards.last().scrollIntoViewIfNeeded();
    const last = await cards.last().boundingBox();
    const navigation = await page
      .getByRole('navigation', { name: 'Основная навигация' })
      .boundingBox();

    expect(last!.y + last!.height).toBeLessThanOrEqual(navigation!.y + 0.5);
    expect((await heading.boundingBox())!.y).toBeCloseTo(top!.y, 0);
    const geometry = await viewport.evaluate((node) => ({
      width: node.clientWidth,
      content: node.scrollWidth,
    }));

    expect(geometry.content).toBe(geometry.width);
  });
}

test('short touch landscape retains the mobile layout beyond the width breakpoint', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    ...(baseURL ? { baseURL } : {}),
    ignoreHTTPSErrors: true,
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });

  try {
    const page = await context.newPage();
    await login(page, 'Саша');
    await mobileMeetingsFixture(page);
    await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2099-10-24');
    await expect(page.getByTestId('meeting-card')).toHaveCount(20);
    await expect(
      page.getByRole('button', { name: 'Показать список', exact: true }),
    ).toBeVisible();
    const calendar = page.getByRole('region', { name: 'Календарь встреч' });
    await expect(calendar).toHaveAttribute('data-mobile', 'true');
    await expect(calendar.locator('[data-day="2099-10-24"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const last = page.getByTestId('meeting-card').last();
    await last.scrollIntoViewIfNeeded();
    // A short landscape viewport can be shorter than a card; reaching its end
    // must still expose the card's bottom above the fixed navigation.
    await page.getByTestId('meetings-scroll').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const card = await last.boundingBox();
    const navigation = await page
      .getByRole('navigation', { name: 'Основная навигация' })
      .boundingBox();

    expect(card!.y + card!.height).toBeLessThanOrEqual(navigation!.y + 0.5);
    expect(navigation!.x).toBe(0);
    expect(navigation!.width).toBe(844);
    const viewport = page.getByTestId('meetings-scroll');
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(844);
  } finally {
    await context.close();
  }
});
