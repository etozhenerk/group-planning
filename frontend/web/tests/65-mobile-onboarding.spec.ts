import { expect, test } from '@playwright/test';
import type { Route } from '@playwright/test';
import { trustedTouchGesture } from '@tests/helpers/trustedTouchGesture';

const titles = [
  'Позовите друзей на встречу.',
  'Ваши встречи в списке и календаре.',
  'Обсуждайте детали в чате встречи.',
  'Предложите другую дату.',
  'Договоритесь, где встретиться.',
  'Договоритесь, кто что подготовит.',
  'Соберите фотографии встречи.',
  'Откройте свои встречи.',
];

for (const width of [320, 390, 739]) {
  test(`eight mobile pages keep their controls visible and examples read-only at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 760 });
    const writes: string[] = [];
    page.on('request', (request) => {
      if (
        request.url().includes('/api/') &&
        !['GET', 'HEAD', 'OPTIONS'].includes(request.method())
      ) {
        writes.push(request.url());
      }
    });
    await page.goto('/?intro=0');
    const intro = page.getByTestId('mobile-onboarding');
    const range = intro.getByRole('slider', { name: 'Страница знакомства' });
    const next = intro.getByRole('button', { name: 'Далее', exact: true });
    const back = intro.getByRole('button', { name: 'Предыдущий слайд' });
    await expect(back).not.toBeVisible();
    await expect(range).toHaveAttribute('max', '7');

    for (let index = 0; index < titles.length; index++) {
      await expect(intro.getByRole('heading', { level: 1 })).toHaveText(
        titles[index] ?? '',
      );
      await expect(range).toHaveValue(String(index));
      await expect(range).toBeInViewport({ ratio: 1 });
      const action =
        index === 7
          ? intro.getByRole('button', { name: 'Войти через Яндекс ID', exact: true })
          : next;

      await expect(action).toBeInViewport({ ratio: 1 });

      if (index < 7) {
        await action.click();
      }
    }

    await back.click();
    await expect(range).toHaveValue('6');
    await intro.getByRole('button', { name: 'Пропустить', exact: true }).click();
    await expect(range).toHaveValue('7');
    await range.focus();
    await range.press('Home');
    await range.press('ArrowRight');
    await range.press('ArrowRight');
    await range.press('ArrowRight');
    await expect(range).toHaveValue('3');
    await expect(range).toHaveAttribute('aria-valuetext', '4 из 8');
    await page.reload();
    await expect(range).toHaveValue('3');
    await range.press('Home');
    await next.click();
    await intro.getByRole('button', { name: 'Календарь', exact: true }).click();
    await intro.getByRole('button', { name: 'Список', exact: true }).click();
    expect(writes).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
  });
}

test('mobile sign-in locks pager once, preserves button size and retries after an error', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pending: { route?: Route } = {};
  let starts = 0;
  await page.route('**/api/v1/auth/yandex/start', (route) => {
    starts++;
    pending.route = route;
  });
  await page.goto('/meetings?intro=7');
  const intro = page.getByTestId('mobile-onboarding');
  const button = intro.getByRole('button', {
    name: 'Войти через Яндекс ID',
    exact: true,
  });

  const range = intro.getByRole('slider');
  const before = await button.boundingBox();
  await button.click();
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(range).toBeDisabled();
  await expect(intro.getByRole('button', { name: 'Предыдущий слайд' })).toBeDisabled();
  expect(await button.boundingBox()).toEqual(before);
  await expect.poll(() => pending.route).toBeDefined();
  expect(starts).toBe(1);
  await pending.route?.fulfill({
    status: 503,
    contentType: 'application/json',
    body: '{}',
  });
  await expect(intro.getByRole('alert')).toContainText('Не удалось открыть вход');
  await expect(button).toBeEnabled();
  await expect(range).toHaveValue('7');
  await button.click();
  await expect.poll(() => starts).toBe(2);
  await expect(button).toBeDisabled();
  await expect.poll(() => pending.route).toBeDefined();
  await pending.route?.abort();
  await expect(button).toBeEnabled();
});

test('desktop keeps its landing entry', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.getByTestId('mobile-onboarding')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/meetings');
  await expect(page.getByRole('button', { name: 'Войти через Яндекс ID' })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Страница знакомства' })).toHaveCount(0);
});

test('trusted horizontal touch changes one page while vertical scroll keeps the page', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'CDP touch injection is Chromium-specific; WebKit touch is checked independently.',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const touch = await page.context().newCDPSession(page);
  await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true });

  try {
    await page.goto('/?intro=0');
    const range = page.getByRole('slider', { name: 'Страница знакомства' });
    await expect(range).toHaveValue('0');
    const firstPhoto = page.getByTestId('onboarding-slide-0').locator('img');
    const bounds = await firstPhoto.boundingBox();

    if (!bounds) {
      throw new Error('Photo gesture target is missing');
    }

    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y }],
    });
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x - 70, y }],
    });
    await expect
      .poll(() => firstPhoto.evaluate((element) => element.getBoundingClientRect().x))
      .toBeLessThan(bounds.x - 30);
    await expect(range).toHaveValue('0');
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchCancel',
      touchPoints: [],
    });
    await expect
      .poll(() => firstPhoto.evaluate((element) => element.getBoundingClientRect().x))
      .toBeCloseTo(bounds.x, 0);
    await trustedTouchGesture(page, touch, firstPhoto, -100, 0, false);
    await expect(range).toHaveValue('1');
    const secondSlide = page.getByTestId('onboarding-slide-1');
    await expect(secondSlide).toHaveAttribute('aria-hidden', 'false');
    await expect
      .poll(() =>
        secondSlide.evaluate((element) => Math.abs(element.getBoundingClientRect().x)),
      )
      .toBeLessThan(1);
    const photo = secondSlide.locator('img').first();
    await trustedTouchGesture(page, touch, photo, 0, -100, false);
    await expect(range).toHaveValue('1');
  } finally {
    await touch.detach();
  }
});
