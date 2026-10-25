import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { apiCreate, login, writeHeaders } from '@tests/helpers';
import { preparationTaskSchema, sessionSchema } from '@/shared/api';

const openForm = async (page: Page) => {
  await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  await page.getByRole('menuitem', { name: 'Предложить задачу', exact: true }).click();

  return page.getByRole('main', { name: 'Предложить задачу', exact: true });
};

const propose = async (
  page: Page,
  meeting: string,
  title: string,
  recipient: string | null = null,
) => {
  const response = await page.request.post(
    `/api/v1/meetings/${meeting}/preparation-tasks`,
    { headers: await writeHeaders(page), data: { title, recipient_id: recipient } },
  );

  expect(response.status()).toBe(201);

  return preparationTaskSchema.parse(await response.json());
};

const join = async (page: Page, invitation: string) => {
  const path = new URL(invitation).pathname.replace('/i/', '/api/v1/invitations/');
  const response = await page.request.put(`${path}/rsvp`, {
    headers: await writeHeaders(page),
    data: { answer: 'going', expected_revision: '0' },
  });

  expect(response.status()).toBe(200);

  return path;
};

for (const width of [320, 390, 1440]) {
  test(`task form preserves draft, retries exactly and requires self consent at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Подготовка вечера');
    await page.goto(`/meetings/${meeting.id}`);
    const form = await openForm(page);
    await form.getByLabel('Что сделать').fill('Заказать пиццу');
    await form.getByLabel('Кому предложить').selectOption({ label: 'Вы' });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Добавить к встрече' })).toBeFocused();
    await openForm(page);
    await expect(form.getByLabel('Что сделать')).toHaveValue('Заказать пиццу');
    const keys: (string | undefined)[] = [];
    const bodies: (string | null)[] = [];
    await page.route(`**/meetings/${meeting.id}/preparation-tasks`, async (route) => {
      keys.push(route.request().headers()['idempotency-key']);
      bodies.push(route.request().postData());

      if (keys.length === 1) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
    await form.getByRole('button', { name: 'Предложить задачу' }).click();
    await expect(form.getByRole('alert')).toContainText('Не удалось предложить задачу');
    await expect(form.getByLabel('Что сделать')).toBeDisabled();
    await page.screenshot({
      path: `test-results/task-form-error-${width}.png`,
      animations: 'disabled',
    });
    await form.getByRole('button', { name: 'Повторить отправку' }).click();
    await expect(form).not.toBeVisible();
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    expect(bodies[1]).toBe(bodies[0]);
    const card = page.getByRole('region', { name: 'Задача подготовки' });
    await card.locator('summary').click();
    await expect(card.getByText('Предложено вам')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Отметить выполнение' })).toHaveCount(
      0,
    );
    await card.getByRole('button', { name: 'Принять задачу' }).click();
    await expect(card.getByText('Исполняет Саша')).toBeVisible();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.screenshot({
      path: `test-results/task-accepted-${width}.png`,
      animations: 'disabled',
    });
    await card.getByRole('button', { name: 'Отметить выполнение' }).click();
    await expect(card.getByText('Выполнено · Саша', { exact: true })).toBeVisible();
    await expect(card.getByRole('button')).toHaveCount(0);
    await expect(
      page.getByText('Задача выполнена · Саша · «Заказать пиццу»', { exact: true }),
    ).toBeVisible();
  });
}

test('addressed task waits for its recipient and preserves uncertain acceptance', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Пицца на вечер');
  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  try {
    const friend = await context.newPage();
    await login(friend, 'Лена');
    await join(friend, created.invitation_url);
    const profile = sessionSchema.parse(
      await (await friend.request.get('/api/v1/me')).json(),
    );

    const task = await propose(
      page,
      created.meeting.id,
      'Заказать пиццу',
      profile.user.id,
    );

    await page.goto(`/meetings/${created.meeting.id}`);
    const authorCard = page.getByRole('region', { name: 'Задача подготовки' });
    await expect(authorCard.getByText('Кому предложено: Лена')).toBeVisible();
    await expect(authorCard.getByRole('button', { name: 'Принять задачу' })).toHaveCount(
      0,
    );
    const keys: (string | undefined)[] = [];
    await friend.route(`**/preparation-tasks/${task.id}/accept`, async (route) => {
      keys.push(route.request().headers()['idempotency-key']);

      if (keys.length === 1) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
    await friend.goto(`/meetings/${created.meeting.id}`);
    const card = friend.getByRole('region', { name: 'Задача подготовки' });
    await card.locator('summary').click();
    await card.getByRole('button', { name: 'Принять задачу' }).click();
    await expect(card.getByRole('alert')).toContainText('Не удалось сохранить действие');
    await expect(card.getByText('Предложено вам')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Отказаться' })).toBeDisabled();
    await card.getByRole('button', { name: 'Повторить действие' }).click();
    await expect(card.getByText('Исполняет Лена')).toBeVisible();
    expect(keys[1]).toBe(keys[0]);
    await expect(authorCard.getByText('Исполняет Лена')).toBeVisible({ timeout: 10000 });
    await card.getByRole('button', { name: 'Отказаться' }).click();
    await expect(card.getByText('Отказ · Лена', { exact: true })).toBeVisible();
    await expect(card.getByRole('button')).toHaveCount(0);
    await friend.screenshot({
      path: 'test-results/task-declined.png',
      animations: 'disabled',
    });
  } finally {
    await context.close();
  }
});

test('a conflicting general acceptance refreshes the assignee without taking their task', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Общее дело');
  const task = await propose(page, created.meeting.id, 'Принести настолки');
  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  try {
    const friend = await context.newPage();
    await login(friend, 'Лена');
    await join(friend, created.invitation_url);
    await friend.goto(`/meetings/${created.meeting.id}`);
    const card = friend.getByRole('region', { name: 'Задача подготовки' });
    await card.locator('summary').click();
    await expect(card.getByRole('button', { name: 'Взять на себя' })).toBeVisible();
    await friend.route(`**/preparation-tasks/${task.id}/accept`, async (route) => {
      const accepted = await page.request.post(
        `/api/v1/meetings/${created.meeting.id}/preparation-tasks/${task.id}/accept`,
        { headers: await writeHeaders(page), data: { expected_revision: '1' } },
      );

      expect(accepted.status()).toBe(200);
      await route.continue();
    });
    await card.getByRole('button', { name: 'Взять на себя' }).click();
    await expect(card.getByRole('alert')).toContainText('Задача изменилась');
    await expect(card.getByText('Исполняет Саша')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Отметить выполнение' })).toHaveCount(
      0,
    );
    const cancelled = await page.request.post(
      `/api/v1/meetings/${created.meeting.id}/preparation-tasks/${task.id}/cancel`,
      { headers: await writeHeaders(page), data: { expected_revision: '2' } },
    );

    expect(cancelled.status()).toBe(200);
    await expect(card.getByText('Отменено · Саша', { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(card.getByRole('button')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('participant loading failure keeps the draft and task read failures retain confirmed content', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Задача и сеть');
  await page.goto(`/meetings/${meeting.id}`);
  await page.route(`**/meetings/${meeting.id}/participants`, (route) =>
    route.abort('failed'),
  );
  const form = await openForm(page);
  await form.getByLabel('Что сделать').fill('Купить напитки');
  await expect(form.getByText('Не удалось загрузить участников.')).toBeVisible();
  await expect(form.getByRole('button', { name: 'Предложить задачу' })).toBeDisabled();
  await page.unroute(`**/meetings/${meeting.id}/participants`);
  await form.getByRole('button', { name: 'Повторить', exact: true }).click();
  await form.getByLabel('Кому предложить').selectOption({ label: 'Любой участник' });
  await expect(form.getByLabel('Что сделать')).toHaveValue('Купить напитки');
  await form.getByRole('button', { name: 'Предложить задачу' }).click();
  const card = page.getByRole('region', { name: 'Задача подготовки' });
  await card.locator('summary').click();
  await expect(card.getByText('Пока никто не взял задачу')).toBeVisible();
  await page.route(`**/meetings/${meeting.id}/preparation-tasks/*`, (route) =>
    route.abort('failed'),
  );
  await expect(card.getByText('Не удалось загрузить задачу.')).toBeVisible({
    timeout: 10000,
  });
  await expect(card.getByRole('heading', { name: 'Купить напитки' })).toBeVisible();
  await page.unroute(`**/meetings/${meeting.id}/preparation-tasks/*`);
  await card.getByRole('button', { name: 'Повторить', exact: true }).click();
  await expect(card.getByText('Не удалось загрузить задачу.')).toHaveCount(0);
  await card.getByRole('button', { name: 'Отменить задачу' }).click();
  await expect(card.getByText('Отменено · Саша', { exact: true })).toBeVisible();
});

test('pending acceptance shows only a spinner and its late response cannot restore access', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Задача и доступ');
  const task = await propose(page, created.meeting.id, 'Купить напитки');
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const latch = { release: () => {} };
  const gate = new Promise<void>((resolve) => {
    latch.release = resolve;
  });

  try {
    const friend = await context.newPage();
    await login(friend, 'Лена');
    const invitation = await join(friend, created.invitation_url);
    let held = false;
    await friend.route(`**/preparation-tasks/${task.id}/accept`, async (route) => {
      const response = await route.fetch();
      held = true;
      await gate;
      await route.fulfill({ response });
    });
    await friend.goto(`/meetings/${created.meeting.id}`);
    const card = friend.getByRole('region', { name: 'Задача подготовки' });
    await card.locator('summary').click();
    const button = card.getByRole('button', { name: 'Взять на себя' });
    await button.click();
    await expect.poll(() => held).toBe(true);
    await expect(button).toBeDisabled();
    await expect(button).toHaveText('');
    await expect(button).toHaveAttribute('aria-busy', 'true');
    const left = await friend.request.put(`${invitation}/rsvp`, {
      headers: await writeHeaders(friend),
      data: { answer: 'maybe', expected_revision: '1' },
    });

    expect(left.status()).toBe(200);
    await expect(card).toHaveCount(0, { timeout: 10000 });
    latch.release();
    await expect(card).toHaveCount(0);
  } finally {
    latch.release();
    await context.close();
  }
});
