# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-reliability.spec.ts >> draft survives an error, back warns and sharing returns to the chat
- Location: tests/02-reliability.spec.ts:15:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('main')
Expected substring: "Скопируйте вручную"
Received string:    "Черновик встречи1 участник · 24 октября · 19:00Пригласить друзейВстреча закончиласьКак всё прошло?Добавить фото↗✦Сегодня · 19:25Саша создал встречуПозовём остальных?Отправьте друзьям ссылку на встречу.После ответа «Приду» они появятся в чате.Пригласить друзейСообщениеЧерновик сохраняется после приглашения"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('main') with timeout 5000ms
  - waiting for getByRole('main')
    14 × locator resolved to <main id="main" data-mobile="false" class="_conversation_1abp8_1">…</main>
       - unexpected value "Черновик встречи1 участник · 24 октября · 19:00Пригласить друзейВстреча закончиласьКак всё прошло?Добавить фото↗✦Сегодня · 19:25Саша создал встречуПозовём остальных?Отправьте друзьям ссылку на встречу.После ответа «Приду» они появятся в чате.Пригласить друзейСообщениеЧерновик сохраняется после приглашения"

```

```yaml
- main:
  - link "К моим встречам":
    - /url: /meetings
  - heading "Черновик встречи" [level=1]
  - paragraph: 1 участник · 24 октября · 19:00
  - button "Пригласить друзей"
  - button "Информация о встрече"
  - link "Как всё прошло? Добавить фото":
    - /url: /meetings/c808ad84-875b-484e-a98f-ac5dd51105fd/memories?from=chat
    - text: Встреча закончилась
    - strong: Как всё прошло?
    - text: Добавить фото
  - list "Разговор встречи":
    - listitem:
      - time: Сегодня · 19:25
      - paragraph: Саша создал встречу
  - heading "Позовём остальных?" [level=2]
  - paragraph: Отправьте друзьям ссылку на встречу. После ответа «Приду» они появятся в чате.
  - button "Пригласить друзей"
  - button "Добавить к встрече"
  - text: Сообщение
  - textbox "Сообщение":
    - /placeholder: Сообщение…
    - text: Черновик сохраняется после приглашения
  - button "Выбрать эмодзи"
  - button "Отправить сообщение"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { randomUUID } from 'node:crypto';
  3   | import {
  4   |   apiCreate,
  5   |   apiMeeting,
  6   |   create,
  7   |   csrf,
  8   |   expectMessageSide,
  9   |   inviteLink,
  10  |   login,
  11  |   setDate,
  12  |   writeHeaders,
  13  | } from '@tests/helpers';
  14  | 
  15  | test('draft survives an error, back warns and sharing returns to the chat', async ({
  16  |   page,
  17  | }) => {
  18  |   await login(page, 'Саша');
  19  |   await page.goto('/meetings/new');
  20  |   await page.getByLabel('Название', { exact: true }).fill('Черновик встречи');
  21  |   await page
  22  |     .getByRole('main')
  23  |     .getByRole('link', { name: 'Мои встречи', exact: true })
  24  |     .click();
  25  |   const dialog = page.getByRole('dialog', { name: 'Выйти из формы?' });
  26  |   await expect(dialog).toBeVisible();
  27  |   await page.keyboard.press('Escape');
  28  |   await expect(dialog).not.toBeVisible();
  29  |   await expect(page.getByLabel('Название', { exact: true })).toHaveValue(
  30  |     'Черновик встречи',
  31  |   );
  32  |   await page
  33  |     .getByRole('main')
  34  |     .getByRole('link', { name: 'Мои встречи', exact: true })
  35  |     .click();
  36  |   await dialog.getByRole('button', { name: 'Выйти', exact: true }).click();
  37  |   await expect(page).toHaveURL(/\/meetings$/);
  38  |   await page.goto('/meetings/new');
  39  |   await expect(page.getByLabel('Название', { exact: true })).toHaveValue(
  40  |     'Черновик встречи',
  41  |   );
  42  |   await setDate(page, '24.10.2026');
  43  |   await page.getByRole('textbox', { name: 'Время', exact: true }).fill('19:00');
  44  |   await page.getByRole('button', { name: 'Создать встречу', exact: true }).click();
  45  |   await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  46  |   const trigger = page
  47  |     .getByRole('button', { name: 'Пригласить друзей', exact: true })
  48  |     .first();
  49  | 
  50  |   await page
  51  |     .getByLabel('Сообщение', { exact: true })
  52  |     .fill('Черновик сохраняется после приглашения');
  53  |   await trigger.click();
  54  |   await expect(
  55  |     page.getByRole('heading', { name: 'Пригласить друзей', exact: true }),
  56  |   ).toBeVisible();
  57  |   await page.keyboard.press('Escape');
  58  |   await expect(trigger).toBeVisible();
  59  |   await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  60  |     'Черновик сохраняется после приглашения',
  61  |   );
  62  |   await page.evaluate(() => {
  63  |     Object.defineProperty(navigator, 'clipboard', {
  64  |       value: { writeText: () => Promise.reject(new Error('clipboard disabled')) },
  65  |       configurable: true,
  66  |     });
  67  |   });
  68  |   await trigger.click();
  69  |   await page.getByRole('button', { name: 'Скопировать ссылку' }).click();
> 70  |   await expect(page.getByRole('main')).toContainText('Скопируйте вручную', {
      |                                        ^ Error: expect(locator).toContainText(expected) failed
  71  |     ignoreCase: true,
  72  |   });
  73  |   await expect(page.getByLabel('Ссылка приглашения')).toBeEditable({ editable: false });
  74  | });
  75  | 
  76  | test('message retry after a lost response keeps its ID and confirms once', async ({
  77  |   page,
  78  | }) => {
  79  |   await login(page, 'Саша');
  80  |   const id = await create(page, 'Проверка отправки');
  81  |   let posts = 0;
  82  |   const keys: string[] = [];
  83  |   await page.route(`**/api/v1/meetings/${id}/messages`, async (route) => {
  84  |     posts++;
  85  |     keys.push(route.request().headers()['idempotency-key'] ?? '');
  86  | 
  87  |     if (posts === 1) {
  88  |       await route.fetch();
  89  |       await route.abort('connectionreset');
  90  |     } else {
  91  |       await route.continue();
  92  |     }
  93  |   });
  94  |   await page.getByLabel('Сообщение', { exact: true }).fill('Повтор без дубля');
  95  |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  96  |   await expect(page.getByRole('button', { name: 'Повторить отправку' })).toBeVisible();
  97  |   const pending = await page.getByTestId('pending-message').boundingBox();
  98  |   const pendingList = await page.getByTestId('pending-messages').boundingBox();
  99  | 
  100 |   if (!pending || !pendingList) {
  101 |     throw new Error('Failed message is not visible');
  102 |   }
  103 | 
  104 |   expect(
  105 |     Math.abs(pending.x + pending.width - pendingList.x - pendingList.width),
  106 |   ).toBeLessThan(1);
  107 |   await page.getByRole('button', { name: 'Повторить отправку' }).click();
  108 |   await expect(page.getByText('Повтор без дубля', { exact: true })).toHaveCount(1);
  109 |   expect(keys[0]).toBe(keys[1]);
  110 |   await expectMessageSide(page, 'Повтор без дубля', 'right');
  111 |   await page.reload();
  112 |   await expect(page.getByText('Повтор без дубля', { exact: true })).toHaveCount(1);
  113 | });
  114 | 
  115 | test('history and a stale settings form preserve authoritative state', async ({
  116 |   page,
  117 | }) => {
  118 |   await login(page, 'Саша');
  119 |   const id = await create(page, 'История и настройки');
  120 |   const headers = await writeHeaders(page);
  121 | 
  122 |   for (let n = 0; n < 58; n++) {
  123 |     const key = randomUUID();
  124 |     const response = await page.request.post(`/api/v1/meetings/${id}/messages`, {
  125 |       headers: { ...headers, 'Idempotency-Key': key },
  126 |       data: { text: `Запись истории ${n}`, client_request_id: key },
  127 |     });
  128 | 
  129 |     expect(response.status()).toBe(201);
  130 |   }
  131 | 
  132 |   await page.goto(`/meetings/${id}`);
  133 |   await expect(page.getByText('Запись истории 0', { exact: true })).toHaveCount(0);
  134 |   await page.getByRole('button', { name: 'Предыдущие записи' }).click();
  135 |   await expect(page.getByText('Запись истории 0', { exact: true })).toBeVisible();
  136 |   await page.getByRole('button', { name: 'Информация о встрече' }).click();
  137 |   await page.getByRole('button', { name: 'Изменить настройки', exact: true }).click();
  138 |   const dialog = page.getByRole('dialog', { name: 'Настройки встречи' });
  139 |   await dialog.getByLabel('Название', { exact: true }).fill('Старая правка');
  140 |   const meeting = await apiMeeting(page, id);
  141 |   const changed = await page.request.patch(`/api/v1/meetings/${id}`, {
  142 |     headers,
  143 |     data: { title: 'Правка другого окна', expected_revision: meeting.revision },
  144 |   });
  145 | 
  146 |   expect(changed.status()).toBe(200);
  147 |   await dialog.getByRole('button', { name: 'Сохранить изменения' }).click();
  148 |   await expect(dialog.getByRole('alert')).toContainText('Данные изменились');
  149 |   await expect(dialog.getByLabel('Название', { exact: true })).toHaveValue(
  150 |     'Старая правка',
  151 |   );
  152 |   expect((await apiMeeting(page, id)).title).toBe('Правка другого окна');
  153 | });
  154 | 
  155 | test('a revoked session closes private content and keeps invitation entry', async ({
  156 |   page,
  157 |   browser,
  158 | }) => {
  159 |   await login(page, 'Саша');
  160 |   const created = await apiCreate(page, 'Сессия встречи');
  161 |   const url = created.invitation_url;
  162 |   const context = await browser.newContext({ ignoreHTTPSErrors: true });
  163 |   const friend = await context.newPage();
  164 |   await friend.goto(url);
  165 |   await friend.getByRole('button', { name: 'Войти и ответить' }).click();
  166 |   await friend.getByRole('link', { name: 'Войти как Лена' }).click();
  167 |   await friend.getByRole('button', { name: 'Приду', exact: true }).click();
  168 |   await friend.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  169 |   await expect(friend.getByLabel('Сообщение', { exact: true })).toBeVisible();
  170 |   const logout = await friend.request.post('/api/v1/auth/logout', {
```