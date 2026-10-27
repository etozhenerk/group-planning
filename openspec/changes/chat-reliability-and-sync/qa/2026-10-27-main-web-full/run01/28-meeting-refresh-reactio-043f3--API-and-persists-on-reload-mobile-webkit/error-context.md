# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 28-meeting-refresh.spec.ts >> reaction toggle is confirmed by the API and persists on reload
- Location: tests/28-meeting-refresh.spec.ts:134:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('dialog', { name: 'Реакция', exact: true }).getByRole('button', { name: '👍', exact: true })

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
      - button "Сведения о встрече «Реакция»" [ref=f3e17] [cursor=pointer]:
        - heading "Реакция" [level=1] [ref=f3e18]
        - generic [ref=f3e19]: 24 октября · 19:00 · 1 участник
      - button "Пригласить друзей" [ref=f3e21] [cursor=pointer]
      - button "Информация о встрече" [ref=f3e24] [cursor=pointer]
    - list "Разговор встречи" [ref=f3e29]:
      - listitem [ref=f3e30]:
        - time [ref=f3e31]: Сегодня · 23:24
        - paragraph [ref=f3e32]: Саша создал встречу
      - listitem [ref=f3e33]:
        - generic [aria-hidden] [ref=f3e34]: С
        - generic [ref=f3e35]:
          - generic [ref=f3e36]:
            - strong [ref=f3e37]: Саша
            - time [ref=f3e38]: 23:24
          - 'group "Реакции на сообщение: Принесу чай" [ref=f3e39]':
            - paragraph [ref=f3e40]: Принесу чай
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
  48  |       });
  49  | 
  50  |       return;
  51  |     }
  52  | 
  53  |     await route.fulfill({
  54  |       json: {
  55  |         id: session.user.id,
  56  |         display_name: session.user.display_name,
  57  |         avatar_url: null,
  58  |         email: null,
  59  |         phone: null,
  60  |         provider: 'yandex',
  61  |       },
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
  144 |   await row.getByTestId('message-actions').press('Enter');
  145 |   await page
  146 |     .getByRole('dialog', { name: 'Реакция', exact: true })
  147 |     .getByRole('button', { name: '👍', exact: true })
> 148 |     .click();
      |      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  149 |   await expect(row.getByRole('button', { name: '👍: 1' })).toHaveAttribute(
  150 |     'aria-pressed',
  151 |     'true',
  152 |   );
  153 |   await page.reload();
  154 |   await expect(row.getByRole('button', { name: '👍: 1' })).toHaveAttribute(
  155 |     'aria-pressed',
  156 |     'true',
  157 |   );
  158 |   await row.getByRole('button', { name: '👍: 1' }).press('Shift+F10');
  159 |   await expect(
  160 |     page.getByRole('dialog', { name: 'Кто отреагировал', exact: true }),
  161 |   ).toContainText('Саша');
  162 |   await page.keyboard.press('Escape');
  163 |   await row.getByRole('button', { name: '👍: 1' }).click();
  164 |   await expect(row.getByRole('button', { name: '👍: 1' })).toHaveCount(0);
  165 | });
  166 | 
  167 | test('one hour cutoff is reflected after server refresh without losing current members', async ({
  168 |   page,
  169 |   browser,
  170 | }) => {
  171 |   await login(page, 'Саша');
  172 |   const created = await apiCreate(page, 'Отсечка');
  173 |   const changed = await page.request.patch(`/api/v1/meetings/${created.meeting.id}`, {
  174 |     headers: await writeHeaders(page),
  175 |     data: {
  176 |       expected_revision: created.meeting.revision,
  177 |       starts_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  178 |       starts_on: new Date().toISOString().slice(0, 10),
  179 |       timezone: 'UTC',
  180 |     },
  181 |   });
  182 | 
  183 |   expect(changed.ok()).toBe(true);
  184 |   const context = await browser.newContext({ ignoreHTTPSErrors: true });
  185 |   const guest = await context.newPage();
  186 |   await login(guest, 'Лена');
  187 |   await guest.goto(new URL(created.invitation_url).pathname);
  188 |   await expect(guest.getByRole('button', { name: 'Приду', exact: true })).toBeDisabled();
  189 |   await expect(
  190 |     guest.getByText('Участие закрыто за час до начала встречи.'),
  191 |   ).toBeVisible();
  192 |   await page.goto(`/meetings/${created.meeting.id}`);
  193 |   await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible();
  194 |   await context.close();
  195 | });
  196 | 
  197 | test('private profile displays provider fields without inventing a birth year', async ({
  198 |   page,
  199 | }) => {
  200 |   await login(page, 'Саша');
  201 |   const session = sessionSchema.parse(
  202 |     await (await page.request.get('/api/v1/me')).json(),
  203 |   );
  204 | 
  205 |   await page.route('**/api/v1/me/profile', (route) =>
  206 |     route.fulfill({
  207 |       json: {
  208 |         id: session.user.id,
  209 |         display_name: 'Саша',
  210 |         avatar_url: null,
  211 |         email: 'sasha@example.com',
  212 |         phone: null,
  213 |         provider: 'yandex',
  214 |         login: 'sasha',
  215 |         first_name: 'Александр',
  216 |         last_name: 'Иванов',
  217 |         birthday: '0000-12-23',
  218 |         sex: 'male',
  219 |       },
  220 |     }),
  221 |   );
  222 |   await page.goto('/profile');
  223 |   const details = page.getByRole('region', { name: 'Личные данные' });
  224 |   await expect(details).toContainText('sasha');
  225 |   await expect(details).toContainText('Александр');
  226 |   await expect(details).toContainText('Иванов');
  227 |   await expect(details.getByText('23 декабря', { exact: true })).toBeVisible();
  228 |   await expect(details).toContainText('Мужской');
  229 |   await expect(details.getByRole('textbox')).toHaveCount(0);
  230 | });
  231 | 
```