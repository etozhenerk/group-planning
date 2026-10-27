# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 34-telegram-chat.spec.ts >> reaction people replace the picker and browser Back returns to the same message
- Location: tests/34-telegram-chat.spec.ts:198:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: 'Кто отреагировал', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'Кто отреагировал', exact: true }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Кто отреагировал', exact: true })

```

```yaml
- link "К содержимому":
  - /url: "#main"
- text: Демостенд · данные хранятся до перезапуска
- main:
  - link "К моим встречам":
    - /url: /meetings
  - button "Сведения о встрече «Люди и реакции»":
    - heading "Люди и реакции" [level=1]
    - text: 24 октября · 19:00 · 1 участник
  - button "Пригласить друзей"
  - button "Информация о встрече"
  - list "Разговор встречи":
    - listitem:
      - time: Сегодня · 15:53
      - paragraph: Саша создал встречу
    - listitem:
      - strong: Саша
      - time: 15:53
      - paragraph: Беру настолки
      - 'button "❤️: 1" [pressed]': ❤️ 1
      - button "Добавить реакцию"
      - button "Кто отреагировал"
  - button "Добавить к встрече"
  - text: Сообщение
  - textbox "Сообщение":
    - /placeholder: Сообщение…
  - button "Выбрать эмодзи"
  - button "Отправить сообщение" [disabled]
```

# Test source

```ts
  119 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  120 |   await settings.getByLabel('Название', { exact: true }).fill('Несохранённое название');
  121 |   await expect(settings.getByLabel('Название', { exact: true })).toHaveCSS(
  122 |     'font-size',
  123 |     '16px',
  124 |   );
  125 |   await page.screenshot({ path: test.info().outputPath('meeting-settings-draft.png') });
  126 |   await page.goBack();
  127 |   await expect(info).toBeVisible();
  128 |   await expect(info.getByRole('button', { name: 'Настройки встречи' })).toBeFocused();
  129 |   await info.getByRole('button', { name: 'Настройки встречи' }).click();
  130 |   await expect(settings.getByLabel('Название', { exact: true })).toHaveValue(
  131 |     'Несохранённое название',
  132 |   );
  133 |   await settings.getByRole('button', { name: 'Закрыть', exact: true }).click();
  134 |   await info.getByRole('button', { name: 'Пригласить друзей' }).click();
  135 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  136 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  137 |   await share.getByRole('button', { name: 'Закрыть', exact: true }).click();
  138 |   await expect(info).toBeVisible();
  139 |   await expect(info.getByRole('button', { name: 'Пригласить друзей' })).toBeFocused();
  140 |   await page.screenshot({ path: test.info().outputPath('meeting-info-return.png') });
  141 |   await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  142 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  143 |     'Черновик сообщения',
  144 |   );
  145 | });
  146 | 
  147 | test('opening the emoji dock preserves the reading position and the new-message action stays above it', async ({
  148 |   page,
  149 | }) => {
  150 |   await page.setViewportSize({ width: 390, height: 844 });
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
  208 |   await row.getByRole('button', { name: 'Добавить реакцию' }).click();
  209 |   const picker = page.getByRole('dialog', { name: 'Реакция', exact: true });
  210 |   await picker.getByRole('button', { name: '❤️', exact: true }).click();
  211 |   const reaction = row.getByRole('button', { name: '❤️: 1', exact: true });
  212 |   await expect(reaction).toHaveAttribute('aria-pressed', 'true');
  213 |   await expect(picker).toHaveCount(0);
  214 |   await row.getByRole('button', { name: 'Добавить реакцию' }).click();
  215 |   await expect(picker).toBeVisible();
  216 |   const opener = row.getByRole('button', { name: 'Кто отреагировал', exact: true });
  217 |   await opener.click();
  218 |   const people = page.getByRole('dialog', { name: 'Кто отреагировал', exact: true });
> 219 |   await expect(people).toBeVisible();
      |                        ^ Error: expect(locator).toBeVisible() failed
  220 |   await expect(picker).toHaveCount(0);
  221 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  222 |   const filter = people.getByRole('button', { name: 'Реакция ❤️', exact: true });
  223 |   await filter.click();
  224 |   await expect(filter).toHaveAttribute('aria-pressed', 'true');
  225 |   await expect(filter).toBeFocused();
  226 |   await expect(people.getByRole('list')).toContainText('Саша');
  227 |   await page.screenshot({ path: test.info().outputPath('reaction-people-filter.png') });
  228 |   await page.goBack();
  229 |   await expect(people).not.toBeVisible();
  230 |   await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
  231 |   await expect(opener).toBeFocused();
  232 |   await expect(reaction).toHaveAttribute('aria-pressed', 'true');
  233 |   await reaction.click();
  234 |   await expect(reaction).toHaveCount(0);
  235 |   await row.getByRole('button', { name: 'Добавить реакцию' }).click();
  236 |   await expect(picker).toBeVisible();
  237 |   await page
  238 |     .locator('main#main > header')
  239 |     .getByRole('button', {
  240 |       name: 'Пригласить друзей',
  241 |       exact: true,
  242 |     })
  243 |     .click();
  244 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  245 |   await expect(share).toBeVisible();
  246 |   await expect(picker).toHaveCount(0);
  247 |   await page.keyboard.press('Escape');
  248 |   await expect(share).not.toBeVisible();
  249 |   await expect(page).toHaveURL(new RegExp(`/meetings/${meeting.id}$`));
  250 | });
  251 | 
```