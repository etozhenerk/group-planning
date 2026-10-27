# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 34-telegram-chat.spec.ts >> touch hold opens reactions and chip people without a second toggle; moving cancels a hold
- Location: tests/34-telegram-chat.spec.ts:345:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByTestId('feed-message').filter({ hasText: 'Принесу чай' }).getByTestId('message-actions')
Expected: "true"
Received: "false"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByTestId('feed-message').filter({ hasText: 'Принесу чай' }).getByTestId('message-actions') with timeout 5000ms
  - waiting for getByTestId('feed-message').filter({ hasText: 'Принесу чай' }).getByTestId('message-actions')
    - locator resolved to <div data-pressing="false" class="_target_1kxql_70" data-testid="message-actions" data-chat-surface-trigger="true" aria-label="Реакции на сообщение: Принесу чай">…</div>
    13 × unexpected value "false"
       - locator resolved to <div tabindex="0" role="group" data-pressing="false" aria-expanded="false" aria-haspopup="dialog" class="_target_1kxql_70" data-testid="message-actions" data-chat-surface-trigger="true" aria-keyshortcuts="Enter Space Shift+F10" aria-label="Реакции на сообщение: Принесу чай">…</div>
    - unexpected value "false"

```

```yaml
- 'group "Реакции на сообщение: Принесу чай"':
  - paragraph: Принесу чай
```

# Test source

```ts
  262 |       exact: true,
  263 |     })
  264 |     .click();
  265 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  266 |   await expect(share).toBeVisible();
  267 |   await expect(picker).toHaveCount(0);
  268 |   await page.keyboard.press('Escape');
  269 |   await expect(share).not.toBeVisible();
  270 |   await expect(picker).toHaveCount(0);
  271 |   await expect(
  272 |     page
  273 |       .locator('main#main > header')
  274 |       .getByRole('button', { name: 'Пригласить друзей', exact: true }),
  275 |   ).toBeFocused();
  276 |   await expect(draft).toHaveValue('Черновик под приглашением');
  277 |   expect(await timeline.evaluate((element) => element.parentElement?.scrollTop)).toBe(
  278 |     position,
  279 |   );
  280 |   await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
  281 | });
  282 | 
  283 | test('desktop chat actions stay modal over the conversation and restore the draft', async ({
  284 |   page,
  285 | }) => {
  286 |   await page.setViewportSize({ width: 1440, height: 1000 });
  287 |   await login(page, 'Саша');
  288 |   const { meeting } = await apiCreate(page, 'Модальные действия');
  289 |   await page.goto(`/meetings/${meeting.id}`);
  290 |   const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  291 |   await input.fill('Сохранённый черновик');
  292 | 
  293 |   for (const [label, title] of [
  294 |     ['Предложить дату', 'Предложить дату'],
  295 |     ['Предложить место', 'Предложить место'],
  296 |     ['Предложить задачу', 'Предложить задачу'],
  297 |   ] as const) {
  298 |     await page.getByRole('button', { name: 'Добавить к встрече', exact: true }).click();
  299 |     await page.getByRole('menuitem', { name: label, exact: true }).click();
  300 |     const dialog = page.getByRole('dialog', { name: title, exact: true });
  301 |     await expect(dialog).toBeVisible();
  302 |     await expect(page.locator('dialog:modal')).toHaveCount(1);
  303 |     await expect(page.locator('main#main')).toBeVisible();
  304 | 
  305 |     if (label === 'Предложить дату') {
  306 |       const date = dialog.getByRole('combobox', { name: 'Вариант 1', exact: true });
  307 |       const calendarButton = dialog
  308 |         .getByRole('button', { name: 'Календарь', exact: true })
  309 |         .first();
  310 | 
  311 |       await expect(calendarButton.locator('svg.g-icon')).not.toHaveCSS(
  312 |         'mask-image',
  313 |         'none',
  314 |       );
  315 | 
  316 |       for (const clearIcon of await dialog
  317 |         .locator('.g-text-input__clear svg.g-icon')
  318 |         .all()) {
  319 |         await expect(clearIcon).toHaveCSS('mask-image', 'none');
  320 |       }
  321 | 
  322 |       await calendarButton.click();
  323 |       const calendar = page.locator('.g-popup').filter({ has: page.getByRole('grid') });
  324 |       await expect(calendar).toBeVisible();
  325 |       await calendar.getByRole('button', { name: /29 октября 2099/ }).click();
  326 |       await expect(date).toHaveValue(/29.*10.*2099/);
  327 |       await expect(calendar).not.toBeVisible();
  328 |       await page.screenshot({
  329 |         path: test.info().outputPath('desktop-chat-calendar-icons.png'),
  330 |       });
  331 |     }
  332 | 
  333 |     await expect(dialog.getByRole('button', { name: 'Назад', exact: true })).toHaveCount(
  334 |       0,
  335 |     );
  336 |     await page.keyboard.press('Escape');
  337 |     await expect(dialog).not.toBeVisible();
  338 |     await expect(input).toHaveValue('Сохранённый черновик');
  339 |     await expect(
  340 |       page.getByRole('button', { name: 'Добавить к встрече', exact: true }),
  341 |     ).toBeFocused();
  342 |   }
  343 | });
  344 | 
  345 | test('touch hold opens reactions and chip people without a second toggle; moving cancels a hold', async ({
  346 |   page,
  347 | }) => {
  348 |   await page.setViewportSize({ width: 390, height: 844 });
  349 |   await login(page, 'Саша');
  350 |   const { meeting } = await apiCreate(page, 'Удержание реакции');
  351 |   await page.goto(`/meetings/${meeting.id}`);
  352 |   await page.getByLabel('Сообщение', { exact: true }).fill('Принесу чай');
  353 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  354 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу чай' });
  355 |   const message = row.getByTestId('message-actions');
  356 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  357 |   await message.dispatchEvent('pointerdown', {
  358 |     pointerType: 'touch',
  359 |     clientX: 100,
  360 |     clientY: 100,
  361 |   });
> 362 |   await expect(message).toHaveAttribute('data-pressing', 'true');
      |                         ^ Error: expect(locator).toHaveAttribute(expected) failed
  363 |   await message.dispatchEvent('pointermove', {
  364 |     pointerType: 'touch',
  365 |     clientX: 100,
  366 |     clientY: 150,
  367 |   });
  368 |   await expect(message).toHaveAttribute('data-pressing', 'false');
  369 |   await page.waitForTimeout(500);
  370 |   await expect(picker).toHaveCount(0);
  371 |   await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  372 |   await message.dispatchEvent('pointerdown', {
  373 |     pointerType: 'touch',
  374 |     clientX: 100,
  375 |     clientY: 100,
  376 |   });
  377 |   await expect(picker).toBeVisible();
  378 |   await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  379 |   await message.dispatchEvent('click');
  380 |   await picker.getByRole('button', { name: '❤️', exact: true }).click();
  381 |   const chip = row.getByRole('button', { name: '❤️: 1', exact: true });
  382 |   await expect(chip).toHaveAttribute('aria-pressed', 'true');
  383 | 
  384 |   for (const pickerOpen of [false, true]) {
  385 |     if (pickerOpen) {
  386 |       await message.press('Enter');
  387 |       await expect(picker).toBeVisible();
  388 |       await expect(picker.getByRole('button', { name: '❤️', exact: true })).toBeFocused();
  389 |     }
  390 | 
  391 |     await chip.dispatchEvent('pointerdown', {
  392 |       pointerType: 'touch',
  393 |       clientX: 100,
  394 |       clientY: 100,
  395 |     });
  396 |     const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  397 |     await expect(people).toBeVisible();
  398 |     await chip.dispatchEvent('pointerup', { pointerType: 'touch' });
  399 |     await chip.dispatchEvent('click');
  400 |     await expect(picker).toHaveCount(0);
  401 |     await expect(
  402 |       people.getByRole('button', { name: 'Реакция ❤️', exact: true }),
  403 |     ).toHaveAttribute('aria-pressed', 'true');
  404 |     await page.keyboard.press('Escape');
  405 |     await expect(people).not.toBeVisible();
  406 |     await expect(chip).toBeFocused();
  407 |     await expect(chip).toHaveAttribute('aria-pressed', 'true');
  408 |   }
  409 | 
  410 |   await chip.click();
  411 |   await expect(chip).toHaveCount(0);
  412 | });
  413 | 
  414 | test('mouse context menus open the reaction picker and filtered people without toggling', async ({
  415 |   page,
  416 | }) => {
  417 |   await login(page, 'Саша');
  418 |   const { meeting } = await apiCreate(page, 'Контекстное меню');
  419 |   await page.goto(`/meetings/${meeting.id}`);
  420 |   await page.getByLabel('Сообщение', { exact: true }).fill('Возьму чай');
  421 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  422 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Возьму чай' });
  423 |   const message = row.getByTestId('message-actions');
  424 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  425 |   await message.click({ button: 'right' });
  426 |   await picker.getByRole('button', { name: '👍', exact: true }).click();
  427 |   const chip = row.getByRole('button', { name: '👍: 1', exact: true });
  428 |   await expect(chip).toHaveAttribute('aria-pressed', 'true');
  429 |   await message.click({ button: 'right' });
  430 |   await expect(picker).toBeVisible();
  431 |   await chip.click({ button: 'right' });
  432 |   const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  433 |   await expect(people).toBeVisible();
  434 |   await expect(
  435 |     people.getByRole('button', { name: 'Реакция 👍', exact: true }),
  436 |   ).toHaveAttribute('aria-pressed', 'true');
  437 |   await page.keyboard.press('Escape');
  438 |   await expect(people).not.toBeVisible();
  439 |   await expect(chip).toBeFocused();
  440 |   await expect(chip).toHaveAttribute('aria-pressed', 'true');
  441 | });
  442 | 
```