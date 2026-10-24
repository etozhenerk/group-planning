import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { apiCreate, apiMeeting, login, writeHeaders } from '@tests/helpers';
import { createdSchema, datePollSchema } from '@/shared/api';

const createPoll = async (
  page: Page,
  meeting: string,
  dates: string[],
  hidden = false,
) => {
  const response = await page.request.post(`/api/v1/meetings/${meeting}/date-polls`, {
    headers: await writeHeaders(page),
    data: {
      dates,
      closes_at: new Date(Date.now() + 3_600_000).toISOString(),
      settings: { hide_results: hidden },
    },
  });

  expect(response.status()).toBe(201);

  return datePollSchema.parse(await response.json());
};

for (const example of [
  {
    name: 'gap can leave time unspecified',
    starts: '2026-03-07T02:30:00-05:00',
    dates: ['2026-03-08', '2026-03-09'],
    label: '8 марта',
    time: '02:30',
    error: 'этого времени нет',
    clear: true,
    expected: null,
  },
  {
    name: 'overlap requires an explicit side',
    starts: '2026-10-31T01:30:00-04:00',
    dates: ['2026-11-01', '2026-11-02'],
    label: '1 ноября',
    time: '01:30',
    error: 'дважды',
    clear: false,
    expected: '2026-11-01T06:30:00Z',
  },
]) {
  test(`poll ${example.name}`, async ({ page }) => {
    await login(page, 'Саша');
    const response = await page.request.post('/api/v1/meetings', {
      headers: await writeHeaders(page),
      data: {
        title: 'Встреча при переводе часов',
        starts_at: example.starts,
        timezone: 'America/New_York',
      },
    });

    const { meeting } = createdSchema.parse(await response.json());
    await createPoll(page, meeting.id, example.dates);
    await page.goto(`/meetings/${meeting.id}`);
    const card = page.getByRole('region', { name: 'Опрос о дате' });
    await card.getByRole('checkbox', { name: example.label, exact: true }).check();
    await card.getByRole('button', { name: 'Проголосовать', exact: true }).click();
    await expect(card.getByText('Нужно уточнить время', { exact: true })).toBeVisible();
    expect((await apiMeeting(page, meeting.id)).starts_on).toBe(meeting.starts_on);
    await card.getByRole('textbox', { name: 'Время', exact: true }).fill(example.time);
    await card.getByRole('button', { name: 'Сохранить время' }).click();
    await expect(card.getByRole('alert')).toContainText(example.error);

    if (example.clear) {
      await card.getByRole('button', { name: 'Уточнить время позже' }).click();
    } else {
      await card.getByRole('combobox', { name: 'Повторяющееся время' }).click();
      await page.getByRole('option', { name: 'После перевода часов' }).click();
      await card.getByRole('button', { name: 'Сохранить время' }).click();
    }

    await expect(card.getByText('Опрос завершён · дата выбрана')).toBeVisible();
    const applied = await apiMeeting(page, meeting.id);
    expect(applied.starts_on).toBe(example.dates[0]);
    expect(applied.starts_at).toBe(example.expected);
    await page.screenshot({
      path: `test-results/poll-time-${example.clear ? 'gap' : 'overlap'}.png`,
      fullPage: true,
    });
  });
}

test('manual date change cancels a hidden poll during a vote without revealing totals', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Ручной перенос');
  const poll = await createPoll(page, meeting.id, ['2026-10-25', '2026-10-26'], true);
  const base = `/api/v1/meetings/${meeting.id}`;
  const gate: { release: () => void } = { release: () => undefined };
  const released = new Promise<void>((resolve) => {
    gate.release = resolve;
  });

  let waiting = false;
  await page.route(`**${base}/date-polls/${poll.id}/vote`, async (route) => {
    waiting = true;
    await released;
    const response = await route.fetch();
    await route.fulfill({ response });
  });
  await page.goto(`/meetings/${meeting.id}`);
  const card = page.getByRole('region', { name: 'Опрос о дате' });
  await card.getByRole('checkbox', { name: '25 октября', exact: true }).check();
  await card.getByRole('button', { name: 'Проголосовать', exact: true }).click();
  await expect.poll(() => waiting).toBe(true);
  const changed = await page.request.patch(base, {
    headers: await writeHeaders(page),
    data: {
      starts_on: '2026-10-27',
      starts_at: null,
      expected_revision: meeting.revision,
    },
  });

  expect(changed.status()).toBe(200);
  gate.release();
  await expect(card.getByText('Опрос завершён', { exact: true })).toBeVisible();
  await expect(
    card.getByRole('button', { name: /Проголосовать|Изменить голос/ }),
  ).toHaveCount(0);
  await expect(card.getByText(/\d+ голос/)).toHaveCount(0);
  await expect(card.locator('summary')).toHaveCount(0);
  await expect(
    page.getByTestId('system-event').filter({ hasText: 'Предыдущий опрос завершён' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/poll-cancelled.png', fullPage: true });
});

test('a failed vote keeps selection and retry key; losing membership removes the poll', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Повтор и потеря доступа');
  const poll = await createPoll(page, created.meeting.id, ['2026-10-25', '2026-10-26']);
  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  try {
    const friend = await context.newPage();
    await login(friend, 'Лена');
    const invitation = new URL(created.invitation_url).pathname.replace(
      '/i/',
      '/api/v1/invitations/',
    );

    const joined = await friend.request.put(`${invitation}/rsvp`, {
      headers: await writeHeaders(friend),
      data: { answer: 'going', expected_revision: '0' },
    });

    expect(joined.status()).toBe(200);
    const keys: (string | undefined)[] = [];
    const base = `/api/v1/meetings/${created.meeting.id}`;
    await friend.route(`**${base}/date-polls/${poll.id}/vote`, async (route) => {
      keys.push(route.request().headers()['idempotency-key']);

      if (keys.length === 1) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
    await friend.goto(`/meetings/${created.meeting.id}`);
    const card = friend.getByRole('region', { name: 'Опрос о дате' });
    await card.getByRole('checkbox', { name: '25 октября', exact: true }).check();
    await card.getByRole('button', { name: 'Проголосовать', exact: true }).click();
    await expect(card.getByRole('alert')).toBeVisible();
    await expect(
      card.getByRole('checkbox', { name: '25 октября', exact: true }),
    ).toBeChecked();
    await card.getByRole('button', { name: 'Проголосовать', exact: true }).click();
    await expect(card.getByRole('alert')).toHaveCount(0);
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    const changed = await friend.request.put(`${invitation}/rsvp`, {
      headers: await writeHeaders(friend),
      data: { answer: 'maybe', expected_revision: '1' },
    });

    expect(changed.status()).toBe(200);
    await expect(card).toHaveCount(0, { timeout: 10_000 });
    await expect(friend.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
    expect((await friend.request.get(`${base}/date-polls/${poll.id}`)).status()).toBe(
      403,
    );
  } finally {
    await context.close();
  }
});
