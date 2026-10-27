# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 37-chat-persistence.spec.ts >> two tabs share one durable intent owner while its POST is in flight
- Location: tests/37-chat-persistence.spec.ts:206:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByTestId('feed-message').filter({ hasText: 'Общий intent двух вкладок' })
Expected: "accepted"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByTestId('feed-message').filter({ hasText: 'Общий intent двух вкладок' }) with timeout 5000ms
  - waiting for getByTestId('feed-message').filter({ hasText: 'Общий intent двух вкладок' })

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
  - heading "Один владелец исходящего" [level=1]
  - paragraph: 1 участник · 24 октября · 19:00
  - button "Пригласить друзей"
  - button "Информация о встрече"
  - list "Разговор встречи":
    - listitem:
      - time: Сегодня · 23:24
      - paragraph: Саша создал встречу
  - heading "Позовём остальных?" [level=2]
  - paragraph: Отправьте друзьям ссылку на встречу. После ответа «Приду» они появятся в чате.
  - button "Пригласить друзей"
  - button "Добавить к встрече"
  - text: Сообщение
  - textbox "Сообщение":
    - /placeholder: Сообщение…
    - text: Общий intent двух вкладок
  - button "Выбрать эмодзи"
  - button "Отправить сообщение"
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
  135 |   context,
  136 | }) => {
  137 |   await login(page, 'Саша');
  138 |   const { meeting } = await apiCreate(page, 'Две вкладки');
  139 |   await page.goto(`/meetings/${meeting.id}`);
  140 |   const second = await context.newPage();
  141 |   await second.goto(`/meetings/${meeting.id}`);
  142 |   await second.getByLabel('Сообщение', { exact: true }).fill('Приватный черновик');
  143 |   await page.goto('/profile');
  144 |   await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  145 |   await expect(second.getByLabel('Сообщение', { exact: true })).toHaveCount(0);
  146 |   await expect
  147 |     .poll(() =>
  148 |       page.evaluate(
  149 |         () =>
  150 |           new Promise<number>((resolve, reject) => {
  151 |             const request = indexedDB.open('somewhere-private-chat', 1);
  152 |             request.onerror = () =>
  153 |               reject(request.error ?? new Error('IndexedDB failed'));
  154 |             request.onsuccess = () => {
  155 |               const db = request.result;
  156 |               const read = db.transaction('records').objectStore('records').count();
  157 |               read.onsuccess = () => {
  158 |                 db.close();
  159 |                 resolve(read.result);
  160 |               };
  161 |             };
  162 |           }),
  163 |       ),
  164 |     )
  165 |     .toBe(0);
  166 |   await second.close();
  167 | });
  168 | 
  169 | test('rejected intent retry keeps its key and restore never overwrites a newer draft', async ({
  170 |   page,
  171 | }) => {
  172 |   await login(page, 'Саша');
  173 |   const { meeting } = await apiCreate(page, 'Повтор и черновик');
  174 |   await page.goto(`/meetings/${meeting.id}`);
  175 |   const keys: (string | undefined)[] = [];
  176 |   await page.route(`**/meetings/${meeting.id}/messages`, async (route) => {
  177 |     keys.push(route.request().headers()['idempotency-key']);
  178 |     await route.fulfill({
  179 |       status: 422,
  180 |       contentType: 'application/json',
  181 |       body: JSON.stringify({ error: { code: 'validation_error' } }),
  182 |     });
  183 |   });
  184 |   const input = page.getByLabel('Сообщение', { exact: true });
  185 |   await input.fill('Сохранённое исходящее');
  186 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  187 |   const row = page
  188 |     .getByTestId('feed-message')
  189 |     .filter({ hasText: 'Сохранённое исходящее' });
  190 | 
  191 |   await expect(row).toHaveAttribute('data-delivery', 'rejected');
  192 |   await row.getByRole('button', { name: 'Повторить' }).click();
  193 |   await expect.poll(() => keys.length).toBe(2);
  194 |   expect(keys[0]).toBeTruthy();
  195 |   expect(keys[1]).toBe(keys[0]);
  196 |   await expect(row).toHaveAttribute('data-delivery', 'rejected');
  197 |   await input.fill('Новый черновик');
  198 |   await expect(row.getByRole('button', { name: 'Вернуть текст' })).toBeDisabled();
  199 |   await expect(input).toHaveValue('Новый черновик');
  200 |   await input.fill('');
  201 |   await row.getByRole('button', { name: 'Вернуть текст' }).click();
  202 |   await expect(input).toHaveValue('Сохранённое исходящее');
  203 |   await expect(row).toHaveCount(0);
  204 | });
  205 | 
  206 | test('two tabs share one durable intent owner while its POST is in flight', async ({
  207 |   page,
  208 |   context,
  209 | }) => {
  210 |   await login(page, 'Саша');
  211 |   const { meeting } = await apiCreate(page, 'Один владелец исходящего');
  212 |   await page.goto(`/meetings/${meeting.id}`);
  213 |   const second = await context.newPage();
  214 |   await second.goto(`/meetings/${meeting.id}`);
  215 |   await expect(second.getByLabel('Сообщение', { exact: true })).toBeVisible();
  216 |   let posts = 0;
  217 |   const gate: { release?: () => void } = {};
  218 |   await context.route(`**/meetings/${meeting.id}/messages`, async (route) => {
  219 |     posts += 1;
  220 |     await new Promise<void>((resolve) => {
  221 |       gate.release = resolve;
  222 |     });
  223 |     await route.continue();
  224 |   });
  225 |   await page.getByLabel('Сообщение', { exact: true }).fill('Общий intent двух вкладок');
  226 |   await page.getByRole('button', { name: 'Отправить сообщение' }).click();
  227 |   await expect.poll(() => posts).toBe(1);
  228 |   await page.waitForTimeout(3_500);
  229 |   expect(posts).toBe(1);
  230 |   gate.release?.();
  231 | 
  232 |   for (const target of [page, second]) {
  233 |     await expect(
  234 |       target.getByTestId('feed-message').filter({ hasText: 'Общий intent двух вкладок' }),
> 235 |     ).toHaveAttribute('data-delivery', 'accepted');
      |       ^ Error: expect(locator).toHaveAttribute(expected) failed
  236 |   }
  237 | 
  238 |   expect(posts).toBe(1);
  239 |   const feed = feedSchema.parse(
  240 |     await (await page.request.get(`/api/v1/meetings/${meeting.id}/feed?limit=50`)).json(),
  241 |   );
  242 | 
  243 |   expect(feed.entries.filter((entry) => entry.kind === 'message')).toHaveLength(1);
  244 |   await second.close();
  245 | });
  246 | 
```