# Android read-state / anchor: checkpoint 28.10.2026

Реализация только в managed worktree `chat-android-sync`. Main и production не
изменялись. По новому приоритету пользователя расширенная Android-приёмка
остановлена после текущих обязательных checks; выпуск web/backend идёт первым.
Это implementation checkpoint, не feature-test/design-review/release pass.
Checkbox 6.3–6.5 и независимая приёмка остаются открытыми.

## Baseline и diff

Core: `ff1cf42748debe02c51519db20dac298e67f69d5`.
Отдельные baseline commits: `e1fb1ad85ec74f335133fb3259a363738b72cc4c`
(2.5.0), `c766a5fe1886afd17d31bbd7c438f569b85a5d05` (2.5.1),
`7a5fa1a1a6d9d1cef61db1a4d2926553ffdc59b5` (divider borderStrong).
Implementation diff отсчитывать от последнего baseline; общие baseline файлы
повторно в main не переносить. DS 2.5.1, новые значения/токены не вводились.

## Изменения

- Read-state DTO и HTTP marker/receipts/readers по capability; decimal counters,
  access lease, version guard, server max, авторские receipts, пагинация/410.
- UUID верхней записи + экранное смещение в dp в текущей сессии; reverse layout,
  bounded window, first unread/saved anchor/tail, границы истории, кнопка новых.
- Чтение квалифицируется только по необрезанному концу bubble в фактической
  области над composer/IME: непрерывные 500 мс, foreground, активное окно,
  отсутствие popup/sheet; PUT объединяются до одного в секунду. ACK не receipt.
- Badge списка, фиксированный unread divider, положительный receipt, footer
  «Кто прочитал» в quick/full контексте своего подтверждённого сообщения,
  readers sheet с loading/empty/error/retry/more и возвратом focus/offset.
- Personal SDK списка прекращает idle polling. Синхронизированный чат отключает
  прежний параллельный refresh контейнера приглашения; состав получает
  обновление по meeting_changed. Поздний HTTP списка не регрессирует badge.
- Live исправил валидатор snapshot: reactions-only entry projection ссылается
  на запись в entries; nested entry не обязателен. Проверки ID/scope сохранены.
- QA-only observer и Flow fault injection не входят в production/Release.
  Записи содержат route, факт наличия cursor и SDK signals, без токенов,
  cursor values и сообщений. Дополнительно проверено отсутствие QA markers
  в DEX финального Release.

## Проверки

`android-read-full-check-02.log.gz`: clean, formatCheck, Debug/Release,
lintDebug/lintRelease, **152 JVM tests, 0 failures/errors/skipped**, Debug и QA
instrumentation APK — PASS. Логи всех неудачных попыток сохранены.

Финальные QA `bffb34e4a6872cd8a9629781f6716dffbb39d4de3828c57a89c1b73926f5713f`
и test `cff6f2d10b58c946d66e2e30e0d0c2d668145590d87127faa99d4a7c49410db0`:
**1 live integration UI test PASS, 21.413 s**, `final-live/` и
`android-read-final-device.log.gz`. Два пользователя настоящего TLS API,
официальный SDK 0.8.0, first unread/marker, zero context/empty/Back с возвратом
≤2 dp, второй пользователь → receipt/person, IME/dock Back/draft,
background/foreground catch-up, revoke. Разрыв инъецирован на границе QA Flow:
реальный SDK закрывается и создаётся заново; HTTP catch-up содержит cursor.
Это не отказ физической сети. Idle assertion продвигает Compose clock на 6 с
и ждёт HTTP; отдельного idle polling нет.

Ранее 2 Compose anchor tests PASS на candidate04: экранная верхняя координата
после prepend/new tail, поздней высоты, уменьшения viewport 600→420 dp и reentry
в пределах 2 dp; верх 80-строчного bubble не квалифицирует конец. Это измерения
на **emulator-5554**, не на физическом Android. После последних исправлений
они не повторялись; прежний pass не переносится на final автоматически.
Root ранее выполнил 13 queue/storage/Keystore/composer tests на core ff1;
на этом final они также не перезапускались.

Сохранённые провалы: неверная reverse offset модель; clipped bounds конца;
неподдержанный Gradle task без QA property; форматирование; fixture idempotency;
reactions-only snapshot; 4 заменённые неиспользуемые строки Android Lint;
idle probe 46→48 HTTP из container polling. Последний исправлен и повторён.
Ранний candidate06 live прошёл более слабый wall-clock idle assertion;
это не доказательство отсутствия Compose polling, поэтому verdict уточнён
последующим failed-idle и финальным усиленным повтором.

## Границы готовности

- Нет независимой feature/design приёмки и qa:ready/design:ready; tasks открыты.
- Не повторены финальная полная anchor/eviction/rotation матрица, весь прежний
  UI suite, TalkBack, font scale 200%, readers errors/paging в live, temporal
  motion/full/reduced. Нет физического Android/второго устройства: второй actor
  действовал HTTP API. Телефонный Back проверен; external-keyboard Escape не gate.
- Screenshots сняты при параллельном root Go capacity run (1 CPU); frame-time
  и performance pass не заявляются.
- Full design:check blocked на старом web generated файле из отдельного baseline.
  Android-only literal check: 668 существующих findings, **0 новых literals**.
  agent:check структурно валиден, но blocked теми же 3 inherited ссылками на
  telegram raw/publication/smile, которые parent запретил копировать как общий
  baseline. В main ссылки имеются. Это не pass полной обвязки.

`source-receipt.json`: 536 файлов, дерево
`f4b6a9e99fcf4c3b599beac9491fcee00a1249d11428420f0322289e8656bf57`;
хеши повторно проверены после сборки и live. APK только в ignored `.cache/qa/`;
`artifacts.json` содержит SHA всех пяти артефактов. Private config/session/token
в evidence не копировались. Команды возобновления — `runbook.md`.
