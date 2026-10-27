# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 32-refresh-resilience.spec.ts >> failed reaction restores confirmed state and retries the same intent
- Location: tests/32-refresh-resilience.spec.ts:34:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '❤️', exact: true })

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
      - button "Сведения о встрече «Реакция с повтором»" [ref=f3e17] [cursor=pointer]:
        - heading "Реакция с повтором" [level=1] [ref=f3e18]
        - generic [ref=f3e19]: 24 октября · 19:00 · 1 участник
      - button "Пригласить друзей" [ref=f3e21] [cursor=pointer]
      - button "Информация о встрече" [ref=f3e24] [cursor=pointer]
    - list "Разговор встречи" [ref=f3e29]:
      - listitem [ref=f3e30]:
        - time [ref=f3e31]: Сегодня · 23:25
        - paragraph [ref=f3e32]: Саша создал встречу
      - listitem [ref=f3e33]:
        - generic [aria-hidden] [ref=f3e34]: С
        - generic [ref=f3e35]:
          - generic [ref=f3e36]:
            - strong [ref=f3e37]: Саша
            - time [ref=f3e38]: 23:25
          - 'group "Реакции на сообщение: Проверка реакции" [ref=f3e39]':
            - paragraph [ref=f3e40]: Проверка реакции
    - generic [ref=f3e43]:
      - button "Добавить к встрече" [ref=f3e45] [cursor=pointer]
      - generic [ref=f3e48]:
        - generic [ref=f3e49]:
          - generic [ref=f3e50]: Сообщение
          - textbox "Сообщение" [ref=f3e51]:
            - /placeholder: Сообщение…
        - button "Выбрать эмодзи" [ref=f3e52] [cursor=pointer]
      - button "Отправить сообщение" [disabled] [ref=f3e58]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { create, login } from '@tests/helpers';
  3  | 
  4  | test('public support receives a real reference and retries a lost response without duplication', async ({
  5  |   page,
  6  | }) => {
  7  |   const keys: string[] = [];
  8  |   const references: string[] = [];
  9  |   await page.route('**/api/v1/support/feedback', async (route) => {
  10 |     keys.push(route.request().headers()['idempotency-key'] ?? '');
  11 |     const response = await route.fetch();
  12 |     expect(response.status()).toBe(201);
  13 |     const result = (await response.json()) as { reference: string };
  14 |     references.push(result.reference);
  15 | 
  16 |     if (references.length === 1) {
  17 |       await route.abort('failed');
  18 |     } else {
  19 |       await route.fulfill({ response });
  20 |     }
  21 |   });
  22 |   await page.goto('/support?kind=question');
  23 |   await page.getByLabel('Ваше сообщение').fill('Как добавить фотографии после встречи?');
  24 |   await page.getByRole('button', { name: 'Отправить сообщение ↗', exact: true }).click();
  25 |   await expect(page.getByRole('alert')).toContainText('Не удалось отправить');
  26 |   await page.getByRole('button', { name: 'Отправить сообщение ↗', exact: true }).click();
  27 |   await expect(page.getByRole('heading', { name: 'Обращение принято' })).toBeVisible();
  28 |   expect(references).toHaveLength(2);
  29 |   expect(references[0]).toBe(references[1]);
  30 |   expect(keys[0]).toBe(keys[1]);
  31 |   await expect(page.getByText(`Номер ${references[0]}`)).toBeVisible();
  32 | });
  33 | 
  34 | test('failed reaction restores confirmed state and retries the same intent', async ({
  35 |   page,
  36 | }) => {
  37 |   await login(page, 'Саша');
  38 |   await create(page, 'Реакция с повтором');
  39 |   await page.getByLabel('Сообщение', { exact: true }).fill('Проверка реакции');
  40 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  41 |   await expect(page.getByText('Проверка реакции', { exact: true })).toBeVisible();
  42 |   const keys: string[] = [];
  43 |   await page.route('**/reactions', async (route) => {
  44 |     if (route.request().method() !== 'PUT') {
  45 |       await route.continue();
  46 | 
  47 |       return;
  48 |     }
  49 | 
  50 |     keys.push(route.request().headers()['idempotency-key'] ?? '');
  51 | 
  52 |     if (keys.length === 1) {
  53 |       await route.fulfill({
  54 |         status: 503,
  55 |         json: {
  56 |           error: { code: 'unavailable', field_errors: {}, request_id: 'reaction-test' },
  57 |         },
  58 |       });
  59 |     } else {
  60 |       await route.continue();
  61 |     }
  62 |   });
  63 |   await page.getByTestId('message-actions').press('Enter');
> 64 |   await page.getByRole('button', { name: '❤️', exact: true }).click();
     |                                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  65 |   await expect(
  66 |     page.getByRole('button', { name: 'Не удалось сохранить. Повторить' }),
  67 |   ).toBeVisible();
  68 |   await expect(page.getByRole('button', { name: '❤️: 1', exact: true })).toHaveCount(0);
  69 |   await page.getByRole('button', { name: 'Не удалось сохранить. Повторить' }).click();
  70 |   await expect(page.getByRole('button', { name: '❤️: 1', exact: true })).toHaveAttribute(
  71 |     'aria-pressed',
  72 |     'true',
  73 |   );
  74 |   expect(keys).toHaveLength(2);
  75 |   expect(keys[0]).toBe(keys[1]);
  76 | });
  77 | 
```