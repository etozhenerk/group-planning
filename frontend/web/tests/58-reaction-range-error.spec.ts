import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { apiCreate, login, writeHeaders } from '@tests/helpers';
import { entrySchema } from '@/shared/api';

test('a failed reaction GET after a virtual range change retains confirmed chips and supports retry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /React|Maximum update depth/i.test(message.text())
    ) {
      errors.push(message.text());
    }
  });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Диапазон и ошибка реакций');
  const headers = await writeHeaders(page);
  const entries = [];

  for (let index = 0; index < 80; index++) {
    const key = randomUUID();
    const response = await page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
      headers: { ...headers, 'Idempotency-Key': key },
      data: {
        text: `Строка ${index}. ${'Сохраняем подтверждённую реакцию. '.repeat((index % 3) + 1)}`,
        client_request_id: key,
      },
    });

    expect(response.status()).toBe(201);
    entries.push(entrySchema.parse(await response.json()));
  }

  const entry = entries[40]!;
  expect(
    (
      await page.request.put(
        `/api/v1/meetings/${meeting.id}/messages/${entry.id}/reactions`,
        {
          headers: { ...headers, 'Idempotency-Key': randomUUID() },
          data: { emoji: '🍕', active: true },
        },
      )
    ).status(),
  ).toBe(200);
  await page.goto(`/meetings/${meeting.id}`);
  const row = page.getByTestId('feed-message').filter({ hasText: 'Строка 40.' });
  const history = page.getByRole('list', { name: 'Разговор встречи' }).locator('..');
  await expect(history).toBeVisible();
  await history.evaluate((element) => element.scrollTo({ top: 0 }));
  await expect(row).toBeAttached();
  await row.scrollIntoViewIfNeeded();
  await row.getByTestId('message-actions').focus();
  const chip = row.getByRole('button', { name: '🍕: 1', exact: true });
  await expect(chip).toBeVisible();
  await page.waitForTimeout(100);
  const requests: string[] = [];
  const gate = { fail: true };
  await page.route(`**/meetings/${meeting.id}/reactions?*`, async (route) => {
    requests.push(route.request().url());

    if (gate.fail) {
      await route.fulfill({
        status: 503,
        json: {
          error: { code: 'unavailable', field_errors: {}, request_id: 'range-reactions' },
        },
      });
    } else {
      await route.continue();
    }
  });
  await page.setViewportSize({ width: 844, height: 520 });

  for (let step = 0; step < 6 && requests.length === 0; step++) {
    await history.evaluate((element) => {
      element.scrollTop += 80;
    });
    await page.waitForTimeout(50);
  }

  await expect.poll(() => requests.length).toBeGreaterThan(0);
  await page.waitForTimeout(750);
  const error = page
    .getByRole('status')
    .filter({ hasText: 'Не удалось обновить реакции' });

  const observation = {
    errors,
    requests: requests.length,
    confirmedChips: await chip.count(),
    errorVisible: await error.isVisible(),
  };

  await writeFile(
    test.info().outputPath('range-error-observation.json'),
    JSON.stringify(observation),
  );
  await test.info().attach('range-error-observation', {
    body: JSON.stringify(observation),
    contentType: 'application/json',
  });
  expect.soft(errors).toEqual([]);
  expect.soft(requests.length).toBeLessThan(10);
  expect.soft(await chip.count()).toBe(1);
  await expect(error).toBeVisible();
  // The error is after the virtual list. Focus without auto-scroll so this action
  // retries the failed window instead of navigating to a different query range.
  await error
    .getByRole('button', { name: 'Повторить', exact: true })
    .evaluate((button) => button.focus({ preventScroll: true }));
  gate.fail = false;
  await page.keyboard.press('Enter');
  await expect(error).toHaveCount(0);
  await expect(chip).toBeVisible();
  expect(errors).toEqual([]);
});
