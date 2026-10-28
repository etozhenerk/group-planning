import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { apiCreate, login, writeHeaders } from '@tests/helpers';

test.use({ hasTouch: true });

test('emoji dock preserves selection, supports repeated insertion and restores the keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Док эмодзи');
  await page.goto(`/meetings/${meeting.id}`);
  const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  await input.fill('Возьму чай завтра');
  await input.evaluate((element) => {
    if (element instanceof HTMLTextAreaElement) {
      element.setSelectionRange(7, 10);
      element.dispatchEvent(new Event('select', { bubbles: true }));
    }
  });
  await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  const dock = page.getByRole('region', { name: 'Выбор эмодзи', exact: true });
  const search = dock.getByRole('searchbox', { name: 'Найти эмодзи' });
  await expect(search).not.toBeFocused();
  await expect(search).toHaveCSS('font-size', '16px');
  await search.fill('пицца');
  await dock.getByRole('button', { name: 'Вставить: пицца', exact: true }).click();
  await dock.getByRole('button', { name: 'Вставить: пицца', exact: true }).click();
  await expect(input).toHaveValue('Возьму 🍕🍕 завтра');
  await expect(dock).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('emoji-dock-selection.png') });
  await dock
    .getByRole('button', { name: 'Удалить символ перед курсором сообщения' })
    .click();
  await expect(input).toHaveValue('Возьму 🍕 завтра');
  await page.getByRole('button', { name: 'Вернуться к клавиатуре', exact: true }).click();
  await expect(dock).toHaveCount(0);
  await expect(input).toBeFocused();
  await input.pressSequentially(' и чай');
  await expect(input).toHaveValue('Возьму 🍕 и чай завтра');
  await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  await expect(dock).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dock).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  await expect(dock).toBeVisible();
  await page.goBack();
  await expect(dock).toHaveCount(0);
  await expect(input).toHaveValue('Возьму 🍕 и чай завтра');
  await expect(
    page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }),
  ).toBeFocused();
  await expect(page.getByTestId('feed-message')).toHaveCount(0);
});

test('emoji dock and expanded reactions keep the composer usable in compact viewports', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Панели на маленьком экране');
  await page.goto(`/meetings/${meeting.id}`);
  await page.getByLabel('Сообщение', { exact: true }).fill('Принесу игры');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу игры' });
  await expect(row).toBeVisible();
  await expect(row).toHaveAttribute('data-delivery', 'accepted');

  for (const viewport of [
    { width: 320, height: 760 },
    { width: 390, height: 430 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
    const input = page.getByLabel('Сообщение', { exact: true });
    const dock = page.getByRole('region', { name: 'Выбор эмодзи', exact: true });
    await expect(input).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole('button', { name: 'Отправить сообщение' }),
    ).toBeInViewport({ ratio: 1 });
    await expect(page.locator('[data-emoji-panel]')).toHaveAttribute(
      'data-motion',
      'open',
    );
    const inputBox = await input.boundingBox();
    const dockBox = await dock.boundingBox();
    expect(inputBox && dockBox && inputBox.y + inputBox.height <= dockBox.y).toBe(true);
    await row.getByTestId('message-actions').press('Enter');
    await expect(dock).toHaveCount(0);
    const reactions = page.getByRole('dialog', { name: 'Реакция', exact: true });
    await reactions.getByRole('button', { name: 'Все эмодзи' }).click();
    await expect(reactions).toBeInViewport({ ratio: 1 });
    await expect(input).toBeInViewport({ ratio: 1 });
    await page.screenshot({
      path: test
        .info()
        .outputPath(`full-reactions-${viewport.width}-${viewport.height}.png`),
    });
    await page.keyboard.press('Escape');
    await expect(row.getByTestId('message-actions')).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width);
  }
});

test('settings and sharing return to the same information sheet and retain the draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Родительская панель');
  await page.goto(`/meetings/${meeting.id}`);
  await page.getByLabel('Сообщение', { exact: true }).fill('Черновик сообщения');
  await page.getByRole('button', { name: 'Информация о встрече' }).click();
  const info = page.getByRole('dialog', { name: meeting.title, exact: true });
  await info.getByRole('button', { name: 'Настройки встречи' }).click();
  const settings = page.getByRole('dialog', { name: 'Настройки встречи' });
  await expect(page.locator('dialog:modal')).toHaveCount(1);
  await settings.getByLabel('Название', { exact: true }).fill('Несохранённое название');
  await expect(settings.getByLabel('Название', { exact: true })).toHaveCSS(
    'font-size',
    '16px',
  );
  await page.screenshot({ path: test.info().outputPath('meeting-settings-draft.png') });
  await page.goBack();
  await expect(info).toBeVisible();
  await expect(info.getByRole('button', { name: 'Настройки встречи' })).toBeFocused();
  await info.getByRole('button', { name: 'Настройки встречи' }).click();
  await expect(settings.getByLabel('Название', { exact: true })).toHaveValue(
    'Несохранённое название',
  );
  await settings.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await info.getByRole('button', { name: 'Пригласить друзей' }).click();
  const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  await expect(page.locator('dialog:modal')).toHaveCount(1);
  await share.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(info).toBeVisible();
  await expect(info.getByRole('button', { name: 'Пригласить друзей' })).toBeFocused();
  await page.screenshot({ path: test.info().outputPath('meeting-info-return.png') });
  await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
    'Черновик сообщения',
  );
});

test('opening the emoji dock preserves the reading position and the new-message action stays above it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Позиция чтения');
  const headers = await writeHeaders(page);
  const send = async (text: string) => {
    const key = randomUUID();
    const response = await page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
      headers: { ...headers, 'Idempotency-Key': key },
      data: { text, client_request_id: key },
    });

    expect(response.status()).toBe(201);
  };

  for (let index = 0; index < 25; index++) {
    await send(`Сообщение истории ${index}`);
  }

  await page.goto(`/meetings/${meeting.id}`);
  const history = page.getByRole('list', { name: 'Разговор встречи' }).locator('..');
  await expect(page.getByText('Сообщение истории 24', { exact: true })).toBeInViewport();
  await history.evaluate((node) => {
    node.scrollTop = 120;
    node.dispatchEvent(new Event('scroll'));
  });
  await send('Новое сообщение внизу');
  const latest = page.getByRole('button', { name: 'К новым сообщениям' });
  await expect(latest).toBeVisible();
  const before = await history.evaluate((node) => node.scrollTop);
  await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Выбор эмодзи' })).toBeVisible();
  await expect
    .poll(() => history.evaluate((node) => node.scrollTop))
    .toBeCloseTo(before, 0);
  await expect(latest).toBeInViewport({ ratio: 1 });
  await expect(page.locator('[data-emoji-panel]')).toHaveAttribute('data-motion', 'open');
  const latestBox = await latest.boundingBox();
  const inputBox = await page.getByLabel('Сообщение', { exact: true }).boundingBox();
  expect(latestBox && inputBox && latestBox.y + latestBox.height <= inputBox.y).toBe(
    true,
  );
  await page.screenshot({
    path: test.info().outputPath('reading-position-emoji-dock.png'),
  });
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-emoji-panel]')).toHaveCount(0);
  expect(await history.evaluate((node) => node.scrollTop)).toBeCloseTo(before, 0);
  await latest.click();
  await expect(latest).toHaveCount(0);
  await expect(page.getByText('Новое сообщение внизу', { exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  await expect(page.locator('[data-emoji-panel]')).toHaveAttribute('data-motion', 'open');
  await expect(page.getByText('Новое сообщение внизу', { exact: true })).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-emoji-panel]')).toHaveCount(0);
  await expect(page.getByText('Новое сообщение внизу', { exact: true })).toBeInViewport();
});

test('reaction people replace the picker and browser Back returns to the same message', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Люди и реакции');
  await page.goto(`/meetings/${meeting.id}`);
  await page.getByLabel('Сообщение', { exact: true }).fill('Беру настолки');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  const row = page.getByTestId('feed-message').filter({ hasText: 'Беру настолки' });
  await expect(row).toHaveAttribute('data-delivery', 'accepted');
  await row.getByTestId('message-actions').press('Enter');
  const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  await picker.getByRole('button', { name: '❤️', exact: true }).click();
  const reaction = row.getByRole('button', { name: '❤️: 1', exact: true });
  await expect(reaction).toHaveAttribute('aria-pressed', 'true');
  await expect(row.getByRole('button', { name: 'Добавить реакцию' })).toHaveCount(0);
  await expect(row.getByRole('button', { name: 'Кто отреагировал' })).toHaveCount(0);
  await expect(picker).toHaveCount(0);
  await row.getByTestId('message-actions').press('Enter');
  await expect(picker).toBeVisible();
  await expect(picker.getByRole('button', { name: '❤️', exact: true })).toBeFocused();
  const opener = reaction;
  await opener.press('Shift+F10');
  const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  await expect(people).toBeVisible();
  await expect(picker).toHaveCount(0);
  await expect(page.locator('dialog:modal')).toHaveCount(1);
  const filter = people.getByRole('button', { name: 'Реакция ❤️', exact: true });
  await expect(filter).toHaveAttribute('aria-pressed', 'true');
  await filter.click();
  await expect(filter).toBeFocused();
  await expect(people.getByRole('list')).toContainText('Саша');
  await page.screenshot({ path: test.info().outputPath('reaction-people-filter.png') });
  await page.goBack();
  await expect(people).not.toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
  await expect(opener).toBeFocused();
  await expect(reaction).toHaveAttribute('aria-pressed', 'true');
  await reaction.click();
  await expect(reaction).toHaveCount(0);
  const draft = page.getByLabel('Сообщение', { exact: true });
  await draft.fill('Черновик под приглашением');
  const timeline = page.getByRole('list', { name: 'Разговор встречи' });
  const position = await timeline.evaluate((element) => element.parentElement?.scrollTop);
  await row.getByTestId('message-actions').press('Enter');
  await expect(picker).toBeVisible();
  await page
    .locator('main#main > header')
    .getByRole('button', {
      name: 'Пригласить друзей',
      exact: true,
    })
    .click();
  const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  await expect(share).toBeVisible();
  await expect(picker).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(share).not.toBeVisible();
  await expect(picker).toHaveCount(0);
  await expect(
    page
      .locator('main#main > header')
      .getByRole('button', { name: 'Пригласить друзей', exact: true }),
  ).toBeFocused();
  await expect(draft).toHaveValue('Черновик под приглашением');
  expect(await timeline.evaluate((element) => element.parentElement?.scrollTop)).toBe(
    position,
  );
  await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
});

test('desktop chat actions stay modal over the conversation and restore the draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Модальные действия');
  await page.goto(`/meetings/${meeting.id}`);
  const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  await input.fill('Сохранённый черновик');

  for (const [label, title] of [
    ['Предложить дату', 'Новая дата встречи'],
    ['Предложить место', 'Предложить место'],
    ['Предложить задачу', 'Предложить задачу'],
  ] as const) {
    await page.getByRole('button', { name: 'Добавить к встрече', exact: true }).click();
    await page.getByRole('menuitem', { name: label, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    await expect(dialog).toBeVisible();
    await expect(page.locator('dialog:modal')).toHaveCount(1);
    await expect(page.locator('main#main')).toBeVisible();

    if (label === 'Предложить дату') {
      const date = dialog.getByRole('combobox', { name: 'Вариант 1', exact: true });
      const calendarButton = dialog
        .getByRole('button', { name: 'Календарь', exact: true })
        .first();

      await expect(calendarButton.locator('svg.g-icon')).not.toHaveCSS(
        'mask-image',
        'none',
      );

      for (const clearIcon of await dialog
        .locator('.g-text-input__clear svg.g-icon')
        .all()) {
        await expect(clearIcon).toHaveCSS('mask-image', 'none');
      }

      await calendarButton.click();
      const calendar = page.locator('.g-popup').filter({ has: page.getByRole('grid') });
      await expect(calendar).toBeVisible();
      await calendar.getByRole('button', { name: /29 октября 2099/ }).click();
      await expect(date).toHaveValue(/29.*10.*2099/);
      await expect(calendar).not.toBeVisible();
      await page.screenshot({
        path: test.info().outputPath('desktop-chat-calendar-icons.png'),
      });
    }

    await expect(dialog.getByRole('button', { name: 'Назад', exact: true })).toHaveCount(
      0,
    );
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(input).toHaveValue('Сохранённый черновик');
    await expect(
      page.getByRole('button', { name: 'Добавить к встрече', exact: true }),
    ).toBeFocused();
  }
});

test('touch hold opens reactions and chip people without a second toggle; moving cancels a hold', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Удержание реакции');
  await page.goto(`/meetings/${meeting.id}`);
  await page.getByLabel('Сообщение', { exact: true }).fill('Принесу чай');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу чай' });
  const message = row.getByTestId('message-actions');
  const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  await expect(row).toHaveAttribute('data-delivery', 'accepted');
  await message.dispatchEvent('pointerdown', {
    pointerType: 'touch',
    clientX: 100,
    clientY: 100,
  });
  await expect(message).toHaveAttribute('data-pressing', 'true');
  await message.dispatchEvent('pointermove', {
    pointerType: 'touch',
    clientX: 100,
    clientY: 150,
  });
  await expect(message).toHaveAttribute('data-pressing', 'false');
  await page.waitForTimeout(500);
  await expect(picker).toHaveCount(0);
  await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  await message.dispatchEvent('pointerdown', {
    pointerType: 'touch',
    clientX: 100,
    clientY: 100,
  });
  await expect(picker).toBeVisible();
  await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  await message.dispatchEvent('click');
  await picker.getByRole('button', { name: '❤️', exact: true }).click();
  const chip = row.getByRole('button', { name: '❤️: 1', exact: true });
  await expect(chip).toHaveAttribute('aria-pressed', 'true');

  for (const pickerOpen of [false, true]) {
    if (pickerOpen) {
      await message.press('Enter');
      await expect(picker).toBeVisible();
      await expect(picker.getByRole('button', { name: '❤️', exact: true })).toBeFocused();
    }

    await chip.dispatchEvent('pointerdown', {
      pointerType: 'touch',
      clientX: 100,
      clientY: 100,
    });
    const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
    await expect(people).toBeVisible();
    await chip.dispatchEvent('pointerup', { pointerType: 'touch' });
    await chip.dispatchEvent('click');
    await expect(picker).toHaveCount(0);
    await expect(
      people.getByRole('button', { name: 'Реакция ❤️', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(people).not.toBeVisible();
    await expect(chip).toBeFocused();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
  }

  await chip.click();
  await expect(chip).toHaveCount(0);
});

test('mouse context menus open the reaction picker and filtered people without toggling', async ({
  page,
}) => {
  await login(page, 'Саша');
  const { meeting } = await apiCreate(page, 'Контекстное меню');
  await page.goto(`/meetings/${meeting.id}`);
  await page.getByLabel('Сообщение', { exact: true }).fill('Возьму чай');
  await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  const row = page.getByTestId('feed-message').filter({ hasText: 'Возьму чай' });
  const message = row.getByTestId('message-actions');
  const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  await message.click({ button: 'right' });
  await picker.getByRole('button', { name: '👍', exact: true }).click();
  const chip = row.getByRole('button', { name: '👍: 1', exact: true });
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await message.click({ button: 'right' });
  await expect(picker).toBeVisible();
  await chip.click({ button: 'right' });
  const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  await expect(people).toBeVisible();
  await expect(
    people.getByRole('button', { name: 'Реакция 👍', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(people).not.toBeVisible();
  await expect(chip).toBeFocused();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
});
