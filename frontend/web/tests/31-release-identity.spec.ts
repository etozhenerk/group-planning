import { test, expect } from '@playwright/test';
import { apiCreate, apiMeeting, login, writeHeaders } from '@tests/helpers';

test.describe('onboarding on a landscape phone', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 844, height: 390 } });

  test('footer stays hidden above the desktop width breakpoint', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('footer')).not.toBeVisible();
  });
});

test('demo identity is explicit; footer appears only on desktop onboarding', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(
    page.locator('footer').getByRole('link', { name: 'Демо', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(page.locator('footer')).not.toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about');
  await expect(page.getByRole('link', { name: 'Профиль', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.locator('dl').getByText('Демо', { exact: true })).toBeVisible();
  await expect(page.getByRole('term').filter({ hasText: /^Сборка$/ })).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(0);
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Версия в сервисных экранах');
  const id = created.meeting.id;
  await page.goto(`/meetings/${id}`);
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  await expect(page.locator('footer')).toHaveCount(0);
  const changed = await page.request.patch(`/api/v1/meetings/${id}`, {
    headers: await writeHeaders(page),
    data: {
      expected_revision: created.meeting.revision,
      starts_at: null,
      starts_on: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
      timezone: 'UTC',
    },
  });

  expect(changed.ok()).toBe(true);
  await expect.poll(async () => (await apiMeeting(page, id)).period).toBe('past');
  await page.goto(`/meetings/${id}/memories`);
  await expect(page.getByRole('heading', { name: 'Как всё прошло?' })).toBeVisible();
  await expect(page.locator('footer')).toHaveCount(0);
});

test('mobile bottom navigation belongs only to meeting lists, invitations and main profile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Навигация');

  for (const route of [
    '/meetings',
    '/meetings?view=calendar',
    '/meetings?period=past',
    '/invitations',
    '/profile',
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole('navigation', { name: 'Основная навигация' }),
    ).toBeVisible();
  }

  for (const route of [
    '/meetings/new',
    `/meetings/${created.meeting.id}`,
    `/meetings/${created.meeting.id}/share`,
    `/meetings/${created.meeting.id}?action=date`,
    `/meetings/${created.meeting.id}?action=place`,
    `/meetings/${created.meeting.id}?action=task`,
    `/meetings/${created.meeting.id}/upload?kind=file&purpose=message`,
    `/meetings/${created.meeting.id}/memories`,
    '/support',
    '/about',
    '/help',
    '/privacy',
    '/cookies',
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole('navigation', { name: 'Основная навигация' }),
    ).toBeHidden();
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
  }
});
