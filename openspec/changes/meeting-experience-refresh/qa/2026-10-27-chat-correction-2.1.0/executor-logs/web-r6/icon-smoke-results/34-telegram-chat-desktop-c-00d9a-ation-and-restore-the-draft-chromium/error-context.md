# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 34-telegram-chat.spec.ts >> desktop chat actions stay modal over the conversation and restore the draft
- Location: tests/34-telegram-chat.spec.ts:269:1

# Error details

```
Error: expect(locator).not.toHaveCSS(expected) failed

Locator: getByRole('dialog', { name: 'Предложить дату', exact: true }).locator('.g-date-picker__field .g-button').first().locator('svg')
Expected: not "none"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "not toHaveCSS" getByRole('dialog', { name: 'Предложить дату', exact: true }).locator('.g-date-picker__field .g-button').first().locator('svg') with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Предложить дату', exact: true }).locator('.g-date-picker__field .g-button').first().locator('svg')

```

```yaml
- link "К содержимому":
  - /url: "#main"
- text: Демостенд · данные хранятся до перезапуска
- navigation "Основная навигация":
  - link "Somewhere — на главную":
    - /url: /
    - text: somewhere
  - link "Встречи":
    - /url: /meetings
    - text: Мои встречи
  - link "Приглашения":
    - /url: /invitations
  - link "Сообщить о проблеме":
    - /url: /support
  - link "Профиль":
    - /url: /profile
    - strong: Саша
    - text: Мой профиль
- main:
  - link "К моим встречам":
    - /url: /meetings
  - heading "Модальные действия" [level=1]
  - paragraph: 1 участник · 24 октября · 19:00
  - button "Пригласить друзей"
  - button "Информация о встрече"
  - list "Разговор встречи":
    - listitem:
      - time: Сегодня · 20:07
      - paragraph: Саша создал встречу
  - heading "Позовём остальных?" [level=2]
  - paragraph: Отправьте друзьям ссылку на встречу. После ответа «Приду» они появятся в чате.
  - button "Пригласить друзей"
  - button "Добавить к встрече"
  - text: Сообщение
  - textbox "Сообщение":
    - /placeholder: Сообщение…
    - text: Сохранённый черновик
  - button "Выбрать эмодзи"
  - button "Отправить сообщение"
- dialog "Предложить дату":
  - heading "Предложить дату" [level=2]
  - button "Закрыть"
  - group "Даты":
    - text: Даты Вариант 1
    - group:
      - combobox "Вариант 1": ⁦⁨24⁩⁨.⁩⁨10⁩⁨.⁩⁨2099⁩⁩
      - button "Календарь"
    - text: Вариант 2
    - group:
      - combobox "Вариант 2": ⁦⁨25⁩⁨.⁩⁨10⁩⁨.⁩⁨2099⁩⁩
      - button "Календарь"
    - button "Добавить вариант"
  - group "Опрос завершится":
    - text: Опрос завершится Дата
    - group:
      - combobox "Дата": ⁦⁨28⁩⁨.⁩⁨10⁩⁨.⁩⁨2026⁩⁩
      - button "Очистить"
      - button "Календарь"
    - text: Время
    - textbox "Время":
      - /placeholder: 19:00
      - text: 20:07
    - text: Москва
  - group "Настройки":
    - text: Можно выбрать несколько дат
    - checkbox "Можно выбрать несколько дат" [checked]
    - text: Можно изменить голос
    - checkbox "Можно изменить голос" [checked]
    - text: Можно добавить дату
    - checkbox "Можно добавить дату" [checked]
    - text: Анонимное голосование
    - checkbox "Анонимное голосование"
    - text: Скрывать результаты до завершения
    - checkbox "Скрывать результаты до завершения"
  - button "Создать опрос"
- complementary:
  - term: Когда
  - definition: 24 октября в 19:00 Москва
  - term: Где
  - definition: Место пока не выбрано
  - heading "Кто придёт · 1" [level=3]
  - 'button "Все участники встречи. Придут: 1"': Саша
```

# Test source

```ts
  194 |   await expect(latest).toHaveCount(0);
  195 |   await expect(page.getByText('Новое сообщение внизу', { exact: true })).toBeInViewport();
  196 | });
  197 | 
  198 | test('reaction people replace the picker and browser Back returns to the same message', async ({
  199 |   page,
  200 | }) => {
  201 |   await page.setViewportSize({ width: 390, height: 844 });
  202 |   await login(page, 'Саша');
  203 |   const { meeting } = await apiCreate(page, 'Люди и реакции');
  204 |   await page.goto(`/meetings/${meeting.id}`);
  205 |   await page.getByLabel('Сообщение', { exact: true }).fill('Беру настолки');
  206 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  207 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Беру настолки' });
  208 |   await row.getByTestId('message-actions').press('Enter');
  209 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  210 |   await picker.getByRole('button', { name: '❤️', exact: true }).click();
  211 |   const reaction = row.getByRole('button', { name: '❤️: 1', exact: true });
  212 |   await expect(reaction).toHaveAttribute('aria-pressed', 'true');
  213 |   await expect(row.getByRole('button', { name: 'Добавить реакцию' })).toHaveCount(0);
  214 |   await expect(row.getByRole('button', { name: 'Кто отреагировал' })).toHaveCount(0);
  215 |   await expect(picker).toHaveCount(0);
  216 |   await row.getByTestId('message-actions').press('Enter');
  217 |   await expect(picker).toBeVisible();
  218 |   await expect(picker.getByRole('button', { name: '❤️', exact: true })).toBeFocused();
  219 |   const opener = reaction;
  220 |   await opener.press('Shift+F10');
  221 |   const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  222 |   await expect(people).toBeVisible();
  223 |   await expect(picker).toHaveCount(0);
  224 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  225 |   const filter = people.getByRole('button', { name: 'Реакция ❤️', exact: true });
  226 |   await expect(filter).toHaveAttribute('aria-pressed', 'true');
  227 |   await filter.click();
  228 |   await expect(filter).toBeFocused();
  229 |   await expect(people.getByRole('list')).toContainText('Саша');
  230 |   await page.screenshot({ path: test.info().outputPath('reaction-people-filter.png') });
  231 |   await page.goBack();
  232 |   await expect(people).not.toBeVisible();
  233 |   await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
  234 |   await expect(opener).toBeFocused();
  235 |   await expect(reaction).toHaveAttribute('aria-pressed', 'true');
  236 |   await reaction.click();
  237 |   await expect(reaction).toHaveCount(0);
  238 |   const draft = page.getByLabel('Сообщение', { exact: true });
  239 |   await draft.fill('Черновик под приглашением');
  240 |   const timeline = page.getByRole('list', { name: 'Разговор встречи' });
  241 |   const position = await timeline.evaluate((element) => element.parentElement?.scrollTop);
  242 |   await row.getByTestId('message-actions').press('Enter');
  243 |   await expect(picker).toBeVisible();
  244 |   await page
  245 |     .locator('main#main > header')
  246 |     .getByRole('button', {
  247 |       name: 'Пригласить друзей',
  248 |       exact: true,
  249 |     })
  250 |     .click();
  251 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  252 |   await expect(share).toBeVisible();
  253 |   await expect(picker).toHaveCount(0);
  254 |   await page.keyboard.press('Escape');
  255 |   await expect(share).not.toBeVisible();
  256 |   await expect(picker).toHaveCount(0);
  257 |   await expect(
  258 |     page
  259 |       .locator('main#main > header')
  260 |       .getByRole('button', { name: 'Пригласить друзей', exact: true }),
  261 |   ).toBeFocused();
  262 |   await expect(draft).toHaveValue('Черновик под приглашением');
  263 |   expect(await timeline.evaluate((element) => element.parentElement?.scrollTop)).toBe(
  264 |     position,
  265 |   );
  266 |   await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
  267 | });
  268 | 
  269 | test('desktop chat actions stay modal over the conversation and restore the draft', async ({
  270 |   page,
  271 | }) => {
  272 |   await page.setViewportSize({ width: 1440, height: 1000 });
  273 |   await login(page, 'Саша');
  274 |   const { meeting } = await apiCreate(page, 'Модальные действия');
  275 |   await page.goto(`/meetings/${meeting.id}`);
  276 |   const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  277 |   await input.fill('Сохранённый черновик');
  278 | 
  279 |   for (const [label, title] of [
  280 |     ['Предложить дату', 'Предложить дату'],
  281 |     ['Предложить место', 'Предложить место'],
  282 |     ['Предложить задачу', 'Предложить задачу'],
  283 |   ] as const) {
  284 |     await page.getByRole('button', { name: 'Добавить к встрече', exact: true }).click();
  285 |     await page.getByRole('menuitem', { name: label, exact: true }).click();
  286 |     const dialog = page.getByRole('dialog', { name: title, exact: true });
  287 |     await expect(dialog).toBeVisible();
  288 |     await expect(page.locator('dialog:modal')).toHaveCount(1);
  289 |     await expect(page.locator('main#main')).toBeVisible();
  290 | 
  291 |     if (label === 'Предложить дату') {
  292 |       const date = dialog.getByRole('combobox', { name: 'Вариант 1', exact: true });
  293 |       const calendarButton = dialog.locator('.g-date-picker__field .g-button').first();
> 294 |       await expect(calendarButton.locator('svg')).not.toHaveCSS('mask-image', 'none');
      |                                                       ^ Error: expect(locator).not.toHaveCSS(expected) failed
  295 |       await calendarButton.click();
  296 |       const calendar = page.locator('.g-popup').filter({ has: page.getByRole('grid') });
  297 |       await expect(calendar).toBeVisible();
  298 |       await calendar.getByRole('button', { name: /29 октября 2026/ }).click();
  299 |       await expect(date).toHaveValue(/29.*10.*2026/);
  300 |     }
  301 | 
  302 |     await expect(dialog.getByRole('button', { name: 'Назад', exact: true })).toHaveCount(
  303 |       0,
  304 |     );
  305 |     await page.keyboard.press('Escape');
  306 |     await expect(dialog).not.toBeVisible();
  307 |     await expect(input).toHaveValue('Сохранённый черновик');
  308 |     await expect(
  309 |       page.getByRole('button', { name: 'Добавить к встрече', exact: true }),
  310 |     ).toBeFocused();
  311 |   }
  312 | });
  313 | 
  314 | test('touch hold opens reactions and chip people without a second toggle; moving cancels a hold', async ({
  315 |   page,
  316 | }) => {
  317 |   await page.setViewportSize({ width: 390, height: 844 });
  318 |   await login(page, 'Саша');
  319 |   const { meeting } = await apiCreate(page, 'Удержание реакции');
  320 |   await page.goto(`/meetings/${meeting.id}`);
  321 |   await page.getByLabel('Сообщение', { exact: true }).fill('Принесу чай');
  322 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  323 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу чай' });
  324 |   const message = row.getByTestId('message-actions');
  325 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  326 |   await message.dispatchEvent('pointerdown', {
  327 |     pointerType: 'touch',
  328 |     clientX: 100,
  329 |     clientY: 100,
  330 |   });
  331 |   await expect(message).toHaveAttribute('data-pressing', 'true');
  332 |   await message.dispatchEvent('pointermove', {
  333 |     pointerType: 'touch',
  334 |     clientX: 100,
  335 |     clientY: 150,
  336 |   });
  337 |   await expect(message).toHaveAttribute('data-pressing', 'false');
  338 |   await page.waitForTimeout(500);
  339 |   await expect(picker).toHaveCount(0);
  340 |   await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  341 |   await message.dispatchEvent('pointerdown', {
  342 |     pointerType: 'touch',
  343 |     clientX: 100,
  344 |     clientY: 100,
  345 |   });
  346 |   await expect(picker).toBeVisible();
  347 |   await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  348 |   await message.dispatchEvent('click');
  349 |   await picker.getByRole('button', { name: '❤️', exact: true }).click();
  350 |   const chip = row.getByRole('button', { name: '❤️: 1', exact: true });
  351 |   await expect(chip).toHaveAttribute('aria-pressed', 'true');
  352 | 
  353 |   for (const pickerOpen of [false, true]) {
  354 |     if (pickerOpen) {
  355 |       await message.press('Enter');
  356 |       await expect(picker).toBeVisible();
  357 |       await expect(picker.getByRole('button', { name: '❤️', exact: true })).toBeFocused();
  358 |     }
  359 | 
  360 |     await chip.dispatchEvent('pointerdown', {
  361 |       pointerType: 'touch',
  362 |       clientX: 100,
  363 |       clientY: 100,
  364 |     });
  365 |     const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  366 |     await expect(people).toBeVisible();
  367 |     await chip.dispatchEvent('pointerup', { pointerType: 'touch' });
  368 |     await chip.dispatchEvent('click');
  369 |     await expect(picker).toHaveCount(0);
  370 |     await expect(
  371 |       people.getByRole('button', { name: 'Реакция ❤️', exact: true }),
  372 |     ).toHaveAttribute('aria-pressed', 'true');
  373 |     await page.keyboard.press('Escape');
  374 |     await expect(people).not.toBeVisible();
  375 |     await expect(chip).toBeFocused();
  376 |     await expect(chip).toHaveAttribute('aria-pressed', 'true');
  377 |   }
  378 | 
  379 |   await chip.click();
  380 |   await expect(chip).toHaveCount(0);
  381 | });
  382 | 
  383 | test('mouse context menus open the reaction picker and filtered people without toggling', async ({
  384 |   page,
  385 | }) => {
  386 |   await login(page, 'Саша');
  387 |   const { meeting } = await apiCreate(page, 'Контекстное меню');
  388 |   await page.goto(`/meetings/${meeting.id}`);
  389 |   await page.getByLabel('Сообщение', { exact: true }).fill('Возьму чай');
  390 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  391 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Возьму чай' });
  392 |   const message = row.getByTestId('message-actions');
  393 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  394 |   await message.click({ button: 'right' });
```