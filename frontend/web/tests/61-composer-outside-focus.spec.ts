import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiCreate, login, meetingInfoSurface, writeHeaders } from '@tests/helpers';

test.use({ hasTouch: true });

for (const width of [1440, 390, 320]) {
  test(`outside composer click preserves draft and first-tap actions at ${width}`, async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, 'Саша');
    const { meeting } = await apiCreate(page, `Фокус сообщения ${width}`);
    const key = randomUUID();
    const posted = await page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
      headers: await writeHeaders(page, key),
      data: { text: 'Сообщение для внешнего нажатия', client_request_id: key },
    });

    expect(posted.status()).toBe(201);
    await page.goto(`/meetings/${meeting.id}`);
    const composer = page.getByRole('textbox', { name: 'Сообщение', exact: true });
    const activate = (target: Locator) => (width < 740 ? target.tap() : target.click());
    const draft = 'Возьму чай\nзавтра';
    const initialHeight = await composer.evaluate((element) => element.clientHeight);
    await composer.fill(Array.from({ length: 40 }, () => 'Длинный черновик').join('\n'));
    await expect
      .poll(() =>
        composer.evaluate((element) => element.scrollHeight > element.clientHeight),
      )
      .toBe(true);
    const maximum = await composer.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).maxHeight),
    );

    expect((await composer.boundingBox())?.height).toBeLessThanOrEqual(maximum + 1);
    await composer.fill(draft);
    await expect
      .poll(() => composer.evaluate((element) => element.clientHeight))
      .toBeGreaterThan(initialHeight);
    await expect
      .poll(() =>
        composer.evaluate((element) => element.scrollHeight - element.clientHeight),
      )
      .toBeLessThanOrEqual(1);
    await activate(composer);
    await expect(composer).toBeFocused();
    const select = async () => {
      await composer.focus();
      await composer.evaluate((element) => {
        if (element instanceof HTMLTextAreaElement) {
          element.setSelectionRange(7, 10);
          element.dispatchEvent(new Event('select', { bubbles: true }));
        }
      });
    };

    await select();
    const feed = page.locator('[data-server-count]');

    if (width < 740) {
      await feed.tap({ position: { x: 3, y: 3 } });
    } else {
      await feed.click({ position: { x: 3, y: 3 } });
    }

    await expect(composer).not.toBeFocused();
    await expect(composer).toHaveValue(draft);
    expect(
      await composer.evaluate((element) =>
        element instanceof HTMLTextAreaElement
          ? [element.selectionStart, element.selectionEnd]
          : [],
      ),
    ).toEqual([7, 10]);
    await select();
    await activate(page.getByText('Сообщение для внешнего нажатия', { exact: true }));
    await expect(composer).not.toBeFocused();
    await expect(composer).toHaveValue(draft);
    await composer.evaluate((element) => {
      element.dataset['focusReturns'] = '0';
      element.addEventListener('focus', () => {
        element.dataset['focusReturns'] = String(
          Number(element.dataset['focusReturns'] ?? 0) + 1,
        );
      });
    });
    await select();
    await activate(page.getByRole('button', { name: 'Информация о встрече' }));
    const info = meetingInfoSurface(page, meeting.title);
    await expect(info).toBeVisible();
    await composer.evaluate((element) => (element.dataset['focusReturns'] = '0'));
    await activate(info.getByRole('button', { name: 'Закрыть', exact: true }));
    await expect(info).not.toBeVisible();
    await expect(composer).not.toBeFocused();
    await expect(composer).toHaveAttribute('data-focus-returns', '0');
    await select();
    await activate(page.getByRole('button', { name: 'Добавить к встрече' }));
    await expect(page.getByRole('menu')).toBeVisible();
    await expect(composer).not.toBeFocused();
    await activate(page.getByRole('menuitem', { name: 'Предложить место', exact: true }));
    const form = page.getByRole('dialog', { name: 'Предложить место', exact: true });
    const otherInput = form.getByLabel('Новое место');
    await activate(otherInput);
    await expect(otherInput).toBeFocused();
    await otherInput.fill('Кафе');
    await expect(otherInput).toBeFocused();
    await otherInput.fill('');
    await composer.evaluate((element) => (element.dataset['focusReturns'] = '0'));
    await activate(form.getByRole('button', { name: 'Закрыть', exact: true }));
    await expect(form).not.toBeVisible();
    await expect(composer).toHaveAttribute('data-focus-returns', '0');
    await expect(composer).toHaveValue(draft);
    await select();
    await activate(page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }));
    const emojis = page.getByRole('region', { name: 'Выбор эмодзи', exact: true });
    await expect(emojis).toBeVisible();
    await expect(composer).not.toBeFocused();
    const search = emojis.getByRole('searchbox', { name: 'Найти эмодзи' });
    await activate(search);
    await search.fill('пицца');
    await expect(search).toBeFocused();
    await activate(
      emojis.getByRole('button', {
        name: width < 740 ? 'Вставить: пицца' : 'пицца',
        exact: true,
      }),
    );
    await expect(composer).toHaveValue('Возьму 🍕\nзавтра');
    await expect(composer).not.toBeFocused();
    await activate(
      page.getByRole('button', { name: 'Вернуться к клавиатуре', exact: true }),
    );
    await expect(composer).toBeFocused();
    await composer.pressSequentially(' и чай');
    await expect(composer).toHaveValue('Возьму 🍕 и чай\nзавтра');
    await composer.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const emojiTrigger = page.getByRole('button', {
      name: 'Выбрать эмодзи',
      exact: true,
    });

    await expect(emojiTrigger).toBeFocused();
    await emojiTrigger.press('Enter');
    await expect(emojis).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(emojiTrigger).toBeFocused();
    await composer.focus();
    await composer.press('ArrowLeft');
    await expect(composer).toBeFocused();
    const requests: string[] = [];
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().endsWith(`/api/v1/meetings/${meeting.id}/messages`)
      ) {
        requests.push(request.url());
      }
    });
    await activate(page.getByRole('button', { name: 'Отправить сообщение' }));
    const message = page
      .getByTestId('feed-message')
      .filter({ hasText: 'Возьму 🍕 и чай' });

    await expect(message).toHaveCount(1);
    await expect(message).toHaveAttribute('data-delivery', 'accepted');
    expect(requests).toHaveLength(1);
    await expect(composer).toHaveValue('');
    await expect(composer).not.toBeFocused();
    await expect
      .poll(() => composer.evaluate((element) => element.clientHeight))
      .toBe(initialHeight);
  });
}

test('composer resizes with viewport without changing draft or selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Размер поля сообщения');
  await page.goto(`/meetings/${meeting.id}`);
  const composer = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  const draft = 'Сохраняем текст и выделение при изменении ширины окна';
  await composer.fill(draft);
  await composer.evaluate((element) => {
    if (element instanceof HTMLTextAreaElement) {
      element.setSelectionRange(3, 12);
      element.dispatchEvent(new Event('select', { bubbles: true }));
    }
  });
  await page.setViewportSize({ width: 320, height: 760 });
  await expect
    .poll(() =>
      composer.evaluate((element) => element.scrollHeight - element.clientHeight),
    )
    .toBeLessThanOrEqual(1);
  const narrowHeight = await composer.evaluate((element) => element.clientHeight);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect
    .poll(() => composer.evaluate((element) => element.clientHeight))
    .toBeLessThan(narrowHeight);
  await expect(composer).toHaveValue(draft);
  expect(
    await composer.evaluate((element) =>
      element instanceof HTMLTextAreaElement
        ? [element.selectionStart, element.selectionEnd]
        : [],
    ),
  ).toEqual([3, 12]);
});
