# Независимая приёмка web chat4.1 · 01.11.2026

**Whole-task PASS:4.1, integration state/transport scope.** Проверяющий
`/root/sdd_clients_audit`, исполнитель `/root`; source949d и bundlec3d07e
остались неизменными. Нативный UI/design или вся chat-фича не приняты.

[Точный план](task-plans/chat-reliability-and-sync-4.1/plan.json) создан до действий,
[run](task-plans/chat-reliability-and-sync-4.1/run.json) содержит8/8 independent
step reviews,5 действительных обязательных suites. Общие suite и100/101/102 действия
физически выполнены один раз на текущем контексте и заново сопоставлены со всеми
шагами4.1; [shared-action provenance](task-plans/chat-reliability-and-sync-4.1/evidence/shared-action-provenance.json).
Исторический PASS и timestamps не переписывались.

## Полные case действия

| Case | Фактический результат |
| --- | --- |
| TC-CHAT-SYNC-2D68FE69 |Реальный Go100/foreign101/ownACK102, следующий GET после100, затем101/102 по одному. Текущий217-test suite дополнительно проверяет history/replay/empty initial/incremental, uint64 и apply failure. Это тот же явно указанный current execution, что принят для1.1, с отдельным whole-step review4.1. |
| TC-CHAT-SYNC-THROUGH |4/4 адресных:110 real journal changes, T+1 между страницами; повтор старой страницы отклонён; сбой последнего feed commit сохраняет cursor первой страницы. Retry заканчивается наT, следующий цикл получаетT+1 один раз. maxInFlight=1. |
| TC-CHAT-SYNC-5EFD24A6 |2/2 адресных: poll в tail-окне, авторC вне окна; реальные голоса закрывают poll, sync обновляет open→applied без отдельного GET карточки/feed и без нового пользовательского сообщения. Удаление собственного синтетическогоC даёт history_invalidated; свежий разрешённый old-range snapshot показывает «Удалённый аккаунт». Настоящая прежняя incremental projection с меньшей версией не возвращает имя. |
| TC-CHAT-SECURITY-92CE8303 |4/4 actual UI/IndexedDB: удержаны реальные committed sync/send/read responses и старый production privateScope callback. После logout/loginАня выпущены все старые ответы: чужие text/outbox не появились, callback AbortError, X получает403. При смене RSVP одной встречи старые ответы/IDB также отклонены, M очищена/403, другаяM2 доступна200 и её persistent draft record полностью совпадает. |

Суммарно10 новых адресных проверок: through4, card/privacy2, account-switch2,
targeted revoke2. Raw logs, безопасные JSON network/state outcomes, UI PNG и
воспроизводимый harness ZIP находятся в [evidence](task-plans/chat-reliability-and-sync-4.1/evidence).

Through/card используют реальные API и точные production loadChat/chatState
в отдельном test-only QueryClient, проверяют state-контракт, а не композицию карточки.
Account/revoke выполняются в настоящем приложении с real IndexedDB; old callback
использует production scope, связанную с той же базой. Эти границы явно отражены
в [observed environment](task-plans/chat-reliability-and-sync-4.1/evidence/residual-observed-environment.json).

## Окружение и сохранённые ошибки

Наблюдаемый bundled Chromium156.0.8078.4 headless,1440×900/390×900,
ru-RU/Europe/Moscow, свежий own8537 memory fixture backend413 с штатными
REALTIME=1/READ_STATE=1. Неизменённый план содержит прежнее описание NativeChrome/
backend412; это metadata deviation, а не подтверждение native manual UI. SourceHash
и artifact совпадают с планом; реальные source/HTTP/state предусмотренные raw case
проверены. Эта техническая задача не требует нового дизайна.

Исходные setup FAIL не удалены. Harness сначала выбрал first-unread вместо tail,
ожидал resource_kind=date_poll вместо entry с вложенным date_poll, предположил
несуществующий cancel endpoint и entry внутри snapshot projection. Исправлена
только подготовка/чтение опубликованного wire-контракта: явный tail anchor,
date_poll.state, штатное большинство голосов и настоящая старая incremental page.
Все исходники этих итераций и raw сохранены в residual-harness.zip. Product
assertions, API/schema, timeout и приложение не менялись. Это не новые runtime-дефекты.

Настройки и устройства пользователя не менялись; context/routes закрыты finally.
Текущий own fixture остаётся для следующего согласованного recovery case.
Canonical task.acceptance/scoped-ready выполняются перед checkbox отдельно;
общая приёмка4.3/release этим результатом не заявлена.
