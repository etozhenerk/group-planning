import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiCreate, login, writeHeaders } from '@tests/helpers';

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
]) {
  test(`expanded reactions use the space below a near-top message at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Полный выбор реакций');
    const headers = await writeHeaders(page);

    for (const text of ['Принесу настолки', 'Выбрать реакцию', 'Возьму чай']) {
      const key = randomUUID();
      const response = await page.request.post(
        `/api/v1/meetings/${meeting.id}/messages`,
        {
          headers: { ...headers, 'Idempotency-Key': key },
          data: { text, client_request_id: key },
        },
      );

      expect(response.status()).toBe(201);
    }

    await page.goto(`/meetings/${meeting.id}`);
    const target = page
      .getByTestId('feed-message')
      .filter({ hasText: 'Выбрать реакцию' })
      .getByTestId('message-actions');

    await expect(target).toBeVisible();
    const history = page.getByRole('list', { name: 'Разговор встречи' }).locator('..');
    const before = await history.evaluate((element) => element.scrollTop);
    await target.press('Enter');
    const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
    await picker.getByRole('button', { name: 'Все эмодзи' }).click();
    await expect
      .poll(async () => (await picker.boundingBox())?.height)
      .toBeCloseTo(352, 1);
    const bubble = await target.boundingBox();
    const panel = await picker.boundingBox();
    const composer = await page.getByLabel('Сообщение', { exact: true }).boundingBox();
    expect(bubble && panel && panel.y >= bubble.y + bubble.height).toBe(true);
    expect(panel && composer && panel.y + panel.height <= composer.y).toBe(true);
    await expect(picker).toBeInViewport({ ratio: 1 });
    await expect(picker.getByText('Выбрать реакцию', { exact: true })).toBeVisible();
    const search = picker.getByRole('searchbox', { name: 'Найти эмодзи' });
    await expect(search).toBeInViewport({ ratio: 1 });
    const lastEmoji = picker.getByRole('button', { name: /^Поставить реакцию:/ }).last();
    await lastEmoji.scrollIntoViewIfNeeded();
    await expect(lastEmoji).toBeInViewport({ ratio: 1 });
    await expect(search).toBeInViewport({ ratio: 1 });
    expect(await history.evaluate((element) => element.scrollTop)).toBeCloseTo(before);
    await page.screenshot({ path: test.info().outputPath('expanded-reaction.png') });
    await search.fill('пицца');
    const pizza = picker.getByRole('button', {
      name: 'Поставить реакцию: пицца',
      exact: true,
    });

    await expect(pizza).toBeInViewport({ ratio: 1 });
    await pizza.click();
    await expect(picker).toHaveCount(0);
    await expect(target).toBeFocused();
    expect(await history.evaluate((element) => element.scrollTop)).toBeCloseTo(before);
  });
}

for (const viewport of [
  { width: 390, height: 430 },
  { width: 844, height: 390 },
]) {
  test(`expanded reactions remain usable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    const renderErrors: string[] = [];
    page.on('pageerror', (error) => renderErrors.push(error.message));
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        /React|Maximum update depth/i.test(message.text())
      ) {
        renderErrors.push(message.text());
      }
    });
    await page.setViewportSize(viewport);
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Реакции в низком окне');
    const headers = await writeHeaders(page);

    for (const text of [
      'Принесу настолки',
      'Низкая панель реакций',
      ...Array.from({ length: 12 }, (_, index) => `Дальше в разговоре ${index + 1}`),
    ]) {
      const key = randomUUID();
      const response = await page.request.post(
        `/api/v1/meetings/${meeting.id}/messages`,
        {
          headers: { ...headers, 'Idempotency-Key': key },
          data: { text, client_request_id: key },
        },
      );

      expect(response.status()).toBe(201);
    }

    await page.goto(`/meetings/${meeting.id}`);
    const message = page
      .getByTestId('feed-message')
      .filter({ hasText: 'Низкая панель реакций' });

    const target = message.getByTestId('message-actions');
    const history = page.getByRole('list', { name: 'Разговор встречи' }).locator('..');
    await history.evaluate((element) => element.scrollTo({ top: 0 }));
    await target.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        history.evaluate(
          (element) => element.scrollHeight - element.scrollTop - element.clientHeight,
        ),
      )
      .toBeGreaterThan(viewport.height);
    const before = await history.evaluate((element) => element.scrollTop);
    await target.press('Enter');
    const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
    await picker.getByRole('button', { name: 'Все эмодзи' }).click();
    const search = picker.getByRole('searchbox', { name: 'Найти эмодзи' });
    await search.fill('пицца');
    const pizza = picker.getByRole('button', {
      name: 'Поставить реакцию: пицца',
      exact: true,
    });

    await expect(search).toBeInViewport({ ratio: 1 });
    const readers = picker.getByRole('button', { name: 'Кто прочитал', exact: true });

    if (await readers.count()) {
      await readers.scrollIntoViewIfNeeded();
      await expect(readers).toBeInViewport({ ratio: 1 });
    }

    await pizza.scrollIntoViewIfNeeded();
    await expect(pizza).toBeInViewport({ ratio: 1 });
    const panel = await picker.boundingBox();
    const bounds = await history.boundingBox();
    expect(panel && bounds && panel.y >= bounds.y).toBe(true);
    expect(panel && bounds && panel.y + panel.height <= bounds.y + bounds.height).toBe(
      true,
    );
    await page.screenshot({ path: test.info().outputPath('low-height-pizza.png') });
    await pizza.click();
    await expect(picker).toHaveCount(0);
    expect(renderErrors).toEqual([]);
    await expect(
      page.getByRole('heading', { name: 'Не удалось открыть страницу' }),
    ).toHaveCount(0);
    await expect(
      message.getByRole('button', { name: '🍕: 1', exact: true }),
    ).toBeVisible();
    await expect(target).toBeFocused();
    expect(await history.evaluate((element) => element.scrollTop)).toBeCloseTo(before);
    expect(renderErrors).toEqual([]);
    const composer = page.getByLabel('Сообщение', { exact: true });
    await composer.fill('Черновик после реакции');

    for (let cycle = 0; cycle < 3; cycle++) {
      await target.press('Enter');
      await picker.getByRole('button', { name: 'Все эмодзи' }).click();
      await picker.getByRole('searchbox', { name: 'Найти эмодзи' }).fill('пицца');
      const committed = page.waitForResponse(
        (response) =>
          response.request().method() === 'PUT' && response.url().endsWith('/reactions'),
      );

      await picker
        .getByRole('button', {
          name: `${cycle % 2 === 0 ? 'Снять' : 'Поставить'} реакцию: пицца`,
          exact: true,
        })
        .click();
      expect((await committed).status()).toBe(200);
      await expect(picker).toHaveCount(0);
      await expect(
        message.getByRole('button', { name: '🍕: 1', exact: true }),
      ).toHaveCount(cycle % 2 === 0 ? 0 : 1);
      await expect(composer).toHaveValue('Черновик после реакции');
      await expect(
        page.getByRole('heading', { name: 'Не удалось открыть страницу' }),
      ).toHaveCount(0);
      expect(renderErrors).toEqual([]);
    }
  });
}
