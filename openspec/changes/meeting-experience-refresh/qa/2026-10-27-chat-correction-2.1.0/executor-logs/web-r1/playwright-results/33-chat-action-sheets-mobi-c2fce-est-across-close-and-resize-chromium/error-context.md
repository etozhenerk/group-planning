# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 33-chat-action-sheets.spec.ts >> mobile task sheet preserves an uncertain request across close and resize
- Location: tests/33-chat-action-sheets.spec.ts:237:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('main', { name: 'Предложить задачу', exact: true }).or(getByRole('dialog', { name: 'Предложить задачу', exact: true })).getByRole('button', { name: 'Назад', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('main', { name: 'Предложить задачу', exact: true }).or(getByRole('dialog', { name: 'Предложить задачу', exact: true })).getByRole('button', { name: 'Назад', exact: true }) with timeout 5000ms
  - waiting for getByRole('main', { name: 'Предложить задачу', exact: true }).or(getByRole('dialog', { name: 'Предложить задачу', exact: true })).getByRole('button', { name: 'Назад', exact: true })

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
  - heading "Задача без потери контекста" [level=1]
  - paragraph: 1 участник · 24 октября · 19:00
  - button "Пригласить друзей"
  - button "Информация о встрече"
  - list "Разговор встречи":
    - listitem:
      - time: Сегодня · 19:30
      - paragraph: Саша создал встречу
    - listitem:
      - region "Задача подготовки":
        - text: Новая задача · Саша
        - time: 19:30
        - button "Подробности задачи «Принести настолку»":
          - strong: Принести настолку
        - paragraph: Пока никто не взял задачу
        - button "Взять на себя"
  - heading "Позовём остальных?" [level=2]
  - paragraph: Отправьте друзьям ссылку на встречу. После ответа «Приду» они появятся в чате.
  - button "Пригласить друзей"
  - button "Добавить к встрече"
  - text: Сообщение
  - textbox "Сообщение":
    - /placeholder: Сообщение…
    - text: Обсудим после
  - button "Выбрать эмодзи"
  - button "Отправить сообщение"
- dialog "Предложить задачу":
  - heading "Предложить задачу" [level=2]
  - button "Закрыть"
  - text: Что сделать
  - textbox "Что сделать" [disabled]: Принести настолку
  - text: Кому предложить
  - combobox "Кому предложить" [disabled]:
    - option "Любому участнику" [selected]
    - option "Вы"
  - alert: Не удалось предложить задачу. Повторите отправку.
  - button "Повторить отправку"
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
  185 | 
  186 |     for (const input of await inputs.all()) {
  187 |       await expect(input).toBeDisabled();
  188 |     }
  189 | 
  190 |     if (kind === 'date') {
  191 |       const dates = form.getByRole('button', { name: /^(Вариант \d+|Дата)$/ });
  192 |       await expect(dates).toHaveCount(3);
  193 | 
  194 |       for (const date of await dates.all()) {
  195 |         await expect(date).toBeDisabled();
  196 |       }
  197 |     }
  198 | 
  199 |     if (kind === 'date') {
  200 |       await expect(
  201 |         sheet.getByRole('button', { name: 'Добавить вариант', exact: true }),
  202 |       ).toBeDisabled();
  203 |     }
  204 | 
  205 |     await sheet.getByRole('button', { name: 'Закрыть', exact: true }).click();
  206 |     await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  207 |     await page.getByRole('menuitem', { name: title, exact: true }).click();
  208 | 
  209 |     for (const input of await inputs.all()) {
  210 |       await expect(input).toBeDisabled();
  211 |     }
  212 | 
  213 |     if (kind === 'date') {
  214 |       const dates = form.getByRole('button', { name: /^(Вариант \d+|Дата)$/ });
  215 |       await expect(dates).toHaveCount(3);
  216 | 
  217 |       for (const date of await dates.all()) {
  218 |         await expect(date).toBeDisabled();
  219 |       }
  220 |     }
  221 | 
  222 |     await retry.click();
  223 |     await expect(sheet).not.toBeVisible();
  224 |     expect(keys).toHaveLength(2);
  225 |     expect(keys[0]).toBeTruthy();
  226 |     expect(keys[1]).toBe(keys[0]);
  227 |     expect(bodies[1]).toBe(bodies[0]);
  228 |     expect(ids[1]).toBe(ids[0]);
  229 |     await expect(
  230 |       page.getByRole('region', {
  231 |         name: kind === 'date' ? 'Опрос о дате' : 'Опрос о месте',
  232 |       }),
  233 |     ).toHaveCount(1);
  234 |   });
  235 | }
  236 | 
  237 | test('mobile task sheet preserves an uncertain request across close and resize', async ({
  238 |   page,
  239 | }) => {
  240 |   await page.setViewportSize({ width: 390, height: 844 });
  241 |   await login(page, 'Саша');
  242 |   const { meeting } = await apiCreate(page, 'Задача без потери контекста');
  243 |   await page.goto(`/meetings/${meeting.id}`);
  244 |   await page.getByLabel('Сообщение', { exact: true }).fill('Обсудим после');
  245 |   const keys: string[] = [];
  246 |   const bodies: string[] = [];
  247 |   await page.route(
  248 |     `**/api/v1/meetings/${meeting.id}/preparation-tasks`,
  249 |     async (route) => {
  250 |       if (route.request().method() !== 'POST') {
  251 |         await route.continue();
  252 | 
  253 |         return;
  254 |       }
  255 | 
  256 |       keys.push(route.request().headers()['idempotency-key'] ?? '');
  257 |       bodies.push(route.request().postData() ?? '');
  258 |       const response = await route.fetch();
  259 | 
  260 |       if (keys.length === 1) {
  261 |         await route.abort('failed');
  262 |       } else {
  263 |         await route.fulfill({ response });
  264 |       }
  265 |     },
  266 |   );
  267 |   await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  268 |   await page.getByRole('menuitem', { name: 'Предложить задачу', exact: true }).click();
  269 |   const sheet = actionSurface(page, 'Предложить задачу');
  270 |   await expect(page.getByRole('dialog', { name: 'Предложить задачу' })).toBeVisible();
  271 |   await expect(page.locator('main#main')).toBeVisible();
  272 |   await expect(sheet.getByRole('button', { name: 'Назад' })).toHaveCount(0);
  273 |   await sheet.getByLabel('Что сделать').fill('Принести настолку');
  274 |   await sheet.getByRole('button', { name: 'Предложить задачу', exact: true }).click();
  275 |   await expect(sheet.getByRole('button', { name: 'Повторить отправку' })).toBeVisible();
  276 |   await sheet.getByRole('button', { name: 'Закрыть', exact: true }).click();
  277 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  278 |     'Обсудим после',
  279 |   );
  280 |   await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  281 |   await page.getByRole('menuitem', { name: 'Предложить задачу', exact: true }).click();
  282 |   await expect(sheet.getByLabel('Что сделать')).toHaveValue('Принести настолку');
  283 |   await page.setViewportSize({ width: 1440, height: 1000 });
  284 |   await expect(sheet.getByLabel('Что сделать')).toHaveValue('Принести настолку');
> 285 |   await expect(sheet.getByRole('button', { name: 'Назад', exact: true })).toBeVisible();
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
  286 |   await sheet.getByRole('button', { name: 'Повторить отправку' }).click();
  287 |   await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  288 |   expect(keys).toHaveLength(2);
  289 |   expect(keys[0]).toBeTruthy();
  290 |   expect(keys[0]).toBe(keys[1]);
  291 |   expect(bodies[0]).toBe(bodies[1]);
  292 |   await expect(
  293 |     page.getByRole('heading', { name: 'Принести настолку', exact: true }),
  294 |   ).toHaveCount(1);
  295 | });
  296 | 
  297 | test('meeting information shares in one sheet, excludes service links and keeps an edit draft', async ({
  298 |   page,
  299 | }) => {
  300 |   await page.setViewportSize({ width: 320, height: 844 });
  301 |   await login(page, 'Саша');
  302 |   const { meeting, invitation_url } = await apiCreate(page, 'Информация о встрече');
  303 |   const changed = await page.request.patch(`/api/v1/meetings/${meeting.id}`, {
  304 |     headers: await writeHeaders(page),
  305 |     data: {
  306 |       expected_revision: meeting.revision,
  307 |       description: 'Собираемся вечером, подробности обсудим в чате. '.repeat(30),
  308 |     },
  309 |   });
  310 | 
  311 |   expect(changed.ok()).toBe(true);
  312 |   await page.goto(`/meetings/${meeting.id}`);
  313 |   await page.getByLabel('Сообщение', { exact: true }).fill('Черновик под сведениями');
  314 |   const open = page.getByRole('button', {
  315 |     name: 'Информация о встрече',
  316 |     exact: true,
  317 |   });
  318 | 
  319 |   await open.click();
  320 |   const info = page.getByRole('dialog', { name: meeting.title, exact: true });
  321 |   await expect(
  322 |     info.getByRole('heading', { name: meeting.title, exact: true }),
  323 |   ).toBeVisible();
  324 |   const monitor = await page.evaluateHandle(() => {
  325 |     let maximum = document.querySelectorAll('dialog:modal').length;
  326 |     const observer = new MutationObserver(() => {
  327 |       maximum = Math.max(maximum, document.querySelectorAll('dialog:modal').length);
  328 |     });
  329 | 
  330 |     observer.observe(document.body, {
  331 |       subtree: true,
  332 |       attributes: true,
  333 |       attributeFilter: ['open'],
  334 |     });
  335 | 
  336 |     return {
  337 |       stop: () => {
  338 |         observer.disconnect();
  339 | 
  340 |         return maximum;
  341 |       },
  342 |     };
  343 |   });
  344 | 
  345 |   await expect(
  346 |     info.getByRole('link', {
  347 |       name: /Помощь|Сообщить|О somewhere|Политика|Cookie|Версия/,
  348 |     }),
  349 |   ).toHaveCount(0);
  350 |   const invite = info.getByRole('button', { name: 'Пригласить друзей', exact: true });
  351 |   await invite.scrollIntoViewIfNeeded();
  352 |   expect(
  353 |     await info.getByTestId('meeting-info-scroll').evaluate((node) => node.scrollTop),
  354 |   ).toBeGreaterThan(0);
  355 |   await expect(info.getByRole('button', { name: 'Закрыть', exact: true })).toBeInViewport(
  356 |     { ratio: 1 },
  357 |   );
  358 |   await invite.click();
  359 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  360 |   await expect(info).not.toBeVisible();
  361 |   await expect(share).toHaveAttribute('data-motion', 'open');
  362 |   await expect(share.getByLabel('Ссылка приглашения')).toHaveValue(invitation_url);
  363 |   await expect
  364 |     .poll(() => share.evaluate((node) => node.contains(document.activeElement)))
  365 |     .toBe(true);
  366 |   await share.getByRole('button', { name: 'Закрыть', exact: true }).click();
  367 |   await expect(share).not.toBeVisible();
  368 |   await expect(info).toHaveAttribute('data-motion', 'open');
  369 |   await expect
  370 |     .poll(() => info.evaluate((node) => node.contains(document.activeElement)))
  371 |     .toBe(true);
  372 |   await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  373 |   await expect(info).not.toBeVisible();
  374 |   await expect(open).toBeFocused();
  375 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  376 |     'Черновик под сведениями',
  377 |   );
  378 |   await open.click();
  379 |   await info.getByRole('button', { name: 'Настройки встречи', exact: true }).click();
  380 |   const edit = page.getByRole('dialog', { name: 'Настройки встречи' });
  381 |   await edit.getByLabel('Название', { exact: true }).fill('Сохраним позже');
  382 |   await edit.getByRole('button', { name: 'Закрыть', exact: true }).click();
  383 |   await expect(info).toBeVisible();
  384 |   await expect(
  385 |     info.getByRole('button', { name: 'Настройки встречи', exact: true }),
```