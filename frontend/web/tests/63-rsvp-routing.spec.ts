import { expect, test } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [320, 390, 739, 740, 1100, 1440]) {
  test(`confirmed RSVP routes across invitation, saved list and details at ${width}px`, async ({
    page,
    browser,
  }) => {
    await login(page, 'Саша');
    const created = await apiCreate(page, `Ответ и переход ${width}`);
    const id = created.meeting.id;
    const guestContext = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width, height: 900 },
    });

    const guest = await guestContext.newPage();
    let writes = 0;
    guest.on('request', (request) => {
      if (request.method() === 'PUT' && request.url().endsWith('/rsvp')) {
        writes += 1;
      }
    });

    try {
      await login(guest, 'Лена');
      await guest.goto(created.invitation_url);
      await guest.getByRole('button', { name: 'Приду', exact: true }).click();
      await expect(guest).toHaveURL(`/meetings/${id}`);
      await expect(guest.getByLabel('Сообщение', { exact: true })).toBeVisible();
      await guest.goto(created.invitation_url);
      await expect(guest).toHaveURL(`/meetings/${id}`);
      await guest.reload();
      await expect(guest.getByLabel('Сообщение', { exact: true })).toBeVisible();
      expect(writes).toBe(1);
      await guest
        .getByRole('button', { name: 'Информация о встрече', exact: true })
        .click();
      await guest.getByRole('button', { name: 'Возможно', exact: true }).click();
      await expect(guest).toHaveURL('/invitations');
      await expect(guest.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
      const card = guest
        .getByTestId('saved-invitation')
        .filter({ hasText: created.meeting.title });

      await expect(card).toBeVisible();
      expect((await guest.request.get(`/api/v1/meetings/${id}/feed`)).status()).toBe(403);
      await card.click();
      await guest.getByRole('button', { name: 'Не смогу', exact: true }).click();
      await expect(guest).toHaveURL(`/meetings/${id}/declined`);
      await expect(
        guest.getByRole('heading', { name: 'Вы ответили «Не смогу»', exact: true }),
      ).toBeFocused();
      await expect(guest.getByText(created.meeting.title, { exact: true })).toBeVisible();
      await guest.reload();
      await expect(
        guest.getByRole('heading', { name: 'Вы ответили «Не смогу»', exact: true }),
      ).toBeVisible();

      if (width >= 740) {
        const account = guest.getByRole('button', { name: 'Аккаунт: Лена', exact: true });
        await account.focus();
        await account.press('Enter');
        await expect(
          guest.getByRole('menuitem', { name: 'Выйти', exact: true }),
        ).toBeVisible();
        await guest.keyboard.press('Escape');
        await expect(
          guest.getByRole('menuitem', { name: 'Выйти', exact: true }),
        ).toHaveCount(0);
        await expect(account).toBeFocused();
      }

      expect(writes).toBe(3);
      expect((await guest.request.get(`/api/v1/meetings/${id}/feed`)).status()).toBe(403);
      await guest.getByRole('link', { name: 'К моим встречам', exact: true }).click();
      await expect(guest).toHaveURL('/meetings');
      await expect(
        guest.getByTestId('meeting-card').filter({ hasText: created.meeting.title }),
      ).toHaveCount(0);
      await guest.goto('/invitations');
      await expect(card).toHaveCount(0);
      const feed = await page.request.get(`/api/v1/meetings/${id}/feed`);
      const raw: unknown = await feed.json();
      const { feedSchema } = await import('@/shared/api');
      const events = feedSchema
        .parse(raw)
        .entries.filter((entry) =>
          ['participant_joined', 'participant_left', 'rsvp_changed'].includes(entry.kind),
        );

      expect(events).toHaveLength(3);
      expect(events.map((entry) => entry.payload)).toEqual([
        expect.objectContaining({ answer: 'going' }),
        expect.objectContaining({ answer: 'maybe' }),
        expect.objectContaining({ answer: 'not_going' }),
      ]);
      await page.goto(`/meetings/${id}`);

      for (const answer of ['Приду', 'Возможно', 'Не смогу']) {
        await expect(
          page.getByText(`Лена ответил «${answer}»`, { exact: true }),
        ).toHaveCount(1);
      }

      expect(
        await guest.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    } finally {
      await guestContext.close();
    }
  });
}

for (const width of [390, 1440]) {
  test(`unconfirmed RSVP stays and retries the same intent without duplicate events at ${width}px`, async ({
    page,
    browser,
  }) => {
    await login(page, 'Саша');
    const created = await apiCreate(page, `Неизвестный результат ${width}`);
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width, height: 900 },
    });

    const guest = await context.newPage();
    const keys: string[] = [];
    const latch = { release: () => {} };

    const waiting = new Promise<void>((resolve) => {
      latch.release = resolve;
    });

    const endpoint = '**/api/v1/invitations/*/rsvp';

    try {
      await login(guest, 'Лена');
      await guest.goto(created.invitation_url);
      await guest.route(endpoint, async (route) => {
        keys.push(route.request().headers()['idempotency-key'] ?? '');
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        await waiting;
        await route.abort('connectionreset');
      });
      await guest.getByRole('button', { name: 'Приду', exact: true }).click();
      await expect(guest.getByRole('status')).toContainText('Сохраняем ответ');
      await expect(
        guest.getByRole('button', { name: 'Возможно', exact: true }),
      ).toBeDisabled();
      await expect(guest).toHaveURL(created.invitation_url);
      latch.release();
      await expect(guest.getByRole('alert')).toBeVisible();
      await expect(guest).toHaveURL(created.invitation_url);
      await guest.unroute(endpoint);
      guest.on('request', (request) => {
        if (request.method() === 'PUT' && request.url().endsWith('/rsvp')) {
          keys.push(request.headers()['idempotency-key'] ?? '');
        }
      });
      await guest.getByRole('button', { name: 'Приду', exact: true }).click();
      await expect(guest).toHaveURL(`/meetings/${created.meeting.id}`);
      await expect(guest.getByLabel('Сообщение', { exact: true })).toBeVisible();
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe('');
      expect(keys[1]).toBe(keys[0]);
      const feed = await page.request.get(`/api/v1/meetings/${created.meeting.id}/feed`);
      const raw: unknown = await feed.json();
      const { feedSchema } = await import('@/shared/api');
      expect(
        feedSchema
          .parse(raw)
          .entries.filter((entry) => entry.kind === 'participant_joined'),
      ).toHaveLength(1);
    } finally {
      latch.release();
      await context.close();
    }
  });
}
