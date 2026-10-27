# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 33-chat-action-sheets.spec.ts >> meeting information shares in one sheet, excludes service links and keeps an edit draft
- Location: tests/33-chat-action-sheets.spec.ts:297:1

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Информация о встрече' }) resolved to 2 elements:
    1) <button type="button" data-narrow="true" class="_heading_1e1ug_23" data-chat-surface-trigger="true" aria-label="Сведения о встрече «Информация о встрече»">…</button> aka getByRole('button', { name: 'Сведения о встрече «Информация о встрече»' })
    2) <button type="button" data-chat-surface-trigger="true" aria-label="Информация о встрече" class="_icon_w1kid_20 _ghost_w1kid_15">…</button> aka getByRole('button', { name: 'Информация о встрече', exact: true })

Call log:
  - waiting for getByRole('button', { name: 'Информация о встрече' })

```

# Page snapshot

```yaml
- generic [ref=f3e3]:
  - link "К содержимому" [ref=f3e4] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=f3e5]: Демостенд · данные хранятся до перезапуска
  - main [ref=f3e8]:
    - generic [ref=f3e9]:
      - link "К моим встречам" [ref=f3e10] [cursor=pointer]:
        - /url: /meetings
      - button "Сведения о встрече «Информация о встрече»" [ref=f3e16] [cursor=pointer]:
        - heading "Информация о встрече" [level=1] [ref=f3e17]
        - generic [ref=f3e18]: 1 участник · 24 октября · 19:00
      - button "Информация о встрече" [ref=f3e19] [cursor=pointer]
    - generic [ref=f3e24]:
      - list "Разговор встречи" [ref=f3e25]:
        - listitem [ref=f3e26]:
          - time [ref=f3e27]: Сегодня · 15:33
          - paragraph [ref=f3e28]: Саша создал встречу
        - listitem [ref=f3e29]:
          - time [ref=f3e30]: Сегодня · 15:33
          - paragraph [ref=f3e31]: Саша изменил описание
      - generic [ref=f3e32]:
        - heading "Позовём остальных?" [level=2] [ref=f3e37]
        - paragraph [ref=f3e38]: Отправьте друзьям ссылку на встречу.После ответа «Приду» они появятся в чате.
        - button "Пригласить друзей" [ref=f3e39] [cursor=pointer]
    - generic [ref=f3e46]:
      - button "Добавить к встрече" [ref=f3e48] [cursor=pointer]
      - generic [ref=f3e50]:
        - generic [ref=f3e51]:
          - generic [ref=f3e52]: Сообщение
          - textbox "Сообщение" [active] [ref=f3e53]:
            - /placeholder: Сообщение…
            - text: Черновик под сведениями
        - button "Выбрать эмодзи" [ref=f3e54] [cursor=pointer]
      - button "Отправить сообщение" [ref=f3e58] [cursor=pointer]
```

# Test source

```ts
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
  285 |   await expect(sheet.getByRole('button', { name: 'Назад', exact: true })).toBeVisible();
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
  314 |   const open = page.getByRole('button', { name: 'Информация о встрече' });
> 315 |   await open.click();
      |              ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Информация о встрече' }) resolved to 2 elements:
  316 |   const info = page.getByRole('dialog', { name: meeting.title, exact: true });
  317 |   await expect(
  318 |     info.getByRole('heading', { name: meeting.title, exact: true }),
  319 |   ).toBeVisible();
  320 |   const monitor = await page.evaluateHandle(() => {
  321 |     let maximum = document.querySelectorAll('dialog:modal').length;
  322 |     const observer = new MutationObserver(() => {
  323 |       maximum = Math.max(maximum, document.querySelectorAll('dialog:modal').length);
  324 |     });
  325 | 
  326 |     observer.observe(document.body, {
  327 |       subtree: true,
  328 |       attributes: true,
  329 |       attributeFilter: ['open'],
  330 |     });
  331 | 
  332 |     return {
  333 |       stop: () => {
  334 |         observer.disconnect();
  335 | 
  336 |         return maximum;
  337 |       },
  338 |     };
  339 |   });
  340 | 
  341 |   await expect(
  342 |     info.getByRole('link', {
  343 |       name: /Помощь|Сообщить|О somewhere|Политика|Cookie|Версия/,
  344 |     }),
  345 |   ).toHaveCount(0);
  346 |   const invite = info.getByRole('button', { name: 'Пригласить друзей', exact: true });
  347 |   await invite.scrollIntoViewIfNeeded();
  348 |   expect(
  349 |     await info.getByTestId('meeting-info-scroll').evaluate((node) => node.scrollTop),
  350 |   ).toBeGreaterThan(0);
  351 |   await expect(info.getByRole('button', { name: 'Закрыть', exact: true })).toBeInViewport(
  352 |     { ratio: 1 },
  353 |   );
  354 |   await invite.click();
  355 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  356 |   await expect(info).not.toBeVisible();
  357 |   await expect(share).toHaveAttribute('data-motion', 'open');
  358 |   await expect(share.getByLabel('Ссылка приглашения')).toHaveValue(invitation_url);
  359 |   await expect
  360 |     .poll(() => share.evaluate((node) => node.contains(document.activeElement)))
  361 |     .toBe(true);
  362 |   await share.getByRole('button', { name: 'Закрыть', exact: true }).click();
  363 |   await expect(share).not.toBeVisible();
  364 |   await expect(info).toHaveAttribute('data-motion', 'open');
  365 |   await expect
  366 |     .poll(() => info.evaluate((node) => node.contains(document.activeElement)))
  367 |     .toBe(true);
  368 |   await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  369 |   await expect(info).not.toBeVisible();
  370 |   await expect(open).toBeFocused();
  371 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  372 |     'Черновик под сведениями',
  373 |   );
  374 |   await open.click();
  375 |   await info.getByRole('button', { name: 'Настройки встречи', exact: true }).click();
  376 |   const edit = page.getByRole('dialog', { name: 'Настройки встречи' });
  377 |   await edit.getByLabel('Название', { exact: true }).fill('Сохраним позже');
  378 |   await edit.getByRole('button', { name: 'Закрыть', exact: true }).click();
  379 |   await expect(info).toBeVisible();
  380 |   await expect(
  381 |     info.getByRole('button', { name: 'Настройки встречи', exact: true }),
  382 |   ).toBeFocused();
  383 |   await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  384 |   await expect(open).toBeFocused();
  385 |   expect(await monitor.evaluate((value) => value.stop())).toBe(1);
  386 |   await monitor.dispose();
  387 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  388 |     'Черновик под сведениями',
  389 |   );
  390 |   await open.click();
  391 |   await info.getByRole('button', { name: 'Настройки встречи', exact: true }).click();
  392 |   await expect(edit.getByLabel('Название', { exact: true })).toHaveValue(
  393 |     'Сохраним позже',
  394 |   );
  395 |   await edit.getByRole('button', { name: 'Закрыть', exact: true }).click();
  396 |   await page.goto('/profile');
  397 |   await expect(
  398 |     page.getByRole('link', { name: 'Сообщить о проблеме', exact: true }),
  399 |   ).toBeVisible();
  400 | });
  401 | 
  402 | for (const width of [320, 390]) {
  403 |   test(`chat action keeps its heading and close button visible in a real ${width}x430 viewport`, async ({
  404 |     page,
  405 |   }) => {
  406 |     await page.setViewportSize({ width, height: 844 });
  407 |     await login(page, 'Саша');
  408 |     const { meeting } = await apiCreate(page, 'Длинная форма в низком окне');
  409 |     await page.goto(`/meetings/${meeting.id}`);
  410 |     await page.getByLabel('Сообщение', { exact: true }).fill('Обсудим после опроса');
  411 |     await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  412 |     await page.getByRole('menuitem', { name: 'Предложить дату', exact: true }).click();
  413 |     const sheet = page.getByRole('dialog', { name: 'Предложить дату', exact: true });
  414 |     await expect(sheet).toHaveAttribute('data-motion', 'open');
  415 |     await page.setViewportSize({ width, height: 430 });
```