import { expect, test } from '@playwright/test';
import { login } from '@tests/helpers';
import { calendarItems, calendarResponse } from '@tests/calendar-helpers';

for (const width of [390, 1440]) {
  test(`profile service return and FAQ disclosure work at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page, 'Саша');
    await page.getByRole('link', { name: 'Профиль', exact: true }).click();
    await page.getByRole('link', { name: 'Помощь', exact: true }).click();
    const questions = page.locator('button[aria-expanded][aria-controls]');
    const second = questions.nth(1);
    await expect(second).toHaveAttribute('aria-expanded', 'false');
    const answer = page.locator(`[id="${await second.getAttribute('aria-controls')}"]`);
    await expect(answer).toHaveAttribute('aria-hidden', 'true');
    await second.click();
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    await expect(answer).toHaveCSS('opacity', '1');
    expect(await answer.evaluate((node) => node.clientHeight)).toBeGreaterThan(0);
    await second.click();
    await expect(answer).toHaveAttribute('aria-hidden', 'true');
    await expect(answer).toHaveCSS('opacity', '0');
    await page.getByRole('link', { name: 'Задать вопрос ↗', exact: true }).click();
    await page.getByRole('link', { name: /Назад/ }).click();
    await expect(page).toHaveURL(/\/help$/);
    await page.getByRole('link', { name: /Назад/ }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(
      page.getByRole('button', { name: 'Удалить аккаунт', exact: true }),
    ).toHaveCount(0);
    await page.getByRole('link', { name: 'Cookie', exact: true }).click();
    await page.getByRole('link', { name: /Назад/ }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await page.getByRole('link', { name: 'О приложении', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'О приложении', exact: true }),
    ).toHaveCount(1);
    await page.getByRole('link', { name: 'Сообщить о проблеме ↗', exact: true }).click();
    await page.getByRole('link', { name: /Назад/ }).click();
    await expect(page).toHaveURL(/\/about$/);
    await page.getByRole('link', { name: /Назад/ }).click();
    await expect(page).toHaveURL(/\/profile$/);
  });
}

test('bottom tab motion reverses from its rendered position and respects reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const nav = page.getByRole('navigation', { name: 'Основная навигация' });
  const indicator = nav.locator('span[aria-hidden="true"]').first();
  await nav.getByRole('link', { name: 'Профиль', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  const interrupted = await indicator.evaluate((element) => {
    const animation = element.getAnimations()[0];

    if (!animation) {
      throw new Error('Expected the published tab animation');
    }

    animation.pause();
    animation.currentTime = Number(animation.effect?.getTiming().duration) * 0.4;

    return (
      new DOMMatrixReadOnly(getComputedStyle(element).transform).m41 /
      element.getBoundingClientRect().width
    );
  });

  expect(interrupted).toBeGreaterThan(0);
  expect(interrupted).toBeLessThan(2);
  await nav.getByRole('link', { name: 'Приглашения', exact: true }).click();
  await expect(page).toHaveURL(/\/invitations$/);
  await expect(
    nav.getByRole('link', { name: 'Приглашения', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  const firstOffset = await indicator.evaluate((element) => {
    const effect = element.getAnimations()[0]?.effect;

    if (!(effect instanceof KeyframeEffect)) {
      throw new Error('Expected reverse animation');
    }

    const transform = String(effect.getKeyframes()[0]?.transform);

    return Number.parseFloat(transform.replace('translateX(', '')) / 100;
  });

  expect(Math.abs(firstOffset - interrupted)).toBeLessThan(0.02);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect
    .poll(() =>
      page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    )
    .toBe(true);
  await nav.getByRole('link', { name: 'Встречи', exact: true }).click();
  await expect(page).toHaveURL(/\/meetings$/);
  await expect(nav.getByRole('link', { name: 'Встречи', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const animations = await indicator.evaluate((element) =>
    element.getAnimations().map((animation) => ({
      state: animation.playState,
      frames:
        animation.effect instanceof KeyframeEffect ? animation.effect.getKeyframes() : [],
    })),
  );

  expect(animations).toEqual([]);
});

test('calendar day refresh keeps content through a slow error and retry without skeleton flashes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const items = await calendarItems(page);
  let fail = false;
  let release: (() => void) | undefined;
  await page.route('**/api/v1/meetings?*', async (route) => {
    const params = new URL(route.request().url()).searchParams;

    if (
      fail &&
      params.get('from') === '2026-10-31' &&
      params.get('to') === '2026-11-01'
    ) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      await route.fulfill({ status: 503, json: { error: { code: 'unavailable' } } });

      return;
    }

    await route.fulfill({ json: calendarResponse(items, route.request().url()) });
  });
  await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2026-10-24');
  const agenda = page.getByRole('region', { name: 'Встречи выбранного дня' });
  const original = agenda.getByRole('link', { name: /Суббота без спешки/ });
  const skeleton = page.getByRole('status', { name: 'Загрузка встреч' });
  await expect(original).toBeVisible();
  fail = true;
  await page.getByRole('button', { name: /31 октября 2026.*встреч: 2/ }).click();

  try {
    await expect.poll(() => !!release).toBe(true);
    await expect(original).toBeVisible();
    await expect(skeleton).toHaveCount(0);
    await page.waitForTimeout(2_000);
    await expect(original).toBeVisible();
    await expect(skeleton).toHaveCount(0);
  } finally {
    release?.();
  }

  await expect(agenda.getByText('Не удалось обновить встречи')).toBeVisible();
  await expect(original).toBeVisible();
  fail = false;
  await agenda.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(2);
  await expect(skeleton).toHaveCount(0);
  await page.getByRole('button', { name: /24 октября 2026/ }).click();
  await expect(original).toBeVisible();
  await expect(skeleton).toHaveCount(0);
});

test('calendar continuity clears data across periods and after access denial', async ({
  page,
}) => {
  await login(page, 'Саша');
  const items = await calendarItems(page);
  await page.route('**/api/v1/meetings?*', async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const denied = params.get('from') === '2026-10-25';

    if (params.get('period') === 'past' || denied) {
      await route.fulfill({
        status: denied ? 403 : 503,
        json: {
          error: {
            code: denied ? 'access_denied' : 'unavailable',
            field_errors: {},
            request_id: 'calendar-scope',
          },
        },
      });

      return;
    }

    await route.fulfill({ json: calendarResponse(items, route.request().url()) });
  });
  await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2026-10-24');
  const agenda = page.getByRole('region', { name: 'Встречи выбранного дня' });
  const original = agenda.getByRole('link', { name: /Суббота без спешки/ });
  await expect(original).toBeVisible();
  await page.getByRole('button', { name: /^Прошедшие/ }).click();
  await expect(agenda.getByText('Не удалось загрузить встречи')).toBeVisible();
  await expect(original).toHaveCount(0);
  await page.getByRole('button', { name: /^Предстоящие/ }).click();
  await expect(original).toBeVisible();
  await page.getByRole('button', { name: /25 октября 2026/ }).click();
  await expect(agenda.getByText('Не удалось загрузить встречи')).toBeVisible();
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(0);
});
