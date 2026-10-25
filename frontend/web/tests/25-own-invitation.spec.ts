import { expect, test } from '@playwright/test';
import { apiCreate, apiMeeting, login } from '@tests/helpers';

test('organizer opens own invitation after login without RSVP or duplicate membership', async ({
  page,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Своя встреча');
  let responses = 0;
  page.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().endsWith('/rsvp')) {
      responses++;
    }
  });
  await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
  await page.goto(created.invitation_url);
  await page.getByRole('button', { name: 'Войти и ответить' }).click();
  await page.getByRole('link', { name: 'Войти как Саша' }).click();
  await expect(page).toHaveURL(created.invitation_url);
  await expect(page.getByText('Вы организуете эту встречу.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Приду', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Возможно', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole('button', { name: 'Не смогу', exact: true })).toHaveCount(
    0,
  );
  await page.reload();
  await expect(page.getByText('Вы организуете эту встречу.')).toBeVisible();

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('link', { name: 'Открыть встречу' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/own-invitation-${width}.png`,
      fullPage: true,
    });
  }

  const open = page.getByRole('link', { name: 'Открыть встречу', exact: true });
  await open.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`/meetings/${created.meeting.id}`);
  await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  const saved = await apiMeeting(page, created.meeting.id);
  expect(saved.participant_count).toBe(1);
  expect(saved.my_rsvp).toBeNull();
  expect(saved.revision).toBe(created.meeting.revision);
  expect(responses).toBe(0);
});

test('role check shows a skeleton and retries a network failure before offering actions', async ({
  page,
}) => {
  await login(page, 'Саша');
  const created = await apiCreate(page, 'Проверка роли');
  const gate = { release: () => {} };
  const pending = new Promise<void>((resolve) => {
    gate.release = resolve;
  });

  await page.route(`**/api/v1/meetings/${created.meeting.id}`, async (route) => {
    await pending;
    await route.abort('connectionreset');
  });
  await page.goto(created.invitation_url);
  await expect(
    page.getByRole('status', { name: 'Проверка доступа к встрече' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Приду', exact: true })).toHaveCount(0);
  gate.release();
  await expect(page.getByRole('alert')).toContainText(
    'Не удалось проверить доступ к встрече',
  );
  await expect(page.getByRole('button', { name: 'Приду', exact: true })).toHaveCount(0);
  await page.unroute(`**/api/v1/meetings/${created.meeting.id}`);
  await page.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(page.getByRole('link', { name: 'Открыть встречу' })).toBeVisible();
});
