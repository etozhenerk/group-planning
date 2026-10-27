# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 15-poll-modal.spec.ts >> date action adapts to sheet, preserves draft, handles calendar and validation at 1440px
- Location: tests/15-poll-modal.spec.ts:5:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('dialog')
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByRole('dialog') with timeout 5000ms
  - waiting for getByRole('dialog')
    14 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=f3e3]:
  - link "К содержимому" [ref=f3e4] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=f3e5]: Демостенд · данные хранятся до перезапуска
  - generic [ref=f3e6]:
    - navigation "Основная навигация" [ref=f3e8]:
      - link "Somewhere — на главную" [ref=f3e10] [cursor=pointer]:
        - /url: /
        - generic [ref=f3e11]: somewhere
      - generic [ref=f3e12]:
        - link "Встречи" [ref=f3e13] [cursor=pointer]:
          - /url: /meetings
          - generic [ref=f3e16]: Мои встречи
        - link "Приглашения" [ref=f3e17] [cursor=pointer]:
          - /url: /invitations
        - link "Сообщить о проблеме" [ref=f3e22] [cursor=pointer]:
          - /url: /support
        - link "Профиль" [ref=f3e26] [cursor=pointer]:
          - /url: /profile
          - generic [aria-hidden] [ref=f3e28]: С
          - generic [ref=f3e29]:
            - strong [ref=f3e30]: Саша
            - generic [ref=f3e31]: Мой профиль
    - generic [ref=f3e32]:
      - main [ref=f3e33]:
        - generic [ref=f3e34]:
          - link "К моим встречам" [ref=f3e35] [cursor=pointer]:
            - /url: /meetings
          - generic [ref=f3e38]:
            - heading "Дата в панели" [level=1] [ref=f3e39]
            - paragraph [ref=f3e40]: 1 участник · 24 октября · 19:00
          - button "Пригласить друзей" [ref=f3e42] [cursor=pointer]
          - button "Информация о встрече" [ref=f3e46] [cursor=pointer]
        - link "Как всё прошло? Добавить фото" [ref=f3e51] [cursor=pointer]:
          - /url: /meetings/7f1eb168-8de1-42db-85ad-c22d1cfded01/memories?from=chat
          - generic [ref=f3e52]:
            - generic [ref=f3e53]: Встреча закончилась
            - strong [ref=f3e54]: Как всё прошло?
            - generic [ref=f3e55]:
              - text: Добавить фото
              - generic [aria-hidden] [ref=f3e56]: ↗
          - generic [aria-hidden] [ref=f3e57]: ✦
        - generic [ref=f3e58]:
          - list "Разговор встречи" [ref=f3e59]:
            - listitem [ref=f3e60]:
              - time [ref=f3e61]: Сегодня · 19:27
              - paragraph [ref=f3e62]: Саша создал встречу
          - generic [ref=f3e63]:
            - heading "Позовём остальных?" [level=2] [ref=f3e68]
            - paragraph [ref=f3e69]: Отправьте друзьям ссылку на встречу.После ответа «Приду» они появятся в чате.
            - button "Пригласить друзей" [ref=f3e70] [cursor=pointer]
        - generic [ref=f3e77]:
          - button "Добавить к встрече" [ref=f3e79] [cursor=pointer]
          - generic [ref=f3e81]:
            - generic [ref=f3e82]:
              - generic [ref=f3e83]: Сообщение
              - textbox "Сообщение" [ref=f3e84]:
                - /placeholder: Сообщение…
                - text: Черновик разговора
            - button "Выбрать эмодзи" [ref=f3e85] [cursor=pointer]
          - button "Отправить сообщение" [ref=f3e91] [cursor=pointer]
      - dialog [ref=f3e94]:
        - generic [ref=f3e96]:
          - heading "Предложить дату" [level=2] [ref=f3e97]
          - button "Закрыть" [active] [ref=f3e98] [cursor=pointer]
        - generic [ref=f3e104]:
          - generic [ref=f3e106]:
            - group "Даты" [ref=f3e107]:
              - generic [ref=f3e110]:
                - generic [ref=f3e111]: Вариант 1
                - group [ref=f3e113]:
                  - generic [ref=f3e115]:
                    - combobox "Вариант 1" [ref=f3e116]: ⁦⁨24⁩⁨.⁩⁨10⁩⁨.⁩⁨2026⁩⁩
                    - button "Календарь" [ref=f3e118] [cursor=pointer]
              - generic [ref=f3e125]:
                - generic [ref=f3e126]: Вариант 2
                - group [ref=f3e128]:
                  - generic [ref=f3e130]:
                    - combobox "Вариант 2" [ref=f3e131]: ⁦⁨25⁩⁨.⁩⁨10⁩⁨.⁩⁨2026⁩⁩
                    - button "Календарь" [ref=f3e133] [cursor=pointer]
              - button "Добавить вариант" [ref=f3e139] [cursor=pointer]
            - group "Опрос завершится" [ref=f3e141]:
              - generic [ref=f3e143]:
                - generic [ref=f3e144]:
                  - generic [ref=f3e145]: Дата
                  - group [ref=f3e147]:
                    - generic [ref=f3e149]:
                      - combobox "Дата" [ref=f3e150]: ⁦⁨28⁩⁨.⁩⁨10⁩⁨.⁩⁨2026⁩⁩
                      - button "Очистить" [ref=f3e151] [cursor=pointer]
                      - button "Календарь" [ref=f3e158] [cursor=pointer]
                - generic [ref=f3e164]:
                  - generic [ref=f3e165]: Время
                  - textbox "Время" [ref=f3e168]:
                    - /placeholder: 19:00
                    - text: 19:27
              - generic [ref=f3e173]: Москва
            - group "Настройки" [ref=f3e174]:
              - generic [ref=f3e175]:
                - generic [ref=f3e176]: Можно выбрать несколько дат
                - checkbox "Можно выбрать несколько дат" [checked] [ref=f3e177] [cursor=pointer]
              - generic [ref=f3e178]:
                - generic [ref=f3e179]: Можно изменить голос
                - checkbox "Можно изменить голос" [checked] [ref=f3e180] [cursor=pointer]
              - generic [ref=f3e181]:
                - generic [ref=f3e182]: Можно добавить дату
                - checkbox "Можно добавить дату" [checked] [ref=f3e183] [cursor=pointer]
              - generic [ref=f3e184]:
                - generic [ref=f3e185]: Анонимное голосование
                - checkbox "Анонимное голосование" [ref=f3e186] [cursor=pointer]
              - generic [ref=f3e187]:
                - generic [ref=f3e188]: Скрывать результаты до завершения
                - checkbox "Скрывать результаты до завершения" [ref=f3e189] [cursor=pointer]
          - button "Создать опрос" [ref=f3e191] [cursor=pointer]
      - complementary [ref=f3e192]:
        - generic [ref=f3e193]:
          - generic [ref=f3e194]:
            - generic [ref=f3e195]:
              - term [ref=f3e196]: Когда
              - definition [ref=f3e197]:
                - generic [ref=f3e198]: 24 октября в 19:00
                - generic [ref=f3e199]: Москва
            - generic [ref=f3e200]:
              - term [ref=f3e201]: Где
              - definition [ref=f3e202]: Место пока не выбрано
          - generic [ref=f3e203]:
            - heading "Кто придёт · 1" [level=3] [ref=f3e204]
            - 'button "Все участники встречи. Придут: 1" [ref=f3e205] [cursor=pointer]':
              - generic "Саша" [ref=f3e206]:
                - generic [aria-hidden] [ref=f3e207]: С
                - text: Саша
          - link "Фото встречи" [ref=f3e208] [cursor=pointer]:
            - /url: /meetings/7f1eb168-8de1-42db-85ad-c22d1cfded01/memories?from=chat
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { actionSurface, apiCreate, login } from '@tests/helpers';
  3  | 
  4  | for (const width of [320, 390, 1440]) {
  5  |   test(`date action adapts to sheet, preserves draft, handles calendar and validation at ${width}px`, async ({
  6  |     page,
  7  |   }) => {
  8  |     await page.setViewportSize({ width, height: 844 });
  9  |     await login(page, 'Саша');
  10 |     const { meeting } = await apiCreate(
  11 |       page,
  12 |       'Дата в панели',
  13 |       '2026-10-24T19:00:00+03:00',
  14 |     );
  15 | 
  16 |     await page.goto(`/meetings/${meeting.id}`);
  17 |     const open = page.getByRole('button', { name: 'Добавить к встрече' });
  18 |     await page.getByLabel('Сообщение', { exact: true }).fill('Черновик разговора');
  19 |     await open.click();
  20 |     await page.getByRole('menuitem', { name: 'Предложить дату', exact: true }).click();
  21 |     const screen = actionSurface(page, 'Предложить дату');
  22 |     await expect(screen).toBeVisible();
  23 |     await expect(page).toHaveURL(/action=date$/);
> 24 |     await expect(page.getByRole('dialog')).toHaveCount(width < 740 ? 1 : 0);
     |                                            ^ Error: expect(locator).toHaveCount(expected) failed
  25 |     await expect(page.locator('body')).toHaveCSS(
  26 |       'position',
  27 |       width < 740 ? 'fixed' : 'static',
  28 |     );
  29 |     await expect(
  30 |       page.getByRole('navigation', { name: 'Основная навигация' }),
  31 |     ).toBeVisible({ visible: width >= 740 });
  32 |     await expect(screen.getByRole('checkbox')).toHaveCount(5);
  33 |     const dateRole = width < 740 ? 'button' : 'combobox';
  34 |     const first = screen.getByRole(dateRole, { name: 'Вариант 1', exact: true });
  35 |     const expectSelectedDate = async () => {
  36 |       if (width < 740) {
  37 |         await expect(first).toHaveAttribute('data-date', '27.10.2026');
  38 |         await expect(first).toHaveText('27 октября');
  39 |       } else {
  40 |         await expect(first).toHaveValue(/27.*10.*2026/);
  41 |       }
  42 |     };
  43 | 
  44 |     await first.click();
  45 |     const popup = page.locator('.g-popup').filter({ has: page.getByRole('grid') });
  46 |     await expect(popup).toBeVisible();
  47 |     const bounds = await popup.boundingBox();
  48 |     expect(bounds?.x).toBeGreaterThanOrEqual(0);
  49 |     expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
  50 |     await popup.getByRole('button', { name: /27 октября 2026/ }).click();
  51 |     await expectSelectedDate();
  52 |     await screen.getByRole('button', { name: 'Добавить вариант' }).click();
  53 |     await screen.getByRole('button', { name: 'Создать опрос', exact: true }).click();
  54 |     const third = screen.getByRole(dateRole, { name: 'Вариант 3', exact: true });
  55 |     await expect(third).toBeFocused();
  56 |     await expect(third).toHaveAttribute('aria-invalid', 'true');
  57 |     await expect(
  58 |       screen.getByRole('alert').filter({ hasText: 'Выберите дату.' }),
  59 |     ).toBeInViewport();
  60 |     await third.click();
  61 |     await popup.getByRole('button', { name: /27 октября 2026/ }).click();
  62 |     await screen.getByRole('button', { name: 'Создать опрос', exact: true }).click();
  63 |     await expect(
  64 |       screen.getByRole('alert').filter({ hasText: 'Эта дата уже есть в опросе.' }),
  65 |     ).toBeInViewport();
  66 |     await screen.getByRole('button', { name: 'Удалить вариант 3' }).click();
  67 |     await expect(third).toHaveCount(0);
  68 |     await screen
  69 |       .getByRole('button', { name: width < 740 ? 'Закрыть' : 'Назад', exact: true })
  70 |       .click();
  71 |     await expect(page.getByLabel('Сообщение', { exact: true })).toHaveValue(
  72 |       'Черновик разговора',
  73 |     );
  74 |     await expect(open).toBeFocused();
  75 |     await open.click();
  76 |     await page.getByRole('menuitem', { name: 'Предложить дату', exact: true }).click();
  77 |     await expectSelectedDate();
  78 |     await first.press('Alt+ArrowDown');
  79 |     await expect(popup).toBeVisible();
  80 |     await page.keyboard.press('Escape');
  81 |     await expect(popup).not.toBeVisible();
  82 |     await expect(screen).toBeVisible();
  83 |     await page.keyboard.press('Escape');
  84 |     await expect(screen).not.toBeVisible();
  85 |     await expect(open).toBeFocused();
  86 |     await page.goForward();
  87 |     await expect(screen).toBeVisible();
  88 |     await expectSelectedDate();
  89 |     await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
  90 |     await page.screenshot({
  91 |       path: `test-results/action-date-${width}.png`,
  92 |       fullPage: true,
  93 |       animations: 'disabled',
  94 |     });
  95 |   });
  96 | }
  97 | 
```