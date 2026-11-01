# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 42-chat-first-unread.spec.ts >> ten thousand messages open around first unread without walking history and jump to real tail
- Location: tests/42-chat-first-unread.spec.ts:5:1

# Error details

```
Test timeout of 240000ms exceeded.
```

```
Error: apiRequestContext.post: Test timeout of 240000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - link "К содержимому" [ref=f2e4]:
    - /url: "#main"
  - generic [ref=f2e5]: Демостенд · данные хранятся до перезапуска
  - generic [ref=f2e6]:
    - navigation "Основная навигация" [ref=f2e8]:
      - generic [ref=f2e9]:
        - link "Встречи" [ref=f2e10]:
          - /url: /meetings
        - link "Приглашения" [ref=f2e14]:
          - /url: /invitations
        - link "Профиль" [ref=f2e19]:
          - /url: /profile
    - generic [ref=f2e25]:
      - link "Somewhere — на главную" [ref=f2e27]:
        - /url: /
        - generic [ref=f2e28]: somewhere
      - main [active] [ref=f2e29]:
        - generic [ref=f2e31]:
          - heading "Мои встречи" [level=1] [ref=f2e32]
          - link "Создать встречу" [ref=f2e33]:
            - /url: /meetings/new
            - text: Создать
        - generic [ref=f2e35]:
          - navigation "Период встреч" [ref=f2e36]:
            - button "Предстоящие 7" [pressed] [ref=f2e37] [cursor=pointer]:
              - text: Предстоящие
              - generic [ref=f2e38]: "7"
            - button "Прошедшие 0" [ref=f2e39] [cursor=pointer]:
              - text: Прошедшие
              - generic [ref=f2e40]: "0"
          - navigation "Вид встреч" [ref=f2e41]:
            - button "Список" [pressed] [ref=f2e42] [cursor=pointer]
            - button "Календарь" [ref=f2e44] [cursor=pointer]
        - generic [ref=f2e49]:
          - heading "октябрь 2099" [level=2] [ref=f2e50]
          - generic [ref=f2e51]:
            - article [ref=f2e52]:
              - link [ref=f2e53]:
                - /url: /meetings/2beb3cbd-417b-460f-b2e5-83af961644f5
                - time [ref=f2e54]: Сб, 24 октября · 19:00
                - generic [ref=f2e55]:
                  - heading "Проверка прочтения Вы организатор" [level=2] [ref=f2e57]:
                    - text: Проверка
                    - generic [ref=f2e58]:
                      - generic [ref=f2e59]: прочтения
                      - img "Вы организатор" [ref=f2e60]
                  - paragraph [ref=f2e62]: Место пока не выбрано
                - 'generic "Участников: 2" [ref=f2e69]':
                  - generic "Саша · Организатор" [ref=f2e70]:
                    - generic [aria-hidden] [ref=f2e71]: С
                  - generic "Лена" [ref=f2e72]:
                    - generic [aria-hidden] [ref=f2e73]: Л
            - article [ref=f2e74]:
              - link [ref=f2e75]:
                - /url: /meetings/2f73657f-3e36-4400-8a2f-192c4e01d3bd
                - time [ref=f2e76]: Сб, 24 октября · 19:00
                - generic [ref=f2e77]:
                  - heading "Стабильные прочитавшие Вы организатор" [level=2] [ref=f2e79]:
                    - text: Стабильные
                    - generic [ref=f2e80]:
                      - generic [ref=f2e81]: прочитавшие
                      - img "Вы организатор" [ref=f2e82]
                  - paragraph [ref=f2e84]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e91]':
                  - generic "Саша · Организатор" [ref=f2e92]:
                    - generic [aria-hidden] [ref=f2e93]: С
            - article [ref=f2e94]:
              - link [ref=f2e95]:
                - /url: /meetings/5d2b72cb-06f1-4a7d-a368-62d2a36816c8
                - time [ref=f2e96]: Сб, 24 октября · 19:00
                - generic [ref=f2e97]:
                  - heading "Конец длинного сообщения Вы организатор" [level=2] [ref=f2e99]:
                    - text: Конец длинного
                    - generic [ref=f2e100]:
                      - generic [ref=f2e101]: сообщения
                      - img "Вы организатор" [ref=f2e102]
                  - paragraph [ref=f2e104]: Место пока не выбрано
                - 'generic "Участников: 2" [ref=f2e111]':
                  - generic "Саша · Организатор" [ref=f2e112]:
                    - generic [aria-hidden] [ref=f2e113]: С
                  - generic "Лена" [ref=f2e114]:
                    - generic [aria-hidden] [ref=f2e115]: Л
            - article [ref=f2e116]:
              - link [ref=f2e117]:
                - /url: /meetings/8c67af92-9c76-4717-a4bc-ae1ab5602c5e
                - time [ref=f2e118]: Сб, 24 октября · 19:00
                - generic [ref=f2e119]:
                  - heading "Десять тысяч сообщений Вы организатор" [level=2] [ref=f2e121]:
                    - text: Десять тысяч
                    - generic [ref=f2e122]:
                      - generic [ref=f2e123]: сообщений
                      - img "Вы организатор" [ref=f2e124]
                  - paragraph [ref=f2e126]: Место пока не выбрано
                - 'generic "Участников: 2" [ref=f2e133]':
                  - generic "Саша · Организатор" [ref=f2e134]:
                    - generic [aria-hidden] [ref=f2e135]: С
                  - generic "Лена" [ref=f2e136]:
                    - generic [aria-hidden] [ref=f2e137]: Л
            - article [ref=f2e138]:
              - link [ref=f2e139]:
                - /url: /meetings/bea02517-ac6c-4c92-8787-136e19ef3546
                - time [ref=f2e140]: Сб, 24 октября · 19:00
                - generic [ref=f2e141]:
                  - heading "Десять тысяч сообщений Вы организатор" [level=2] [ref=f2e143]:
                    - text: Десять тысяч
                    - generic [ref=f2e144]:
                      - generic [ref=f2e145]: сообщений
                      - img "Вы организатор" [ref=f2e146]
                  - paragraph [ref=f2e148]: Место пока не выбрано
                - 'generic "Участников: 2" [ref=f2e155]':
                  - generic "Саша · Организатор" [ref=f2e156]:
                    - generic [aria-hidden] [ref=f2e157]: С
                  - generic "Лена" [ref=f2e158]:
                    - generic [aria-hidden] [ref=f2e159]: Л
            - article [ref=f2e160]:
              - link [ref=f2e161]:
                - /url: /meetings/f63384b8-fbba-4777-be2b-b27ad3a9e567
                - time [ref=f2e162]: Сб, 24 октября · 19:00
                - generic [ref=f2e163]:
                  - heading "Стабильные прочитавшие Вы организатор" [level=2] [ref=f2e165]:
                    - text: Стабильные
                    - generic [ref=f2e166]:
                      - generic [ref=f2e167]: прочитавшие
                      - img "Вы организатор" [ref=f2e168]
                  - paragraph [ref=f2e170]: Место пока не выбрано
                - 'generic "Участников: 1" [ref=f2e177]':
                  - generic "Саша · Организатор" [ref=f2e178]:
                    - generic [aria-hidden] [ref=f2e179]: С
            - article [ref=f2e180]:
              - link [ref=f2e181]:
                - /url: /meetings/f8f8dca4-d05a-4d88-900f-9e8a9c48cebb
                - time [ref=f2e182]: Сб, 24 октября · 19:00
                - generic [ref=f2e183]:
                  - heading "Проверка прочтения Вы организатор" [level=2] [ref=f2e185]:
                    - text: Проверка
                    - generic [ref=f2e186]:
                      - generic [ref=f2e187]: прочтения
                      - img "Вы организатор" [ref=f2e188]
                  - paragraph [ref=f2e190]: Место пока не выбрано
                - 'generic "Участников: 2" [ref=f2e197]':
                  - generic "Саша · Организатор" [ref=f2e198]:
                    - generic [aria-hidden] [ref=f2e199]: С
                  - generic "Лена" [ref=f2e200]:
                    - generic [aria-hidden] [ref=f2e201]: Л
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | import type { Browser, Page } from '@playwright/test';
  3  | import { randomUUID } from 'node:crypto';
  4  | import { entrySchema } from '@/shared/api';
  5  | import { apiCreate, login, writeHeaders } from '@tests/helpers';
  6  | 
  7  | export const readChat = async (page: Page, browser: Browser, title: string) => {
  8  |   await login(page, 'Саша');
  9  |   const { meeting, invitation_url } = await apiCreate(page, title);
  10 |   const context = await browser.newContext({
  11 |     ignoreHTTPSErrors: true,
  12 |     baseURL: new URL(page.url()).origin,
  13 |   });
  14 | 
  15 |   const friend = await context.newPage();
  16 |   await login(friend, 'Лена');
  17 |   const friendHeaders = await writeHeaders(friend);
  18 |   const token = new URL(invitation_url).pathname.split('/').at(-1)!;
  19 |   expect(
  20 |     (
  21 |       await friend.request.put(`/api/v1/invitations/${token}/rsvp`, {
  22 |         headers: friendHeaders,
  23 |         data: { answer: 'going', expected_revision: '0' },
  24 |       })
  25 |     ).status(),
  26 |   ).toBe(200);
  27 | 
  28 |   return { meeting, friend, context, friendHeaders, headers: await writeHeaders(page) };
  29 | };
  30 | 
  31 | export const postMessage = async (
  32 |   page: Page,
  33 |   id: string,
  34 |   headers: Record<string, string>,
  35 |   text: string,
  36 | ) => {
  37 |   const key = randomUUID();
> 38 |   const response = await page.request.post(`/api/v1/meetings/${id}/messages`, {
     |                                       ^ Error: apiRequestContext.post: Test timeout of 240000ms exceeded.
  39 |     headers: { ...headers, 'Idempotency-Key': key },
  40 |     data: { text, client_request_id: key },
  41 |   });
  42 | 
  43 |   expect(response.status()).toBe(201);
  44 |   const body: unknown = await response.json();
  45 | 
  46 |   return entrySchema.parse(body);
  47 | };
  48 | 
```