# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 33-chat-action-sheets.spec.ts >> TC-CHAT-INFO-EXPAND: both roles reveal the real roster and retain independent actions
- Location: tests/33-chat-action-sheets.spec.ts:6:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('button', { name: 'Информация о встрече', exact: true })
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" getByRole('button', { name: 'Информация о встрече', exact: true }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Информация о встрече', exact: true })
    14 × locator resolved to <button type="button" aria-label="Информация о встрече" class="_icon_11cfe_20 _ghost_11cfe_15">…</button>
       - unexpected value "inactive"

```

```yaml
- button "Информация о встрече"
```

# Test source

```ts
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
  97  |           const share = actionSurface(viewer, 'Пригласить друзей');
  98  | 
  99  |           await expect(share).toHaveAttribute('data-motion', 'open');
  100 |           await expect(info).not.toBeVisible();
  101 |           await expect(viewer.locator('dialog:modal')).toHaveCount(width < 740 ? 1 : 0);
  102 |           await share
  103 |             .getByRole('button', {
  104 |               name: width < 740 ? 'Закрыть' : 'Назад',
  105 |               exact: true,
  106 |             })
  107 |             .click();
  108 |           await expect(info).toHaveAttribute('data-motion', 'open');
  109 |         }
  110 | 
  111 |         await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  112 |         await expect(info).not.toBeVisible();
> 113 |         await expect(open).toBeFocused();
      |                            ^ Error: expect(locator).toBeFocused() failed
  114 |         await expect(composer).toHaveValue('Черновик под составом');
  115 |       }
  116 |     }
  117 |   } finally {
  118 |     await fixture.close();
  119 |   }
  120 | });
  121 | 
  122 | for (const kind of ['date', 'place'] as const) {
  123 |   test(`${kind} poll freezes a committed request after a lost response and retries after reopening`, async ({
  124 |     page,
  125 |   }) => {
  126 |     await page.setViewportSize({ width: 390, height: 844 });
  127 |     await login(page, 'Саша');
  128 |     const { meeting } = await apiCreate(page, 'Опрос без дубликата');
  129 |     await page.goto(`/meetings/${meeting.id}`);
  130 |     const keys: string[] = [];
  131 |     const bodies: string[] = [];
  132 |     const ids: string[] = [];
  133 |     await page.route(`**/api/v1/meetings/${meeting.id}/${kind}-polls`, async (route) => {
  134 |       if (route.request().method() !== 'POST') {
  135 |         await route.continue();
  136 | 
  137 |         return;
  138 |       }
  139 | 
  140 |       keys.push(route.request().headers()['idempotency-key'] ?? '');
  141 |       bodies.push(route.request().postData() ?? '');
  142 |       const response = await route.fetch();
  143 |       expect(response.ok()).toBe(true);
  144 |       const body: unknown = await response.json();
  145 |       const poll =
  146 |         kind === 'date' ? datePollSchema.parse(body) : placePollSchema.parse(body);
  147 | 
  148 |       ids.push(poll.id);
  149 | 
  150 |       if (keys.length === 1) {
  151 |         await route.abort('failed');
  152 |       } else {
  153 |         await route.fulfill({ response });
  154 |       }
  155 |     });
  156 |     const title = kind === 'date' ? 'Предложить дату' : 'Предложить место';
  157 |     await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  158 |     await page.getByRole('menuitem', { name: title, exact: true }).click();
  159 |     const sheet = page.getByRole('dialog', { name: title, exact: true });
  160 | 
  161 |     if (kind === 'place') {
  162 |       await sheet.getByLabel('Новое место').fill('Кафе у парка');
  163 |       await sheet.getByLabel('Почему здесь').fill('Здесь есть большой стол');
  164 |     }
  165 | 
  166 |     await sheet
  167 |       .getByRole('button', {
  168 |         name: kind === 'date' ? 'Создать опрос' : 'Предложить место',
  169 |         exact: true,
  170 |       })
  171 |       .click();
  172 |     const retry = sheet.getByRole('button', { name: 'Повторить отправку', exact: true });
  173 |     await expect(retry).toBeEnabled();
  174 |     const form = sheet.locator('form:visible');
  175 |     await expect(form).toHaveCount(1);
  176 |     const inputs = form.locator('input, textarea, select');
  177 |     expect(await inputs.count()).toBeGreaterThan(0);
  178 | 
  179 |     for (const input of await inputs.all()) {
  180 |       await expect(input).toBeDisabled();
  181 |     }
  182 | 
  183 |     if (kind === 'date') {
  184 |       await expect(
  185 |         sheet.getByRole('button', { name: 'Добавить вариант' }),
  186 |       ).toBeDisabled();
  187 |     }
  188 | 
  189 |     await sheet.getByRole('button', { name: 'Закрыть', exact: true }).click();
  190 |     await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  191 |     await page.getByRole('menuitem', { name: title, exact: true }).click();
  192 | 
  193 |     for (const input of await inputs.all()) {
  194 |       await expect(input).toBeDisabled();
  195 |     }
  196 | 
  197 |     await retry.click();
  198 |     await expect(sheet).not.toBeVisible();
  199 |     expect(keys).toHaveLength(2);
  200 |     expect(keys[0]).toBeTruthy();
  201 |     expect(keys[1]).toBe(keys[0]);
  202 |     expect(bodies[1]).toBe(bodies[0]);
  203 |     expect(ids[1]).toBe(ids[0]);
  204 |     await expect(
  205 |       page.getByRole('region', {
  206 |         name: kind === 'date' ? 'Опрос о дате' : 'Опрос о месте',
  207 |       }),
  208 |     ).toHaveCount(1);
  209 |   });
  210 | }
  211 | 
  212 | test('mobile task sheet preserves an uncertain request across close and resize', async ({
  213 |   page,
```