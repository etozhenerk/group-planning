# Независимая текущая приёмка web · e856 · 01.11.2026

**Whole-task verdict: chat1.1,4.1,4.3 PASS в техническом web integration scope.**
Проверяющий `/root/sdd_clients_audit`, исполнитель `/root`. Каждый mapped case
прочитан целиком, действия сопоставлены с текущими фактическими результатами.
Это не общая приёмка UI, всего изменения, остальных клиентов или выпуска.

## Точный кандидат

SourceHash `e856c969201f30f96a9410474d6d5737f4c89ebd2ad93bb23950e15ce78d1391`,
catalogHash `84856bf42ba9493c4f47f9152522aa73cd69705d3e968815a9e12a45bcc11b2e`,
253-file demo inventory SHA256
`b6226898e549090fc5f60e1b474ca046d3d665bce6ff5b42b721e552836e66d0`.
[Source-after](freeze-verification.json):1033 web/package inputs,0 различий;
253 файла immutable bundle,0 различий; каталог415,gaps0. Дистрибутив и бинарник
не копировались в Git; сохранены только inventories и воспроизводимый harness.

Фактические technical profiles: bundled Chromium156.0.8078.4 headless,
1440×900/390×900 CSS px, macOS27.0.1, ru-RU/Europe/Moscow, собственный TLS
memory fixture8537. NativeChrome/physical touch/IME/Safari ими не заявляются.
Backend413 и API не менялись. Для настоящих epoch/expiry использован отдельно
одобренный QA-only binarye91e5868 с атомарным memory epoch control и identity-only
clock; private control nonce в пакет не включён. Время Mac не менялось.

## Исполненные обязательные наборы

Все32 плана созданы до действий и suites; для остальных UI-планов сохранена
только [компактная metadata](all-plan-metadata.json), PASS им не присвоен.
Каждый required suite физически выполнялся один раз, строго последовательно.

| Suite | Фактический результат | Raw |
| --- | --- | --- |
| web-check |49 файлов,222 PASS |[log](web-check.log) |
| web-e2e |282 PASS,1 SKIP |[log](web-e2e.log) |
| web-chat-e2e |38 PASS |[log](web-chat-e2e.log) |
| web-read-e2e |10 PASS |[log](web-read-e2e.log) |
| web-window-e2e |4 PASS |[log](web-window-e2e.log) |

SKIP — `08-cross-platform.spec.ts: one meeting shared by web, iOS and Android`.
Он не переименован в PASS. [Оригинальный run](plans/chat-reliability-and-sync-4.3/run.json)
сохраняет commandHash, planHash, реальные timestamps и logs.
[Shared-execution provenance](shared-execution-provenance.json) объясняет общие
исполнения для трёх заранее созданных планов; старые manual PASS не копировались.

Дополнительно, после тех же планов: **11/11 независимых timer controls**,
**20/20 текущих live checks** и **6/6 узких оставшихся mapped checks**.
Последние шесть уже завершились до нового поручения пользователя закончить
проверки; после него новых сценариев, UI/design-проходов не запускалось.

## Целые задачи1.1 и4.1

- **1.1:** real Go100→foreign101→ownACK102; ACK один раз, следующий GET после100,
  затем101/102 по одному в серверном порядке. Явный controlled disabled-capability
  ответ включает совместимый legacy HTTP путь. History/replay/empty initial и
  incremental/uint64/ошибка применения дополнены текущими production-model
  integration assertions из222-test suite.
- **4.1:** все четыре mapped cases на обоих профилях. Дополнительно real Go110
  изменений, T+1 между страницами, повтор старой страницы и сбой последнего apply;
  cursor остаётся на применённых данных. Старая poll-карточка обновляется через
  sync после реального большинства; удаление собственного синтетического автора
  вызывает history_invalidated, прежнее имя не возвращается при старом replay.
  При logout/loginX и отдельном отзывеM поздние sync/send/read/IndexedDB callbacks
  не возвращают приватное состояние; другаяM2 и её persistent draft сохранены.

Through/card проверяют реальный API и production loadChat/chatState в отдельном
test-only QueryClient. Account/revoke выполняются в настоящем приложении с
реальным IndexedDB и callbacks. Отдельный state probe не назван визуальной
приёмкой карточки. Полные step reviews и безопасные raw лежат в evidence
соответствующего плана.

## Полный mapped scope4.3

| Case | Какие действия подтверждают оба шага |
| --- | --- |
| BC07BEB1 |Current real SDK snapshot→subscribe gap и HTTP catch-up; controlled client outage5min,100 реальных изменений, RTT150ms. Все100 получены через HTTP, последняя canonical запись видна; применение страниц дополнено production-model controls. Настоящий SDK `recovered=true` отдельно не отменяет HTTP catch-up. |
| F6CFB5E9 |Настоящая memory epochA→B, старый подписанный cursor410, malformed cursor400, terminal401/403/404. Authorized snapshotB использует saved anchor; durable pending/new draft сохранены. Старый HISTORY ответ действительно доставлен послеB, окно не расширилось, anchor≤2px, тот же ключ даёт одну canonical запись. Это HISTORY DTO без epoch-поля, не отдельный old-sync DTO. |
| THROUGH |Real110 changes; фиксированныйT, T+1 между страницами; повтор и ошибка применения не продвигают cursor впереди данных, retry заканчивается наT, следующий цикл получаетT+1. |
| 65C6F806 |Production-owner idle90s до и после burst; нет idle polling. Burst20 с повторами/перестановкой сериализован; latest change применено. Real SDK healthy idle наблюдается также текущим38-suite. Новые50/150ms и long-second-GET controls исключают потерю coalesce hint. |
| 60FCAA1D |Actual sustained WebSocket failure вызывает один fallback catch-up. Независимые timers дают3/6/12/30, cap30 и jitter bounds при работающем/ошибающемся HTTP; legacy cadence3s сохранён. Ready+catch-up отменяет fallback. Actual hidden/foreground проверяет stop/auth→sync→queue; это layered integration, не один native background trace. |
| 6F728A92 |Actual app: draft+uncertain intent, hidden60s прекращает owner HTTP/read/retry; чужая запись добавлена. Foreground подтверждает auth200→sync200→same-key queue, новый draft сохранён. Отдельный настоящий identity expiry401 и поздние callbacks не восстанавливают private state/отправку. Visibility задаётся test context, не OS. |
| SECURITY0E0CB54C |Серверная половина current413: реальные WS revoke и2s session expiry закрывают3503, lifetime не продлевается, поздние обращения401. Текущий web отдельно доказывает real identity expiry401/cleanup, SDK terminal auth/no retry и late callback guards. Активный45s browser wait не заявлен: периодическая серверная граница доказана API half, клиентская реакция — current web controls. |
| SECURITY1DC708F2 |Current413 actual hint→storage gate→RSVP revoke→delayed HTTP403/WS2003; read/feed/send и late recovery запрещены. Текущий actual web подтверждает очисткуM, отказ старых HTTP/IDB callbacks и сохранность разрешённойM2. Серверный PASS не подставлен вместо клиентского cleanup. |
| CAPABILITIES |Четыре fresh web controls404/disabled: единственный legacy feed/send/lost-ACK/reload/retry, same ID/sequence, одна canonical запись, новый draft,0sync/read/ws. Backend no-journal writer/new epoch с сохранением истории квалифицирован по exact production archives с исходными датами; current web epoch-reset пересверяет сохранённое окно/pending. Старый browser PASS не используется. |

Точные ID сохранены в планах. [Измерения](measurements.json), current interaction
JSON и ровно два PNG actual epoch viewport находятся в proof. Остальные debug PNG
не копировались; это не screenshot-only review. [Harness](harness.zip) содержит
тестовые controls и необходимые production-model test snapshots, без dependencies,
253-file dist, бинарника, cookie/CSRF, nonce или private traces.

[API half](api-half-qualified.json) — существующий независимый current413
результат, а не новый backend/SQL прогон после web-плана. Исходные даты SQL и
точная archive parity сохранены. Он подтверждает серверные предпосылки; текущие
web действия отдельно подтверждают клиентские шаги. Квалификация неизменного
backend не выдаётся за новый browser run.

## Исправленные дефекты и границы

Исходные FAIL сохранены отдельно: [fallback949d](../2026-11-01-web-transport-independent/report.md)
и [потерянный hint0502](../2026-11-01-web-hint-race-independent/report.md).
Старые partial219/base118+skip+interrupted не объявлены завершёнными suites.
На текущем e856 independently passed: early50ms,late150ms,long second GET,
stop/terminal; fallback working/errors,legacy,jitter,healthy/restart/stop.
Текущий source прочитан независимо, а авторские11 unit не присвоены ревьюеру.

Для1.1/4.1/4.3 не вводилась новая UI-композиция; отдельный whole-design PASS не
заявляется. Другие web UI/design tasks, прочие платформы, real OAuth grant,
capacity/frames/full7.9, Telegram и выпуск остаются за пределами результата.
Canonical task.acceptance/checkbox изменяет root после своих scoped gates.

## Cleanup

Все собственные live browser contexts/routes закрыты. Fixture8537 завершён
SIGTERM/exit0, его memory/identity clock уничтожены; own8836 завершён ранее.
Автоматические8444/8458 после suites не слушают. Native QA-tab и throttling/
viewport были восстановлены в предыдущем cleanup и здесь не менялись. Пользовательский
8790, обычные приложения, устройства, Keychain, stores и CI не затрагивались.
В web scope не создавались reverse mappings. Приватные traces остаются только
локально/tmp с checksum manifest; в Git их нет.
