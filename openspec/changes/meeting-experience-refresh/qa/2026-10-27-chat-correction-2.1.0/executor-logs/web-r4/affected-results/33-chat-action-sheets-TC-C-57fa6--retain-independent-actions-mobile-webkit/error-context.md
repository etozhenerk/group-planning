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

Locator: getByRole('dialog', { name: 'Состав встречи', exact: true })
Expected: "open"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByRole('dialog', { name: 'Состав встречи', exact: true }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Состав встречи', exact: true })

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
  - heading "Состав встречи" [level=1]
  - paragraph: 6 участников · 24 октября · 19:00
  - button "Пригласить друзей"
  - button "Информация о встрече"
  - list "Разговор встречи":
    - listitem:
      - time: Сегодня · 19:44
      - paragraph: Саша создал встречу
    - listitem:
      - time: Сегодня · 19:44
      - paragraph: Лена ответил «Приду»
    - listitem:
      - time: Сегодня · 19:44
      - paragraph: Миша ответил «Приду»
    - listitem:
      - time: Сегодня · 19:44
      - paragraph: Аня ответил «Приду»
    - listitem:
      - time: Сегодня · 19:44
      - paragraph: Дима ответил «Приду»
    - listitem:
      - time: Сегодня · 19:44
      - paragraph: Катя ответил «Приду»
    - listitem:
      - time: Сегодня · 19:44
      - paragraph: Олег ответил «Возможно»
    - listitem:
      - time: Сегодня · 19:44
      - paragraph: Ира ответил «Не смогу»
  - button "Добавить к встрече"
  - text: Сообщение
  - textbox "Сообщение":
    - /placeholder: Сообщение…
    - text: Черновик под составом
  - button "Выбрать эмодзи"
  - button "Отправить сообщение"
```

# Test source

```ts
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
  53  |           name: width < 740 ? 'Настройки встречи' : 'Изменить настройки',
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
  64  |         await expect(chips).toContainText(width < 740 ? '+3' : 'ещё 3');
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
  78  |           info.getByRole('heading', {
  79  |             name: width < 740 ? /^Все ответы\s*8$/ : 'Участники',
  80  |             exact: true,
  81  |           }),
  82  |         ).toBeVisible();
  83  |         await expect(roster.getByText('Организатор', { exact: true })).toHaveCount(1);
  84  |         await expect(roster.getByText('Возможно', { exact: true })).toHaveCount(1);
  85  |         await expect(roster.getByText('Не смогу', { exact: true })).toHaveCount(1);
  86  |         const last = roster.getByRole('listitem').last();
  87  |         await last.scrollIntoViewIfNeeded();
  88  |         await expect(last).toBeInViewport({ ratio: 1 });
  89  |         await expect(organizer ? settings : answer).toBeEnabled();
  90  |         const collapse = info.getByRole('button', {
  91  |           name: width < 740 ? 'Свернуть список' : 'Скрыть состав',
  92  |           exact: true,
  93  |         });
  94  | 
  95  |         await collapse.click();
  96  |         await expect(roster).toHaveCount(0);
  97  |         await expect(chips).toBeFocused();
  98  |         await chips.press('Enter');
  99  |         await expect(roster.getByRole('listitem')).toHaveCount(8);
  100 |         await expect(collapse).toBeFocused();
  101 | 
  102 |         if (organizer) {
  103 |           await invite.click();
  104 |           const share = actionSurface(viewer, 'Пригласить друзей');
  105 | 
  106 |           await expect(share).toHaveAttribute('data-motion', 'open');
  107 |           await expect(info).not.toBeVisible();
  108 |           await expect(viewer.locator('dialog:modal')).toHaveCount(1);
  109 |           await share
  110 |             .getByRole('button', {
  111 |               name: 'Закрыть',
  112 |               exact: true,
  113 |             })
  114 |             .click();
> 115 |           await expect(info).toHaveAttribute('data-motion', 'open');
      |                              ^ Error: expect(locator).toHaveAttribute(expected) failed
  116 |         }
  117 | 
  118 |         await info.getByRole('button', { name: 'Закрыть', exact: true }).click();
  119 |         await expect(info).not.toBeVisible();
  120 |         await expect(open).toBeFocused();
  121 |         await expect(composer).toHaveValue('Черновик под составом');
  122 |       }
  123 |     }
  124 |   } finally {
  125 |     await fixture.close();
  126 |   }
  127 | });
  128 | 
  129 | for (const kind of ['date', 'place'] as const) {
  130 |   test(`${kind} poll freezes a committed request after a lost response and retries after reopening`, async ({
  131 |     page,
  132 |   }) => {
  133 |     await page.setViewportSize({ width: 390, height: 844 });
  134 |     await login(page, 'Саша');
  135 |     const { meeting } = await apiCreate(page, 'Опрос без дубликата');
  136 |     await page.goto(`/meetings/${meeting.id}`);
  137 |     const keys: string[] = [];
  138 |     const bodies: string[] = [];
  139 |     const ids: string[] = [];
  140 |     await page.route(`**/api/v1/meetings/${meeting.id}/${kind}-polls`, async (route) => {
  141 |       if (route.request().method() !== 'POST') {
  142 |         await route.continue();
  143 | 
  144 |         return;
  145 |       }
  146 | 
  147 |       keys.push(route.request().headers()['idempotency-key'] ?? '');
  148 |       bodies.push(route.request().postData() ?? '');
  149 |       const response = await route.fetch();
  150 |       expect(response.ok()).toBe(true);
  151 |       const body: unknown = await response.json();
  152 |       const poll =
  153 |         kind === 'date' ? datePollSchema.parse(body) : placePollSchema.parse(body);
  154 | 
  155 |       ids.push(poll.id);
  156 | 
  157 |       if (keys.length === 1) {
  158 |         await route.abort('failed');
  159 |       } else {
  160 |         await route.fulfill({ response });
  161 |       }
  162 |     });
  163 |     const title = kind === 'date' ? 'Предложить дату' : 'Предложить место';
  164 |     await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  165 |     await page.getByRole('menuitem', { name: title, exact: true }).click();
  166 |     const sheet = page.getByRole('dialog', { name: title, exact: true });
  167 | 
  168 |     if (kind === 'place') {
  169 |       await sheet.getByLabel('Новое место').fill('Кафе у парка');
  170 |       await sheet.getByLabel('Почему здесь').fill('Здесь есть большой стол');
  171 |     }
  172 | 
  173 |     await sheet
  174 |       .getByRole('button', {
  175 |         name: kind === 'date' ? 'Создать опрос' : 'Предложить место',
  176 |         exact: true,
  177 |       })
  178 |       .click();
  179 |     const retry = sheet.getByRole('button', { name: 'Повторить отправку', exact: true });
  180 |     await expect(retry).toBeEnabled();
  181 |     const form = sheet.locator('form:visible');
  182 |     await expect(form).toHaveCount(1);
  183 |     const inputs = form.locator('input, textarea, select');
  184 |     expect(await inputs.count()).toBeGreaterThan(0);
  185 | 
  186 |     for (const input of await inputs.all()) {
  187 |       await expect(input).toBeDisabled();
  188 |     }
  189 | 
  190 |     if (kind === 'date') {
  191 |       const dates = form.getByRole('button', { name: /^(Вариант \d+|Дата)$/ });
  192 |       await expect(dates).toHaveCount(3);
  193 | 
  194 |       for (const date of await dates.all()) {
  195 |         await expect(date).toBeDisabled();
  196 |       }
  197 |     }
  198 | 
  199 |     if (kind === 'date') {
  200 |       await expect(
  201 |         sheet.getByRole('button', { name: 'Добавить вариант', exact: true }),
  202 |       ).toBeDisabled();
  203 |     }
  204 | 
  205 |     await sheet.getByRole('button', { name: 'Закрыть', exact: true }).click();
  206 |     await page.getByRole('button', { name: 'Добавить к встрече' }).click();
  207 |     await page.getByRole('menuitem', { name: title, exact: true }).click();
  208 | 
  209 |     for (const input of await inputs.all()) {
  210 |       await expect(input).toBeDisabled();
  211 |     }
  212 | 
  213 |     if (kind === 'date') {
  214 |       const dates = form.getByRole('button', { name: /^(Вариант \d+|Дата)$/ });
  215 |       await expect(dates).toHaveCount(3);
```