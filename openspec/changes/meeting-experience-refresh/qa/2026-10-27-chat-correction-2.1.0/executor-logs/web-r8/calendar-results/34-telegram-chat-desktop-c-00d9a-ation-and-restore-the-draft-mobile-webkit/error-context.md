# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 34-telegram-chat.spec.ts >> desktop chat actions stay modal over the conversation and restore the draft
- Location: tests/34-telegram-chat.spec.ts:269:1

# Error details

```
Error: expect(locator).toHaveCSS(expected) failed

Locator: getByRole('dialog', { name: 'Предложить дату', exact: true }).locator('.g-text-input__clear svg.g-icon')
Expected: "none"
Error: strict mode violation: getByRole('dialog', { name: 'Предложить дату', exact: true }).locator('.g-text-input__clear svg.g-icon') resolved to 2 elements:
    1) <svg width="16" height="16" stroke="none" class="g-icon" aria-hidden="true" fill="currentColor" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">…</svg> aka getByRole('button', { name: 'Очистить' })
    2) <svg width="16" height="16" stroke="none" class="g-icon" aria-hidden="true" fill="currentColor" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">…</svg> aka locator('._body_3z48e_8 > ._deadline_1o0ja_1 > ._fields_1o0ja_14 > ._control-field_gkq4j_1 > ._chatPicker_gkq4j_104 > .g-date-date-picker > .g-text-input > .g-text-input__content > .g-button.g-button_view_normal > .g-button__icon > .g-button__icon-inner > .g-icon')

Call log:
  - Expect "toHaveCSS" getByRole('dialog', { name: 'Предложить дату', exact: true }).locator('.g-text-input__clear svg.g-icon') with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Предложить дату', exact: true }).locator('.g-text-input__clear svg.g-icon')

```

# Page snapshot

```yaml
- generic [ref=f3e3]:
  - link "К содержимому" [ref=f3e4]:
    - /url: "#main"
  - generic [ref=f3e5]: Демостенд · данные хранятся до перезапуска
  - generic [ref=f3e6]:
    - navigation "Основная навигация" [ref=f3e8]:
      - link "Somewhere — на главную" [ref=f3e10]:
        - /url: /
        - generic [ref=f3e11]: somewhere
      - generic [ref=f3e12]:
        - link "Встречи" [ref=f3e13]:
          - /url: /meetings
          - generic [ref=f3e16]: Мои встречи
        - link "Приглашения" [ref=f3e17]:
          - /url: /invitations
        - link "Сообщить о проблеме" [ref=f3e22]:
          - /url: /support
        - link "Профиль" [ref=f3e26]:
          - /url: /profile
          - generic [aria-hidden] [ref=f3e28]: С
          - generic [ref=f3e29]:
            - strong [ref=f3e30]: Саша
            - generic [ref=f3e31]: Мой профиль
    - generic [ref=f3e32]:
      - main [ref=f3e33]:
        - generic [ref=f3e34]:
          - link "К моим встречам" [ref=f3e35]:
            - /url: /meetings
          - generic [ref=f3e38]:
            - heading "Модальные действия" [level=1] [ref=f3e39]
            - paragraph [ref=f3e40]: 1 участник · 24 октября · 19:00
          - button "Пригласить друзей" [ref=f3e42] [cursor=pointer]
          - button "Информация о встрече" [ref=f3e45] [cursor=pointer]
        - generic [ref=f3e50]:
          - list "Разговор встречи" [ref=f3e51]:
            - listitem [ref=f3e52]:
              - time [ref=f3e53]: Сегодня · 20:21
              - paragraph [ref=f3e54]: Саша создал встречу
          - generic [ref=f3e55]:
            - heading "Позовём остальных?" [level=2] [ref=f3e60]
            - paragraph [ref=f3e61]: Отправьте друзьям ссылку на встречу.После ответа «Приду» они появятся в чате.
            - button "Пригласить друзей" [ref=f3e62] [cursor=pointer]
        - generic [ref=f3e68]:
          - button "Добавить к встрече" [ref=f3e70] [cursor=pointer]
          - generic [ref=f3e73]:
            - generic [ref=f3e74]:
              - generic [ref=f3e75]: Сообщение
              - textbox "Сообщение" [ref=f3e76]:
                - /placeholder: Сообщение…
                - text: Сохранённый черновик
            - button "Выбрать эмодзи" [ref=f3e77] [cursor=pointer]
          - button "Отправить сообщение" [ref=f3e83] [cursor=pointer]
      - dialog [ref=f3e86]:
        - generic [ref=f3e88]:
          - heading "Предложить дату" [level=2] [ref=f3e89]
          - button "Закрыть" [active] [ref=f3e90] [cursor=pointer]
        - generic [ref=f3e95]:
          - generic [ref=f3e97]:
            - group "Даты" [ref=f3e98]:
              - generic [ref=f3e101]:
                - generic [ref=f3e102]: Вариант 1
                - group [ref=f3e104]:
                  - generic [ref=f3e106]:
                    - combobox "Вариант 1" [ref=f3e107]: ⁦⁨24⁩⁨.⁩⁨10⁩⁨.⁩⁨2099⁩⁩
                    - button "Календарь" [ref=f3e109] [cursor=pointer]
              - generic [ref=f3e116]:
                - generic [ref=f3e117]: Вариант 2
                - group [ref=f3e119]:
                  - generic [ref=f3e121]:
                    - combobox "Вариант 2" [ref=f3e122]: ⁦⁨25⁩⁨.⁩⁨10⁩⁨.⁩⁨2099⁩⁩
                    - button "Календарь" [ref=f3e124] [cursor=pointer]
              - button "Добавить вариант" [ref=f3e130] [cursor=pointer]
            - group "Опрос завершится" [ref=f3e133]:
              - generic [ref=f3e135]:
                - generic [ref=f3e136]:
                  - generic [ref=f3e137]: Дата
                  - group [ref=f3e139]:
                    - generic [ref=f3e141]:
                      - combobox "Дата" [ref=f3e142]: ⁦⁨28⁩⁨.⁩⁨10⁩⁨.⁩⁨2026⁩⁩
                      - button "Очистить" [ref=f3e143] [cursor=pointer]
                      - button "Календарь" [ref=f3e150] [cursor=pointer]
                - generic [ref=f3e156]:
                  - generic [ref=f3e157]: Время
                  - textbox "Время" [ref=f3e160]:
                    - /placeholder: 19:00
                    - text: 20:21
              - generic [ref=f3e165]: Москва
            - group "Настройки" [ref=f3e166]:
              - generic [ref=f3e167]:
                - generic [ref=f3e168]: Можно выбрать несколько дат
                - checkbox "Можно выбрать несколько дат" [checked] [ref=f3e169] [cursor=pointer]
              - generic [ref=f3e170]:
                - generic [ref=f3e171]: Можно изменить голос
                - checkbox "Можно изменить голос" [checked] [ref=f3e172] [cursor=pointer]
              - generic [ref=f3e173]:
                - generic [ref=f3e174]: Можно добавить дату
                - checkbox "Можно добавить дату" [checked] [ref=f3e175] [cursor=pointer]
              - generic [ref=f3e176]:
                - generic [ref=f3e177]: Анонимное голосование
                - checkbox "Анонимное голосование" [ref=f3e178] [cursor=pointer]
              - generic [ref=f3e179]:
                - generic [ref=f3e180]: Скрывать результаты до завершения
                - checkbox "Скрывать результаты до завершения" [ref=f3e181] [cursor=pointer]
          - button "Создать опрос" [ref=f3e183] [cursor=pointer]
      - complementary [ref=f3e184]:
        - generic [ref=f3e185]:
          - generic [ref=f3e186]:
            - generic [ref=f3e187]:
              - term [ref=f3e188]: Когда
              - definition [ref=f3e189]:
                - generic [ref=f3e190]: 24 октября в 19:00
                - generic [ref=f3e191]: Москва
            - generic [ref=f3e192]:
              - term [ref=f3e193]: Где
              - definition [ref=f3e194]: Место пока не выбрано
          - generic [ref=f3e195]:
            - heading "Кто придёт · 1" [level=3] [ref=f3e196]
            - 'button "Все участники встречи. Придут: 1" [ref=f3e197] [cursor=pointer]':
              - generic "Саша" [ref=f3e198]:
                - generic [aria-hidden] [ref=f3e199]: С
                - text: Саша
```

# Test source

```ts
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
  293 |       const calendarButton = dialog
  294 |         .getByRole('button', { name: 'Календарь', exact: true })
  295 |         .first();
  296 | 
  297 |       await expect(calendarButton.locator('svg.g-icon')).not.toHaveCSS(
  298 |         'mask-image',
  299 |         'none',
  300 |       );
> 301 |       await expect(dialog.locator('.g-text-input__clear svg.g-icon')).toHaveCSS(
      |                                                                       ^ Error: expect(locator).toHaveCSS(expected) failed
  302 |         'mask-image',
  303 |         'none',
  304 |       );
  305 |       await calendarButton.click();
  306 |       const calendar = page.locator('.g-popup').filter({ has: page.getByRole('grid') });
  307 |       await expect(calendar).toBeVisible();
  308 |       await calendar.getByRole('button', { name: /29 октября 2099/ }).click();
  309 |       await expect(date).toHaveValue(/29.*10.*2099/);
  310 |       await expect(calendar).not.toBeVisible();
  311 |       await page.screenshot({
  312 |         path: test.info().outputPath('desktop-chat-calendar-icons.png'),
  313 |       });
  314 |     }
  315 | 
  316 |     await expect(dialog.getByRole('button', { name: 'Назад', exact: true })).toHaveCount(
  317 |       0,
  318 |     );
  319 |     await page.keyboard.press('Escape');
  320 |     await expect(dialog).not.toBeVisible();
  321 |     await expect(input).toHaveValue('Сохранённый черновик');
  322 |     await expect(
  323 |       page.getByRole('button', { name: 'Добавить к встрече', exact: true }),
  324 |     ).toBeFocused();
  325 |   }
  326 | });
  327 | 
  328 | test('touch hold opens reactions and chip people without a second toggle; moving cancels a hold', async ({
  329 |   page,
  330 | }) => {
  331 |   await page.setViewportSize({ width: 390, height: 844 });
  332 |   await login(page, 'Саша');
  333 |   const { meeting } = await apiCreate(page, 'Удержание реакции');
  334 |   await page.goto(`/meetings/${meeting.id}`);
  335 |   await page.getByLabel('Сообщение', { exact: true }).fill('Принесу чай');
  336 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  337 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу чай' });
  338 |   const message = row.getByTestId('message-actions');
  339 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  340 |   await message.dispatchEvent('pointerdown', {
  341 |     pointerType: 'touch',
  342 |     clientX: 100,
  343 |     clientY: 100,
  344 |   });
  345 |   await expect(message).toHaveAttribute('data-pressing', 'true');
  346 |   await message.dispatchEvent('pointermove', {
  347 |     pointerType: 'touch',
  348 |     clientX: 100,
  349 |     clientY: 150,
  350 |   });
  351 |   await expect(message).toHaveAttribute('data-pressing', 'false');
  352 |   await page.waitForTimeout(500);
  353 |   await expect(picker).toHaveCount(0);
  354 |   await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  355 |   await message.dispatchEvent('pointerdown', {
  356 |     pointerType: 'touch',
  357 |     clientX: 100,
  358 |     clientY: 100,
  359 |   });
  360 |   await expect(picker).toBeVisible();
  361 |   await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  362 |   await message.dispatchEvent('click');
  363 |   await picker.getByRole('button', { name: '❤️', exact: true }).click();
  364 |   const chip = row.getByRole('button', { name: '❤️: 1', exact: true });
  365 |   await expect(chip).toHaveAttribute('aria-pressed', 'true');
  366 | 
  367 |   for (const pickerOpen of [false, true]) {
  368 |     if (pickerOpen) {
  369 |       await message.press('Enter');
  370 |       await expect(picker).toBeVisible();
  371 |       await expect(picker.getByRole('button', { name: '❤️', exact: true })).toBeFocused();
  372 |     }
  373 | 
  374 |     await chip.dispatchEvent('pointerdown', {
  375 |       pointerType: 'touch',
  376 |       clientX: 100,
  377 |       clientY: 100,
  378 |     });
  379 |     const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  380 |     await expect(people).toBeVisible();
  381 |     await chip.dispatchEvent('pointerup', { pointerType: 'touch' });
  382 |     await chip.dispatchEvent('click');
  383 |     await expect(picker).toHaveCount(0);
  384 |     await expect(
  385 |       people.getByRole('button', { name: 'Реакция ❤️', exact: true }),
  386 |     ).toHaveAttribute('aria-pressed', 'true');
  387 |     await page.keyboard.press('Escape');
  388 |     await expect(people).not.toBeVisible();
  389 |     await expect(chip).toBeFocused();
  390 |     await expect(chip).toHaveAttribute('aria-pressed', 'true');
  391 |   }
  392 | 
  393 |   await chip.click();
  394 |   await expect(chip).toHaveCount(0);
  395 | });
  396 | 
  397 | test('mouse context menus open the reaction picker and filtered people without toggling', async ({
  398 |   page,
  399 | }) => {
  400 |   await login(page, 'Саша');
  401 |   const { meeting } = await apiCreate(page, 'Контекстное меню');
```