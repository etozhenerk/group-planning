import { expect, test } from '@playwright/test';
import type { Route } from '@playwright/test';
import { create, inviteLink, login } from '@tests/helpers';

test('sign-in stays busy through slow API and navigation without changing its size', async ({
  page,
}) => {
  let start: Route | undefined;
  let provider: Route | undefined;
  await page.route('**/api/v1/auth/yandex/start', (route) => {
    start = route;
  });
  await page.route('**/__test/provider?**', (route) => {
    provider = route;
  });
  await page.goto('/meetings');
  const button = page.getByRole('button', { name: 'Войти через Яндекс ID' });
  const before = await button.boundingBox();
  await button.click();
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button.locator('span').first()).toHaveCSS('visibility', 'hidden');
  const spinner = await button.locator('svg').last().boundingBox();
  expect(
    spinner &&
      before &&
      Math.abs(spinner.x + spinner.width / 2 - before.x - before.width / 2),
  ).toBeLessThan(1);
  await page.screenshot({ path: 'test-results/auth-button-busy.png' });
  await button.evaluate((element) => {
    const record = () => {
      const box = element.getBoundingClientRect();
      const sample = JSON.stringify({
        disabled: element.hasAttribute('disabled'),
        busy: element.getAttribute('aria-busy'),
        label: element.textContent,
        width: box.width,
        height: box.height,
      });

      sessionStorage.setItem(
        'test-auth-states',
        `${sessionStorage.getItem('test-auth-states') ?? ''}${sample}\n`,
      );
    };

    record();
    new MutationObserver(record).observe(element, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.setInterval(record, 20);
  });
  await expect.poll(() => start).toBeDefined();
  await start?.continue();
  await expect.poll(() => provider).toBeDefined();
  // Keep the next document pending after the mutation has already completed.
  await page.waitForTimeout(400);
  await provider?.continue();
  await expect(page.getByRole('heading', { name: 'Тестовый вход' })).toBeVisible();
  const recorded = await page.evaluate(() => sessionStorage.getItem('test-auth-states'));
  const samples = (recorded ?? '').trim().split('\n');
  expect(samples.length).toBeGreaterThan(1);

  for (const sample of samples) {
    expect(JSON.parse(sample)).toEqual({
      disabled: true,
      busy: 'true',
      label: 'Войти через Яндекс ID',
      width: before?.width,
      height: before?.height,
    });
  }

  await page.goBack();
  await expect(page.getByRole('button', { name: 'Войти через Яндекс ID' })).toBeEnabled();
});

test('restoring a cached page unlocks sign-in and failed starts can be retried', async ({
  page,
}) => {
  let starts = 0;
  await page.route('**/api/v1/auth/yandex/start', async (route) => {
    starts++;

    if (starts === 1) {
      await route.abort('failed');
    } else {
      await route.continue();
    }
  });
  await page.route('**/__test/provider?**', (route) => route.fulfill({ status: 204 }));
  await page.goto('/meetings');
  const button = page.getByRole('button', { name: 'Войти через Яндекс ID' });
  const currentButton = await button.elementHandle();
  await button.click();
  await expect(page.getByRole('alert')).toContainText('Не удалось открыть вход');
  await expect(button).toBeEnabled();
  await button.click({ noWaitAfter: true });
  await expect.poll(() => starts).toBe(2);
  await page.waitForTimeout(200);
  expect(await currentButton?.getAttribute('aria-busy')).toBe('true');
  await currentButton?.evaluate(() => {
    window.stop();
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect.poll(() => currentButton?.getAttribute('disabled')).toBeNull();
  expect(await currentButton?.getAttribute('aria-busy')).toBe('false');
  expect(await currentButton?.getAttribute('aria-describedby')).toBeNull();
});

test('return shows only the branded loader at all widths, respects reduced motion and proceeds', async ({
  page,
}) => {
  await login(page, 'Саша');
  let session: Route | undefined;
  await page.route('**/api/v1/me', (route) => {
    session = route;
  });
  await page.goto('/auth/return?kind=home');
  const loading = page.getByRole('status', { name: 'Загрузка' });
  await expect(loading).toBeVisible();
  await expect(loading).toHaveCSS('opacity', '1');
  await expect(
    page.getByText(/Завершаем|Проверяем вход|Открываем Somewhere/),
  ).toHaveCount(0);

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      loading.getByRole('link', { name: 'Somewhere — на главную' }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/auth-loading-${width}.png` });
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(loading).toHaveCSS('animation-name', 'none');
  expect(
    await loading
      .locator('span[aria-hidden]')
      .evaluate((element) => getComputedStyle(element, '::after').animationName),
  ).toBe('none');
  await session?.continue();
  await page.unroute('**/api/v1/me');
  await expect(page).toHaveURL(/\/meetings$/);
});

test('return retries a failed session read without another OAuth attempt', async ({
  page,
}) => {
  await login(page, 'Саша');
  let reads = 0;
  let starts = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/auth/yandex/start')) {
      starts++;
    }
  });
  await page.route('**/api/v1/me', async (route) => {
    reads++;

    if (reads === 1) {
      await route.fulfill({
        status: 503,
        json: { error: { code: 'unavailable', field_errors: {}, request_id: 'test' } },
      });
    } else {
      await route.continue();
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/auth/return?kind=home');
  await expect(page.getByRole('heading', { name: 'Не удалось войти' })).toBeVisible();
  await page.screenshot({ path: 'test-results/auth-error-390.png' });
  await page.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(page).toHaveURL(/\/meetings$/);
  expect(starts).toBe(0);
});

test('missing session offers a fresh sign-in that preserves the invitation without RSVP', async ({
  page,
}) => {
  await login(page, 'Саша');
  await create(page, 'Вход после истечения сессии');
  const invitation = await inviteLink(page);
  const token = new URL(invitation).pathname.split('/').at(-1);
  await page.context().clearCookies();
  await page.goto(`/auth/return?kind=invitation&token=${token}`);
  await expect(page.getByRole('heading', { name: 'Войдите ещё раз' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'К приглашению' })).toHaveAttribute(
    'href',
    `/i/${token}`,
  );
  await page.getByRole('button', { name: 'Войти через Яндекс ID' }).click();
  await page.getByRole('link', { name: 'Войти как Лена' }).click();
  await expect(page).toHaveURL(invitation);
  await expect(page.getByRole('button', { name: 'Приду', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
});
