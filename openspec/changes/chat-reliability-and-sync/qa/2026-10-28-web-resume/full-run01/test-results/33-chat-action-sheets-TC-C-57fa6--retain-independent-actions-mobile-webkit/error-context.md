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
            - button "Предстоящие 58" [pressed] [ref=f2e37] [cursor=pointer]:
              - text: Предстоящие
              - generic [ref=f2e38]: "58"
            - button "Прошедшие 3" [ref=f2e39] [cursor=pointer]:
              - text: Прошедшие
              - generic [ref=f2e40]: "3"
          - navigation "Вид встреч" [ref=f2e41]:
            - button "Список" [pressed] [ref=f2e42] [cursor=pointer]
            - button "Календарь" [ref=f2e44] [cursor=pointer]
        - generic [ref=f2e47]:
          - generic [ref=f2e48]:
            - generic [ref=f2e49]:
              - heading "октябрь 2026" [level=2] [ref=f2e50]
              - generic [ref=f2e51]:
                - article [ref=f2e52]:
                  - link [ref=f2e53]:
                    - /url: /meetings/f11b3520-19ba-440e-a5fa-e5e871a9adda
                    - time [ref=f2e54]: Ср, 28 октября · 08:01
                    - generic [ref=f2e55]:
                      - heading "Отсечка Вы организатор" [level=2] [ref=f2e57]:
                        - generic [ref=f2e58]:
                          - generic [ref=f2e59]: Отсечка
                          - img "Вы организатор" [ref=f2e60]
                      - paragraph [ref=f2e62]: Место пока не выбрано
                      - paragraph [ref=f2e66]: GMT+00:00
                    - 'generic "Участников: 1" [ref=f2e70]':
                      - generic "Саша · Организатор" [ref=f2e71]:
                        - generic [aria-hidden] [ref=f2e72]: С
                - article [ref=f2e73]:
                  - link [ref=f2e74]:
                    - /url: /meetings/fd6b8b8e-b187-4110-87bf-5048f28f0370
                    - time [ref=f2e75]: Ср, 28 октября · 08:02
                    - generic [ref=f2e76]:
                      - heading "Отсечка Вы организатор" [level=2] [ref=f2e78]:
                        - generic [ref=f2e79]:
                          - generic [ref=f2e80]: Отсечка
                          - img "Вы организатор" [ref=f2e81]
                      - paragraph [ref=f2e83]: Место пока не выбрано
                      - paragraph [ref=f2e87]: GMT+00:00
                    - 'generic "Участников: 1" [ref=f2e91]':
                      - generic "Саша · Организатор" [ref=f2e92]:
                        - generic [aria-hidden] [ref=f2e93]: С
            - generic [ref=f2e94]:
              - heading "октябрь 2099" [level=2] [ref=f2e95]
              - generic [ref=f2e96]:
                - article [ref=f2e97]:
                  - link [ref=f2e98]:
                    - /url: /meetings/007ea9ed-7276-4c08-975a-8234ef34d3d0
                    - time [ref=f2e99]: Сб, 24 октября · 19:00
                    - generic [ref=f2e100]:
                      - heading "Прокрутка mobile-webkit 2 Вы организатор" [level=2] [ref=f2e102]:
                        - text: Прокрутка mobile-webkit
                        - generic [ref=f2e103]:
                          - generic [ref=f2e104]: "2"
                          - img "Вы организатор" [ref=f2e105]
                      - paragraph [ref=f2e107]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e114]':
                      - generic "Саша · Организатор" [ref=f2e115]:
                        - generic [aria-hidden] [ref=f2e116]: С
                - article [ref=f2e117]:
                  - link [ref=f2e118]:
                    - /url: /meetings/0394c9c3-013b-4844-b764-3c03011a98ea
                    - time [ref=f2e119]: Сб, 24 октября · 19:00
                    - generic [ref=f2e120]:
                      - heading "Проверка клавиатуры Вы организатор" [level=2] [ref=f2e122]:
                        - text: Проверка
                        - generic [ref=f2e123]:
                          - generic [ref=f2e124]: клавиатуры
                          - img "Вы организатор" [ref=f2e125]
                      - paragraph [ref=f2e127]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e134]':
                      - generic "Саша · Организатор" [ref=f2e135]:
                        - generic [aria-hidden] [ref=f2e136]: С
                - article [ref=f2e137]:
                  - link [ref=f2e138]:
                    - /url: /meetings/05dc2a22-2b5c-45f6-924e-a10272fd7c16
                    - time [ref=f2e139]: Сб, 24 октября · 19:00
                    - generic [ref=f2e140]:
                      - heading "Задача без потери контекста Вы организатор" [level=2] [ref=f2e142]:
                        - text: Задача без потери
                        - generic [ref=f2e143]:
                          - generic [ref=f2e144]: контекста
                          - img "Вы организатор" [ref=f2e145]
                      - paragraph [ref=f2e147]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e154]':
                      - generic "Саша · Организатор" [ref=f2e155]:
                        - generic [aria-hidden] [ref=f2e156]: С
                - article [ref=f2e157]:
                  - link [ref=f2e158]:
                    - /url: /meetings/18e58899-9463-4199-ae08-b225c69afbd1
                    - time [ref=f2e159]: Сб, 24 октября · 19:00
                    - generic [ref=f2e160]:
                      - heading "Панели на маленьком экране Вы организатор" [level=2] [ref=f2e162]:
                        - text: Панели на маленьком
                        - generic [ref=f2e163]:
                          - generic [ref=f2e164]: экране
                          - img "Вы организатор" [ref=f2e165]
                      - paragraph [ref=f2e167]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e174]':
                      - generic "Саша · Организатор" [ref=f2e175]:
                        - generic [aria-hidden] [ref=f2e176]: С
                - article [ref=f2e177]:
                  - link [ref=f2e178]:
                    - /url: /meetings/19d52f8b-fb95-4b3d-9200-3bbaf4497f72
                    - time [ref=f2e179]: Сб, 24 октября · 19:00
                    - generic [ref=f2e180]:
                      - heading "Реакция Вы организатор" [level=2] [ref=f2e182]:
                        - generic [ref=f2e183]:
                          - generic [ref=f2e184]: Реакция
                          - img "Вы организатор" [ref=f2e185]
                      - paragraph [ref=f2e187]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e194]':
                      - generic "Саша · Организатор" [ref=f2e195]:
                        - generic [aria-hidden] [ref=f2e196]: С
                - article [ref=f2e197]:
                  - link [ref=f2e198]:
                    - /url: /meetings/2153f260-f6d5-422e-8e3e-e94a24097d90
                    - time [ref=f2e199]: Сб, 24 октября · 19:00
                    - generic [ref=f2e200]:
                      - heading "Прокрутка chromium 0 Вы организатор" [level=2] [ref=f2e202]:
                        - text: Прокрутка chromium
                        - generic [ref=f2e203]:
                          - generic [ref=f2e204]: "0"
                          - img "Вы организатор" [ref=f2e205]
                      - paragraph [ref=f2e207]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e214]':
                      - generic "Саша · Организатор" [ref=f2e215]:
                        - generic [aria-hidden] [ref=f2e216]: С
                - article [ref=f2e217]:
                  - link [ref=f2e218]:
                    - /url: /meetings/2745fbf9-eb5b-4628-bf55-521a43402a1a
                    - time [ref=f2e219]: Сб, 24 октября · 19:00
                    - generic [ref=f2e220]:
                      - heading "Прокрутка chromium 4 Вы организатор" [level=2] [ref=f2e222]:
                        - text: Прокрутка chromium
                        - generic [ref=f2e223]:
                          - generic [ref=f2e224]: "4"
                          - img "Вы организатор" [ref=f2e225]
                      - paragraph [ref=f2e227]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e234]':
                      - generic "Саша · Организатор" [ref=f2e235]:
                        - generic [aria-hidden] [ref=f2e236]: С
                - article [ref=f2e237]:
                  - link [ref=f2e238]:
                    - /url: /meetings/27ea6b9e-6edb-4760-b394-859ff760f3d7
                    - time [ref=f2e239]: Сб, 24 октября · 19:00
                    - generic [ref=f2e240]:
                      - heading "Позиция чтения Вы организатор" [level=2] [ref=f2e242]:
                        - text: Позиция
                        - generic [ref=f2e243]:
                          - generic [ref=f2e244]: чтения
                          - img "Вы организатор" [ref=f2e245]
                      - paragraph [ref=f2e247]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e254]':
                      - generic "Саша · Организатор" [ref=f2e255]:
                        - generic [aria-hidden] [ref=f2e256]: С
                - article [ref=f2e257]:
                  - link [ref=f2e258]:
                    - /url: /meetings/2a6782f7-07fb-411a-8c10-3546b711ec5a
                    - time [ref=f2e259]: Сб, 24 октября · 19:00
                    - generic [ref=f2e260]:
                      - heading "Движение эмодзи Вы организатор" [level=2] [ref=f2e262]:
                        - text: Движение
                        - generic [ref=f2e263]:
                          - generic [ref=f2e264]: эмодзи
                          - img "Вы организатор" [ref=f2e265]
                      - paragraph [ref=f2e267]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e274]':
                      - generic "Саша · Организатор" [ref=f2e275]:
                        - generic [aria-hidden] [ref=f2e276]: С
                - article [ref=f2e277]:
                  - link [ref=f2e278]:
                    - /url: /meetings/2ef1b1c1-7a79-41d5-954d-50167dc37fd1
                    - time [ref=f2e279]: Сб, 24 октября · 19:00
                    - generic [ref=f2e280]:
                      - heading "Файлы в разговоре Вы организатор" [level=2] [ref=f2e282]:
                        - text: Файлы в
                        - generic [ref=f2e283]:
                          - generic [ref=f2e284]: разговоре
                          - img "Вы организатор" [ref=f2e285]
                      - paragraph [ref=f2e287]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e294]':
                      - generic "Саша · Организатор" [ref=f2e295]:
                        - generic [aria-hidden] [ref=f2e296]: С
                - article [ref=f2e297]:
                  - link [ref=f2e298]:
                    - /url: /meetings/35c67f49-6e21-4cb8-b4c9-ba4ea1f47029
                    - time [ref=f2e299]: Сб, 24 октября · 19:00
                    - generic [ref=f2e300]:
                      - heading "Новый разговор Вы организатор" [level=2] [ref=f2e302]:
                        - text: Новый
                        - generic [ref=f2e303]:
                          - generic [ref=f2e304]: разговор
                          - img "Вы организатор" [ref=f2e305]
                      - paragraph [ref=f2e307]: Лофт «Квартал»
                    - 'generic "Участников: 1" [ref=f2e314]':
                      - generic "Саша · Организатор" [ref=f2e315]:
                        - generic [aria-hidden] [ref=f2e316]: С
                - article [ref=f2e317]:
                  - link [ref=f2e318]:
                    - /url: /meetings/3649a61c-578e-4380-8c0a-ed55983a8baf
                    - time [ref=f2e319]: Сб, 24 октября · 19:00
                    - generic [ref=f2e320]:
                      - heading "Отмена вложения Вы организатор" [level=2] [ref=f2e322]:
                        - text: Отмена
                        - generic [ref=f2e323]:
                          - generic [ref=f2e324]: вложения
                          - img "Вы организатор" [ref=f2e325]
                      - paragraph [ref=f2e327]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e334]':
                      - generic "Саша · Организатор" [ref=f2e335]:
                        - generic [aria-hidden] [ref=f2e336]: С
                - article [ref=f2e337]:
                  - link [ref=f2e338]:
                    - /url: /meetings/384caa05-da9b-4a20-80b6-ec87ac556d52
                    - time [ref=f2e339]: Сб, 24 октября · 19:00
                    - generic [ref=f2e340]:
                      - heading "Файлы в разговоре Вы организатор" [level=2] [ref=f2e342]:
                        - text: Файлы в
                        - generic [ref=f2e343]:
                          - generic [ref=f2e344]: разговоре
                          - img "Вы организатор" [ref=f2e345]
                      - paragraph [ref=f2e347]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e354]':
                      - generic "Саша · Организатор" [ref=f2e355]:
                        - generic [aria-hidden] [ref=f2e356]: С
                - article [ref=f2e357]:
                  - link [ref=f2e358]:
                    - /url: /meetings/3bd8f18c-9e43-4887-b7d8-705980238a52
                    - time [ref=f2e359]: Сб, 24 октября · 19:00
                    - generic [ref=f2e360]:
                      - heading "Удержание реакции Вы организатор" [level=2] [ref=f2e362]:
                        - text: Удержание
                        - generic [ref=f2e363]:
                          - generic [ref=f2e364]: реакции
                          - img "Вы организатор" [ref=f2e365]
                      - paragraph [ref=f2e367]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e374]':
                      - generic "Саша · Организатор" [ref=f2e375]:
                        - generic [aria-hidden] [ref=f2e376]: С
                - article [ref=f2e377]:
                  - link [ref=f2e378]:
                    - /url: /meetings/3cb52005-6708-4f4c-8a75-bf75450bc289
                    - time [ref=f2e379]: Сб, 24 октября · 19:00
                    - generic [ref=f2e380]:
                      - heading "Информация о встрече Вы организатор" [level=2] [ref=f2e382]:
                        - text: Информация о
                        - generic [ref=f2e383]:
                          - generic [ref=f2e384]: встрече
                          - img "Вы организатор" [ref=f2e385]
                      - paragraph [ref=f2e387]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e394]':
                      - generic "Саша · Организатор" [ref=f2e395]:
                        - generic [aria-hidden] [ref=f2e396]: С
                - article [ref=f2e397]:
                  - link [ref=f2e398]:
                    - /url: /meetings/3de1fe3e-d8d7-481d-a9e7-955c5f4ca7b3
                    - time [ref=f2e399]: Сб, 24 октября · 19:00
                    - generic [ref=f2e400]:
                      - heading "Реакция Вы организатор" [level=2] [ref=f2e402]:
                        - generic [ref=f2e403]:
                          - generic [ref=f2e404]: Реакция
                          - img "Вы организатор" [ref=f2e405]
                      - paragraph [ref=f2e407]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e414]':
                      - generic "Саша · Организатор" [ref=f2e415]:
                        - generic [aria-hidden] [ref=f2e416]: С
                - article [ref=f2e417]:
                  - link [ref=f2e418]:
                    - /url: /meetings/469087a1-e0b0-482f-86b3-520a2f3f6a0f
                    - time [ref=f2e419]: Сб, 24 октября · 19:00
                    - generic [ref=f2e420]:
                      - heading "Родительская панель Вы организатор" [level=2] [ref=f2e422]:
                        - text: Родительская
                        - generic [ref=f2e423]:
                          - generic [ref=f2e424]: панель
                          - img "Вы организатор" [ref=f2e425]
                      - paragraph [ref=f2e427]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e434]':
                      - generic "Саша · Организатор" [ref=f2e435]:
                        - generic [aria-hidden] [ref=f2e436]: С
                - article [ref=f2e437]:
                  - link [ref=f2e438]:
                    - /url: /meetings/4e9e82e3-4b77-4c47-a72b-1118b687d73c
                    - time [ref=f2e439]: Сб, 24 октября · 19:00
                    - generic [ref=f2e440]:
                      - heading "Отмена вложения Вы организатор" [level=2] [ref=f2e442]:
                        - text: Отмена
                        - generic [ref=f2e443]:
                          - generic [ref=f2e444]: вложения
                          - img "Вы организатор" [ref=f2e445]
                      - paragraph [ref=f2e447]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e454]':
                      - generic "Саша · Организатор" [ref=f2e455]:
                        - generic [aria-hidden] [ref=f2e456]: С
                - article [ref=f2e457]:
                  - link [ref=f2e458]:
                    - /url: /meetings/553cc8d6-6043-4a36-8d6e-468cca6d0117
                    - time [ref=f2e459]: Сб, 24 октября · 19:00
                    - generic [ref=f2e460]:
                      - heading "Опрос без дубликата Вы организатор" [level=2] [ref=f2e462]:
                        - text: Опрос без
                        - generic [ref=f2e463]:
                          - generic [ref=f2e464]: дубликата
                          - img "Вы организатор" [ref=f2e465]
                      - paragraph [ref=f2e467]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e474]':
                      - generic "Саша · Организатор" [ref=f2e475]:
                        - generic [aria-hidden] [ref=f2e476]: С
                - article [ref=f2e477]:
                  - link [ref=f2e478]:
                    - /url: /meetings/55b0ad01-54d1-406f-b6e9-082d6c192cbb
                    - time [ref=f2e479]: Сб, 24 октября · 19:00
                    - generic [ref=f2e480]:
                      - heading "Две вкладки Вы организатор" [level=2] [ref=f2e482]:
                        - text: Две
                        - generic [ref=f2e483]:
                          - generic [ref=f2e484]: вкладки
                          - img "Вы организатор" [ref=f2e485]
                      - paragraph [ref=f2e487]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e494]':
                      - generic "Саша · Организатор" [ref=f2e495]:
                        - generic [aria-hidden] [ref=f2e496]: С
                - article [ref=f2e497]:
                  - link [ref=f2e498]:
                    - /url: /meetings/5ca7d1ad-de24-420e-b929-11df3bf4305f
                    - time [ref=f2e499]: Сб, 24 октября · 19:00
                    - generic [ref=f2e500]:
                      - heading "Меню без движения Вы организатор" [level=2] [ref=f2e502]:
                        - text: Меню без
                        - generic [ref=f2e503]:
                          - generic [ref=f2e504]: движения
                          - img "Вы организатор" [ref=f2e505]
                      - paragraph [ref=f2e507]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e514]':
                      - generic "Саша · Организатор" [ref=f2e515]:
                        - generic [aria-hidden] [ref=f2e516]: С
                - article [ref=f2e517]:
                  - link [ref=f2e518]:
                    - /url: /meetings/620a3b92-ef96-4e1f-afb2-0d7592135b1b
                    - time [ref=f2e519]: Сб, 24 октября · 19:00
                    - generic [ref=f2e520]:
                      - heading "Меню без движения Вы организатор" [level=2] [ref=f2e522]:
                        - text: Меню без
                        - generic [ref=f2e523]:
                          - generic [ref=f2e524]: движения
                          - img "Вы организатор" [ref=f2e525]
                      - paragraph [ref=f2e527]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e534]':
                      - generic "Саша · Организатор" [ref=f2e535]:
                        - generic [aria-hidden] [ref=f2e536]: С
                - article [ref=f2e537]:
                  - link [ref=f2e538]:
                    - /url: /meetings/6dc8c817-8a8e-4885-8362-c0aaa373188a
                    - time [ref=f2e539]: Сб, 24 октября · 19:00
                    - generic [ref=f2e540]:
                      - heading "Потерянный ответ Вы организатор" [level=2] [ref=f2e542]:
                        - text: Потерянный
                        - generic [ref=f2e543]:
                          - generic [ref=f2e544]: ответ
                          - img "Вы организатор" [ref=f2e545]
                      - paragraph [ref=f2e547]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e554]':
                      - generic "Саша · Организатор" [ref=f2e555]:
                        - generic [aria-hidden] [ref=f2e556]: С
                - article [ref=f2e557]:
                  - link [ref=f2e558]:
                    - /url: /meetings/7093350d-4d5e-473a-ba04-68799536c5ca
                    - time [ref=f2e559]: Сб, 24 октября · 19:00
                    - generic [ref=f2e560]:
                      - heading "Быстрый выбор файла Вы организатор" [level=2] [ref=f2e562]:
                        - text: Быстрый выбор
                        - generic [ref=f2e563]:
                          - generic [ref=f2e564]: файла
                          - img "Вы организатор" [ref=f2e565]
                      - paragraph [ref=f2e567]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e574]':
                      - generic "Саша · Организатор" [ref=f2e575]:
                        - generic [aria-hidden] [ref=f2e576]: С
                - article [ref=f2e577]:
                  - link [ref=f2e578]:
                    - /url: /meetings/76804c1a-7b1d-4873-8015-55b4cc78af9d
                    - time [ref=f2e579]: Сб, 24 октября · 19:00
                    - generic [ref=f2e580]:
                      - heading "Длинная форма в низком окне Вы организатор" [level=2] [ref=f2e582]:
                        - text: Длинная форма в низком
                        - generic [ref=f2e583]:
                          - generic [ref=f2e584]: окне
                          - img "Вы организатор" [ref=f2e585]
                      - paragraph [ref=f2e587]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e594]':
                      - generic "Саша · Организатор" [ref=f2e595]:
                        - generic [aria-hidden] [ref=f2e596]: С
                - article [ref=f2e597]:
                  - link [ref=f2e598]:
                    - /url: /meetings/7a7c2f47-96df-4055-aec4-92ca67c59867
                    - time [ref=f2e599]: Сб, 24 октября · 19:00
                    - generic [ref=f2e600]:
                      - heading "Эмодзи без движения Вы организатор" [level=2] [ref=f2e602]:
                        - text: Эмодзи без
                        - generic [ref=f2e603]:
                          - generic [ref=f2e604]: движения
                          - img "Вы организатор" [ref=f2e605]
                      - paragraph [ref=f2e607]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e614]':
                      - generic "Саша · Организатор" [ref=f2e615]:
                        - generic [aria-hidden] [ref=f2e616]: С
                - article [ref=f2e617]:
                  - link [ref=f2e618]:
                    - /url: /meetings/7aeaca1d-12f3-4d7e-8e82-8e770ed48fde
                    - time [ref=f2e619]: Сб, 24 октября · 19:00
                    - generic [ref=f2e620]:
                      - heading "Проверка клавиатуры Вы организатор" [level=2] [ref=f2e622]:
                        - text: Проверка
                        - generic [ref=f2e623]:
                          - generic [ref=f2e624]: клавиатуры
                          - img "Вы организатор" [ref=f2e625]
                      - paragraph [ref=f2e627]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e634]':
                      - generic "Саша · Организатор" [ref=f2e635]:
                        - generic [aria-hidden] [ref=f2e636]: С
                - article [ref=f2e637]:
                  - link [ref=f2e638]:
                    - /url: /meetings/7ee50fa4-cef2-41ee-851f-ace1dc9a8bfa
                    - time [ref=f2e639]: Сб, 24 октября · 19:00
                    - generic [ref=f2e640]:
                      - heading "Новый разговор Вы организатор" [level=2] [ref=f2e642]:
                        - text: Новый
                        - generic [ref=f2e643]:
                          - generic [ref=f2e644]: разговор
                          - img "Вы организатор" [ref=f2e645]
                      - paragraph [ref=f2e647]: Лофт «Квартал»
                    - 'generic "Участников: 1" [ref=f2e654]':
                      - generic "Саша · Организатор" [ref=f2e655]:
                        - generic [aria-hidden] [ref=f2e656]: С
                - article [ref=f2e657]:
                  - link [ref=f2e658]:
                    - /url: /meetings/86a25d17-05e9-40e1-be10-aabe1b9c41d8
                    - time [ref=f2e659]: Сб, 24 октября · 19:00
                    - generic [ref=f2e660]:
                      - heading "Один владелец исходящего Вы организатор" [level=2] [ref=f2e662]:
                        - text: Один владелец
                        - generic [ref=f2e663]:
                          - generic [ref=f2e664]: исходящего
                          - img "Вы организатор" [ref=f2e665]
                      - paragraph [ref=f2e667]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e674]':
                      - generic "Саша · Организатор" [ref=f2e675]:
                        - generic [aria-hidden] [ref=f2e676]: С
                - article [ref=f2e677]:
                  - link [ref=f2e678]:
                    - /url: /meetings/8c7b01da-2f02-49c8-bcf3-70e835d05661
                    - time [ref=f2e679]: Сб, 24 октября · 19:00
                    - generic [ref=f2e680]:
                      - heading "Люди и реакции Вы организатор" [level=2] [ref=f2e682]:
                        - text: Люди и
                        - generic [ref=f2e683]:
                          - generic [ref=f2e684]: реакции
                          - img "Вы организатор" [ref=f2e685]
                      - paragraph [ref=f2e687]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e694]':
                      - generic "Саша · Организатор" [ref=f2e695]:
                        - generic [aria-hidden] [ref=f2e696]: С
                - article [ref=f2e697]:
                  - link [ref=f2e698]:
                    - /url: /meetings/8caf535e-744d-4b68-8a03-14f27c690715
                    - time [ref=f2e699]: Сб, 24 октября · 19:00
                    - generic [ref=f2e700]:
                      - heading "Прокрутка mobile-webkit 1 Вы организатор" [level=2] [ref=f2e702]:
                        - text: Прокрутка mobile-webkit
                        - generic [ref=f2e703]:
                          - generic [ref=f2e704]: "1"
                          - img "Вы организатор" [ref=f2e705]
                      - paragraph [ref=f2e707]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e714]':
                      - generic "Саша · Организатор" [ref=f2e715]:
                        - generic [aria-hidden] [ref=f2e716]: С
                - article [ref=f2e717]:
                  - link [ref=f2e718]:
                    - /url: /meetings/8ec70c78-f401-436b-a670-aca2f5789883
                    - time [ref=f2e719]: Сб, 24 октября · 19:00
                    - generic [ref=f2e720]:
                      - heading "Опрос без дубликата Вы организатор" [level=2] [ref=f2e722]:
                        - text: Опрос без
                        - generic [ref=f2e723]:
                          - generic [ref=f2e724]: дубликата
                          - img "Вы организатор" [ref=f2e725]
                      - paragraph [ref=f2e727]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e734]':
                      - generic "Саша · Организатор" [ref=f2e735]:
                        - generic [aria-hidden] [ref=f2e736]: С
                - article [ref=f2e737]:
                  - link [ref=f2e738]:
                    - /url: /meetings/8f99012c-1074-42ad-8290-a4ff0b58f53e
                    - time [ref=f2e739]: Сб, 24 октября · 19:00
                    - generic [ref=f2e740]:
                      - heading "Реакция с повтором Вы организатор" [level=2] [ref=f2e742]:
                        - text: Реакция с
                        - generic [ref=f2e743]:
                          - generic [ref=f2e744]: повтором
                          - img "Вы организатор" [ref=f2e745]
                      - paragraph [ref=f2e747]: Лофт «Квартал»
                    - 'generic "Участников: 1" [ref=f2e754]':
                      - generic "Саша · Организатор" [ref=f2e755]:
                        - generic [aria-hidden] [ref=f2e756]: С
                - article [ref=f2e757]:
                  - link [ref=f2e758]:
                    - /url: /meetings/927d2e67-c98d-44d1-af34-5faac14be373
                    - time [ref=f2e759]: Сб, 24 октября · 19:00
                    - generic [ref=f2e760]:
                      - heading "Быстрый выбор файла Вы организатор" [level=2] [ref=f2e762]:
                        - text: Быстрый выбор
                        - generic [ref=f2e763]:
                          - generic [ref=f2e764]: файла
                          - img "Вы организатор" [ref=f2e765]
                      - paragraph [ref=f2e767]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e774]':
                      - generic "Саша · Организатор" [ref=f2e775]:
                        - generic [aria-hidden] [ref=f2e776]: С
                - article [ref=f2e777]:
                  - link [ref=f2e778]:
                    - /url: /meetings/93427fbc-5c39-4a71-944b-a324d6dc6306
                    - time [ref=f2e779]: Сб, 24 октября · 19:00
                    - generic [ref=f2e780]:
                      - heading "Прокрутка mobile-webkit 4 Вы организатор" [level=2] [ref=f2e782]:
                        - text: Прокрутка mobile-webkit
                        - generic [ref=f2e783]:
                          - generic [ref=f2e784]: "4"
                          - img "Вы организатор" [ref=f2e785]
                      - paragraph [ref=f2e787]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e794]':
                      - generic "Саша · Организатор" [ref=f2e795]:
                        - generic [aria-hidden] [ref=f2e796]: С
                - article [ref=f2e797]:
                  - link [ref=f2e798]:
                    - /url: /meetings/9731b88b-853a-40d6-a34e-7376dca5b12b
                    - time [ref=f2e799]: Сб, 24 октября · 19:00
                    - generic [ref=f2e800]:
                      - heading "Док эмодзи Вы организатор" [level=2] [ref=f2e802]:
                        - text: Док
                        - generic [ref=f2e803]:
                          - generic [ref=f2e804]: эмодзи
                          - img "Вы организатор" [ref=f2e805]
                      - paragraph [ref=f2e807]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e814]':
                      - generic "Саша · Организатор" [ref=f2e815]:
                        - generic [aria-hidden] [ref=f2e816]: С
                - article [ref=f2e817]:
                  - link [ref=f2e818]:
                    - /url: /meetings/9a11267c-9d1f-478e-8eab-ece4d1e8c049
                    - time [ref=f2e819]: Сб, 24 октября · 19:00
                    - generic [ref=f2e820]:
                      - heading "Реакция с повтором Вы организатор" [level=2] [ref=f2e822]:
                        - text: Реакция с
                        - generic [ref=f2e823]:
                          - generic [ref=f2e824]: повтором
                          - img "Вы организатор" [ref=f2e825]
                      - paragraph [ref=f2e827]: Лофт «Квартал»
                    - 'generic "Участников: 1" [ref=f2e834]':
                      - generic "Саша · Организатор" [ref=f2e835]:
                        - generic [aria-hidden] [ref=f2e836]: С
                - article [ref=f2e837]:
                  - link [ref=f2e838]:
                    - /url: /meetings/9f2cae3e-8d2d-4100-8e7b-393d0aef3f51
                    - time [ref=f2e839]: Сб, 24 октября · 19:00
                    - generic [ref=f2e840]:
                      - heading "Длинная форма в низком окне Вы организатор" [level=2] [ref=f2e842]:
                        - text: Длинная форма в низком
                        - generic [ref=f2e843]:
                          - generic [ref=f2e844]: окне
                          - img "Вы организатор" [ref=f2e845]
                      - paragraph [ref=f2e847]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e854]':
                      - generic "Саша · Организатор" [ref=f2e855]:
                        - generic [aria-hidden] [ref=f2e856]: С
                - article [ref=f2e857]:
                  - link [ref=f2e858]:
                    - /url: /meetings/a48f42d8-d5ec-4bce-ad5d-1d8e69bd5235
                    - time [ref=f2e859]: Сб, 24 октября · 19:00
                    - generic [ref=f2e860]:
                      - heading "Навигация Вы организатор" [level=2] [ref=f2e862]:
                        - generic [ref=f2e863]:
                          - generic [ref=f2e864]: Навигация
                          - img "Вы организатор" [ref=f2e865]
                      - paragraph [ref=f2e867]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e874]':
                      - generic "Саша · Организатор" [ref=f2e875]:
                        - generic [aria-hidden] [ref=f2e876]: С
                - article [ref=f2e877]:
                  - link [ref=f2e878]:
                    - /url: /meetings/a51c7ab8-5f47-4d81-bf78-68b4caba44d1
                    - time [ref=f2e879]: Сб, 24 октября · 19:00
                    - generic [ref=f2e880]:
                      - heading "Ошибка устройства Вы организатор" [level=2] [ref=f2e882]:
                        - text: Ошибка
                        - generic [ref=f2e883]:
                          - generic [ref=f2e884]: устройства
                          - img "Вы организатор" [ref=f2e885]
                      - paragraph [ref=f2e887]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e894]':
                      - generic "Саша · Организатор" [ref=f2e895]:
                        - generic [aria-hidden] [ref=f2e896]: С
                - article [ref=f2e897]:
                  - link [ref=f2e898]:
                    - /url: /meetings/a9cb8e64-be6f-4dcd-b632-4e7c4464e733
                    - time [ref=f2e899]: Сб, 24 октября · 19:00
                    - generic [ref=f2e900]:
                      - heading "Прокрутка chromium 1 Вы организатор" [level=2] [ref=f2e902]:
                        - text: Прокрутка chromium
                        - generic [ref=f2e903]:
                          - generic [ref=f2e904]: "1"
                          - img "Вы организатор" [ref=f2e905]
                      - paragraph [ref=f2e907]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e914]':
                      - generic "Саша · Организатор" [ref=f2e915]:
                        - generic [aria-hidden] [ref=f2e916]: С
                - article [ref=f2e917]:
                  - link [ref=f2e918]:
                    - /url: /meetings/b2ddc156-a543-4a55-921f-79601198ed27
                    - time [ref=f2e919]: Сб, 24 октября · 19:00
                    - generic [ref=f2e920]:
                      - heading "Модальные действия Вы организатор" [level=2] [ref=f2e922]:
                        - text: Модальные
                        - generic [ref=f2e923]:
                          - generic [ref=f2e924]: действия
                          - img "Вы организатор" [ref=f2e925]
                      - paragraph [ref=f2e927]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e934]':
                      - generic "Саша · Организатор" [ref=f2e935]:
                        - generic [aria-hidden] [ref=f2e936]: С
                - article [ref=f2e937]:
                  - link [ref=f2e938]:
                    - /url: /meetings/b523ea63-cf44-4cc7-952c-0ecd9f14c6f9
                    - time [ref=f2e939]: Сб, 24 октября · 19:00
                    - generic [ref=f2e940]:
                      - heading "Контекстное меню Вы организатор" [level=2] [ref=f2e942]:
                        - text: Контекстное
                        - generic [ref=f2e943]:
                          - generic [ref=f2e944]: меню
                          - img "Вы организатор" [ref=f2e945]
                      - paragraph [ref=f2e947]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e954]':
                      - generic "Саша · Организатор" [ref=f2e955]:
                        - generic [aria-hidden] [ref=f2e956]: С
                - article [ref=f2e957]:
                  - link [ref=f2e958]:
                    - /url: /meetings/ba996d37-7f63-4d1d-bb1d-456069d4f82c
                    - time [ref=f2e959]: Сб, 24 октября · 19:00
                    - generic [ref=f2e960]:
                      - heading "Движение эмодзи Вы организатор" [level=2] [ref=f2e962]:
                        - text: Движение
                        - generic [ref=f2e963]:
                          - generic [ref=f2e964]: эмодзи
                          - img "Вы организатор" [ref=f2e965]
                      - paragraph [ref=f2e967]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e974]':
                      - generic "Саша · Организатор" [ref=f2e975]:
                        - generic [aria-hidden] [ref=f2e976]: С
                - article [ref=f2e977]:
                  - link [ref=f2e978]:
                    - /url: /meetings/bb624ab9-8152-4cb0-a819-ff4238f8d9b2
                    - time [ref=f2e979]: Сб, 24 октября · 19:00
                    - generic [ref=f2e980]:
                      - heading "Эмодзи без движения Вы организатор" [level=2] [ref=f2e982]:
                        - text: Эмодзи без
                        - generic [ref=f2e983]:
                          - generic [ref=f2e984]: движения
                          - img "Вы организатор" [ref=f2e985]
                      - paragraph [ref=f2e987]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e994]':
                      - generic "Саша · Организатор" [ref=f2e995]:
                        - generic [aria-hidden] [ref=f2e996]: С
                - article [ref=f2e997]:
                  - link [ref=f2e998]:
                    - /url: /meetings/bce45638-12c1-4f23-a1f1-76996c0dc144
                    - time [ref=f2e999]: Сб, 24 октября · 19:00
                    - generic [ref=f2e1000]:
                      - heading "Сохранение исходящих Вы организатор" [level=2] [ref=f2e1002]:
                        - text: Сохранение
                        - generic [ref=f2e1003]:
                          - generic [ref=f2e1004]: исходящих
                          - img "Вы организатор" [ref=f2e1005]
                      - paragraph [ref=f2e1007]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e1014]':
                      - generic "Саша · Организатор" [ref=f2e1015]:
                        - generic [aria-hidden] [ref=f2e1016]: С
                - article [ref=f2e1017]:
                  - link [ref=f2e1018]:
                    - /url: /meetings/c8c8ebab-8978-4fee-94a2-967fc5c0995c
                    - time [ref=f2e1019]: Сб, 24 октября · 19:00
                    - generic [ref=f2e1020]:
                      - heading "Прокрутка mobile-webkit 3 Вы организатор" [level=2] [ref=f2e1022]:
                        - text: Прокрутка mobile-webkit
                        - generic [ref=f2e1023]:
                          - generic [ref=f2e1024]: "3"
                          - img "Вы организатор" [ref=f2e1025]
                      - paragraph [ref=f2e1027]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e1034]':
                      - generic "Саша · Организатор" [ref=f2e1035]:
                        - generic [aria-hidden] [ref=f2e1036]: С
                - article [ref=f2e1037]:
                  - link [ref=f2e1038]:
                    - /url: /meetings/d106ac6e-f591-463b-b87c-9bf099ec1791
                    - time [ref=f2e1039]: Сб, 24 октября · 19:00
                    - generic [ref=f2e1040]:
                      - heading "Движение меню Вы организатор" [level=2] [ref=f2e1042]:
                        - text: Движение
                        - generic [ref=f2e1043]:
                          - generic [ref=f2e1044]: меню
                          - img "Вы организатор" [ref=f2e1045]
                      - paragraph [ref=f2e1047]: Место пока не выбрано
                    - 'generic "Участников: 1" [ref=f2e1054]':
                      - generic "Саша · Организатор" [ref=f2e1055]:
                        - generic [aria-hidden] [ref=f2e1056]: С
          - button "Показать ещё" [ref=f2e1057] [cursor=pointer]
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