# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 33-chat-action-sheets.spec.ts >> TC-CHAT-INFO-EXPAND: both roles reveal the real roster and retain independent actions
- Location: tests/33-chat-action-sheets.spec.ts:6:1

# Error details

```
Error: ENOENT: no such file or directory, open '/private/tmp/somewhere-web-resume-20261028/openspec/changes/meeting-experience-refresh/assets/boardgame.png'
```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - link "К содержимому" [ref=f2e4] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=f2e5]: Демостенд · данные хранятся до перезапуска
  - generic [ref=f2e6]:
    - navigation "Основная навигация" [ref=f2e8]:
      - link "Somewhere — на главную" [ref=f2e10] [cursor=pointer]:
        - /url: /
        - generic [ref=f2e11]: somewhere
      - generic [ref=f2e12]:
        - link "Встречи" [ref=f2e13] [cursor=pointer]:
          - /url: /meetings
          - generic [ref=f2e16]: Мои встречи
        - link "Приглашения" [ref=f2e17] [cursor=pointer]:
          - /url: /invitations
        - link "Сообщить о проблеме" [ref=f2e22] [cursor=pointer]:
          - /url: /support
        - link "Профиль" [ref=f2e26] [cursor=pointer]:
          - /url: /profile
          - generic [aria-hidden] [ref=f2e28]: С
          - generic [ref=f2e29]:
            - strong [ref=f2e30]: Саша
            - generic [ref=f2e31]: Мой профиль
    - main [active] [ref=f2e33]:
      - generic [ref=f2e35]:
        - heading "Мои встречи" [level=1] [ref=f2e36]
        - link "Создать встречу" [ref=f2e37] [cursor=pointer]:
          - /url: /meetings/new
          - text: Создать
      - generic [ref=f2e39]:
        - navigation "Период встреч" [ref=f2e40]:
          - button "Предстоящие 15" [pressed] [ref=f2e41] [cursor=pointer]:
            - text: Предстоящие
            - generic [ref=f2e42]: "15"
          - button "Прошедшие 2" [ref=f2e43] [cursor=pointer]:
            - text: Прошедшие
            - generic [ref=f2e44]: "2"
        - navigation "Вид встреч" [ref=f2e45]:
          - button "Список" [pressed] [ref=f2e46] [cursor=pointer]
          - button "Календарь" [ref=f2e48] [cursor=pointer]
      - generic [ref=f2e52]:
        - generic [ref=f2e53]:
          - heading "октябрь 2026" [level=2] [ref=f2e54]
          - article [ref=f2e56]:
            - link [ref=f2e57] [cursor=pointer]:
              - /url: /meetings/f11b3520-19ba-440e-a5fa-e5e871a9adda
              - time [ref=f2e58]: Ср, 28 октября · 08:01
              - generic [ref=f2e59]:
                - heading "Отсечка Вы организатор" [level=2] [ref=f2e61]:
                  - generic [ref=f2e62]:
                    - generic [ref=f2e63]: Отсечка
                    - img "Вы организатор" [ref=f2e64]
                - paragraph [ref=f2e66]: Место пока не выбрано
                - paragraph [ref=f2e70]: GMT+00:00
              - 'generic "Участников: 1" [ref=f2e74]':
                - generic "Саша · Организатор" [ref=f2e75]:
                  - generic [aria-hidden] [ref=f2e76]: С
        - generic [ref=f2e77]:
          - heading "октябрь 2099" [level=2] [ref=f2e78]
          - generic [ref=f2e79]:
            - article [ref=f2e80]:
              - link [ref=f2e81] [cursor=pointer]:
                - /url: /meetings/19d52f8b-fb95-4b3d-9200-3bbaf4497f72
                - time [ref=f2e82]: Сб, 24 октября · 19:00
                - generic [ref=f2e83]:
                  - heading "Реакция Вы организатор" [level=2] [ref=f2e85]:
                    - generic [ref=f2e86]:
                      - generic [ref=f2e87]: Реакция
                      - img "Вы организатор" [ref=f2e88]
                  - paragraph [ref=f2e90]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e97]':
                  - generic "Саша · Организатор" [ref=f2e98]:
                    - generic [aria-hidden] [ref=f2e99]: С
            - article [ref=f2e100]:
              - link [ref=f2e101] [cursor=pointer]:
                - /url: /meetings/2153f260-f6d5-422e-8e3e-e94a24097d90
                - time [ref=f2e102]: Сб, 24 октября · 19:00
                - generic [ref=f2e103]:
                  - heading "Прокрутка chromium 0 Вы организатор" [level=2] [ref=f2e105]:
                    - text: Прокрутка chromium
                    - generic [ref=f2e106]:
                      - generic [ref=f2e107]: "0"
                      - img "Вы организатор" [ref=f2e108]
                  - paragraph [ref=f2e110]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e117]':
                  - generic "Саша · Организатор" [ref=f2e118]:
                    - generic [aria-hidden] [ref=f2e119]: С
            - article [ref=f2e120]:
              - link [ref=f2e121] [cursor=pointer]:
                - /url: /meetings/2745fbf9-eb5b-4628-bf55-521a43402a1a
                - time [ref=f2e122]: Сб, 24 октября · 19:00
                - generic [ref=f2e123]:
                  - heading "Прокрутка chromium 4 Вы организатор" [level=2] [ref=f2e125]:
                    - text: Прокрутка chromium
                    - generic [ref=f2e126]:
                      - generic [ref=f2e127]: "4"
                      - img "Вы организатор" [ref=f2e128]
                  - paragraph [ref=f2e130]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e137]':
                  - generic "Саша · Организатор" [ref=f2e138]:
                    - generic [aria-hidden] [ref=f2e139]: С
            - article [ref=f2e140]:
              - link [ref=f2e141] [cursor=pointer]:
                - /url: /meetings/2ef1b1c1-7a79-41d5-954d-50167dc37fd1
                - time [ref=f2e142]: Сб, 24 октября · 19:00
                - generic [ref=f2e143]:
                  - heading "Файлы в разговоре Вы организатор" [level=2] [ref=f2e145]:
                    - text: Файлы в
                    - generic [ref=f2e146]:
                      - generic [ref=f2e147]: разговоре
                      - img "Вы организатор" [ref=f2e148]
                  - paragraph [ref=f2e150]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e157]':
                  - generic "Саша · Организатор" [ref=f2e158]:
                    - generic [aria-hidden] [ref=f2e159]: С
            - article [ref=f2e160]:
              - link [ref=f2e161] [cursor=pointer]:
                - /url: /meetings/3649a61c-578e-4380-8c0a-ed55983a8baf
                - time [ref=f2e162]: Сб, 24 октября · 19:00
                - generic [ref=f2e163]:
                  - heading "Отмена вложения Вы организатор" [level=2] [ref=f2e165]:
                    - text: Отмена
                    - generic [ref=f2e166]:
                      - generic [ref=f2e167]: вложения
                      - img "Вы организатор" [ref=f2e168]
                  - paragraph [ref=f2e170]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e177]':
                  - generic "Саша · Организатор" [ref=f2e178]:
                    - generic [aria-hidden] [ref=f2e179]: С
            - article [ref=f2e180]:
              - link [ref=f2e181] [cursor=pointer]:
                - /url: /meetings/7aeaca1d-12f3-4d7e-8e82-8e770ed48fde
                - time [ref=f2e182]: Сб, 24 октября · 19:00
                - generic [ref=f2e183]:
                  - heading "Проверка клавиатуры Вы организатор" [level=2] [ref=f2e185]:
                    - text: Проверка
                    - generic [ref=f2e186]:
                      - generic [ref=f2e187]: клавиатуры
                      - img "Вы организатор" [ref=f2e188]
                  - paragraph [ref=f2e190]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e197]':
                  - generic "Саша · Организатор" [ref=f2e198]:
                    - generic [aria-hidden] [ref=f2e199]: С
            - article [ref=f2e200]:
              - link [ref=f2e201] [cursor=pointer]:
                - /url: /meetings/7ee50fa4-cef2-41ee-851f-ace1dc9a8bfa
                - time [ref=f2e202]: Сб, 24 октября · 19:00
                - generic [ref=f2e203]:
                  - heading "Новый разговор Вы организатор" [level=2] [ref=f2e205]:
                    - text: Новый
                    - generic [ref=f2e206]:
                      - generic [ref=f2e207]: разговор
                      - img "Вы организатор" [ref=f2e208]
                  - paragraph [ref=f2e210]: Лофт «Квартал»
                - 'generic "Участников: 1" [ref=f2e217]':
                  - generic "Саша · Организатор" [ref=f2e218]:
                    - generic [aria-hidden] [ref=f2e219]: С
            - article [ref=f2e220]:
              - link [ref=f2e221] [cursor=pointer]:
                - /url: /meetings/8f99012c-1074-42ad-8290-a4ff0b58f53e
                - time [ref=f2e222]: Сб, 24 октября · 19:00
                - generic [ref=f2e223]:
                  - heading "Реакция с повтором Вы организатор" [level=2] [ref=f2e225]:
                    - text: Реакция с
                    - generic [ref=f2e226]:
                      - generic [ref=f2e227]: повтором
                      - img "Вы организатор" [ref=f2e228]
                  - paragraph [ref=f2e230]: Лофт «Квартал»
                - 'generic "Участников: 1" [ref=f2e237]':
                  - generic "Саша · Организатор" [ref=f2e238]:
                    - generic [aria-hidden] [ref=f2e239]: С
            - article [ref=f2e240]:
              - link [ref=f2e241] [cursor=pointer]:
                - /url: /meetings/927d2e67-c98d-44d1-af34-5faac14be373
                - time [ref=f2e242]: Сб, 24 октября · 19:00
                - generic [ref=f2e243]:
                  - heading "Быстрый выбор файла Вы организатор" [level=2] [ref=f2e245]:
                    - text: Быстрый выбор
                    - generic [ref=f2e246]:
                      - generic [ref=f2e247]: файла
                      - img "Вы организатор" [ref=f2e248]
                  - paragraph [ref=f2e250]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e257]':
                  - generic "Саша · Организатор" [ref=f2e258]:
                    - generic [aria-hidden] [ref=f2e259]: С
            - article [ref=f2e260]:
              - link [ref=f2e261] [cursor=pointer]:
                - /url: /meetings/a48f42d8-d5ec-4bce-ad5d-1d8e69bd5235
                - time [ref=f2e262]: Сб, 24 октября · 19:00
                - generic [ref=f2e263]:
                  - heading "Навигация Вы организатор" [level=2] [ref=f2e265]:
                    - generic [ref=f2e266]:
                      - generic [ref=f2e267]: Навигация
                      - img "Вы организатор" [ref=f2e268]
                  - paragraph [ref=f2e270]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e277]':
                  - generic "Саша · Организатор" [ref=f2e278]:
                    - generic [aria-hidden] [ref=f2e279]: С
            - article [ref=f2e280]:
              - link [ref=f2e281] [cursor=pointer]:
                - /url: /meetings/a9cb8e64-be6f-4dcd-b632-4e7c4464e733
                - time [ref=f2e282]: Сб, 24 октября · 19:00
                - generic [ref=f2e283]:
                  - heading "Прокрутка chromium 1 Вы организатор" [level=2] [ref=f2e285]:
                    - text: Прокрутка chromium
                    - generic [ref=f2e286]:
                      - generic [ref=f2e287]: "1"
                      - img "Вы организатор" [ref=f2e288]
                  - paragraph [ref=f2e290]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e297]':
                  - generic "Саша · Организатор" [ref=f2e298]:
                    - generic [aria-hidden] [ref=f2e299]: С
            - article [ref=f2e300]:
              - link [ref=f2e301] [cursor=pointer]:
                - /url: /meetings/dfb3e4d6-4da5-4fd2-958d-2b893ec8f65e
                - time [ref=f2e302]: Сб, 24 октября · 19:00
                - generic [ref=f2e303]:
                  - heading "Быстрый выбор файла Вы организатор" [level=2] [ref=f2e305]:
                    - text: Быстрый выбор
                    - generic [ref=f2e306]:
                      - generic [ref=f2e307]: файла
                      - img "Вы организатор" [ref=f2e308]
                  - paragraph [ref=f2e310]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e317]':
                  - generic "Саша · Организатор" [ref=f2e318]:
                    - generic [aria-hidden] [ref=f2e319]: С
            - article [ref=f2e320]:
              - link [ref=f2e321] [cursor=pointer]:
                - /url: /meetings/ef5d0db3-0ff8-4cb3-8613-5e4d0fc6e354
                - time [ref=f2e322]: Сб, 24 октября · 19:00
                - generic [ref=f2e323]:
                  - heading "Прокрутка chromium 3 Вы организатор" [level=2] [ref=f2e325]:
                    - text: Прокрутка chromium
                    - generic [ref=f2e326]:
                      - generic [ref=f2e327]: "3"
                      - img "Вы организатор" [ref=f2e328]
                  - paragraph [ref=f2e330]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e337]':
                  - generic "Саша · Организатор" [ref=f2e338]:
                    - generic [aria-hidden] [ref=f2e339]: С
            - article [ref=f2e340]:
              - link [ref=f2e341] [cursor=pointer]:
                - /url: /meetings/f997f562-6120-4122-9d5f-cbf4b106da62
                - time [ref=f2e342]: Сб, 24 октября · 19:00
                - generic [ref=f2e343]:
                  - heading "Прокрутка chromium 2 Вы организатор" [level=2] [ref=f2e345]:
                    - text: Прокрутка chromium
                    - generic [ref=f2e346]:
                      - generic [ref=f2e347]: "2"
                      - img "Вы организатор" [ref=f2e348]
                  - paragraph [ref=f2e350]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e357]':
                  - generic "Саша · Организатор" [ref=f2e358]:
                    - generic [aria-hidden] [ref=f2e359]: С
```

# Test source

```ts
  1  | import { readFile } from 'node:fs/promises';
  2  | import path from 'node:path';
  3  | import type { Browser, BrowserContext, Page } from '@playwright/test';
  4  | import { expect } from '@playwright/test';
  5  | import { createdSchema, participantsSchema } from '@/shared/api';
  6  | import { writeHeaders } from '@tests/helpers';
  7  | 
  8  | export const meetingRoster = async (browser: Browser, organizer: Page) => {
> 9  |   const cover = await readFile(
     |                 ^ Error: ENOENT: no such file or directory, open '/private/tmp/somewhere-web-resume-20261028/openspec/changes/meeting-experience-refresh/assets/boardgame.png'
  10 |     path.resolve(
  11 |       '../../openspec/changes/meeting-experience-refresh/assets/boardgame.png',
  12 |     ),
  13 |   );
  14 | 
  15 |   const created = await organizer.request.post('/api/v1/meetings', {
  16 |     headers: await writeHeaders(organizer),
  17 |     data: {
  18 |       title: 'Состав встречи',
  19 |       starts_at: '2099-10-24T19:00:00+03:00',
  20 |       timezone: 'Europe/Moscow',
  21 |       place: 'У Саши дома',
  22 |       cover: { media_type: 'image/png', data: cover.toString('base64') },
  23 |     },
  24 |   });
  25 | 
  26 |   expect(created.status()).toBe(201);
  27 |   const result = createdSchema.parse(await created.json());
  28 |   const contexts: BrowserContext[] = [];
  29 |   let member: Page | undefined;
  30 | 
  31 |   try {
  32 |     for (const [name, answer] of [
  33 |       ['Лена', 'Приду'],
  34 |       ['Миша', 'Приду'],
  35 |       ['Аня', 'Приду'],
  36 |       ['Дима', 'Приду'],
  37 |       ['Катя', 'Приду'],
  38 |       ['Олег', 'Возможно'],
  39 |       ['Ира', 'Не смогу'],
  40 |     ] as const) {
  41 |       const context = await browser.newContext({ ignoreHTTPSErrors: true });
  42 |       contexts.push(context);
  43 |       const page = await context.newPage();
  44 |       await page.goto(result.invitation_url);
  45 |       await page.getByRole('button', { name: 'Войти и ответить', exact: true }).click();
  46 |       await page.getByRole('link', { name: `Войти как ${name}`, exact: true }).click();
  47 |       await page.getByRole('button', { name: answer, exact: true }).click();
  48 |       await expect(page.getByRole('status')).toContainText(`Вы ответили «${answer}»`);
  49 | 
  50 |       if (name === 'Лена') {
  51 |         member = page;
  52 |       }
  53 |     }
  54 | 
  55 |     if (!member) {
  56 |       throw new Error('Member context was not created');
  57 |     }
  58 | 
  59 |     const response = await organizer.request.get(
  60 |       `/api/v1/meetings/${result.meeting.id}/participants`,
  61 |     );
  62 | 
  63 |     expect(response.status()).toBe(200);
  64 |     const { participants } = participantsSchema.parse(await response.json());
  65 |     expect(participants).toHaveLength(8);
  66 | 
  67 |     return {
  68 |       ...result,
  69 |       member,
  70 |       participants,
  71 |       close: () => Promise.all(contexts.map((context) => context.close())),
  72 |     };
  73 |   } catch (error) {
  74 |     await Promise.all(contexts.map((context) => context.close()));
  75 |     throw error;
  76 |   }
  77 | };
  78 | 
```