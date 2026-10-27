# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 33-chat-action-sheets.spec.ts >> TC-CHAT-INFO-EXPAND: both roles reveal the real roster and retain independent actions
- Location: tests/33-chat-action-sheets.spec.ts:6:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByRole('dialog', { name: 'Пригласить друзей', exact: true })
Expected: "open"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByRole('dialog', { name: 'Пригласить друзей', exact: true }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Пригласить друзей', exact: true })

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
- main "Пригласить друзей":
  - heading "Пригласить друзей" [level=2]
  - button "Назад"
  - paragraph: Отправьте ссылку тем, кого хотите позвать.
  - text: Ссылка приглашения
  - textbox "Ссылка приглашения": https://127.0.0.1:8444/i/zuBAt8vkkQ-CWYZwhD5sKw
  - button "Скопировать ссылку"
```

# Test source

```ts
  2   | import { actionSurface, apiCreate, login, writeHeaders } from '@tests/helpers';
  3   | import { datePollSchema, placePollSchema } from '@/shared/api';
  4   | import { meetingRoster } from '@tests/helpers/meetingRoster';
  5   | 
  6   | test('TC-CHAT-INFO-EXPAND: both roles reveal the real roster and retain independent actions', async ({
  7   |   page,
  8   |   browser,
  9   | }) => {
  10  |   test.setTimeout(150_000);
  11  |   await login(page, 'Саша');
  12  |   const fixture = await meetingRoster(browser, page);
  13  |   const attending = fixture.participants.filter(
  14  |     (person) => person.role === 'organizer' || person.rsvp === 'going',
  15  |   );
  16  | 
  17  |   expect(attending).toHaveLength(6);
  18  | 
  19  |   try {
  20  |     for (const [viewer, organizer] of [
  21  |       [page, true],
  22  |       [fixture.member, false],
  23  |     ] as const) {
  24  |       for (const width of [320, 390, 768, 1440]) {
  25  |         await viewer.setViewportSize({ width, height: 844 });
  26  |         await viewer.goto(
  27  |           new URL(`/meetings/${fixture.meeting.id}`, fixture.invitation_url).href,
  28  |         );
  29  |         const composer = viewer.getByLabel('Сообщение', { exact: true });
  30  |         await composer.fill('Черновик под составом');
  31  |         const open = viewer.getByRole('button', {
  32  |           name: 'Информация о встрече',
  33  |           exact: true,
  34  |         });
  35  | 
  36  |         await open.click();
  37  |         const info = viewer.getByRole('dialog', {
  38  |           name: fixture.meeting.title,
  39  |           exact: true,
  40  |         });
  41  | 
  42  |         const chips = info.getByRole('button', {
  43  |           name: 'Все участники встречи. Придут: 6',
  44  |           exact: true,
  45  |         });
  46  | 
  47  |         const roster = info.getByRole('list', {
  48  |           name: 'Все участники встречи',
  49  |           exact: true,
  50  |         });
  51  | 
  52  |         const settings = info.getByRole('button', {
  53  |           name: 'Изменить настройки',
  54  |           exact: true,
  55  |         });
  56  | 
  57  |         const invite = info.getByRole('button', {
  58  |           name: 'Пригласить друзей',
  59  |           exact: true,
  60  |         });
  61  | 
  62  |         const answer = info.getByRole('button', { name: 'Приду', exact: true });
  63  |         await expect(chips).toHaveAttribute('aria-expanded', 'false');
  64  |         await expect(chips).toContainText('ещё 3');
  65  |         await expect(roster).toHaveCount(0);
  66  |         await expect(info.locator('img')).toHaveCount(0);
  67  |         await expect(settings).toHaveCount(organizer ? 1 : 0);
  68  |         await expect(invite).toHaveCount(organizer ? 1 : 0);
  69  |         await expect(answer).toHaveCount(organizer ? 0 : 1);
  70  | 
  71  |         for (const person of attending.slice(0, 3)) {
  72  |           await expect(chips).toContainText(person.user.display_name);
  73  |         }
  74  | 
  75  |         await chips.click();
  76  |         await expect(roster.getByRole('listitem')).toHaveCount(8);
  77  |         await expect(
  78  |           info.getByRole('heading', { name: 'Участники', exact: true }),
  79  |         ).toBeVisible();
  80  |         await expect(roster.getByText('Организатор', { exact: true })).toHaveCount(1);
  81  |         await expect(roster.getByText('Возможно', { exact: true })).toHaveCount(1);
  82  |         await expect(roster.getByText('Не смогу', { exact: true })).toHaveCount(1);
  83  |         const last = roster.getByRole('listitem').last();
  84  |         await last.scrollIntoViewIfNeeded();
  85  |         await expect(last).toBeInViewport({ ratio: 1 });
  86  |         await expect(organizer ? settings : answer).toBeEnabled();
  87  |         const collapse = info.getByRole('button', { name: 'Скрыть состав', exact: true });
  88  |         await collapse.click();
  89  |         await expect(roster).toHaveCount(0);
  90  |         await expect(chips).toBeFocused();
  91  |         await chips.press('Enter');
  92  |         await expect(roster.getByRole('listitem')).toHaveCount(8);
  93  |         await expect(collapse).toBeFocused();
  94  | 
  95  |         if (organizer) {
  96  |           await invite.click();
  97  |           const share = viewer.getByRole('dialog', {
  98  |             name: 'Пригласить друзей',
  99  |             exact: true,
  100 |           });
  101 | 
> 102 |           await expect(share).toHaveAttribute('data-motion', 'open');
      |                               ^ Error: expect(locator).toHaveAttribute(expected) failed
  103 |           await expect(info).not.toBeVisible();
  104 |           await expect(viewer.locator('dialog:modal')).toHaveCount(1);
  105 |           await share.getByRole('button', { name: 'Закрыть', exact: true }).click();
  106 |           await expect(info).toHaveAttribute('data-motion', 'open');
  107 |         }
  108 | 
  109 |         await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  110 |         await expect(info).not.toBeVisible();
  111 |         await expect(open).toBeFocused();
  112 |         await expect(composer).toHaveValue('Черновик под составом');
  113 |       }
  114 |     }
  115 |   } finally {
  116 |     await fixture.close();
  117 |   }
  118 | });
  119 | 
  120 | for (const kind of ['date', 'place'] as const) {
  121 |   test(`${kind} poll freezes a committed request after a lost response and retries after reopening`, async ({
  122 |     page,
  123 |   }) => {
  124 |     await page.setViewportSize({ width: 390, height: 844 });
  125 |     await login(page, 'Саша');
  126 |     const { meeting } = await apiCreate(page, 'Опрос без дубликата');
  127 |     await page.goto(`/meetings/${meeting.id}`);
  128 |     const keys: string[] = [];
  129 |     const bodies: string[] = [];
  130 |     const ids: string[] = [];
  131 |     await page.route(`**/api/v1/meetings/${meeting.id}/${kind}-polls`, async (route) => {
  132 |       if (route.request().method() !== 'POST') {
  133 |         await route.continue();
  134 | 
  135 |         return;
  136 |       }
  137 | 
  138 |       keys.push(route.request().headers()['idempotency-key'] ?? '');
  139 |       bodies.push(route.request().postData() ?? '');
  140 |       const response = await route.fetch();
  141 |       expect(response.ok()).toBe(true);
  142 |       const body: unknown = await response.json();
  143 |       const poll =
  144 |         kind === 'date' ? datePollSchema.parse(body) : placePollSchema.parse(body);
  145 | 
  146 |       ids.push(poll.id);
  147 | 
  148 |       if (keys.length === 1) {
  149 |         await route.abort('failed');
  150 |       } else {
  151 |         await route.fulfill({ response });
  152 |       }
  153 |     });
  154 |     const title = kind === 'date' ? 'Предложить дату' : 'Предложить место';
  155 |     await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  156 |     await page.getByRole('menuitem', { name: title, exact: true }).click();
  157 |     const sheet = page.getByRole('dialog', { name: title, exact: true });
  158 | 
  159 |     if (kind === 'place') {
  160 |       await sheet.getByLabel('Новое место').fill('Кафе у парка');
  161 |       await sheet.getByLabel('Почему здесь').fill('Здесь есть большой стол');
  162 |     }
  163 | 
  164 |     await sheet
  165 |       .getByRole('button', {
  166 |         name: kind === 'date' ? 'Создать опрос' : 'Предложить место',
  167 |         exact: true,
  168 |       })
  169 |       .click();
  170 |     const retry = sheet.getByRole('button', { name: 'Повторить отправку', exact: true });
  171 |     await expect(retry).toBeEnabled();
  172 |     const form = sheet.locator('form:visible');
  173 |     await expect(form).toHaveCount(1);
  174 |     const inputs = form.locator('input, textarea, select');
  175 |     expect(await inputs.count()).toBeGreaterThan(0);
  176 | 
  177 |     for (const input of await inputs.all()) {
  178 |       await expect(input).toBeDisabled();
  179 |     }
  180 | 
  181 |     if (kind === 'date') {
  182 |       await expect(
  183 |         sheet.getByRole('button', { name: 'Добавить вариант' }),
  184 |       ).toBeDisabled();
  185 |     }
  186 | 
  187 |     await sheet.getByRole('button', { name: 'Закрыть', exact: true }).click();
  188 |     await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  189 |     await page.getByRole('menuitem', { name: title, exact: true }).click();
  190 | 
  191 |     for (const input of await inputs.all()) {
  192 |       await expect(input).toBeDisabled();
  193 |     }
  194 | 
  195 |     await retry.click();
  196 |     await expect(sheet).not.toBeVisible();
  197 |     expect(keys).toHaveLength(2);
  198 |     expect(keys[0]).toBeTruthy();
  199 |     expect(keys[1]).toBe(keys[0]);
  200 |     expect(bodies[1]).toBe(bodies[0]);
  201 |     expect(ids[1]).toBe(ids[0]);
  202 |     await expect(
```