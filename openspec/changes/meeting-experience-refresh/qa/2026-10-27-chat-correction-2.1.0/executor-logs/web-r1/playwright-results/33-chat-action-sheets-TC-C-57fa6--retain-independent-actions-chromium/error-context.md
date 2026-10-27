# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 33-chat-action-sheets.spec.ts >> TC-CHAT-INFO-EXPAND: both roles reveal the real roster and retain independent actions
- Location: tests/33-chat-action-sheets.spec.ts:6:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('dialog:modal')
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('dialog:modal') with timeout 5000ms
  - waiting for locator('dialog:modal')
    14 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=f5e3]:
  - link "К содержимому" [ref=f5e4] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=f5e5]: Демостенд · данные хранятся до перезапуска
  - generic [ref=f5e6]:
    - navigation "Основная навигация" [ref=f5e8]:
      - link "Somewhere — на главную" [ref=f5e10] [cursor=pointer]:
        - /url: /
        - generic [ref=f5e11]: somewhere
      - generic [ref=f5e12]:
        - link "Встречи" [ref=f5e13] [cursor=pointer]:
          - /url: /meetings
          - generic [ref=f5e16]: Мои встречи
        - link "Приглашения" [ref=f5e17] [cursor=pointer]:
          - /url: /invitations
        - link "Сообщить о проблеме" [ref=f5e22] [cursor=pointer]:
          - /url: /support
        - link "Профиль" [ref=f5e26] [cursor=pointer]:
          - /url: /profile
          - generic [aria-hidden] [ref=f5e28]: С
          - generic [ref=f5e29]:
            - strong [ref=f5e30]: Саша
            - generic [ref=f5e31]: Мой профиль
    - generic [ref=f5e32]:
      - main [ref=f5e33]:
        - generic [ref=f5e34]:
          - link "К моим встречам" [ref=f5e35] [cursor=pointer]:
            - /url: /meetings
          - generic [ref=f5e38]:
            - heading "Состав встречи" [level=1] [ref=f5e39]
            - paragraph [ref=f5e40]: 6 участников · 24 октября · 19:00
          - button "Пригласить друзей" [ref=f5e42] [cursor=pointer]
          - button "Информация о встрече" [ref=f5e46] [cursor=pointer]
        - list "Разговор встречи" [ref=f5e52]:
          - listitem [ref=f5e53]:
            - time [ref=f5e54]: Сегодня · 19:30
            - paragraph [ref=f5e55]: Саша создал встречу
          - listitem [ref=f5e56]:
            - time [ref=f5e57]: Сегодня · 19:30
            - paragraph [ref=f5e58]: Лена ответил «Приду»
          - listitem [ref=f5e59]:
            - time [ref=f5e60]: Сегодня · 19:30
            - paragraph [ref=f5e61]: Миша ответил «Приду»
          - listitem [ref=f5e62]:
            - time [ref=f5e63]: Сегодня · 19:30
            - paragraph [ref=f5e64]: Аня ответил «Приду»
          - listitem [ref=f5e65]:
            - time [ref=f5e66]: Сегодня · 19:30
            - paragraph [ref=f5e67]: Дима ответил «Приду»
          - listitem [ref=f5e68]:
            - time [ref=f5e69]: Сегодня · 19:30
            - paragraph [ref=f5e70]: Катя ответил «Приду»
          - listitem [ref=f5e71]:
            - time [ref=f5e72]: Сегодня · 19:30
            - paragraph [ref=f5e73]: Олег ответил «Возможно»
          - listitem [ref=f5e74]:
            - time [ref=f5e75]: Сегодня · 19:30
            - paragraph [ref=f5e76]: Ира ответил «Не смогу»
        - generic [ref=f5e79]:
          - button "Добавить к встрече" [ref=f5e81] [cursor=pointer]
          - generic [ref=f5e83]:
            - generic [ref=f5e84]:
              - generic [ref=f5e85]: Сообщение
              - textbox "Сообщение" [ref=f5e86]:
                - /placeholder: Сообщение…
                - text: Черновик под составом
            - button "Выбрать эмодзи" [ref=f5e87] [cursor=pointer]
          - button "Отправить сообщение" [ref=f5e93] [cursor=pointer]
      - dialog [ref=f5e96]:
        - generic [ref=f5e98]:
          - heading "Пригласить друзей" [level=2] [ref=f5e99]
          - button "Закрыть" [active] [ref=f5e100] [cursor=pointer]
        - generic [ref=f5e106]:
          - paragraph [ref=f5e107]: Отправьте ссылку тем, кого хотите позвать.
          - generic [ref=f5e108]:
            - text: Ссылка приглашения
            - textbox "Ссылка приглашения" [ref=f5e109]: https://127.0.0.1:8444/i/UlAeiCsjwX5KoD3yjTerug
          - button "Скопировать ссылку" [ref=f5e110] [cursor=pointer]
```

# Test source

```ts
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
> 108 |           await expect(viewer.locator('dialog:modal')).toHaveCount(width < 740 ? 1 : 0);
      |                                                        ^ Error: expect(locator).toHaveCount(expected) failed
  109 |           await share
  110 |             .getByRole('button', {
  111 |               name: width < 740 ? 'Закрыть' : 'Назад',
  112 |               exact: true,
  113 |             })
  114 |             .click();
  115 |           await expect(info).toHaveAttribute('data-motion', 'open');
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
```