import { expect, test } from '@playwright/test';
import type { Route } from '@playwright/test';
import { apiCreate, create, inviteLink, login, writeHeaders } from '@tests/helpers';
import { holdRequests } from '@tests/loading-helpers';

test('session and list skeletons preserve layout and reduced motion at all widths', async ({
  page,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'После загрузки');
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const updated = await page.request.patch(`/api/v1/meetings/${created.meeting.id}`, {
    headers: await writeHeaders(page),
    data: {
      starts_at: future,
      starts_on: future.slice(0, 10),
      timezone: 'UTC',
      expected_revision: created.meeting.revision,
    },
  });

  expect(updated.status()).toBe(200);
  const releaseSession = await holdRequests(page, '**/api/v1/me');
  const releaseList = await holdRequests(page, '**/api/v1/meetings?*');
  await page.goto('/meetings');
  const loading = page.getByRole('status', { name: 'Загрузка встреч' });
  await expect(loading).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти через Яндекс ID' })).toHaveCount(
    0,
  );

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/skeleton-workspace-${width}.png` });
  }

  await releaseSession();
  await expect(
    page.getByRole('heading', { name: 'Мои встречи', exact: true }),
  ).toBeVisible();
  await expect(loading).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(loading.locator('span').first()).toHaveCSS('animation-name', 'none');
  await expect(loading.locator('button, input, a')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/skeleton-list-1440.png' });
  await releaseList();
  await expect(page.getByTestId('meeting-card').first()).toBeVisible();
  await expect(loading).toHaveCount(0);
  const releaseRefresh = await holdRequests(page, '**/api/v1/meetings?*');
  await page.clock.install();
  await page.clock.fastForward(65_000);
  await expect(page.getByTestId('meeting-card').first()).toBeVisible();
  await expect(loading).toHaveCount(0);
  await releaseRefresh();
});

test('meeting, conversation and people skeletons resolve independently', async ({
  page,
}) => {
  await login(page, 'Саша');
  const id = await create(page, 'Проверка скелетонов');
  const releaseMeeting = await holdRequests(page, `**/api/v1/meetings/${id}`);
  const releaseFeed = await holdRequests(page, `**/api/v1/meetings/${id}/feed?*`);
  const releasePeople = await holdRequests(page, `**/api/v1/meetings/${id}/participants`);
  await page.goto(`/meetings/${id}`);
  const loading = page.getByRole('status', { name: 'Загрузка разговора' });
  await expect(loading).toBeVisible();

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/skeleton-conversation-${width}.png` });
  }

  await releaseMeeting();
  await expect(
    page.getByRole('heading', { name: 'Проверка скелетонов', exact: true }),
  ).toBeVisible();
  await expect(loading).toBeVisible();
  await expect(page.getByRole('status', { name: 'Загрузка участников' })).toBeVisible();
  await releasePeople();
  await expect(page.getByRole('status', { name: 'Загрузка участников' })).toHaveCount(0);
  await releaseFeed();
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  await expect(loading).toHaveCount(0);
});

test('invitation skeleton transitions to an error and can be retried', async ({
  page,
}) => {
  await login(page, 'Саша');
  await create(page, 'Загрузка приглашения');
  const invitation = await inviteLink(page);
  await page.context().clearCookies();
  let held: Route | undefined;
  await page.route('**/api/v1/invitations/*', (route) => {
    held = route;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(invitation);
  const loading = page.getByRole('status', { name: 'Загрузка приглашения' });
  await expect(loading).toBeVisible();
  await page.screenshot({ path: 'test-results/skeleton-invitation-390.png' });
  await expect.poll(() => held).toBeDefined();
  await held?.abort('failed');
  await expect(
    page.getByRole('heading', { name: 'Приглашение недоступно' }),
  ).toBeVisible();
  await expect(loading).toHaveCount(0);
  await page.unroute('**/api/v1/invitations/*');
  await page.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(page.getByRole('heading', { name: 'Загрузка приглашения' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти и ответить' })).toBeVisible();
});

test('cold logout never renders the sign-in gate while landing loads and clears private state', async ({
  page,
}) => {
  await login(page, 'Саша');
  await create(page, 'Приватная встреча');
  let landing: Route | undefined;
  await page.route('**/assets/landing-*.js', (route) => {
    landing = route;
  });
  await page.evaluate(() => {
    sessionStorage.setItem('test-login-flash', 'false');
    new MutationObserver(() => {
      if (document.body.textContent?.includes('Войдите, чтобы создавать встречи')) {
        sessionStorage.setItem('test-login-flash', 'true');
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  await expect.poll(() => landing).toBeDefined();
  await page.waitForTimeout(400);
  await expect(
    page.getByText('Войдите, чтобы создавать встречи и отвечать на приглашения.'),
  ).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('test-login-flash'))).toBe(
    'false',
  );
  await landing?.continue();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /Кто придёт/ })).toBeVisible();
  expect((await page.request.get('/api/v1/me')).status()).toBe(401);
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith('somewhere-')),
    ),
  ).toEqual([]);
  await page.goto('/meetings');
  await expect(page.getByRole('button', { name: 'Войти через Яндекс ID' })).toBeVisible();
  await expect(page.getByText('Приватная встреча', { exact: true })).toHaveCount(0);
});

test('failed logout keeps the current page and permits another attempt', async ({
  page,
}) => {
  await login(page, 'Саша');
  await page.route('**/api/v1/auth/logout', (route) => route.abort('failed'));
  await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  const button = page.getByRole('button', { name: 'Выйти из аккаунта' });
  await button.click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(button).toBeEnabled();
  await expect(page).toHaveURL(/\/profile$/);
  await page.unroute('**/api/v1/auth/logout');
  await button.click();
  await expect(page.getByRole('heading', { name: /Кто придёт/ })).toBeVisible();
});
