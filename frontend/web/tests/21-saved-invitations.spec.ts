import { test, expect } from '@playwright/test';
import { apiCreate, login, writeHeaders } from '@tests/helpers';

for (const width of [320, 390, 1440]) {
  test(`saved invitation moves only after a confirmed answer at ${width}px`, async ({
    page,
    browser,
  }, info) => {
    await login(page, 'Саша');
    const created = await apiCreate(page, `Прогулка по приглашению ${width}`);
    const scheduled = await page.request.patch(`/api/v1/meetings/${created.meeting.id}`, {
      headers: await writeHeaders(page),
      data: {
        starts_at: null,
        starts_on: new Date(Date.now() + 172800000).toISOString().slice(0, 10),
        expected_revision: created.meeting.revision,
      },
    });

    expect(scheduled.status()).toBe(200);
    const guestContext = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width, height: 900 },
    });

    const guest = await guestContext.newPage();

    try {
      await login(guest, 'Лена');
      await guest.goto(new URL(created.invitation_url).pathname);
      await guest.getByRole('button', { name: 'Возможно', exact: true }).click();
      await expect(guest.getByRole('status')).toContainText('Вы ответили «Возможно»');
      await guest.getByRole('link', { name: 'К приглашениям' }).click();
      const card = guest
        .getByTestId('saved-invitation')
        .filter({ hasText: created.meeting.title });

      await expect(card).toBeVisible();
      await expect(
        guest
          .getByRole('navigation', { name: 'Основная навигация' })
          .getByRole('link', { name: 'Приглашения' }),
      ).toHaveAttribute('aria-current', 'page');
      await expect(guest.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
      await expect
        .poll(() =>
          guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        )
        .toBe(true);
      await guest.screenshot({
        path: info.outputPath(`invitations-${width}.png`),
        fullPage: true,
      });
      await card.click();
      await guest.goBack();
      await expect(card).toBeVisible();
      await card.click();
      const pattern = '**/api/v1/invitations/*/rsvp';
      await guest.route(pattern, (route) => route.abort());
      await guest.getByRole('button', { name: 'Приду', exact: true }).click();
      await expect(guest.getByRole('alert')).toBeVisible();
      await expect(
        guest.getByRole('button', { name: 'Возможно', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      await guest.unroute(pattern);
      await guest.getByRole('button', { name: 'Приду', exact: true }).click();
      await expect(guest.getByRole('link', { name: 'Открыть встречу' })).toBeVisible();
      await guest.getByRole('link', { name: 'К приглашениям' }).click();
      await expect(card).toHaveCount(0);
      await guest.getByRole('link', { name: 'Встречи', exact: true }).click();
      await expect(
        guest.getByTestId('meeting-card').filter({ hasText: created.meeting.title }),
      ).toBeVisible();
      const base = `/api/v1/meetings/${created.meeting.id}`;
      const changed = await guest.request.put(`${base}/rsvp`, {
        headers: await writeHeaders(guest),
        data: { answer: 'maybe', expected_revision: '2' },
      });

      expect(changed.status()).toBe(200);
      await guest.getByRole('link', { name: 'Приглашения', exact: true }).click();
      await expect(card).toBeVisible();
      expect((await guest.request.get(`${base}/feed`)).status()).toBe(403);
      await card.click();
      await guest.getByRole('button', { name: 'Не смогу', exact: true }).click();
      await expect(guest.getByRole('status')).toContainText('Вы ответили «Не смогу»');
      await guest.getByRole('link', { name: 'К приглашениям' }).click();
      await expect(card).toHaveCount(0);
    } finally {
      await guestContext.close();
    }
  });
}

test('invitations distinguish skeleton, error and empty state and preserve calendar selection', async ({
  page,
}) => {
  await login(page, 'Саша');
  const gate: { release: () => void } = { release: () => undefined };
  const pending = new Promise<void>((resolve) => {
    gate.release = resolve;
  });

  await page.route('**/api/v1/invitations?*', async (route) => {
    await pending;
    await route.abort();
  });
  await page.goto('/invitations');
  await expect(page.getByRole('status', { name: 'Загрузка приглашений' })).toBeVisible();
  await expect(page.getByText('Пока ничего нет')).toHaveCount(0);
  gate.release();
  await expect(page.getByText('Не удалось загрузить приглашения')).toBeVisible();
  await page.unroute('**/api/v1/invitations?*');
  await page.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(page.getByText('Пока ничего нет')).toBeVisible();
  await page.goto('/meetings?view=calendar&period=past&past=2026-09-03');
  await expect(page.locator('[data-day="2026-09-03"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('link', { name: 'Приглашения', exact: true }).click();
  await expect(page).toHaveURL(/\/invitations$/);
  await page.goBack();
  await expect(page).toHaveURL(/past=2026-09-03/);
  await page.getByRole('link', { name: 'Приглашения', exact: true }).click();
  await expect(page).toHaveURL(/\/invitations$/);
  await page.getByRole('link', { name: 'Встречи', exact: true }).click();
  await expect(page.locator('[data-day="2026-09-03"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
