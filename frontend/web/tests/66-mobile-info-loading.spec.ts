import { expect, test } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';
import { holdNextGet } from '@tests/helpers/holdNextGet';

test('mobile information owns loading, failure and separate participant retry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Сведения и повтор загрузки');
  await page.goto(`/meetings/${meeting.id}`);
  const trigger = page.getByRole('button', { name: 'Информация о встрече', exact: true });
  await expect(trigger).toBeVisible();
  const detailsHeld = await holdNextGet(page, `**/api/v1/meetings/${meeting.id}`);

  await trigger.click();
  await detailsHeld.requested;
  const info = page.getByRole('dialog', { name: 'О встрече', exact: true });
  const share = info.getByRole('button', { name: 'Пригласить друзей', exact: true });
  await expect(
    info.getByRole('status', { name: 'Загрузка встречи', exact: true }),
  ).toBeVisible();
  await expect(share).toHaveCount(0);
  detailsHeld.finish(503);
  await expect(
    info.getByRole('heading', { name: 'Встреча не загрузилась' }),
  ).toBeVisible();
  await expect(info.getByText(meeting.title, { exact: true })).toHaveCount(0);
  await expect(share).toHaveCount(0);
  const peopleHeld = await holdNextGet(
    page,
    `**/api/v1/meetings/${meeting.id}/participants`,
  );

  await info.getByRole('button', { name: 'Повторить загрузку', exact: true }).click();
  await peopleHeld.requested;
  await expect(
    info.getByRole('heading', { name: meeting.title, exact: true }),
  ).toBeVisible();
  await expect(
    info.getByRole('status', { name: 'Загрузка участников', exact: true }),
  ).toBeVisible();
  await expect(share).toBeVisible();
  peopleHeld.finish(503);
  await expect(
    info.getByText('Не удалось получить ответы.', { exact: false }),
  ).toBeVisible();
  await info.getByRole('button', { name: 'Повторить', exact: true }).click();
  await expect(
    info.getByText('Не удалось получить ответы.', { exact: false }),
  ).toHaveCount(0);
  await expect(
    info.getByRole('button', { name: /^Все участники встречи/ }),
  ).toBeVisible();
});

test('enlarged settings retain the draft without a chat layout render loop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Крупный интерфейс');
  await page.goto(`/meetings/${meeting.id}`);
  await page.getByRole('button', { name: 'Информация о встрече', exact: true }).click();
  await page.getByRole('button', { name: 'Настройки встречи', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Настройки встречи', exact: true });
  const title = settings.getByRole('textbox', { name: /Название/ });
  await title.fill('Сохранённый локальный ввод');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(title).toHaveValue('Сохранённый локальный ввод');
  await title.fill('Ещё одна правка после увеличения');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '';
  });
  await expect(title).toHaveValue('Ещё одна правка после увеличения');
  expect(errors).toEqual([]);
});
