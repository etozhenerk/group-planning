# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 33-chat-action-sheets.spec.ts >> chat action keeps its heading and close button visible in a real 320x430 viewport
- Location: tests/33-chat-action-sheets.spec.ts:370:3

# Error details

```
Error: expect(locator).toBeInViewport() failed

Locator:  getByRole('dialog', { name: 'Предложить дату', exact: true }).getByRole('button', { name: 'Создать опрос', exact: true })
Expected: in viewport
Received: viewport ratio 0.9971910119056702
Timeout:  5000ms

Call log:
  - Expect "toBeInViewport" getByRole('dialog', { name: 'Предложить дату', exact: true }).getByRole('button', { name: 'Создать опрос', exact: true }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Предложить дату', exact: true }).getByRole('button', { name: 'Создать опрос', exact: true })
    14 × locator resolved to <button type="submit" aria-busy="false" aria-label="Создать опрос">Создать опрос</button>
       - unexpected value "viewport ratio 0.9971910119056702"

```

```yaml
- button "Создать опрос"
```

# Test source

```ts
  291 |     info.getByRole('heading', { name: meeting.title, exact: true }),
  292 |   ).toBeVisible();
  293 |   const monitor = await page.evaluateHandle(() => {
  294 |     let maximum = document.querySelectorAll('dialog:modal').length;
  295 |     const observer = new MutationObserver(() => {
  296 |       maximum = Math.max(maximum, document.querySelectorAll('dialog:modal').length);
  297 |     });
  298 | 
  299 |     observer.observe(document.body, {
  300 |       subtree: true,
  301 |       attributes: true,
  302 |       attributeFilter: ['open'],
  303 |     });
  304 | 
  305 |     return {
  306 |       stop: () => {
  307 |         observer.disconnect();
  308 | 
  309 |         return maximum;
  310 |       },
  311 |     };
  312 |   });
  313 | 
  314 |   await expect(
  315 |     info.getByRole('link', {
  316 |       name: /Помощь|Сообщить|О somewhere|Политика|Cookie|Версия/,
  317 |     }),
  318 |   ).toHaveCount(0);
  319 |   const invite = info.getByRole('button', { name: 'Пригласить друзей', exact: true });
  320 |   await invite.scrollIntoViewIfNeeded();
  321 |   expect(
  322 |     await info.getByTestId('dialog-content').evaluate((node) => node.scrollTop),
  323 |   ).toBeGreaterThan(0);
  324 |   await expect(info.getByRole('button', { name: 'Закрыть', exact: true })).toBeInViewport(
  325 |     { ratio: 1 },
  326 |   );
  327 |   await invite.click();
  328 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  329 |   await expect(info).not.toBeVisible();
  330 |   await expect(share).toHaveAttribute('data-motion', 'open');
  331 |   await expect(share.getByLabel('Ссылка приглашения')).toHaveValue(invitation_url);
  332 |   await expect
  333 |     .poll(() => share.evaluate((node) => node.contains(document.activeElement)))
  334 |     .toBe(true);
  335 |   await share.getByRole('button', { name: 'Закрыть', exact: true }).click();
  336 |   await expect(share).not.toBeVisible();
  337 |   await expect(info).toHaveAttribute('data-motion', 'open');
  338 |   await expect
  339 |     .poll(() => info.evaluate((node) => node.contains(document.activeElement)))
  340 |     .toBe(true);
  341 |   await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  342 |   await expect(info).not.toBeVisible();
  343 |   await expect(open).toBeFocused();
  344 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  345 |     'Черновик под сведениями',
  346 |   );
  347 |   await open.click();
  348 |   await info.getByRole('button', { name: 'Изменить настройки' }).click();
  349 |   const edit = page.getByRole('dialog', { name: 'Настройки встречи' });
  350 |   await edit.getByLabel('Название', { exact: true }).fill('Сохраним позже');
  351 |   await edit.getByRole('button', { name: 'Закрыть', exact: true }).click();
  352 |   expect(await monitor.evaluate((value) => value.stop())).toBe(1);
  353 |   await monitor.dispose();
  354 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  355 |     'Черновик под сведениями',
  356 |   );
  357 |   await open.click();
  358 |   await info.getByRole('button', { name: 'Изменить настройки' }).click();
  359 |   await expect(edit.getByLabel('Название', { exact: true })).toHaveValue(
  360 |     'Сохраним позже',
  361 |   );
  362 |   await edit.getByRole('button', { name: 'Закрыть', exact: true }).click();
  363 |   await page.goto('/profile');
  364 |   await expect(
  365 |     page.getByRole('link', { name: 'Сообщить о проблеме', exact: true }),
  366 |   ).toBeVisible();
  367 | });
  368 | 
  369 | for (const width of [320, 390]) {
  370 |   test(`chat action keeps its heading and close button visible in a real ${width}x430 viewport`, async ({
  371 |     page,
  372 |   }) => {
  373 |     await page.setViewportSize({ width, height: 844 });
  374 |     await login(page, 'Саша');
  375 |     const { meeting } = await apiCreate(page, 'Длинная форма в низком окне');
  376 |     await page.goto(`/meetings/${meeting.id}`);
  377 |     await page.getByLabel('Сообщение', { exact: true }).fill('Обсудим после опроса');
  378 |     await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  379 |     await page.getByRole('menuitem', { name: 'Предложить дату', exact: true }).click();
  380 |     const sheet = page.getByRole('dialog', { name: 'Предложить дату', exact: true });
  381 |     await expect(sheet).toHaveAttribute('data-motion', 'open');
  382 |     await page.setViewportSize({ width, height: 430 });
  383 |     const heading = sheet.getByRole('heading', { name: 'Предложить дату', exact: true });
  384 |     const close = sheet.getByRole('button', { name: 'Закрыть', exact: true });
  385 |     const content = sheet.getByTestId('dialog-content');
  386 |     const submit = sheet.getByRole('button', { name: 'Создать опрос', exact: true });
  387 |     await expect(close).toBeInViewport({ ratio: 1 });
  388 |     const headingTop = (await heading.boundingBox())?.y;
  389 |     await submit.scrollIntoViewIfNeeded();
  390 |     expect(await content.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
> 391 |     await expect(submit).toBeInViewport({ ratio: 1 });
      |                          ^ Error: expect(locator).toBeInViewport() failed
  392 |     await expect(close).toBeInViewport({ ratio: 1 });
  393 |     await expect(heading).toBeInViewport({ ratio: 1 });
  394 |     expect((await heading.boundingBox())?.y).toBe(headingTop);
  395 |     expect(await sheet.evaluate((node) => node.scrollTop)).toBe(0);
  396 |     expect(await sheet.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(width);
  397 |     await close.click();
  398 |     await expect(sheet).not.toBeVisible();
  399 |     await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  400 |       'Обсудим после опроса',
  401 |     );
  402 |   });
  403 | }
  404 | 
```