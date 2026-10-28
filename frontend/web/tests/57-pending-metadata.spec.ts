import { test, expect } from '@playwright/test';
import { apiCreate, login } from '@tests/helpers';

for (const slow of [false, true]) {
  test(`${slow ? 'queued to slow sending' : 'fast ACK'} preserves message node and metadata geometry`, async ({
    page,
    context,
  }) => {
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Индикатор без скачка');
    await page.goto(`/meetings/${meeting.id}`);
    const input = page.getByLabel('Сообщение', { exact: true });
    await expect(input).toBeVisible();
    const gate: { release?: () => void } = {};
    await page.route(
      `**/meetings/${meeting.id}/messages`,
      async (route) => {
        await new Promise<void>((resolve) => {
          gate.release = resolve;
        });
        await route.continue();
      },
      { times: 1 },
    );

    if (slow) {
      await context.setOffline(true);
    }

    await input.fill('Одно сообщение без прыжков');
    await page.getByRole('button', { name: 'Отправить сообщение' }).click();
    const row = page
      .getByTestId('feed-message')
      .filter({ hasText: 'Одно сообщение без прыжков' });

    await expect(row).toBeVisible();
    const node = await row.elementHandle();
    const key = await row.getAttribute('data-ui-key');
    const height = (await row.boundingBox())!.height;
    const slot = row.getByTestId('message-pending-slot');
    const status = row.getByRole('status', { name: 'Отправляем сообщение' });
    expect((await slot.boundingBox())?.width).toBe(12);
    expect((await slot.boundingBox())?.height).toBe(12);
    await expect(status).toHaveCount(0);
    await expect(row.getByTestId('message-delivery')).toHaveCount(0);

    if (slow) {
      await expect(row).toHaveAttribute('data-delivery', 'queued');
      await page.waitForTimeout(1300);
      await expect(status).toHaveCount(0);
      await context.setOffline(false);
      await expect.poll(() => !!gate.release).toBe(true);
      await expect(row).toHaveAttribute('data-delivery', 'sending');
      await expect(status).toBeVisible({ timeout: 1200 });
      expect((await row.boundingBox())?.height).toBe(height);
      expect(await row.getAttribute('data-ui-key')).toBe(key);
    } else {
      await expect.poll(() => !!gate.release).toBe(true);
    }

    gate.release?.();
    await expect(row).toHaveAttribute('data-delivery', 'accepted');
    await expect(status).toHaveCount(0);
    expect(await node?.evaluate((element) => element.isConnected)).toBe(true);
    expect(await row.getAttribute('data-ui-key')).toBe(key);
    expect((await row.boundingBox())?.height).toBe(height);
    expect((await slot.boundingBox())?.width).toBe(12);
    await expect(row).not.toContainText('Отправляем');
    await page.waitForTimeout(2100);
    await expect(status).toHaveCount(0);
    await node?.dispose();
  });
}
