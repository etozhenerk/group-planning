# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 34-telegram-chat.spec.ts >> emoji dock preserves selection, supports repeated insertion and restores the keyboard
- Location: tests/34-telegram-chat.spec.ts:7:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: getByRole('textbox', { name: 'Сообщение', exact: true })
Expected: "Возьму 🍕 и чай завтра"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" getByRole('textbox', { name: 'Сообщение', exact: true }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Сообщение', exact: true })

```

```yaml
- link "К содержимому":
  - /url: "#main"
- text: Демостенд · данные хранятся до перезапуска
- navigation "Основная навигация":
  - link "Встречи":
    - /url: /meetings
  - link "Приглашения":
    - /url: /invitations
  - link "Профиль":
    - /url: /profile
- link "Somewhere — на главную":
  - /url: /
  - text: somewhere
- main:
  - heading "Мои встречи" [level=1]
  - link "Создать встречу":
    - /url: /meetings/new
    - text: Создать
  - navigation "Период встреч":
    - button "Предстоящие 1" [pressed]
    - button "Прошедшие 0"
  - navigation "Вид встреч":
    - button "Список" [pressed]
    - button "Календарь"
  - heading "октябрь 2099" [level=2]
  - article:
    - 'link "Сб, 24 октября · 19:00 Док эмодзи Вы организатор Место пока не выбрано Участников: 1"':
      - /url: /meetings/a168a99c-0514-4ef4-a111-61454591d819
      - time: Сб, 24 октября · 19:00
      - heading "Док эмодзи Вы организатор" [level=2]:
        - text: Док эмодзи
        - img "Вы организатор"
      - paragraph: Место пока не выбрано
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { randomUUID } from 'node:crypto';
  3   | import { apiCreate, login, writeHeaders } from '@tests/helpers';
  4   | 
  5   | test.use({ hasTouch: true });
  6   | 
  7   | test('emoji dock preserves selection, supports repeated insertion and restores the keyboard', async ({
  8   |   page,
  9   | }) => {
  10  |   await page.setViewportSize({ width: 390, height: 844 });
  11  |   await login(page, 'Саша');
  12  |   const { meeting } = await apiCreate(page, 'Док эмодзи');
  13  |   await page.goto(`/meetings/${meeting.id}`);
  14  |   const input = page.getByRole('textbox', { name: 'Сообщение', exact: true });
  15  |   await input.fill('Возьму чай завтра');
  16  |   await input.evaluate((element) => {
  17  |     if (element instanceof HTMLTextAreaElement) {
  18  |       element.setSelectionRange(7, 10);
  19  |       element.dispatchEvent(new Event('select', { bubbles: true }));
  20  |     }
  21  |   });
  22  |   await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  23  |   const dock = page.getByRole('region', { name: 'Выбор эмодзи', exact: true });
  24  |   const search = dock.getByRole('searchbox', { name: 'Найти эмодзи' });
  25  |   await expect(search).not.toBeFocused();
  26  |   await search.fill('пицца');
  27  |   await dock.getByRole('button', { name: 'Вставить: пицца', exact: true }).click();
  28  |   await dock.getByRole('button', { name: 'Вставить: пицца', exact: true }).click();
  29  |   await expect(input).toHaveValue('Возьму 🍕🍕 завтра');
  30  |   await expect(dock).toBeVisible();
  31  |   await dock
  32  |     .getByRole('button', { name: 'Удалить символ перед курсором сообщения' })
  33  |     .click();
  34  |   await expect(input).toHaveValue('Возьму 🍕 завтра');
  35  |   await page.getByRole('button', { name: 'Вернуться к клавиатуре', exact: true }).click();
  36  |   await expect(dock).toHaveCount(0);
  37  |   await expect(input).toBeFocused();
  38  |   await input.pressSequentially(' и чай');
  39  |   await expect(input).toHaveValue('Возьму 🍕 и чай завтра');
  40  |   await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  41  |   await page.keyboard.press('Escape');
  42  |   await expect(dock).toHaveCount(0);
  43  |   await expect(
  44  |     page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }),
  45  |   ).toBeFocused();
  46  |   await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  47  |   await page.goBack();
  48  |   await expect(dock).toHaveCount(0);
> 49  |   await expect(input).toHaveValue('Возьму 🍕 и чай завтра');
      |                       ^ Error: expect(locator).toHaveValue(expected) failed
  50  |   await expect(
  51  |     page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }),
  52  |   ).toBeFocused();
  53  |   await expect(page.getByTestId('feed-message')).toHaveCount(0);
  54  | });
  55  | 
  56  | test('emoji dock and expanded reactions keep the composer usable in compact viewports', async ({
  57  |   page,
  58  | }) => {
  59  |   await page.setViewportSize({ width: 390, height: 844 });
  60  |   await login(page, 'Саша');
  61  |   const { meeting } = await apiCreate(page, 'Панели на маленьком экране');
  62  |   await page.goto(`/meetings/${meeting.id}`);
  63  |   await page.getByLabel('Сообщение', { exact: true }).fill('Принесу игры');
  64  |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  65  |   const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу игры' });
  66  |   await expect(row).toBeVisible();
  67  | 
  68  |   for (const viewport of [
  69  |     { width: 320, height: 760 },
  70  |     { width: 390, height: 430 },
  71  |     { width: 844, height: 390 },
  72  |   ]) {
  73  |     await page.setViewportSize(viewport);
  74  |     await page.getByRole('button', { name: 'Выбрать эмодзи', exact: true }).click();
  75  |     const input = page.getByLabel('Сообщение', { exact: true });
  76  |     const dock = page.getByRole('region', { name: 'Выбор эмодзи', exact: true });
  77  |     await expect(input).toBeInViewport({ ratio: 1 });
  78  |     await expect(
  79  |       page.getByRole('button', { name: 'Отправить сообщение' }),
  80  |     ).toBeInViewport({ ratio: 1 });
  81  |     const inputBox = await input.boundingBox();
  82  |     const dockBox = await dock.boundingBox();
  83  |     expect(inputBox && dockBox && inputBox.y + inputBox.height <= dockBox.y).toBe(true);
  84  |     await row.getByRole('button', { name: 'Добавить реакцию' }).click();
  85  |     await expect(dock).toHaveCount(0);
  86  |     const reactions = page.getByRole('dialog', { name: 'Реакция', exact: true });
  87  |     await reactions.getByRole('button', { name: 'Все эмодзи' }).click();
  88  |     await expect(reactions).toBeInViewport({ ratio: 1 });
  89  |     await expect(input).toBeInViewport({ ratio: 1 });
  90  |     await page.keyboard.press('Escape');
  91  |     await expect(row.getByRole('button', { name: 'Добавить реакцию' })).toBeFocused();
  92  |     expect(
  93  |       await page.evaluate(() => document.documentElement.scrollWidth),
  94  |     ).toBeLessThanOrEqual(viewport.width);
  95  |   }
  96  | });
  97  | 
  98  | test('settings and sharing return to the same information sheet and retain the draft', async ({
  99  |   page,
  100 | }) => {
  101 |   await page.setViewportSize({ width: 390, height: 844 });
  102 |   await login(page, 'Саша');
  103 |   const { meeting } = await apiCreate(page, 'Родительская панель');
  104 |   await page.goto(`/meetings/${meeting.id}`);
  105 |   await page.getByLabel('Сообщение', { exact: true }).fill('Черновик сообщения');
  106 |   await page.getByRole('button', { name: 'Информация о встрече' }).click();
  107 |   const info = page.getByRole('dialog', { name: meeting.title, exact: true });
  108 |   await info.getByRole('button', { name: 'Настройки встречи' }).click();
  109 |   const settings = page.getByRole('dialog', { name: 'Настройки встречи' });
  110 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  111 |   await settings.getByLabel('Название', { exact: true }).fill('Несохранённое название');
  112 |   await page.goBack();
  113 |   await expect(info).toBeVisible();
  114 |   await expect(info.getByRole('button', { name: 'Настройки встречи' })).toBeFocused();
  115 |   await info.getByRole('button', { name: 'Настройки встречи' }).click();
  116 |   await expect(settings.getByLabel('Название', { exact: true })).toHaveValue(
  117 |     'Несохранённое название',
  118 |   );
  119 |   await settings.getByRole('button', { name: 'Закрыть', exact: true }).click();
  120 |   await info.getByRole('button', { name: 'Пригласить друзей' }).click();
  121 |   const share = page.getByRole('dialog', { name: 'Пригласить друзей', exact: true });
  122 |   await expect(page.locator('dialog:modal')).toHaveCount(1);
  123 |   await share.getByRole('button', { name: 'Закрыть', exact: true }).click();
  124 |   await expect(info).toBeVisible();
  125 |   await expect(info.getByRole('button', { name: 'Пригласить друзей' })).toBeFocused();
  126 |   await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  127 |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  128 |     'Черновик сообщения',
  129 |   );
  130 | });
  131 | 
  132 | test('opening the emoji dock preserves the reading position and the new-message action stays above it', async ({
  133 |   page,
  134 | }) => {
  135 |   await page.setViewportSize({ width: 390, height: 844 });
  136 |   await login(page, 'Саша');
  137 |   const { meeting } = await apiCreate(page, 'Позиция чтения');
  138 |   const headers = await writeHeaders(page);
  139 |   const send = async (text: string) => {
  140 |     const key = randomUUID();
  141 |     const response = await page.request.post(`/api/v1/meetings/${meeting.id}/messages`, {
  142 |       headers: { ...headers, 'Idempotency-Key': key },
  143 |       data: { text, client_request_id: key },
  144 |     });
  145 | 
  146 |     expect(response.status()).toBe(201);
  147 |   };
  148 | 
  149 |   for (let index = 0; index < 25; index++) {
```