import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiCreate, login, writeHeaders } from '@tests/helpers';
import { postMessage, readChat } from '@tests/helpers/readChat';

for (const width of [390, 1440]) {
  test(`readers keep one viewport through loading, empty, error, list and pagination at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, 'Стабильные прочитавшие');
    await postMessage(page, meeting.id, await writeHeaders(page), 'Список без скачков');

    await page.goto(`/meetings/${meeting.id}`);
    let action = page
      .getByTestId('feed-message')
      .filter({ hasText: 'Список без скачков' })
      .getByTestId('message-actions');

    const gate: {
      release?: () => void;
      state: 'empty' | 'error' | 'list';
      pageError: boolean;
    } = { state: 'empty', pageError: true };

    const reset = () => {
      delete gate.release;
    };

    const release = () => gate.release?.();
    const people = Array.from({ length: 8 }, (_, index) => ({
      id: randomUUID(),
      display_name: `Участник ${index + 1}`,
      avatar_url: null,
    }));

    await page.route(`**/messages/*/readers?*`, async (route) => {
      await new Promise<void>((resolve) => {
        gate.release = resolve;
      });
      const next = new URL(route.request().url()).searchParams.has('cursor');

      if (gate.state === 'error' || (next && gate.pageError)) {
        await route.fulfill({
          status: 503,
          json: {
            error: { code: 'unavailable', field_errors: {}, request_id: 'sheet-readers' },
          },
        });
      } else {
        await route.fulfill({
          json: {
            readers:
              gate.state === 'empty' ? [] : people.slice(next ? 4 : 0, next ? 8 : 4),
            reader_count: gate.state === 'empty' ? '0' : '8',
            next_cursor: gate.state === 'list' && !next ? 'next' : null,
            projection_version: '1000000',
          },
        });
      }
    });
    const open = async () => {
      reset();
      await action.press('Enter');
      await page.getByRole('button', { name: 'Кто прочитал', exact: true }).click();
      await expect.poll(() => !!gate.release).toBe(true);
      await expect(
        page.getByRole('dialog', { name: 'Прочитали', exact: true }),
      ).toHaveAttribute('data-motion', 'open');
    };

    const sheet = page.getByRole('dialog', { name: 'Прочитали', exact: true });
    const viewport = sheet.getByTestId('readers-viewport');
    await open();
    await expect(sheet).toHaveAttribute('data-motion', 'open');
    const initial = await sheet.boundingBox();
    const initialViewport = await viewport.boundingBox();
    expect(initialViewport?.height).toBe(189);
    await expect(sheet.getByRole('status', { name: 'Загружаем список' })).toBeVisible();
    const stable = async () => {
      const box = await sheet.boundingBox();
      expect(box?.y).toBeCloseTo(initial!.y, 1);
      expect(box?.height).toBeCloseTo(initial!.height, 1);
      expect((await viewport.boundingBox())?.height).toBe(initialViewport?.height);
      expect(await sheet.evaluate((node) => node.scrollTop)).toBe(0);
    };

    release();
    await expect(sheet.getByText('Пока никто не прочитал')).toBeVisible();
    await stable();
    await sheet.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await expect(sheet).not.toBeVisible();
    await expect(action).toBeFocused();
    await postMessage(
      page,
      meeting.id,
      await writeHeaders(page),
      'Второй список без скачков',
    );
    await page.reload();
    action = page
      .getByTestId('feed-message')
      .filter({ hasText: 'Второй список без скачков' })
      .getByTestId('message-actions');
    gate.state = 'error';
    await open();
    release();
    await expect(sheet.getByText('Не удалось загрузить список')).toBeVisible();
    await stable();
    gate.state = 'list';
    reset();
    await sheet.getByRole('button', { name: 'Повторить', exact: true }).click();
    await expect.poll(() => !!gate.release).toBe(true);
    release();
    await expect(sheet.getByRole('listitem')).toHaveCount(4);
    await stable();
    reset();
    await sheet.getByRole('button', { name: 'Показать ещё', exact: true }).click();
    await expect.poll(() => !!gate.release).toBe(true);
    release();
    await expect(sheet.getByText('Не удалось загрузить список')).toBeVisible();
    await expect(sheet.getByRole('listitem')).toHaveCount(4);
    await stable();
    gate.pageError = false;
    reset();
    await sheet.getByRole('button', { name: 'Повторить', exact: true }).click();
    await expect.poll(() => !!gate.release).toBe(true);
    release();
    await expect(sheet.getByRole('listitem')).toHaveCount(8);
    await sheet.getByRole('listitem').last().scrollIntoViewIfNeeded();
    await expect(sheet.getByRole('listitem').last()).toBeInViewport({ ratio: 1 });
    await stable();
    expect(await viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  });

  test(`readers preserve history after a composer resize and an incoming message at ${width}`, async ({
    page,
    browser,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const { meeting, friend, context, friendHeaders, headers } = await readChat(
      page,
      browser,
      'Возврат из прочитавших в историю',
    );

    try {
      await postMessage(page, meeting.id, headers, 'Исходное сообщение в истории');

      for (let index = 0; index < 40; index += 1) {
        await postMessage(page, meeting.id, headers, `Последующее сообщение ${index}`);
      }

      await page.bringToFront();
      await page.goto(`/meetings/${meeting.id}`);
      const scroll = page.locator('[data-server-count]');
      const input = page.getByLabel('Сообщение', { exact: true });
      const initialHeight = await scroll.evaluate((element) => element.clientHeight);
      await input.click();
      await input.fill('Черновик, который сохраняется после просмотра прочитавших');
      const resizedHeight = await scroll.evaluate((element) => {
        const height = element.clientHeight;
        element.scrollTop = 0;

        return height;
      });

      if (width === 390) {
        expect(resizedHeight).toBeLessThan(initialHeight);
      }

      const message = page
        .getByTestId('feed-message')
        .filter({ hasText: 'Исходное сообщение в истории' });

      await expect(message).toBeInViewport();
      const before = await message.boundingBox();
      const action = message.getByTestId('message-actions');
      let unavailable = true;
      await page.route('**/messages/*/readers?*', async (route) => {
        if (unavailable) {
          unavailable = false;
          await route.fulfill({
            status: 503,
            json: {
              error: { code: 'unavailable', field_errors: {}, request_id: 'read-return' },
            },
          });
        } else {
          await route.continue();
        }
      });
      await action.press('Enter');
      await page.getByRole('button', { name: 'Кто прочитал', exact: true }).click();
      const sheet = page.getByRole('dialog', { name: 'Прочитали', exact: true });
      await expect(sheet.getByText('Не удалось загрузить список')).toBeVisible();
      await sheet.getByRole('button', { name: 'Повторить', exact: true }).click();
      await expect(sheet.getByText('Пока никто не прочитал')).toBeVisible();
      const incoming = await postMessage(
        friend,
        meeting.id,
        friendHeaders,
        'Новое сообщение под открытым списком',
      );

      await expect(scroll).toHaveAttribute('data-window-last', incoming.sequence);
      await sheet.getByRole('button', { name: 'Закрыть', exact: true }).click();
      await expect(action).toBeFocused();
      await expect(input).toHaveValue(
        'Черновик, который сохраняется после просмотра прочитавших',
      );
      const after = await message.boundingBox();

      expect(before).not.toBeNull();
      expect(after).not.toBeNull();
      expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(2);
    } finally {
      await context.close();
    }
  });
}
