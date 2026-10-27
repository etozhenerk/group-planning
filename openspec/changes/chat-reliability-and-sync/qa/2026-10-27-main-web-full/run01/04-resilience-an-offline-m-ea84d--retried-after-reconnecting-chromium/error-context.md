# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-resilience.spec.ts >> an offline message keeps its text and can be retried after reconnecting
- Location: tests/04-resilience.spec.ts:11:1

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
  - heading "Без сети" [level=1]
  - paragraph: 1 участник · 24 октября · 19:00
  - button "Пригласить друзей"
  - button "Информация о встрече"
  - list "Разговор встречи":
    - listitem:
      - time: Сегодня · 23:19
      - paragraph: Саша создал встречу
    - listitem:
      - strong: Саша
      - time: 23:19
      - paragraph: Сообщение без сети
      - status: Отправляем…
  - heading "Позовём остальных?" [level=2]
  - paragraph: Отправьте друзьям ссылку на встречу. После ответа «Приду» они появятся в чате.
  - button "Пригласить друзей"
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
  - definition: Место пока не выбрано
  - heading "Кто придёт · 1" [level=3]
  - 'button "Все участники встречи. Придут: 1"': Саша
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import {
  3   |   apiCreate,
  4   |   apiMeeting,
  5   |   csrf,
  6   |   expectDate,
  7   |   login,
  8   |   writeHeaders,
  9   | } from '@tests/helpers';
  10  | 
  11  | test('an offline message keeps its text and can be retried after reconnecting', async ({
  12  |   page,
  13  |   context,
  14  | }) => {
  15  |   await login(page, 'Саша');
  16  |   const created = await apiCreate(page, 'Без сети');
  17  |   await page.goto(`/meetings/${created.meeting.id}`);
  18  |   await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  19  |   await context.setOffline(true);
  20  |   await page.getByLabel('Сообщение', { exact: true }).fill('Сообщение без сети');
  21  |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  22  |   await expect(page.getByText('Сообщение без сети', { exact: true })).toHaveCount(1);
> 23  |   await expect(page.getByRole('button', { name: 'Повторить отправку' })).toBeVisible();
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
  24  |   await context.setOffline(false);
  25  |   await page.getByRole('button', { name: 'Повторить отправку' }).click();
  26  |   await expect(page.getByRole('button', { name: 'Повторить отправку' })).toHaveCount(0);
  27  |   await page.reload();
  28  |   await expect(page.getByText('Сообщение без сети', { exact: true })).toHaveCount(1);
  29  | });
  30  | 
  31  | test('a late message response cannot reopen access after a 403', async ({
  32  |   page,
  33  |   browser,
  34  | }) => {
  35  |   await login(page, 'Саша');
  36  |   const created = await apiCreate(page, 'Отозванный доступ');
  37  |   const context = await browser.newContext({ ignoreHTTPSErrors: true });
  38  |   const friend = await context.newPage();
  39  |   await friend.goto(created.invitation_url);
  40  |   await friend.getByRole('button', { name: 'Войти и ответить' }).click();
  41  |   await friend.getByRole('link', { name: 'Войти как Лена' }).click();
  42  |   await friend.getByRole('button', { name: 'Приду', exact: true }).click();
  43  |   await friend.getByRole('link', { name: 'Открыть встречу', exact: true }).click();
  44  |   await expect(friend.getByLabel('Сообщение', { exact: true })).toBeVisible();
  45  |   const release: { response?: () => void } = {};
  46  |   const stored: { response?: () => void } = {};
  47  |   const messageStored = new Promise<void>((resolve) => {
  48  |     stored.response = resolve;
  49  |   });
  50  | 
  51  |   const responseReleased = new Promise<void>((resolve) => {
  52  |     release.response = resolve;
  53  |   });
  54  | 
  55  |   await friend.route(
  56  |     `**/api/v1/meetings/${created.meeting.id}/messages`,
  57  |     async (route) => {
  58  |       const response = await route.fetch();
  59  |       stored.response?.();
  60  |       await responseReleased;
  61  |       await route.fulfill({ response });
  62  |     },
  63  |   );
  64  |   await friend.getByLabel('Сообщение', { exact: true }).fill('Запоздалое подтверждение');
  65  |   await friend.getByRole('button', { name: 'Отправить сообщение' }).click();
  66  |   await messageStored;
  67  |   const leave = await friend.request.put(`/api/v1/meetings/${created.meeting.id}/rsvp`, {
  68  |     headers: {
  69  |       Origin: 'https://127.0.0.1:8444',
  70  |       'X-CSRF-Token': await csrf(friend),
  71  |       'Idempotency-Key': crypto.randomUUID(),
  72  |     },
  73  |     data: { answer: 'not_going', expected_revision: '1' },
  74  |   });
  75  | 
  76  |   expect(leave.status()).toBe(200);
  77  |   await expect(friend.getByRole('heading', { name: 'Переписка закрыта' })).toBeVisible({
  78  |     timeout: 10000,
  79  |   });
  80  |   release.response?.();
  81  |   await expect(friend.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
  82  |   await expect(friend.getByText('Запоздалое подтверждение', { exact: true })).toHaveCount(
  83  |     0,
  84  |   );
  85  |   await expect(friend.getByRole('link', { name: 'Открыть приглашение' })).toBeVisible();
  86  |   await context.close();
  87  | });
  88  | 
  89  | test('editing text preserves seconds and the selected DST instant', async ({ page }) => {
  90  |   await login(page, 'Саша');
  91  |   const created = await apiCreate(page, 'Точное время');
  92  |   const id = created.meeting.id;
  93  |   const changeTime = await page.request.patch(`/api/v1/meetings/${id}`, {
  94  |     headers: await writeHeaders(page),
  95  |     data: {
  96  |       starts_at: '2026-11-01T01:30:37.123-05:00',
  97  |       timezone: 'America/New_York',
  98  |       expected_revision: created.meeting.revision,
  99  |     },
  100 |   });
  101 | 
  102 |   expect(changeTime.status()).toBe(200);
  103 |   const original = await apiMeeting(page, id);
  104 |   await page.goto(`/meetings/${id}`);
  105 |   await page.getByRole('button', { name: 'Информация о встрече' }).click();
  106 |   await page.getByRole('button', { name: 'Изменить настройки', exact: true }).click();
  107 |   const dialog = page.getByRole('dialog', { name: 'Настройки встречи' });
  108 |   await expectDate(page, '01.11.2026');
  109 |   await expect(dialog.getByRole('textbox', { name: 'Время', exact: true })).toHaveValue(
  110 |     '01:30',
  111 |   );
  112 |   await dialog.getByRole('button', { name: 'Календарь', exact: true }).click();
  113 |   await expect(
  114 |     page.locator('.g-popup').filter({ has: page.getByRole('grid') }),
  115 |   ).toBeVisible();
  116 |   await page.keyboard.press('Escape');
  117 |   await expect(dialog).toBeVisible();
  118 |   await expect(
  119 |     page.locator('.g-popup').filter({ has: page.getByRole('grid') }),
  120 |   ).not.toBeVisible();
  121 |   await dialog.getByLabel(/^Описание/).fill('Описание без изменения даты');
  122 |   await dialog.getByRole('button', { name: 'Сохранить изменения' }).click();
  123 |   await expect(dialog).not.toBeVisible();
```