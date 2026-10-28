# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 33-chat-action-sheets.spec.ts >> mobile task details keep inline actions and require a reversible cancellation confirmation
- Location: frontend/web/tests/33-chat-action-sheets.spec.ts:465:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('dialog', { name: 'Принести настолку', exact: true }).getByText('Саша', { exact: true })
Expected: 2
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByRole('dialog', { name: 'Принести настолку', exact: true }).getByText('Саша', { exact: true }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Принести настолку', exact: true }).getByText('Саша', { exact: true })
    14 × locator resolved to 1 element
       - unexpected value "1"

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
      - button "Сведения о встрече «Контекст задачи»" [ref=f3e17] [cursor=pointer]:
        - heading "Контекст задачи" [level=1] [ref=f3e18]
        - generic [ref=f3e19]: 24 октября · 19:00 · 1 участник
      - button "Пригласить друзей" [ref=f3e21] [cursor=pointer]
      - button "Информация о встрече" [ref=f3e24] [cursor=pointer]
    - generic [ref=f3e28]:
      - list "Разговор встречи" [ref=f3e29]:
        - listitem [ref=f3e31]:
          - time [ref=f3e32]: Сегодня · 11:11
          - paragraph [ref=f3e33]: Саша создал встречу
        - listitem [ref=f3e35]:
          - region "Задача подготовки" [ref=f3e36]:
            - generic [ref=f3e37]:
              - generic [ref=f3e41]: Новая задача · Саша
              - time [ref=f3e42]: 11:11
            - button "Подробности задачи «Принести настолку»" [ref=f3e43] [cursor=pointer]:
              - strong [ref=f3e44]: Принести настолку
            - paragraph [ref=f3e47]: Исполняет Саша
            - button "Отметить выполненной" [ref=f3e50] [cursor=pointer]
          - dialog [ref=f3e51]:
            - generic [ref=f3e53]:
              - heading "Принести настолку" [level=2] [ref=f3e54]
              - button "Закрыть" [active] [ref=f3e55] [cursor=pointer]
            - generic [ref=f3e60]:
              - paragraph [ref=f3e61]: Исполняет Саша
              - generic [ref=f3e62]:
                - generic [ref=f3e63]:
                  - term [ref=f3e64]: Предложение от
                  - definition [ref=f3e65]:
                    - generic [aria-hidden] [ref=f3e66]: С
                    - text: Саша
                - generic [ref=f3e67]:
                  - term [ref=f3e68]: Исполняет
                  - definition [ref=f3e69]: Саша
                - generic [ref=f3e70]:
                  - term [ref=f3e71]: Создано
                  - definition [ref=f3e72]:
                    - time [ref=f3e73]: Сегодня, 11:11
              - paragraph [ref=f3e74]: После выполнения отметьте результат здесь или в чате.
              - generic [ref=f3e77]:
                - button "Отметить выполненной" [ref=f3e78] [cursor=pointer]
                - button "Отказаться от задачи" [ref=f3e79] [cursor=pointer]
                - button "Отменить задачу" [ref=f3e80] [cursor=pointer]
        - listitem [ref=f3e82]:
          - time [ref=f3e83]: Сегодня · 11:11
          - paragraph [ref=f3e84]: Задача принята · Саша · «Принести настолку»
      - generic [ref=f3e85]:
        - heading "Позовём остальных?" [level=2] [ref=f3e90]
        - paragraph [ref=f3e91]: Отправьте друзьям ссылку на встречу.После ответа «Приду» они появятся в чате.
        - button "Пригласить друзей" [ref=f3e92] [cursor=pointer]
    - generic [ref=f3e98]:
      - button "Добавить к встрече" [ref=f3e100] [cursor=pointer]
      - generic [ref=f3e103]:
        - generic [ref=f3e104]:
          - generic [ref=f3e105]: Сообщение
          - textbox "Сообщение" [ref=f3e106]:
            - /placeholder: Сообщение…
            - text: Обсудим задачу
        - button "Выбрать эмодзи" [ref=f3e107] [cursor=pointer]
      - button "Отправить сообщение" [ref=f3e113] [cursor=pointer]
```

# Test source

```ts
  398 |   await expect(
  399 |     info.getByRole('button', { name: 'Настройки встречи', exact: true }),
  400 |   ).toBeFocused();
  401 |   await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  402 |   await expect(open).toBeFocused();
  403 |   expect(await monitor.evaluate((value) => value.stop())).toBe(1);
  404 |   await monitor.dispose();
  405 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  406 |     'Черновик под сведениями',
  407 |   );
  408 |   await open.click();
  409 |   await info.getByRole('button', { name: 'Настройки встречи', exact: true }).click();
  410 |   await expect(edit.getByLabel('Название', { exact: true })).toHaveValue(
  411 |     'Сохраним позже',
  412 |   );
  413 |   await edit.getByRole('button', { name: 'Закрыть', exact: true }).click();
  414 |   await page.goto('/profile');
  415 |   await expect(
  416 |     page.getByRole('link', { name: 'Сообщить о проблеме', exact: true }),
  417 |   ).toBeVisible();
  418 | });
  419 | 
  420 | for (const width of [320, 390]) {
  421 |   test(`chat action keeps its heading and close button visible in a real ${width}x430 viewport`, async ({
  422 |     page,
  423 |   }) => {
  424 |     await page.setViewportSize({ width, height: 844 });
  425 |     await login(page, 'Саша');
  426 |     const { meeting } = await apiCreate(page, 'Длинная форма в низком окне');
  427 |     await page.goto(`/meetings/${meeting.id}`);
  428 |     await page.getByLabel('Сообщение', { exact: true }).fill('Обсудим после опроса');
  429 |     await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  430 |     await page.getByRole('menuitem', { name: 'Предложить дату', exact: true }).click();
  431 |     const sheet = page.getByRole('dialog', { name: 'Новая дата встречи', exact: true });
  432 |     await expect(sheet).toHaveAttribute('data-motion', 'open');
  433 |     await page.setViewportSize({ width, height: 430 });
  434 |     const heading = sheet.getByRole('heading', {
  435 |       name: 'Новая дата встречи',
  436 |       exact: true,
  437 |     });
  438 | 
  439 |     const close = sheet.getByRole('button', { name: 'Закрыть', exact: true });
  440 |     const content = sheet.getByTestId('poll-form-scroll');
  441 |     const submit = sheet.getByRole('button', { name: 'Создать опрос', exact: true });
  442 |     await expect(close).toBeInViewport({ ratio: 1 });
  443 |     const headingTop = (await heading.boundingBox())?.y;
  444 |     await expect(submit).toBeInViewport({ ratio: 1 });
  445 |     const footerTop = (await submit.boundingBox())?.y;
  446 |     await sheet
  447 |       .getByRole('textbox', { name: 'Время', exact: true })
  448 |       .scrollIntoViewIfNeeded();
  449 |     expect(await content.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  450 |     expect((await submit.boundingBox())?.y).toBe(footerTop);
  451 |     await expect(submit).toBeInViewport({ ratio: 1 });
  452 |     await expect(close).toBeInViewport({ ratio: 1 });
  453 |     await expect(heading).toBeInViewport({ ratio: 1 });
  454 |     expect((await heading.boundingBox())?.y).toBe(headingTop);
  455 |     expect(await sheet.evaluate((node) => node.scrollTop)).toBe(0);
  456 |     expect(await sheet.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(width);
  457 |     await close.click();
  458 |     await expect(sheet).not.toBeVisible();
  459 |     await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  460 |       'Обсудим после опроса',
  461 |     );
  462 |   });
  463 | }
  464 | 
  465 | test('mobile task details keep inline actions and require a reversible cancellation confirmation', async ({
  466 |   page,
  467 | }) => {
  468 |   await page.setViewportSize({ width: 390, height: 844 });
  469 |   await login(page, 'Саша');
  470 |   const { meeting } = await apiCreate(page, 'Контекст задачи');
  471 |   await page.goto(`/meetings/${meeting.id}`);
  472 |   const composer = page.getByLabel('Сообщение', { exact: true });
  473 |   await composer.fill('Обсудим задачу');
  474 |   await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  475 |   await page.getByRole('menuitem', { name: 'Предложить задачу', exact: true }).click();
  476 |   const form = actionSurface(page, 'Предложить задачу');
  477 |   await form.getByLabel('Что сделать').fill('Принести настолку');
  478 |   await form.getByRole('button', { name: 'Предложить задачу', exact: true }).click();
  479 |   await expect(form).not.toBeVisible();
  480 |   const card = page.getByRole('region', { name: 'Задача подготовки' });
  481 |   await card.getByRole('button', { name: 'Взять на себя', exact: true }).click();
  482 |   await expect(
  483 |     card.getByRole('button', { name: 'Отметить выполненной', exact: true }),
  484 |   ).toBeVisible();
  485 |   const opener = card.getByRole('button', {
  486 |     name: 'Подробности задачи «Принести настолку»',
  487 |     exact: true,
  488 |   });
  489 | 
  490 |   await opener.click();
  491 |   const details = page.getByRole('dialog', { name: 'Принести настолку', exact: true });
  492 |   await expect(
  493 |     details.getByRole('heading', { name: 'Принести настолку', exact: true }),
  494 |   ).toHaveCount(1);
  495 |   await expect(details.getByText('Исполняет Саша', { exact: true })).toHaveCount(1);
  496 |   await expect(details.getByText('Контекст задачи', { exact: true })).toHaveCount(0);
  497 |   await expect(details.getByText('Предложение от', { exact: true })).toBeVisible();
> 498 |   await expect(details.getByText('Саша', { exact: true })).toHaveCount(2);
      |                                                            ^ Error: expect(locator).toHaveCount(expected) failed
  499 |   await details.getByRole('button', { name: 'Отменить задачу', exact: true }).click();
  500 |   const confirmation = page.getByRole('dialog', {
  501 |     name: 'Отменить задачу?',
  502 |     exact: true,
  503 |   });
  504 | 
  505 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  506 |   await expect(confirmation).toContainText('Задача останется в истории');
  507 |   await confirmation
  508 |     .getByRole('button', { name: 'Оставить как есть', exact: true })
  509 |     .click();
  510 |   await expect(
  511 |     details.getByRole('button', { name: 'Отменить задачу', exact: true }),
  512 |   ).toBeFocused();
  513 |   await expect(details.getByText('Исполняет Саша', { exact: true })).toBeVisible();
  514 |   await details.getByRole('button', { name: 'Отменить задачу', exact: true }).click();
  515 |   await confirmation
  516 |     .getByRole('button', { name: 'Отменить задачу', exact: true })
  517 |     .click();
  518 |   await expect(details.getByText('Отменено', { exact: true })).toBeVisible();
  519 |   await expect(
  520 |     details.getByRole('button', {
  521 |       name: /Отметить выполненной|Отказаться|Отменить задачу/,
  522 |     }),
  523 |   ).toHaveCount(0);
  524 |   await expect
  525 |     .poll(() => details.evaluate((node) => node.contains(document.activeElement)))
  526 |     .toBe(true);
  527 |   await details.getByRole('button', { name: 'Закрыть', exact: true }).click();
  528 |   await expect(opener).toBeFocused();
  529 |   await expect(card.getByText('Отменено', { exact: true })).toBeVisible();
  530 |   await expect(composer).toHaveValue('Обсудим задачу');
  531 | });
  532 | 
```