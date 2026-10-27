# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-reliability.spec.ts >> message retry after a lost response keeps its ID and confirms once
- Location: tests/02-reliability.spec.ts:78:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Повторить отправку' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Повторить отправку' }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Повторить отправку' })

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
  - heading "Проверка отправки" [level=1]
  - paragraph: 1 участник · 24 октября · 19:00
  - button "Пригласить друзей"
  - button "Информация о встрече"
  - list "Разговор встречи":
    - listitem:
      - time: Сегодня · 23:18
      - paragraph: Саша создал встречу
    - listitem:
      - strong: Саша
      - time: 23:18
      - 'group "Реакции на сообщение: Повтор без дубля"':
        - paragraph: Повтор без дубля
  - button "Добавить к встрече"
  - text: Сообщение
  - textbox "Сообщение":
    - /placeholder: Сообщение…
  - button "Выбрать эмодзи"
  - button "Отправить сообщение" [disabled]
- complementary:
  - term: Когда
  - definition: 24 октября в 19:00 Москва
  - term: Где
  - definition: Лофт «Квартал»
  - paragraph: Пицца и настольные игры.
  - heading "Кто придёт · 1" [level=3]
  - 'button "Все участники встречи. Придут: 1"': Саша
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
  70  |   await expect(
  71  |     page.getByRole('dialog', { name: 'Пригласить друзей', exact: true }),
  72  |   ).toContainText('Скопируйте вручную', {
  73  |     ignoreCase: true,
  74  |   });
  75  |   await expect(page.getByLabel('Ссылка приглашения')).toBeEditable({ editable: false });
  76  | });
  77  | 
  78  | test('message retry after a lost response keeps its ID and confirms once', async ({
  79  |   page,
  80  | }) => {
  81  |   await login(page, 'Саша');
  82  |   const id = await create(page, 'Проверка отправки');
  83  |   let posts = 0;
  84  |   const keys: string[] = [];
  85  |   await page.route(`**/api/v1/meetings/${id}/messages`, async (route) => {
  86  |     posts++;
  87  |     keys.push(route.request().headers()['idempotency-key'] ?? '');
  88  | 
  89  |     if (posts === 1) {
  90  |       await route.fetch();
  91  |       await route.abort('connectionreset');
  92  |     } else {
  93  |       await route.continue();
  94  |     }
  95  |   });
  96  |   await page.getByLabel('Сообщение', { exact: true }).fill('Повтор без дубля');
  97  |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
> 98  |   await expect(page.getByRole('button', { name: 'Повторить отправку' })).toBeVisible();
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
  99  |   const pending = await page.getByTestId('pending-message').boundingBox();
  100 |   const pendingList = await page.getByTestId('pending-messages').boundingBox();
  101 | 
  102 |   if (!pending || !pendingList) {
  103 |     throw new Error('Failed message is not visible');
  104 |   }
  105 | 
  106 |   expect(
  107 |     Math.abs(pending.x + pending.width - pendingList.x - pendingList.width),
  108 |   ).toBeLessThan(1);
  109 |   await page.getByRole('button', { name: 'Повторить отправку' }).click();
  110 |   await expect(page.getByText('Повтор без дубля', { exact: true })).toHaveCount(1);
  111 |   expect(keys[0]).toBe(keys[1]);
  112 |   await expectMessageSide(page, 'Повтор без дубля', 'right');
  113 |   await page.reload();
  114 |   await expect(page.getByText('Повтор без дубля', { exact: true })).toHaveCount(1);
  115 | });
  116 | 
  117 | test('history and a stale settings form preserve authoritative state', async ({
  118 |   page,
  119 | }) => {
  120 |   await login(page, 'Саша');
  121 |   const id = await create(page, 'История и настройки');
  122 |   const headers = await writeHeaders(page);
  123 | 
  124 |   for (let n = 0; n < 58; n++) {
  125 |     const key = randomUUID();
  126 |     const response = await page.request.post(`/api/v1/meetings/${id}/messages`, {
  127 |       headers: { ...headers, 'Idempotency-Key': key },
  128 |       data: { text: `Запись истории ${n}`, client_request_id: key },
  129 |     });
  130 | 
  131 |     expect(response.status()).toBe(201);
  132 |   }
  133 | 
  134 |   await page.goto(`/meetings/${id}`);
  135 |   await expect(page.getByText('Запись истории 0', { exact: true })).toHaveCount(0);
  136 |   await page.getByRole('button', { name: 'Предыдущие записи' }).click();
  137 |   await expect(page.getByText('Запись истории 0', { exact: true })).toBeVisible();
  138 |   await page.getByRole('button', { name: 'Информация о встрече' }).click();
  139 |   await page.getByRole('button', { name: 'Изменить настройки', exact: true }).click();
  140 |   const dialog = page.getByRole('dialog', { name: 'Настройки встречи' });
  141 |   await dialog.getByLabel('Название', { exact: true }).fill('Старая правка');
  142 |   const meeting = await apiMeeting(page, id);
  143 |   const changed = await page.request.patch(`/api/v1/meetings/${id}`, {
  144 |     headers,
  145 |     data: { title: 'Правка другого окна', expected_revision: meeting.revision },
  146 |   });
  147 | 
  148 |   expect(changed.status()).toBe(200);
  149 |   await dialog.getByRole('button', { name: 'Сохранить изменения' }).click();
  150 |   await expect(dialog.getByRole('alert')).toContainText('Данные изменились');
  151 |   await expect(dialog.getByLabel('Название', { exact: true })).toHaveValue(
  152 |     'Старая правка',
  153 |   );
  154 |   expect((await apiMeeting(page, id)).title).toBe('Правка другого окна');
  155 | });
  156 | 
  157 | test('a revoked session closes private content and keeps invitation entry', async ({
  158 |   page,
  159 |   browser,
  160 | }) => {
  161 |   await login(page, 'Саша');
  162 |   const created = await apiCreate(page, 'Сессия встречи');
  163 |   const url = created.invitation_url;
  164 |   const context = await browser.newContext({ ignoreHTTPSErrors: true });
  165 |   const friend = await context.newPage();
  166 |   await friend.goto(url);
  167 |   await friend.getByRole('button', { name: 'Войти и ответить' }).click();
  168 |   await friend.getByRole('link', { name: 'Войти как Лена' }).click();
  169 |   await friend.getByRole('button', { name: 'Приду', exact: true }).click();
  170 |   await friend.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  171 |   await expect(friend.getByLabel('Сообщение', { exact: true })).toBeVisible();
  172 |   const logout = await friend.request.post('/api/v1/auth/logout', {
  173 |     headers: { Origin: 'https://127.0.0.1:8444', 'X-CSRF-Token': await csrf(friend) },
  174 |   });
  175 | 
  176 |   expect(logout.status()).toBe(204);
  177 |   await expect(friend.getByRole('button', { name: 'Войти через Яндекс ID' })).toBeVisible(
  178 |     { timeout: 10_000 },
  179 |   );
  180 |   await expect(friend.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
  181 |   await friend.getByRole('button', { name: 'Войти через Яндекс ID' }).click();
  182 |   await friend.getByRole('link', { name: 'Войти как Лена' }).click();
  183 |   await expect(friend).toHaveURL(url);
  184 |   await context.close();
  185 | });
  186 | 
  187 | test('cancelled invitation sign-in stays on the invitation without an answer', async ({
  188 |   page,
  189 | }) => {
  190 |   await login(page, 'Саша');
  191 |   await create(page, 'Отмена входа');
  192 |   const url = await inviteLink(page);
  193 |   await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  194 |   await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  195 |   await page.goto(url);
  196 |   await page.getByRole('button', { name: 'Войти и ответить' }).click();
  197 |   await page.getByRole('link', { name: 'Отменить вход' }).click();
  198 |   await expect(page).toHaveURL(/\/i\/.*auth_error=cancelled/);
```