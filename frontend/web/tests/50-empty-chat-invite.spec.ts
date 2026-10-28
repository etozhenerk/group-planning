import { expect, test } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const width of [390, 1440]) {
  test(`empty chat has one primary invite until the first message at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page, 'Саша');
    const created = await apiCreate(page, 'Пустая встреча');
    await page.goto(`/meetings/${created.meeting.id}`);
    const header = page.locator('main#main > header');
    const invitation = page.getByRole('button', {
      name: 'Пригласить друзей',
      exact: true,
    });

    await expect(invitation).toHaveCount(1);
    await expect(invitation).toHaveCSS('background-color', 'rgb(235, 231, 223)');
    await expect(
      header.getByRole('button', { name: 'Пригласить друзей', exact: true }),
    ).toHaveCount(0);
    await invitation.click();
    await expect(
      page.getByRole('dialog', { name: 'Пригласить друзей', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await expect(
      page.getByRole('dialog', { name: 'Пригласить друзей', exact: true }),
    ).not.toBeVisible();
    await page.getByLabel('Сообщение', { exact: true }).fill('Первое сообщение');
    await page.getByRole('button', { name: 'Отправить сообщение' }).click();
    await expect(page.getByText('Первое сообщение', { exact: true })).toBeVisible();
    await expect(invitation).toHaveCount(1);
    await expect(
      header.getByRole('button', { name: 'Пригласить друзей', exact: true }),
    ).toBeVisible();
  });
}
