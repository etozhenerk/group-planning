# Help/support — read-only QA prep

Новый UI/runtime/build не запускались, pass не фиксируется. Продукт/кейсы/canonical runners не менялись; новый runner не создан. Actual после отдельного frozen handoff. Источник — approved help-r2/navigation-r2, current account-service-web manifest, реальные8API sections и соответствующие cases. Хешированный input snapshot/case steps рядом; актуальный context вычисляется заново на frozen candidate.

## Reuse и безопасный fixture

- `frontend/web/tests/49-service-navigation.spec.ts:5–30`: FAQ disclosure/hidden answer/focus и обратный переход. Для нового checkpoint сохранить opened+scroll при FAQ→support→Back, не ограничиваться первоначальным collapse.
- `frontend/web/tests/62-support-boundaries.spec.ts:4–74`: Unicode trim,9/3001→POST0/focus,10/3000→201/реальные distinct receipts, kind/screen/value сохранность. Это canonical бизнес-основа, менять только mobile selectors после freeze.
- `frontend/web/tests/32-refresh-resilience.spec.ts:98–129`: real route.fetch→abort после201→тот же key/reference при retry. Общие `vibe.../web/setup/harness.mjs` frozen/source/disk/live/capture/login/failOnce и existing `loading-helpers.ts` переиспользуются; API wrapper, который требует me/CSRF, для **анонимного** support не нужен.
- `backend/internal/httpapi/support_test.go:17`: `fixtureSupport()=support.New(memory.NewSupport(), nil, time.Now)` — настоящая приёмка в memory без внешнего Delivery. `browser_fixture_test.go:158,164` подключает её и `browserFeedbackScope`. Никаких Telegram/почтовых/production сообщений.
- Native rules/helpers только как повторно используемые recipes: `SupportBoundaryUiTests.kt` (9/3001 invalid,10/3000 distinct real receipt), `SupportServiceUiTests.kt` (system screenshot cancel/preserve), iOS `SupportFormUITests(+Recovery).swift` (focus, retry, private receipt). Native/UI не запускались этим prep.

Запуск после freeze — существующий browser-server wrapper, без новой сборки и без custom support flags:

```sh
QA_PORT=9135 QA_FROZEN=1 QA_CANDIDATE=<exact-candidate.json> QA_BASE_URL=https://127.0.0.1:9135 QA_OUT_DIR=<assigned-QA-dir> node openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/web/setup/start-owned.mjs app
```

Wrapper выставляет SOMEWHERE_BROWSER_FIXTURE=1 через browser-server.ts; DIST=точный immutable candidate; ADDR=127.0.0.1:port; DESIGN=1 для синтетических логинов, MEETINGS=1 только если нужен привычный entry fixture. Support включён без SOMEWHERE_BROWSER_SUPPORT. Root может дать свой готовый origin вместо нашего. PID/log записываются launcher в shared QA setup; чужие процессы не останавливать.

Каждому browser/case задать `X-Somewhere-Test-Feedback-Scope: help-<case>-<browser>-<uuid>` (≤128 chars); один и тот же scope сохраняется во всех retry этого намерения. Test-only adapter меняет только источник квоты, сохраняя API quota/idempotency. Квота5 новых receipts/10мин; same-key retry возвращается до списания лимита. Не обходить quota новым scope внутри одного retry. Own store/fake provider, никаких реальных адресатов.

API `POST /api/v1/support/feedback`: header Idempotency-Key==body.client_request_id, kind problem|idea|question; screen из8значений ниже; description10–3000 Unicode codepoints послеUnicode trim; email/screenshot/diagnostics необязательны/null. Screenshot PNG/JPEG/WebP≤5МБ, реально декодируемый файл. Receipt **201 `{id,reference,status:"accepted"}`**, UI сравнивает настоящий SW-reference, не DEMO-01 из прототипа. Номер не показывается до принятия; lostACK repeat без редактирования сохраняет key/body и тот же id/reference. Ответы receipt нельзя мокать как доказательство server acceptance.

## Текущие8 API sections (не сокращать по вкусу)

| Value | Published/UI label |
| --- | --- |
| meetings | Список встреч |
| calendar | Календарь |
| invitation | Приглашение |
| meeting_chat | Чат встречи |
| profile | Профиль |
| memories | Вайб встречи |
| sign_in | Вход |
| other | Другой экран |

Совпадают `support/validation.go`, текущие `support-feedback/model/types.ts` и approved help-r2/model/types.ts. Восемь значений доступны в section-sheet, API contract не расширяется.

## Короткий actual проход после handoff

1.390 FAQ: открыть вопрос, scroll, support entry «Написать в поддержку»→Back; opened/scroll и focus сохранены; hidden answer не доступен; без поиска по4FAQ.
2.Form: title «Написать в поддержку», kind/question из help; message и screenshot выбрать в own fixture, сохранить имя/MIME/byteSHA; optional email/diagnostics explicit. Открыть «Раздел приложения»,8options, selected mark. Arrow/Home/End двигают **focus**, Enter/Space применяют один выбор; Enter не submit POST. Escape/Back/handle-cancel оставляет прежнийscreen и message/file/scroll; focus возвращается в trigger. Confirm закрывает одну sheet.
3.Required/9/3001 invalid→POST0/message preserved/focus; correction10 и один3000 boundary→real receipt (по короткому согласованному scope, не полная матрица). Invalid screenshot/email рядом с полем, старый корректный screenshot не теряется при cancel/read-error.
4.Один known unavailable и один lostACK after real201: нет раннего успеха, текст/file сохранены, repeat возвращает тот же key/body/receipt. Pending не дублируется. Не придумывать новые error/unknown edit-locks сверх актуального UX/API: approved raw disable-fields только на sending; обязательный контракт — сохранность и exact repeat без редактирования.
5.Footer390normal и320/short390×430: sticky только если measured content overflow. Overflow — bottom/left/right прилегание/top corners/up-shadow, error рядом, action reachable. Short безscroll — обычная action в потоке, no separate background/shadow/radius; resize/section-close сохраняютscroll. Viewport reduction не выдавать за реальную IME.
6.Desktop1100 — прежняя sidebar/form/aside composition, native select/copy; только spot. Новый mobile дизайн не навязывать desktop. Итоговый общий кандидат/gates отдельным проходом.

От root нужны frozen candidate/dist/hash/origin и exact scope (включая какие boundary sends), текущая публикация. Existing isolated support fixture уже достаточен для реального receipt; production delivery или новый backend не нужен. Файлы/сообщения — только синтетические в своём store; request evidence хранит key/body-hash и fileSHA, не мегабайтный base64/CSRF.
