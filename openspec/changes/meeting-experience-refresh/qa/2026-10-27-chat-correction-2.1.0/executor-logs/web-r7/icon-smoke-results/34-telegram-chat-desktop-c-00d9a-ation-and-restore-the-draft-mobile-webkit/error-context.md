# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 34-telegram-chat.spec.ts >> desktop chat actions stay modal over the conversation and restore the draft
- Location: tests/34-telegram-chat.spec.ts:269:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.g-popup').filter({ has: getByRole('grid') }).getByRole('button', { name: /29 октября 2026/ })

```

# Page snapshot

```yaml
- generic [ref=f3e3]:
  - link [aria-hidden] [ref=f3e4]:
    - /url: "#main"
    - text: К содержимому
  - generic [aria-hidden] [ref=f3e5]: Демостенд · данные хранятся до перезапуска
  - generic [ref=f3e6]:
    - navigation [ref=f3e8]:
      - link [ref=f3e10]:
        - /url: /
        - generic [ref=f3e11]: somewhere
      - generic [ref=f3e12]:
        - link [ref=f3e13]:
          - /url: /meetings
          - generic [ref=f3e16]: Мои встречи
        - link [ref=f3e17]:
          - /url: /invitations
          - generic [ref=f3e21]: Приглашения
        - link [ref=f3e22]:
          - /url: /support
          - generic [ref=f3e25]: Сообщить о проблеме
        - link [ref=f3e26]:
          - /url: /profile
          - generic [aria-hidden] [ref=f3e28]: С
          - generic [ref=f3e29]:
            - strong [ref=f3e30]: Саша
            - generic [ref=f3e31]: Мой профиль
    - generic [ref=f3e32]:
      - main [aria-hidden] [ref=f3e33]:
        - generic [ref=f3e34]:
          - link [ref=f3e35]:
            - /url: /meetings
          - generic [ref=f3e38]:
            - heading [level=1] [ref=f3e39]: Модальные действия
            - paragraph [ref=f3e40]: 1 участник · 24 октября · 19:00
          - button [ref=f3e42] [cursor=pointer]
          - button [ref=f3e45] [cursor=pointer]
        - generic [ref=f3e50]:
          - list [ref=f3e51]:
            - listitem [ref=f3e52]:
              - time [ref=f3e53]: Сегодня · 20:12
              - paragraph [ref=f3e54]: Саша создал встречу
          - generic [ref=f3e55]:
            - heading [level=2] [ref=f3e60]: Позовём остальных?
            - paragraph [ref=f3e61]: Отправьте друзьям ссылку на встречу. После ответа «Приду» они появятся в чате.
            - button [ref=f3e62] [cursor=pointer]:
              - generic [ref=f3e65]: Пригласить друзей
        - generic [ref=f3e68]:
          - button [ref=f3e70] [cursor=pointer]
          - generic [ref=f3e73]:
            - generic [ref=f3e74]:
              - generic [ref=f3e75]: Сообщение
              - textbox [ref=f3e76]:
                - /placeholder: Сообщение…
                - text: Сохранённый черновик
            - button [ref=f3e77] [cursor=pointer]
          - button [ref=f3e83] [cursor=pointer]
      - dialog [ref=f3e86]:
        - generic [ref=f3e88]:
          - heading [level=2] [ref=f3e89]: Предложить дату
          - button [ref=f3e90] [cursor=pointer]
        - generic [ref=f3e95]:
          - generic [ref=f3e97]:
            - group [ref=f3e98]:
              - generic [ref=f3e99]: Даты
              - generic [ref=f3e101]:
                - generic [ref=f3e102]: Вариант 1
                - group [ref=f3e104]:
                  - generic [ref=f3e107]:
                    - combobox [expanded] [ref=f3e108]: ⁦⁨24⁩⁨.⁩⁨10⁩⁨.⁩⁨2099⁩⁩
                    - button [expanded] [ref=f3e110] [cursor=pointer]
              - generic [ref=f3e117]:
                - generic [ref=f3e118]: Вариант 2
                - group [ref=f3e120]:
                  - generic [ref=f3e122]:
                    - combobox [ref=f3e123]: ⁦⁨25⁩⁨.⁩⁨10⁩⁨.⁩⁨2099⁩⁩
                    - button [ref=f3e125] [cursor=pointer]
              - button [ref=f3e131] [cursor=pointer]: Добавить вариант
            - group [ref=f3e134]:
              - generic [ref=f3e135]: Опрос завершится
              - generic [ref=f3e136]:
                - generic [ref=f3e137]:
                  - generic [ref=f3e138]: Дата
                  - group [ref=f3e140]:
                    - generic [ref=f3e142]:
                      - combobox [ref=f3e143]: ⁦⁨28⁩⁨.⁩⁨10⁩⁨.⁩⁨2026⁩⁩
                      - button [ref=f3e144] [cursor=pointer]
                      - button [ref=f3e151] [cursor=pointer]
                - generic [ref=f3e157]:
                  - generic [ref=f3e158]: Время
                  - textbox [ref=f3e161]:
                    - /placeholder: 19:00
                    - text: 20:12
              - generic [ref=f3e166]: Москва
            - group [ref=f3e167]:
              - generic [ref=f3e168]:
                - generic [ref=f3e169]: Можно выбрать несколько дат
                - checkbox [checked] [ref=f3e170] [cursor=pointer]
              - generic [ref=f3e171]:
                - generic [ref=f3e172]: Можно изменить голос
                - checkbox [checked] [ref=f3e173] [cursor=pointer]
              - generic [ref=f3e174]:
                - generic [ref=f3e175]: Можно добавить дату
                - checkbox [checked] [ref=f3e176] [cursor=pointer]
              - generic [ref=f3e177]:
                - generic [ref=f3e178]: Анонимное голосование
                - checkbox [ref=f3e179] [cursor=pointer]
              - generic [ref=f3e180]:
                - generic [ref=f3e181]: Скрывать результаты до завершения
                - checkbox [ref=f3e182] [cursor=pointer]
          - button [ref=f3e184] [cursor=pointer]: Создать опрос
        - generic:
          - button [ref=f3e185]
          - button "Закрыть" [ref=f3e186] [cursor=pointer]
          - dialog [ref=f3e187]:
            - group "октябрь 2099" [ref=f3e190]:
              - generic [ref=f3e191]:
                - button "октябрь 2099" [ref=f3e192] [cursor=pointer]
                - generic [ref=f3e200]:
                  - button "Назад" [ref=f3e201] [cursor=pointer]
                  - button "Вперёд" [ref=f3e206] [cursor=pointer]
              - grid "октябрь 2099" [ref=f3e211]:
                - row [ref=f3e212]:
                  - columnheader "понедельник" [ref=f3e213]: пн
                  - columnheader "вторник" [ref=f3e214]: вт
                  - columnheader "среда" [ref=f3e215]: ср
                  - columnheader "четверг" [ref=f3e216]: чт
                  - columnheader "пятница" [ref=f3e217]: пт
                  - columnheader "суббота" [ref=f3e218]: сб
                  - columnheader "воскресенье" [ref=f3e219]: вс
                - rowgroup [ref=f3e220]:
                  - row [ref=f3e221]:
                    - gridcell [ref=f3e222]:
                      - button "понедельник, 28 сентября 2099 г." [ref=f3e223] [cursor=pointer]: "28"
                    - gridcell [ref=f3e224]:
                      - button "вторник, 29 сентября 2099 г." [ref=f3e225] [cursor=pointer]: "29"
                    - gridcell [ref=f3e226]:
                      - button "среда, 30 сентября 2099 г." [ref=f3e227] [cursor=pointer]: "30"
                    - gridcell [ref=f3e228]:
                      - button "четверг, 1 октября 2099 г." [ref=f3e229] [cursor=pointer]: "1"
                    - gridcell [ref=f3e230]:
                      - button "пятница, 2 октября 2099 г." [ref=f3e231] [cursor=pointer]: "2"
                    - gridcell [ref=f3e232]:
                      - button "суббота, 3 октября 2099 г." [ref=f3e233] [cursor=pointer]: "3"
                    - gridcell [ref=f3e234]:
                      - button "воскресенье, 4 октября 2099 г." [ref=f3e235] [cursor=pointer]: "4"
                  - row [ref=f3e236]:
                    - gridcell [ref=f3e237]:
                      - button "понедельник, 5 октября 2099 г." [ref=f3e238] [cursor=pointer]: "5"
                    - gridcell [ref=f3e239]:
                      - button "вторник, 6 октября 2099 г." [ref=f3e240] [cursor=pointer]: "6"
                    - gridcell [ref=f3e241]:
                      - button "среда, 7 октября 2099 г." [ref=f3e242] [cursor=pointer]: "7"
                    - gridcell [ref=f3e243]:
                      - button "четверг, 8 октября 2099 г." [ref=f3e244] [cursor=pointer]: "8"
                    - gridcell [ref=f3e245]:
                      - button "пятница, 9 октября 2099 г." [ref=f3e246] [cursor=pointer]: "9"
                    - gridcell [ref=f3e247]:
                      - button "суббота, 10 октября 2099 г." [ref=f3e248] [cursor=pointer]: "10"
                    - gridcell [ref=f3e249]:
                      - button "воскресенье, 11 октября 2099 г." [ref=f3e250] [cursor=pointer]: "11"
                  - row [ref=f3e251]:
                    - gridcell [ref=f3e252]:
                      - button "понедельник, 12 октября 2099 г." [ref=f3e253] [cursor=pointer]: "12"
                    - gridcell [ref=f3e254]:
                      - button "вторник, 13 октября 2099 г." [ref=f3e255] [cursor=pointer]: "13"
                    - gridcell [ref=f3e256]:
                      - button "среда, 14 октября 2099 г." [ref=f3e257] [cursor=pointer]: "14"
                    - gridcell [ref=f3e258]:
                      - button "четверг, 15 октября 2099 г." [ref=f3e259] [cursor=pointer]: "15"
                    - gridcell [ref=f3e260]:
                      - button "пятница, 16 октября 2099 г." [ref=f3e261] [cursor=pointer]: "16"
                    - gridcell [ref=f3e262]:
                      - button "суббота, 17 октября 2099 г." [ref=f3e263] [cursor=pointer]: "17"
                    - gridcell [ref=f3e264]:
                      - button "воскресенье, 18 октября 2099 г." [ref=f3e265] [cursor=pointer]: "18"
                  - row [ref=f3e266]:
                    - gridcell [ref=f3e267]:
                      - button "понедельник, 19 октября 2099 г." [ref=f3e268] [cursor=pointer]: "19"
                    - gridcell [ref=f3e269]:
                      - button "вторник, 20 октября 2099 г." [ref=f3e270] [cursor=pointer]: "20"
                    - gridcell [ref=f3e271]:
                      - button "среда, 21 октября 2099 г." [ref=f3e272] [cursor=pointer]: "21"
                    - gridcell [ref=f3e273]:
                      - button "четверг, 22 октября 2099 г." [ref=f3e274] [cursor=pointer]: "22"
                    - gridcell [ref=f3e275]:
                      - button "пятница, 23 октября 2099 г." [ref=f3e276] [cursor=pointer]: "23"
                    - gridcell [selected] [ref=f3e277]:
                      - button "суббота, 24 октября 2099 г." [active] [ref=f3e278] [cursor=pointer]: "24"
                    - gridcell [ref=f3e279]:
                      - button "воскресенье, 25 октября 2099 г." [ref=f3e280] [cursor=pointer]: "25"
                  - row [ref=f3e281]:
                    - gridcell [ref=f3e282]:
                      - button "понедельник, 26 октября 2099 г." [ref=f3e283] [cursor=pointer]: "26"
                    - gridcell [ref=f3e284]:
                      - button "вторник, 27 октября 2099 г." [ref=f3e285] [cursor=pointer]: "27"
                    - gridcell [ref=f3e286]:
                      - button "среда, 28 октября 2099 г." [ref=f3e287] [cursor=pointer]: "28"
                    - gridcell [ref=f3e288]:
                      - button "четверг, 29 октября 2099 г." [ref=f3e289] [cursor=pointer]: "29"
                    - gridcell [ref=f3e290]:
                      - button "пятница, 30 октября 2099 г." [ref=f3e291] [cursor=pointer]: "30"
                    - gridcell [ref=f3e292]:
                      - button "суббота, 31 октября 2099 г." [ref=f3e293] [cursor=pointer]: "31"
                    - gridcell [ref=f3e294]:
                      - button "воскресенье, 1 ноября 2099 г." [ref=f3e295] [cursor=pointer]: "1"
                  - row [ref=f3e296]:
                    - gridcell [ref=f3e297]:
                      - button "понедельник, 2 ноября 2099 г." [ref=f3e298] [cursor=pointer]: "2"
                    - gridcell [ref=f3e299]:
                      - button "вторник, 3 ноября 2099 г." [ref=f3e300] [cursor=pointer]: "3"
                    - gridcell [ref=f3e301]:
                      - button "среда, 4 ноября 2099 г." [ref=f3e302] [cursor=pointer]: "4"
                    - gridcell [ref=f3e303]:
                      - button "четверг, 5 ноября 2099 г." [ref=f3e304] [cursor=pointer]: "5"
                    - gridcell [ref=f3e305]:
                      - button "пятница, 6 ноября 2099 г." [ref=f3e306] [cursor=pointer]: "6"
                    - gridcell [ref=f3e307]:
                      - button "суббота, 7 ноября 2099 г." [ref=f3e308] [cursor=pointer]: "7"
                    - gridcell [ref=f3e309]:
                      - button "воскресенье, 8 ноября 2099 г." [ref=f3e310] [cursor=pointer]: "8"
          - button "Закрыть" [ref=f3e311] [cursor=pointer]
          - button [ref=f3e312]
      - complementary [aria-hidden] [ref=f3e313]:
        - generic [ref=f3e314]:
          - generic [ref=f3e315]:
            - generic [ref=f3e316]:
              - term [ref=f3e317]: Когда
              - definition [ref=f3e318]:
                - generic [ref=f3e319]: 24 октября в 19:00
                - generic [ref=f3e320]: Москва
            - generic [ref=f3e321]:
              - term [ref=f3e322]: Где
              - definition [ref=f3e323]: Место пока не выбрано
          - generic [ref=f3e324]:
            - heading [level=3] [ref=f3e325]: Кто придёт · 1
            - button [ref=f3e326] [cursor=pointer]:
              - generic [ref=f3e327]:
                - generic [aria-hidden] [ref=f3e328]: С
                - text: Саша
```

# Test source

```ts
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
  296 |       await expect(calendarButton.locator('svg.g-icon')).not.toHaveCSS(
  297 |         'mask-image',
  298 |         'none',
  299 |       );
  300 |       await date.fill('27.10.2026');
  301 |       await calendarButton.click();
  302 |       const calendar = page.locator('.g-popup').filter({ has: page.getByRole('grid') });
  303 |       await expect(calendar).toBeVisible();
> 304 |       await calendar.getByRole('button', { name: /29 октября 2026/ }).click();
      |                                                                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  305 |       await expect(date).toHaveValue(/29.*10.*2026/);
  306 |       await page.screenshot({
  307 |         path: test.info().outputPath('desktop-chat-calendar-icons.png'),
  308 |       });
  309 |     }
  310 | 
  311 |     await expect(dialog.getByRole('button', { name: 'Назад', exact: true })).toHaveCount(
  312 |       0,
  313 |     );
  314 |     await page.keyboard.press('Escape');
  315 |     await expect(dialog).not.toBeVisible();
  316 |     await expect(input).toHaveValue('Сохранённый черновик');
  317 |     await expect(
  318 |       page.getByRole('button', { name: 'Добавить к встрече', exact: true }),
  319 |     ).toBeFocused();
  320 |   }
  321 | });
  322 | 
  323 | test('touch hold opens reactions and chip people without a second toggle; moving cancels a hold', async ({
  324 |   page,
  325 | }) => {
  326 |   await page.setViewportSize({ width: 390, height: 844 });
  327 |   await login(page, 'Саша');
  328 |   const { meeting } = await apiCreate(page, 'Удержание реакции');
  329 |   await page.goto(`/meetings/${meeting.id}`);
  330 |   await page.getByLabel('Сообщение', { exact: true }).fill('Принесу чай');
  331 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  332 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу чай' });
  333 |   const message = row.getByTestId('message-actions');
  334 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  335 |   await message.dispatchEvent('pointerdown', {
  336 |     pointerType: 'touch',
  337 |     clientX: 100,
  338 |     clientY: 100,
  339 |   });
  340 |   await expect(message).toHaveAttribute('data-pressing', 'true');
  341 |   await message.dispatchEvent('pointermove', {
  342 |     pointerType: 'touch',
  343 |     clientX: 100,
  344 |     clientY: 150,
  345 |   });
  346 |   await expect(message).toHaveAttribute('data-pressing', 'false');
  347 |   await page.waitForTimeout(500);
  348 |   await expect(picker).toHaveCount(0);
  349 |   await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  350 |   await message.dispatchEvent('pointerdown', {
  351 |     pointerType: 'touch',
  352 |     clientX: 100,
  353 |     clientY: 100,
  354 |   });
  355 |   await expect(picker).toBeVisible();
  356 |   await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  357 |   await message.dispatchEvent('click');
  358 |   await picker.getByRole('button', { name: '❤️', exact: true }).click();
  359 |   const chip = row.getByRole('button', { name: '❤️: 1', exact: true });
  360 |   await expect(chip).toHaveAttribute('aria-pressed', 'true');
  361 | 
  362 |   for (const pickerOpen of [false, true]) {
  363 |     if (pickerOpen) {
  364 |       await message.press('Enter');
  365 |       await expect(picker).toBeVisible();
  366 |       await expect(picker.getByRole('button', { name: '❤️', exact: true })).toBeFocused();
  367 |     }
  368 | 
  369 |     await chip.dispatchEvent('pointerdown', {
  370 |       pointerType: 'touch',
  371 |       clientX: 100,
  372 |       clientY: 100,
  373 |     });
  374 |     const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  375 |     await expect(people).toBeVisible();
  376 |     await chip.dispatchEvent('pointerup', { pointerType: 'touch' });
  377 |     await chip.dispatchEvent('click');
  378 |     await expect(picker).toHaveCount(0);
  379 |     await expect(
  380 |       people.getByRole('button', { name: 'Реакция ❤️', exact: true }),
  381 |     ).toHaveAttribute('aria-pressed', 'true');
  382 |     await page.keyboard.press('Escape');
  383 |     await expect(people).not.toBeVisible();
  384 |     await expect(chip).toBeFocused();
  385 |     await expect(chip).toHaveAttribute('aria-pressed', 'true');
  386 |   }
  387 | 
  388 |   await chip.click();
  389 |   await expect(chip).toHaveCount(0);
  390 | });
  391 | 
  392 | test('mouse context menus open the reaction picker and filtered people without toggling', async ({
  393 |   page,
  394 | }) => {
  395 |   await login(page, 'Саша');
  396 |   const { meeting } = await apiCreate(page, 'Контекстное меню');
  397 |   await page.goto(`/meetings/${meeting.id}`);
  398 |   await page.getByLabel('Сообщение', { exact: true }).fill('Возьму чай');
  399 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  400 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Возьму чай' });
  401 |   const message = row.getByTestId('message-actions');
  402 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  403 |   await message.click({ button: 'right' });
  404 |   await picker.getByRole('button', { name: '👍', exact: true }).click();
```