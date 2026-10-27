# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 34-telegram-chat.spec.ts >> reaction people replace the picker and browser Back returns to the same message
- Location: tests/34-telegram-chat.spec.ts:198:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('dialog', { name: 'Реакция', exact: true })
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByRole('dialog', { name: 'Реакция', exact: true }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Реакция', exact: true })
    14 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=f3e3]:
  - link "К содержимому" [ref=f3e4]:
    - /url: "#main"
  - generic [ref=f3e5]: Демостенд · данные хранятся до перезапуска
  - main [ref=f3e8]:
    - generic [ref=f3e9]:
      - link "К моим встречам" [ref=f3e10]:
        - /url: /meetings
      - button "Сведения о встрече «Люди и реакции»" [ref=f3e16] [cursor=pointer]:
        - heading "Люди и реакции" [level=1] [ref=f3e17]
        - generic [ref=f3e18]: 24 октября · 19:00 · 1 участник
      - button "Пригласить друзей" [active] [ref=f3e20] [cursor=pointer]
      - button "Информация о встрече" [ref=f3e24] [cursor=pointer]
    - list "Разговор встречи" [ref=f3e28]:
      - listitem [ref=f3e29]:
        - time [ref=f3e30]: Сегодня · 19:38
        - paragraph [ref=f3e31]: Саша создал встречу
      - listitem [ref=f3e32]:
        - generic [aria-hidden] [ref=f3e33]: С
        - generic [ref=f3e34]:
          - generic [ref=f3e35]:
            - strong [ref=f3e36]: Саша
            - time [ref=f3e37]: 19:38
          - 'group "Реакции на сообщение: Беру настолки" [ref=f3e38]':
            - paragraph [ref=f3e39]: Беру настолки
          - generic:
            - button [ref=f3e41]
            - generic:
              - generic:
                - button [ref=f3e42]
                - dialog "Реакция" [ref=f3e43]:
                  - generic [ref=f3e45]:
                    - button "❤️" [ref=f3e46] [cursor=pointer]
                    - button "👍" [ref=f3e47] [cursor=pointer]
                    - button "😂" [ref=f3e48] [cursor=pointer]
                    - button "🔥" [ref=f3e49] [cursor=pointer]
                    - button "🎉" [ref=f3e50] [cursor=pointer]
                    - button "Все эмодзи" [ref=f3e51] [cursor=pointer]
                - button [ref=f3e54]
            - button [ref=f3e55]
    - generic [ref=f3e58]:
      - button "Добавить к встрече" [ref=f3e60] [cursor=pointer]
      - generic [ref=f3e62]:
        - generic [ref=f3e63]:
          - generic [ref=f3e64]: Сообщение
          - textbox "Сообщение" [ref=f3e65]:
            - /placeholder: Сообщение…
        - button "Выбрать эмодзи" [ref=f3e66] [cursor=pointer]
      - button "Отправить сообщение" [disabled] [ref=f3e72]
```

# Test source

```ts
  151 |   await login(page, 'Саша');
  152 |   const { meeting } = await apiCreate(page, 'Позиция чтения');
  153 |   const headers = await writeHeaders(page);
  154 |   const send = async (text: string) => {
  155 |     const key = randomUUID();
  156 |     const response = await page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
  157 |       headers: { ...headers, 'Idempotency-Key': key },
  158 |       data: { text, client_request_id: key },
  159 |     });
  160 | 
  161 |     expect(response.status()).toBe(201);
  162 |   };
  163 | 
  164 |   for (let index = 0; index < 25; index++) {
  165 |     await send(`Сообщение истории ${index}`);
  166 |   }
  167 | 
  168 |   await page.goto(`/meetings/${meeting.id}`);
  169 |   const history = page.getByRole('list', { name: 'Разговор встречи' }).locator('..');
  170 |   await expect(page.getByText('Сообщение истории 24', { exact: true })).toBeInViewport();
  171 |   await history.evaluate((node) => {
  172 |     node.scrollTop = 120;
  173 |     node.dispatchEvent(new Event('scroll'));
  174 |   });
  175 |   await send('Новое сообщение внизу');
  176 |   const latest = page.getByRole('button', { name: 'Новые сообщения ↓' });
  177 |   await expect(latest).toBeVisible();
  178 |   const before = await history.evaluate((node) => node.scrollTop);
  179 |   await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  180 |   await expect(page.getByRole('region', { name: 'Выбор эмодзи' })).toBeVisible();
  181 |   await expect
  182 |     .poll(() => history.evaluate((node) => node.scrollTop))
  183 |     .toBeCloseTo(before, 0);
  184 |   await expect(latest).toBeInViewport({ ratio: 1 });
  185 |   const latestBox = await latest.boundingBox();
  186 |   const inputBox = await page.getByLabel('Сообщение', { exact: true }).boundingBox();
  187 |   expect(latestBox && inputBox && latestBox.y + latestBox.height <= inputBox.y).toBe(
  188 |     true,
  189 |   );
  190 |   await page.screenshot({
  191 |     path: test.info().outputPath('reading-position-emoji-dock.png'),
  192 |   });
  193 |   await latest.click();
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
  218 |   const opener = reaction;
  219 |   await opener.press('Shift+F10');
  220 |   const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  221 |   await expect(people).toBeVisible();
  222 |   await expect(picker).toHaveCount(0);
  223 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  224 |   const filter = people.getByRole('button', { name: 'Реакция ❤️', exact: true });
  225 |   await expect(filter).toHaveAttribute('aria-pressed', 'true');
  226 |   await filter.click();
  227 |   await expect(filter).toBeFocused();
  228 |   await expect(people.getByRole('list')).toContainText('Саша');
  229 |   await page.screenshot({ path: test.info().outputPath('reaction-people-filter.png') });
  230 |   await page.goBack();
  231 |   await expect(people).not.toBeVisible();
  232 |   await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
  233 |   await expect(opener).toBeFocused();
  234 |   await expect(reaction).toHaveAttribute('aria-pressed', 'true');
  235 |   await reaction.click();
  236 |   await expect(reaction).toHaveCount(0);
  237 |   await row.getByTestId('message-actions').press('Enter');
  238 |   await expect(picker).toBeVisible();
  239 |   await page
  240 |     .locator('main#main > header')
  241 |     .getByRole('button', {
  242 |       name: 'Пригласить друзей',
  243 |       exact: true,
  244 |     })
  245 |     .click();
  246 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  247 |   await expect(share).toBeVisible();
  248 |   await expect(picker).toHaveCount(0);
  249 |   await page.keyboard.press('Escape');
  250 |   await expect(share).not.toBeVisible();
> 251 |   await expect(picker).toHaveCount(0);
      |                        ^ Error: expect(locator).toHaveCount(expected) failed
  252 |   await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
  253 | });
  254 | 
  255 | test('desktop chat actions stay modal over the conversation and restore the draft', async ({
  256 |   page,
  257 | }) => {
  258 |   await page.setViewportSize({ width: 1440, height: 1000 });
  259 |   await login(page, 'Саша');
  260 |   const { meeting } = await apiCreate(page, 'Модальные действия');
  261 |   await page.goto(`/meetings/${meeting.id}`);
  262 |   const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  263 |   await input.fill('Сохранённый черновик');
  264 | 
  265 |   for (const [label, title] of [
  266 |     ['Предложить дату', 'Предложить дату'],
  267 |     ['Предложить место', 'Предложить место'],
  268 |     ['Предложить задачу', 'Предложить задачу'],
  269 |   ] as const) {
  270 |     await page.getByRole('button', { name: 'Добавить к встрече', exact: true }).click();
  271 |     await page.getByRole('menuitem', { name: label, exact: true }).click();
  272 |     const dialog = page.getByRole('dialog', { name: title, exact: true });
  273 |     await expect(dialog).toBeVisible();
  274 |     await expect(page.locator('dialog:modal')).toHaveCount(1);
  275 |     await expect(page.locator('main#main')).toBeVisible();
  276 |     await expect(dialog.getByRole('button', { name: 'Назад', exact: true })).toHaveCount(
  277 |       0,
  278 |     );
  279 |     await page.keyboard.press('Escape');
  280 |     await expect(dialog).not.toBeVisible();
  281 |     await expect(input).toHaveValue('Сохранённый черновик');
  282 |     await expect(
  283 |       page.getByRole('button', { name: 'Добавить к встрече', exact: true }),
  284 |     ).toBeFocused();
  285 |   }
  286 | });
  287 | 
  288 | test('touch hold opens reactions and chip people without a second toggle; moving cancels a hold', async ({
  289 |   page,
  290 | }) => {
  291 |   await page.setViewportSize({ width: 390, height: 844 });
  292 |   await login(page, 'Саша');
  293 |   const { meeting } = await apiCreate(page, 'Удержание реакции');
  294 |   await page.goto(`/meetings/${meeting.id}`);
  295 |   await page.getByLabel('Сообщение', { exact: true }).fill('Принесу чай');
  296 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  297 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу чай' });
  298 |   const message = row.getByTestId('message-actions');
  299 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  300 |   await message.dispatchEvent('pointerdown', {
  301 |     pointerType: 'touch',
  302 |     clientX: 100,
  303 |     clientY: 100,
  304 |   });
  305 |   await expect(message).toHaveAttribute('data-pressing', 'true');
  306 |   await message.dispatchEvent('pointermove', {
  307 |     pointerType: 'touch',
  308 |     clientX: 100,
  309 |     clientY: 150,
  310 |   });
  311 |   await expect(message).toHaveAttribute('data-pressing', 'false');
  312 |   await page.waitForTimeout(500);
  313 |   await expect(picker).toHaveCount(0);
  314 |   await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  315 |   await message.dispatchEvent('pointerdown', {
  316 |     pointerType: 'touch',
  317 |     clientX: 100,
  318 |     clientY: 100,
  319 |   });
  320 |   await expect(picker).toBeVisible();
  321 |   await message.dispatchEvent('pointerup', { pointerType: 'touch' });
  322 |   await message.dispatchEvent('click');
  323 |   await picker.getByRole('button', { name: '❤️', exact: true }).click();
  324 |   const chip = row.getByRole('button', { name: '❤️: 1', exact: true });
  325 |   await expect(chip).toHaveAttribute('aria-pressed', 'true');
  326 | 
  327 |   for (const pickerOpen of [false, true]) {
  328 |     if (pickerOpen) {
  329 |       await message.press('Enter');
  330 |       await expect(picker).toBeVisible();
  331 |       await expect(picker.getByRole('button', { name: '❤️', exact: true })).toBeFocused();
  332 |     }
  333 | 
  334 |     await chip.dispatchEvent('pointerdown', {
  335 |       pointerType: 'touch',
  336 |       clientX: 100,
  337 |       clientY: 100,
  338 |     });
  339 |     const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
  340 |     await expect(people).toBeVisible();
  341 |     await chip.dispatchEvent('pointerup', { pointerType: 'touch' });
  342 |     await chip.dispatchEvent('click');
  343 |     await expect(picker).toHaveCount(0);
  344 |     await expect(
  345 |       people.getByRole('button', { name: 'Реакция ❤️', exact: true }),
  346 |     ).toHaveAttribute('aria-pressed', 'true');
  347 |     await page.keyboard.press('Escape');
  348 |     await expect(people).not.toBeVisible();
  349 |     await expect(chip).toBeFocused();
  350 |     await expect(chip).toHaveAttribute('aria-pressed', 'true');
  351 |   }
```