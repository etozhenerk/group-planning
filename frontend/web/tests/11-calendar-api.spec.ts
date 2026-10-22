import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { createdSchema, invitationLinkSchema } from '@/shared/api';
import { login, writeHeaders } from '@tests/helpers';

test('real API: complete day counts, pagination, changed cursor and rescheduled date', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const headers = await writeHeaders(page);
  const meetings = [];

  for (let index = 0; index < 52; index++) {
    const response = await page.request.post('/api/v1/meetings', {
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      data: {
        title: `Календарь ${index + 1}`,
        starts_at: `2088-02-29T19:${String(index).padStart(2, '0')}:00+03:00`,
        timezone: 'Europe/Moscow',
      },
    });

    expect(response.status()).toBe(201);
    const raw: unknown = await response.json();
    meetings.push(createdSchema.parse(raw).meeting);
  }

  await page.goto('/meetings?view=calendar&period=upcoming&upcoming=2088-02-29');
  const agenda = page.getByRole('region', { name: 'Встречи выбранного дня' });
  await expect(page.locator('[data-day="2088-02-29"]')).toHaveAccessibleName(
    /встреч: 52/,
  );
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(50);
  const first = meetings[0]!;
  const update = await page.request.patch(`/api/v1/meetings/${first.id}`, {
    headers: { ...headers, 'Idempotency-Key': randomUUID() },
    data: { expected_revision: first.revision, starts_at: '2088-03-01T19:00:00+03:00' },
  });

  expect(update.status()).toBe(200);
  await agenda.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(50);
  await expect(agenda.getByRole('link', { name: /19:00Календарь 1/ })).toHaveCount(0);
  await agenda.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(51);
  await expect(agenda.getByRole('button', { name: 'Показать ещё' })).toHaveCount(0);
  await expect(page.locator('[data-day="2088-02-29"]')).toHaveAccessibleName(
    /встреч: 51/,
    { timeout: 10_000 },
  );
  await page.getByRole('button', { name: 'Следующий месяц' }).click();
  await page.locator('[data-day="2088-03-01"]').click();
  await expect(agenda.getByTestId('agenda-meeting')).toHaveCount(1);
  await expect(agenda.getByTestId('agenda-meeting')).toContainText('Календарь 1');
  const invitationResponse = await page.request.get(
    `/api/v1/meetings/${first.id}/invitation`,
  );

  const invitationRaw: unknown = await invitationResponse.json();
  const token = new URL(invitationLinkSchema.parse(invitationRaw).invitation_url).pathname
    .split('/')
    .at(-1)!;

  const context = await browser.newContext({
    baseURL: 'https://127.0.0.1:8444',
    ignoreHTTPSErrors: true,
  });

  try {
    const friend = await context.newPage();
    await login(friend, 'Лена');
    const join = await friend.request.put(`/api/v1/invitations/${token}/rsvp`, {
      headers: await writeHeaders(friend),
      data: { answer: 'going', expected_revision: '0' },
    });

    expect(join.status()).toBe(200);
    await friend.goto('/meetings?view=calendar&period=upcoming&upcoming=2088-03-01');
    const friendAgenda = friend.getByRole('region', { name: 'Встречи выбранного дня' });
    await expect(friendAgenda.getByTestId('agenda-meeting')).toHaveCount(1);
    const leave = await friend.request.put(`/api/v1/meetings/${first.id}/rsvp`, {
      headers: await writeHeaders(friend),
      data: { answer: 'not_going', expected_revision: '1' },
    });

    expect(leave.status()).toBe(200);
    await expect(friendAgenda.getByTestId('agenda-meeting')).toHaveCount(0, {
      timeout: 10_000,
    });
    await expect(friend.locator('[data-day="2088-03-01"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  } finally {
    await context.close();
  }
});
