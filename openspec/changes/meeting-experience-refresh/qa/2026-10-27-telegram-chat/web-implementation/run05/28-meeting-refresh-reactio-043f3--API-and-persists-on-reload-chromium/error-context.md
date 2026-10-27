# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 28-meeting-refresh.spec.ts >> reaction toggle is confirmed by the API and persists on reload
- Location: tests/28-meeting-refresh.spec.ts:134:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('dialog', { name: 'Кто отреагировал', exact: true })
Expected substring: "Саша"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" getByRole('dialog', { name: 'Кто отреагировал', exact: true }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Кто отреагировал', exact: true })

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
  - heading "Реакция" [level=1]
  - paragraph: 1 участник · 24 октября · 19:00
  - button "Пригласить друзей"
  - button "Информация о встрече"
  - list "Разговор встречи":
    - listitem:
      - time: Сегодня · 15:52
      - paragraph: Саша создал встречу
    - listitem:
      - strong: Саша
      - time: 15:52
      - paragraph: Принесу чай
      - 'button "👍: 1" [pressed]': 👍 1
      - button "Добавить реакцию"
      - button "Кто отреагировал"
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
  62  |     });
  63  |   });
  64  |   await page.getByRole('link', { name: 'Профиль', exact: true }).click();
  65  |   await expect(
  66  |     page.getByRole('heading', { name: 'Не удалось загрузить профиль' }),
  67  |   ).toBeVisible();
  68  |   await expect(page.getByText('Не указан', { exact: true })).toHaveCount(0);
  69  |   failed = false;
  70  |   await page.getByRole('button', { name: 'Попробовать снова' }).click();
  71  |   await expect(page.getByText('Не указан', { exact: true })).toBeVisible();
  72  |   await expect(page.getByText('Не указана', { exact: true })).toBeVisible();
  73  |   await expect(page.getByRole('textbox')).toHaveCount(0);
  74  |   await page.screenshot({
  75  |     path: `test-results/refresh-profile-${test.info().project.name}.png`,
  76  |   });
  77  | });
  78  | 
  79  | test('support keeps input after error, retries the same request, and returns server reference', async ({
  80  |   page,
  81  | }) => {
  82  |   const requests: { key: string; body: unknown }[] = [];
  83  |   await page.route('**/api/v1/support/feedback', async (route) => {
  84  |     requests.push({
  85  |       key: route.request().headers()['idempotency-key'] ?? '',
  86  |       body: route.request().postDataJSON(),
  87  |     });
  88  |     await route.fulfill(
  89  |       requests.length === 1
  90  |         ? {
  91  |             status: 503,
  92  |             json: {
  93  |               error: { code: 'unavailable', field_errors: {}, request_id: 'test' },
  94  |             },
  95  |           }
  96  |         : {
  97  |             status: 201,
  98  |             json: {
  99  |               id: '12345678-1234-4234-8234-123456789012',
  100 |               reference: 'SW-TEST-42',
  101 |               status: 'accepted',
  102 |             },
  103 |           },
  104 |     );
  105 |   });
  106 |   await page.goto('/support?kind=idea&screen=meeting_chat');
  107 |   await page
  108 |     .getByLabel('Ваше сообщение')
  109 |     .fill('Предлагаю улучшить выбор фото в разговоре.');
  110 |   await page.getByRole('button', { name: 'Отправить сообщение ↗', exact: true }).click();
  111 |   await expect(page.getByRole('alert')).toContainText('Не удалось отправить');
  112 |   await expect(page.getByLabel('Ваше сообщение')).toHaveValue(
  113 |     'Предлагаю улучшить выбор фото в разговоре.',
  114 |   );
  115 |   await page.getByRole('button', { name: 'Отправить сообщение ↗', exact: true }).click();
  116 |   await expect(page.getByRole('heading', { name: 'Обращение принято' })).toBeVisible();
  117 |   await expect(page.getByText('Номер SW-TEST-42')).toBeVisible();
  118 |   expect(requests[0]?.key).toBe(requests[1]?.key);
  119 |   expect(requests[0]?.body).toMatchObject({
  120 |     kind: 'idea',
  121 |     screen: 'meeting_chat',
  122 |     diagnostics: null,
  123 |     email: null,
  124 |     screenshot: null,
  125 |   });
  126 |   await page.goto('/privacy');
  127 |   await expect(page.getByText('Проект документа', { exact: true })).toBeVisible();
  128 |   await expect(page.getByText('Будет заполнено', { exact: true })).toHaveCount(3);
  129 |   expect(
  130 |     await page.evaluate(() => document.documentElement.scrollWidth),
  131 |   ).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  132 | });
  133 | 
  134 | test('reaction toggle is confirmed by the API and persists on reload', async ({
  135 |   page,
  136 | }) => {
  137 |   await login(page, 'Саша');
  138 |   const created = await apiCreate(page, 'Реакция');
  139 |   await page.goto(`/meetings/${created.meeting.id}`);
  140 |   await page.getByLabel('Сообщение', { exact: true }).fill('Принесу чай');
  141 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  142 |   const row = page.getByTestId('feed-message').filter({ hasText: 'Принесу чай' });
  143 |   await expect(row).toBeVisible();
  144 |   await row.getByRole('button', { name: 'Добавить реакцию' }).click();
  145 |   await page
  146 |     .getByRole('dialog', { name: 'Реакция', exact: true })
  147 |     .getByRole('button', { name: '👍', exact: true })
  148 |     .click();
  149 |   await expect(row.getByRole('button', { name: '👍: 1' })).toHaveAttribute(
  150 |     'aria-pressed',
  151 |     'true',
  152 |   );
  153 |   await page.reload();
  154 |   await expect(row.getByRole('button', { name: '👍: 1' })).toHaveAttribute(
  155 |     'aria-pressed',
  156 |     'true',
  157 |   );
  158 |   await row.getByRole('button', { name: 'Добавить реакцию' }).click();
  159 |   await page.getByRole('button', { name: 'Кто отреагировал' }).click();
  160 |   await expect(
  161 |     page.getByRole('dialog', { name: 'Кто отреагировал', exact: true }),
> 162 |   ).toContainText('Саша');
      |     ^ Error: expect(locator).toContainText(expected) failed
  163 |   await page.keyboard.press('Escape');
  164 |   await row.getByRole('button', { name: '👍: 1' }).click();
  165 |   await expect(row.getByRole('button', { name: '👍: 1' })).toHaveCount(0);
  166 | });
  167 | 
  168 | test('one hour cutoff is reflected after server refresh without losing current members', async ({
  169 |   page,
  170 |   browser,
  171 | }) => {
  172 |   await login(page, 'Саша');
  173 |   const created = await apiCreate(page, 'Отсечка');
  174 |   const changed = await page.request.patch(`/api/v1/meetings/${created.meeting.id}`, {
  175 |     headers: await writeHeaders(page),
  176 |     data: {
  177 |       expected_revision: created.meeting.revision,
  178 |       starts_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  179 |       starts_on: new Date().toISOString().slice(0, 10),
  180 |       timezone: 'UTC',
  181 |     },
  182 |   });
  183 | 
  184 |   expect(changed.ok()).toBe(true);
  185 |   const context = await browser.newContext({ ignoreHTTPSErrors: true });
  186 |   const guest = await context.newPage();
  187 |   await login(guest, 'Лена');
  188 |   await guest.goto(new URL(created.invitation_url).pathname);
  189 |   await expect(guest.getByRole('button', { name: 'Приду', exact: true })).toBeDisabled();
  190 |   await expect(
  191 |     guest.getByText('Участие закрыто за час до начала встречи.'),
  192 |   ).toBeVisible();
  193 |   await page.goto(`/meetings/${created.meeting.id}`);
  194 |   await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  195 |   await context.close();
  196 | });
  197 | 
  198 | test('private profile displays provider fields without inventing a birth year', async ({
  199 |   page,
  200 | }) => {
  201 |   await login(page, 'Саша');
  202 |   const session = sessionSchema.parse(
  203 |     await (await page.request.get('/api/v1/me')).json(),
  204 |   );
  205 | 
  206 |   await page.route('**/api/v1/me/profile', (route) =>
  207 |     route.fulfill({
  208 |       json: {
  209 |         id: session.user.id,
  210 |         display_name: 'Саша',
  211 |         avatar_url: null,
  212 |         email: 'sasha@example.com',
  213 |         phone: null,
  214 |         provider: 'yandex',
  215 |         login: 'sasha',
  216 |         first_name: 'Александр',
  217 |         last_name: 'Иванов',
  218 |         birthday: '0000-12-23',
  219 |         sex: 'male',
  220 |       },
  221 |     }),
  222 |   );
  223 |   await page.goto('/profile');
  224 |   const details = page.getByRole('region', { name: 'Личные данные' });
  225 |   await expect(details).toContainText('sasha');
  226 |   await expect(details).toContainText('Александр');
  227 |   await expect(details).toContainText('Иванов');
  228 |   await expect(details.getByText('23 декабря', { exact: true })).toBeVisible();
  229 |   await expect(details).toContainText('Мужской');
  230 |   await expect(details.getByRole('textbox')).toHaveCount(0);
  231 | });
  232 | 
```