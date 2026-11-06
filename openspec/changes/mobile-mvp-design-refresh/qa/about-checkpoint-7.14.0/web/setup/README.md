# About/document reader — подготовка web checkpoint7.14

Статус: **prepared, awaiting frozen handoff**. Это read-only подготовка по approved about-r2/documents и текущим cases. Приложение, тесты, raw, токены, tasks не менялись; About build/runtime/браузер не запускались, pass не фиксировался. Новый runner/transport не создаётся.

## Источники и границы

- Manifest `design/account-service-web.json`, экраны about/documents; approval `approved-designs.json`: оба published-input, «ок, го некст». Старые PROPOSED заголовки в ux.md исторические; действующее одобрение/публикация имеют приоритет.
- Raw `assets/about-r2`, normalized `preparation/references/{about,documents}/frame.html`; authority IDs about/documents. Реальные `PrivacyDocument`, `CookieDocument`, `DocumentIndex`, `DocumentPage`, AboutPage/Brand/BuildDetails прочитаны.
- Главные cases: `TC-MOBILE-ABOUT-METADATA`, `TC-MOBILE-DOCUMENT-READER` (testing/cases/mobile-interface.yaml); текущий catalog/config и service-information/web-release-identity cases в inputs.json.
- Desktop composition сохраняется. Карты/VO исключены. Полные legal paragraphs, оператор/контакт, сроки и пометка «Проект документа» сохраняются; не дописывать новые юридические условия, не выдавать этот UI checkpoint за приёмку окончательной политики.

## Минимальный actual проход после freeze

1. Сначала убедиться по actual390, что immutable artifact содержит **новый About/reader**, а не прежний service chunk; source/artifact/live asset binding до действий и после. Не повторять R1 Help freeze-path bug: demo build выходит в `.cache/web-demo`, обычный production — `frontend/web/dist`.
2. Из реального профиля открыть About: один знак слева/wordmark somewhere, одно описание и Developed by MintyDev; реальные Web/version/build без example0.1.0-rc.2/42/подставленного0; mobile без повторных документов/поддержки, dock/footer отсутствуют. Back возвращает в профиль. Один320 sanity; desktop1100 spot сохраняет прежнюю композицию.
3. Профиль→Privacy: верхняя Back/Содержание остаётся на месте, прокручивается только текст. Проверить все7privacy headings/параграфы и реквизиты против текущего источника, включая проектную пометку; не менять утверждённый текст.
4. На ненулевой позиции открыть Содержание, Escape/handle cancel: тот же scroll и фокус уtrigger. Keyboard Tab/Enter выбрать средний раздел: панель закрыта, раздел достигнут, heading focus/видимая позиция; тело не растягивается вместе с Dialog. Для проверки ждать closed/конца движения, не выдавать промежуточный кадр за дефект.
5. В Privacy→retention открыть Cookie; пройти его5разделов/TOC, «До30дней», «До10минут», данные вкладки/emoji, проектная пометка. Перекрёстный возврат через Back сохраняет место каждого типа; затем Back в исходный профиль. Проверить browserBack и явныйBack адресно, без полной navigation-матрицы. About собственного document-link не имеет.
6. Один public direct Privacy/Cookie вход без login: текст доступен, Back достижим с безопасным fallback. Один entry из уже заполненной support формы→Privacy→Back сохраняет draft/file/scroll (reuse Help helper; ничего не отправлять). Это важная граница нового reader, не повтор всей поддержки.
7. Один reduced-motion TOC select и короткий WebKit cancel/return,320 nooverflow. Реальный browser/text zoom отдельно по доступности; CSSzoom не называть OSlargefont/браузерным200%gate. Финальная полная матрица позже на общем кандидате.

## Повторно используемые команды и fixtures

Не запускались на этапе setup:

```sh
npm run --silent design:context -- --manifest openspec/changes/mobile-mvp-design-refresh/design/account-service-web.json
npm run test --workspace @somewhere/web -- scripts/build-identity.test.ts
```

Canonical scoped Playwright, только после freeze/по согласованному объёму: из `frontend/web` команда `npx playwright test tests/49-service-navigation.spec.ts --grep 'profile service return' --project=chromium`; тот же файл с `--project=mobile-webkit` — существующий WKproject. Селекторы mobile About в этом тесте требуют адаптации основным агентом, см. selectors-to-adapt.md; reviewer тест не меняет. `31-release-identity.spec.ts` содержит смешанные account/chat/media пути: не запускать весь файл ради короткого reader checkpoint; для canonical regression выбирать `--grep 'public service links retain touch targets|demo identity is explicit'`, учитывая, что latter включает chat/media и уже шире checkpoint. `npm run test:release --workspace @somewhere/web` — существующий отдельный release harness9328 с root `SOMEWHERE_RELEASE_PREVIEW_ROOT`, не запускать без подготовленных candidate/previous/long artifacts; он не даёт About UI pass автоматически.

Actual helper: `qa/vibe-checkpoint-7.13.0/web/setup/harness.mjs` — frozen/finish/launch/login/capture; `start-owned.mjs`/`stop-owned.mjs` для своего сервера с log/pid. Profile/Help transport: context `ignoreHTTPSErrors:true` и request interception, например уже проверенное `context.route('**/*', route => route.continue())`; никаких APIмоков для документов. Обычный Browser fixture даёт безопасные memory identities; DESIGN1 нужен для Саша/Катя, отдельного ABOUT/DOCUMENTS flag нет. Meetings/read flags существующего start-owned допустимы, но не нужны читателю. Внешних сообщений/переходов на провайдеров/production нет.

После handoff root candidate можно поднять существующим helper на свободном9138 (не запущен):

```sh
QA_FROZEN=1 QA_CANDIDATE=openspec/changes/mobile-mvp-design-refresh/qa/about-checkpoint-7.14.0/web/r1/candidate.json QA_BASE_URL=https://127.0.0.1:9138 QA_OUT_DIR=openspec/changes/mobile-mvp-design-refresh/qa/about-checkpoint-7.14.0/web/r1 QA_PORT=9138 node openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/web/setup/start-owned.mjs app
```

Reference сервер — уже принадлежащий reviewer `http://127.0.0.1:9130`, start/stop record в vibe setup; новые процессы setup не создавал. URL `/openspec/changes/mobile-mvp-design-refresh/preparation/references/about/frame.html?platform=web&state=release|local|unavailable`; documents тот же query для privacy/privacy-index/cookies. Raw fake status62 заменять только в referenceDOM на actual safe area+demo32: AboutHeader и DocumentPage.bar, после вычисления matching geometry; published файлы не менять.

От root нужны frozen candidate с exact artifact/source/input hashes и каталогом files, actual mode/buildidentity; при необходимости release/local/unavailable — настоящие отдельные артефакты/существующие records. Номер0.1.0-rc.2/42 в raw только пример; `buildInfo.ts` честно показывает Демо для demo, Локальная сборка для local, fallback для invalid. Не подменять compile-time identity через DOM/route fixture ради pass.
