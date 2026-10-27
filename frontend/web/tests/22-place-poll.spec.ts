import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  actionSurface,
  apiCreate,
  apiMeeting,
  login,
  writeHeaders,
} from '@tests/helpers';
import { placePollSchema } from '@/shared/api';

const openForm = async (page: Page) => {
  await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  await page.getByRole('menuitem', { name: 'Предложить место', exact: true }).click();

  return actionSurface(page, 'Предложить место');
};

const seed = async (page: Page, meeting: string, seconds = 60) => {
  const response = await page.request.post(`/api/v1/meetings/${meeting}/place-polls`, {
    headers: await writeHeaders(page),
    data: {
      place: 'Кафе у парка',
      closes_at: new Date(Date.now() + seconds * 1000).toISOString(),
    },
  });

  expect(response.status()).toBe(201);

  return placePollSchema.parse(await response.json());
};

for (const width of [320, 390, 1440]) {
  test(`place form, failed creation, voting and cancellation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Новое место');
    const base = `/api/v1/meetings/${meeting.id}`;
    await page.goto(`/meetings/${meeting.id}`);
    const form = await openForm(page);
    await form.getByLabel('Новое место').fill('Кафе у парка');
    await form.getByLabel('Почему здесь').fill('Там тихо и есть большой стол');
    const keys: (string | undefined)[] = [];
    const payloads: string[] = [];
    await page.route(`**${base}/place-polls`, async (route) => {
      keys.push(route.request().headers()['idempotency-key']);
      payloads.push(route.request().postData() ?? '');

      if (keys.length === 1) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
    await form.getByRole('button', { name: 'Предложить место', exact: true }).click();
    await expect(form.getByRole('alert')).toHaveText(
      'Не удалось подтвердить создание опроса. Повторите отправку.',
    );
    await expect(form.getByLabel('Новое место')).toHaveValue('Кафе у парка');
    await expect(
      form.getByRole('button', { name: 'Повторить отправку' }),
    ).toBeInViewport();
    await page.screenshot({
      path: `test-results/place-form-error-${width}.png`,
      animations: 'disabled',
    });
    await form.getByRole('button', { name: 'Повторить отправку', exact: true }).click();
    await expect(form).not.toBeVisible();
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    expect(payloads[1]).toBe(payloads[0]);
    const card = page.getByRole('region', { name: 'Опрос о месте' });
    await expect(card.getByRole('heading', { name: 'Кафе у парка' })).toBeVisible();
    await expect(card.getByText('Там тихо и есть большой стол')).toBeVisible();
    await expect(card).toHaveCSS('background-color', 'rgb(48, 49, 56)');
    await card.getByRole('button', { name: 'За · 0', exact: true }).click();
    await expect(
      card.getByRole('button', { name: 'За · 1', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect((await apiMeeting(page, meeting.id)).place).toBeNull();
    await card.getByRole('button', { name: 'Против · 0', exact: true }).click();
    await expect(
      card.getByRole('button', { name: 'Против · 1', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      card.getByRole('button', { name: 'За · 0', exact: true }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(
      card.getByRole('button', { name: 'Против · 1', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await page.screenshot({
      path: `test-results/place-vote-${width}.png`,
      animations: 'disabled',
    });
    const activeForm = await openForm(page);
    await activeForm.getByLabel('Новое место').fill('Другая площадка');
    await activeForm.getByRole('button', { name: 'Предложить место' }).click();
    await expect(activeForm.getByRole('alert')).toContainText('уже есть открытый опрос');
    await page.keyboard.press('Escape');
    await expect(activeForm).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Добавить к встрече' })).toBeFocused();
    const current = await apiMeeting(page, meeting.id);
    const changed = await page.request.patch(base, {
      headers: await writeHeaders(page),
      data: { place: 'У Саши дома', expected_revision: current.revision },
    });

    expect(changed.status()).toBe(200);
    await expect(
      card.getByText('Опрос отменён: организатор изменил место', { exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await expect(card.getByRole('button', { name: /За ·|Против ·/ })).toHaveCount(0);

    if (width < 1170) {
      await page.getByRole('button', { name: 'Информация о встрече' }).click();
    }

    await expect(page.getByText('У Саши дома', { exact: true }).first()).toBeVisible();
  });
}

for (const yes of [true, false]) {
  test(`place closes on time with ${yes ? 'majority' : 'zero votes'} and refreshes header`, async ({
    page,
  }) => {
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Итог места');
    await seed(page, meeting.id, 9);
    await page.goto(`/meetings/${meeting.id}`);
    const card = page.getByRole('region', { name: 'Опрос о месте' });

    if (yes) {
      await card.getByRole('button', { name: 'За · 0' }).click();
      await expect(
        card.getByRole('button', { name: 'За · 1', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
    }

    expect((await apiMeeting(page, meeting.id)).place).toBeNull();
    await expect(
      card.getByText(yes ? 'Место изменено' : 'Место осталось прежним', { exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await expect(card.getByRole('button')).toHaveCount(0);
    expect((await apiMeeting(page, meeting.id)).place).toBe(yes ? 'Кафе у парка' : null);

    if (yes) {
      await expect(
        page.getByText('Кафе у парка', { exact: true }).filter({ visible: true }),
      ).toHaveCount(2);
    }

    await page.screenshot({
      path: `test-results/place-result-${yes ? 'applied' : 'rejected'}.png`,
      fullPage: true,
    });
  });
}

test('failed vote preserves state, retry keeps key, late reply cannot restore lost membership', async ({
  page,
  browser,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Голос и доступ');
  const poll = await seed(page, created.meeting.id);
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
    const base = `/api/v1/meetings/${created.meeting.id}/place-polls/${poll.id}`;
    const keys: (string | undefined)[] = [];
    const latch = { release: () => {} };

    const gate = new Promise<void>((resolve) => {
      latch.release = resolve;
    });

    let held = false;
    await friend.route(`**${base}/vote`, async (route) => {
      keys.push(route.request().headers()['idempotency-key']);

      if (keys.length === 1) {
        await route.abort('failed');
      } else if (keys.length === 3) {
        const response = await route.fetch();
        held = true;
        await gate;
        await route.fulfill({ response });
      } else {
        await route.continue();
      }
    });
    await friend.goto(`/meetings/${created.meeting.id}`);
    const card = friend.getByRole('region', { name: 'Опрос о месте' });
    await card.getByRole('button', { name: 'За · 0' }).click();
    await expect(card.getByRole('alert')).toContainText('Не удалось сохранить голос');
    await expect(card.getByRole('button', { pressed: true })).toHaveCount(0);
    await card.getByRole('button', { name: 'Повторить' }).click();
    await expect(
      card.getByRole('button', { name: 'За · 1', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    await card.getByRole('button', { name: 'Против · 0' }).click();
    await expect.poll(() => held).toBe(true);
    const pending = card.getByRole('button', { name: 'Против · 0' });
    await expect(pending).toBeDisabled();
    await expect(pending).toHaveText('');
    await expect(card.getByRole('button', { name: 'За · 1' })).toBeDisabled();
    const left = await friend.request.put(`${invitation}/rsvp`, {
      headers: await writeHeaders(friend),
      data: { answer: 'maybe', expected_revision: '1' },
    });

    expect(left.status()).toBe(200);
    await expect(card).toHaveCount(0, { timeout: 10000 });
    latch.release();
    await expect(friend.getByRole('region', { name: 'Опрос о месте' })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
