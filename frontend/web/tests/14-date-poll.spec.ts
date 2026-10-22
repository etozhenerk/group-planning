import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { apiCreate, apiMeeting, login, setDate, writeHeaders } from '@tests/helpers';
import { datePollSchema } from '@/shared/api';

const join = async (page: Page, url: string) => {
  await page.goto(url);
  await page.getByRole('button', { name: 'Войти и ответить' }).click();
  await page.getByRole('link', { name: 'Войти как Лена' }).click();
  await page.getByRole('button', { name: 'Приду', exact: true }).click();
  await page.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
};

const read = async (page: Page, id: string, poll: string) =>
  datePollSchema.parse(
    await (await page.request.get(`/api/v1/meetings/${id}/date-polls/${poll}`)).json(),
  );

const vote = async (page: Page, id: string, poll: string, ids: string[]) => {
  const current = await read(page, id, poll);
  const response = await page.request.put(
    `/api/v1/meetings/${id}/date-polls/${poll}/vote`,
    {
      headers: await writeHeaders(page),
      data: { option_ids: ids, expected_revision: current.my_vote_revision },
    },
  );

  expect(response.ok()).toBe(true);
};

test('create a meeting without an hour, then reload the unchanged date and system notice', async ({
  page,
}) => {
  await login(page, 'Саша');
  await page.goto('/meetings/new');
  await page.getByLabel('Название', { exact: true }).fill('Только день');
  await setDate(page, '25.10.2026');
  await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Встреча создана' })).toBeVisible();
  const id = page.url().split('/').at(-2) ?? '';
  expect((await apiMeeting(page, id)).starts_at).toBeNull();
  expect((await apiMeeting(page, id)).starts_on).toBe('2026-10-25');
  await page.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  await expect(page).toHaveURL(`/meetings/${id}`);
  await page.reload();
  await expect(page.getByText(/Осталось договориться о времени/)).toBeVisible();
  await expect(
    page.getByText('25 октября · время пока не выбрано').first(),
  ).toBeVisible();
});
test('create with settings and apply live majority in two chats', async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Опрос в чате');
  const id = created.meeting.id;
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    timezoneId: 'Europe/Moscow',
  });

  const friend = await context.newPage();
  await join(friend, created.invitation_url);
  await page.goto(`/meetings/${id}`);
  await page.getByRole('button', { name: 'Добавить опрос даты' }).click();
  const form = page.getByRole('dialog', { name: 'Предложить другую дату' });
  await expect(form.getByRole('switch', { name: /Несколько вариантов/ })).toBeChecked();
  await expect(form.getByRole('switch', { name: 'Можно переголосовать' })).toBeChecked();
  await expect(
    form.getByRole('switch', { name: 'Участники могут добавить дату' }),
  ).toBeChecked();

  for (const toggle of await form.getByRole('switch').all()) {
    const bounds = await toggle.boundingBox();
    expect(bounds?.width).toBe(42);
    expect(bounds?.height).toBe(26);
  }

  await expect(form).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  const dateField = form.locator('.g-text-input').first();
  const dateBounds = await dateField.boundingBox();

  for (const icon of await dateField.locator('svg').all()) {
    const bounds = await icon.boundingBox();
    expect((bounds?.y ?? 0) + (bounds?.height ?? 0) / 2).toBeCloseTo(
      (dateBounds?.y ?? 0) + (dateBounds?.height ?? 0) / 2,
      0,
    );
  }

  await page.screenshot({
    path: 'test-results/poll-form-390.png',
    fullPage: true,
    animations: 'disabled',
  });
  await form.getByRole('button', { name: 'Создать опрос', exact: true }).click();
  await expect(form).not.toBeVisible();
  const card = page.getByRole('region', { name: 'Опрос о дате' });
  const other = friend.getByRole('region', { name: 'Опрос о дате' });
  await expect(other).toBeVisible({ timeout: 10000 });

  for (const checkbox of await card.getByRole('checkbox').all()) {
    const bounds = await checkbox.boundingBox();
    expect(bounds?.width).toBe(18);
    expect(bounds?.height).toBe(18);
  }

  const cardBox = await card.boundingBox();
  const authorRow = await card.locator('..').locator('..').boundingBox();
  expect(cardBox?.x ?? 0).toBeGreaterThanOrEqual(authorRow?.x ?? 0);
  expect((cardBox?.x ?? 0) + (cardBox?.width ?? 0)).toBeLessThanOrEqual(
    (authorRow?.x ?? 0) + (authorRow?.width ?? 0),
  );
  await card.getByRole('checkbox', { name: '25 октября', exact: true }).check();
  await card.getByRole('button', { name: 'Проголосовать', exact: true }).click();
  await expect(other.getByText('1 голос', { exact: true })).toBeVisible({
    timeout: 10000,
  });
  const bounds = await card.boundingBox();
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: 'test-results/poll-card-390.png',
    fullPage: true,
    animations: 'disabled',
  });
  await other.getByRole('checkbox', { name: '25 октября', exact: true }).check();
  await other.getByRole('button', { name: 'Проголосовать', exact: true }).click();
  await expect(card.getByText('Опрос завершён · дата выбрана')).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText(/Встреча перенесена на 25 октября/)).toBeVisible();
  expect((await apiMeeting(page, id)).starts_at).toBe('2026-10-25T16:00:00Z');
  await expect(card.getByRole('button', { name: 'Проголосовать' })).toHaveCount(0);

  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.screenshot({
      path: `test-results/poll-result-${width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }

  await context.close();
});
test('hidden anonymous tie reveals no interim votes and organizer resolves after deadline', async ({
  page,
  browser,
}) => {
  test.setTimeout(45000);
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Скрытый опрос');
  const id = created.meeting.id;
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const friend = await context.newPage();
  await join(friend, created.invitation_url);
  const response = await page.request.post(`/api/v1/meetings/${id}/date-polls`, {
    headers: await writeHeaders(page),
    data: {
      dates: ['2026-10-25', '2026-10-26'],
      closes_at: new Date(Date.now() + 15000).toISOString(),
      settings: {
        multiple_answers: true,
        allow_revoting: true,
        allow_new_options: true,
        anonymous: true,
        hide_results: true,
      },
    },
  });

  const poll = datePollSchema.parse(await response.json());
  const ids = poll.options.map((option) => option.id);
  await vote(page, id, poll.id, ids);
  await vote(friend, id, poll.id, ids);
  await page.goto(`/meetings/${id}`);
  const card = page.getByRole('region', { name: 'Опрос о дате' });
  await expect(card).toBeVisible();
  await expect(card.getByText(/\d+ голос/)).toHaveCount(0);
  await expect(card.locator('summary')).toHaveCount(0);
  await expect(
    card.getByText('Результаты появятся после окончания опроса.'),
  ).toBeVisible();
  await expect(card.getByText('Выбор за организатором')).toBeVisible({ timeout: 25000 });
  await expect(
    friend.getByRole('region', { name: 'Опрос о дате' }).getByText(/Организатор выберет/),
  ).toBeVisible();
  await card.getByRole('button', { name: '26 октября', exact: true }).click();
  await expect(card.getByText('Опрос завершён · дата выбрана')).toBeVisible();
  expect((await apiMeeting(page, id)).starts_on).toBe('2026-10-26');
  await context.close();
});
