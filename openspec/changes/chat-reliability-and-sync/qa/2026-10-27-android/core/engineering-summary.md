# Android core: chat-reliability-and-sync

Checkpoint от 27.10.2026. Реализация находится только в managed worktree;
main, production, API, emulator и установленное QA-приложение не менялись.
Implementation diff отсчитывается от baseline `c4b9fb0fd53a08bc021ef04217a1dfc712d59a85`,
а не от backend base `6aac61e80a52fdaa2eb117d16b1c42d06ec1857d`.
Baseline receipt сохранён рядом и не переписан. Commit, содержащий этот отчёт,
фиксирует code + evidence; branch/main integration остаётся у parent.

## Реализация

- Официальный Centrifuge Java SDK 0.8.0, проверенный WSS, Bearer только в HTTP
  header, protobuf, personal server-side и одна meeting subscription. Поток
  связан с session/access lease; logout/revoke/background отменяют владельца.
- Capability gate, snapshot→subscribe→HTTP catch-up, независимый change cursor,
  фиксированный through, проверка scope/decimal version, upsert показанных
  карточек, reset410/history invalidation, единый fallback с jitter. Offset SDK
  не становится HTTP cursor; исправная подписка не создаёт idle GET.
- Bounded store до 500 записей и 1000 version guards; history/newer/tail не
  продвигают receive cursor. Текущий UUID reader anchor участвует в выборе окна.
- AES-GCM/Android Keystore + AtomicFile/noBackup для draft и нескольких intent,
  миграция старого pending, owner/meeting isolation, очистка предыдущего owner.
  Сохранение предшествует очистке composer и POST. Последовательная отправка,
  прежний request ID при retry, uncertain head блокирует последующие, rejected
  не блокирует. ACK сверяет встречу/автора/ID/text/attachments.
- Same-row ключ actor/client_request_id до/после ACK, реакций до ACK нет,
  следующий draft доступен во время POST. Rejected можно повторить тем же ID
  или вернуть текст в пустой composer; новый draft не затирается. Sync projection,
  пришедшая во время своей реакции, сохраняется при потере ответа.
- DS 2.3 layout/motion сохранены. Same-row UX реализован по публикации outbox
  2.4; parent уточнил scope до 2.4.1 без изменения значений/композиции. Generated
  в этом кандидате честно остаётся baseline 2.3; общая генерация — при integration.
- Полные тексты новых лицензий в APK assets, source URLs и SHA в sources.json.
  SDK MIT; protobuf BSD; minifuture GPLv2 + Classpath Exception/CC0. Проверка
  toolchain теперь игнорирует служебную строку JAVA_TOOL_OPTIONS при чтении JDK.

## Проверки точного source

145 JVM tests, 0 failures/errors/skipped. Финальные Debug/Release APK,
lintDebug/lintRelease и Debug instrumentation APK — PASS. QA и парный
instrumentation APK — PASS (сборка). APK/test APK не запускались и не установлены.
Новые реальные проверки: serial/multiple queue, lost ACK/process-owner recreation,
rejected retry/recovery, storage failure, late revoke, same-row key/collision,
atomic through/old projection/window bounds, subscribe catch-up/no idle/fallback,
reset/draft/revoke и настоящий TLS WebSocket upgrade официального Java SDK.
Это не полный live E2E с backend и не visual acceptance.

`source-receipt.json` фиксирует 517 input files; хеш каждого повторно проверен
после финальной сборки. `artifacts.json` содержит неизменяемые APK paths/SHA.
`jvm-summary.json` содержит классы и фактические счётчики. APK только в ignored
.cache, public reports не содержат sessions, private bootstrap или токенов.

Полный `sh scripts/check.sh` после clean прошёл на предшествующем варианте
(144 JVM). После узких изменений порядка hydration и attachment collision
повторены обе сборки/Lint/JVM/Debug tests и QA/tests; итог — 145 JVM. Source и
артефакты этого checkpoint соответствуют последнему повтору, а не раннему APK.

## Команды

Все Gradle запуски: JDK17 `/Users/misha/Library/Java/JavaVirtualMachines/jdk-17.0.21+9/Contents/Home`,
SDK `/Users/misha/Library/Android/sdk`, `JAVA_TOOL_OPTIONS=-XX:ActiveProcessorCount=2`,
`GRADLE_OPTS=-Dorg.gradle.vfs.watch=false`; `--no-daemon --max-workers=2`.

Из frontend/android:

```sh
sh scripts/check.sh
./gradlew --no-daemon --max-workers=2 formatApply formatCheck :app:assembleDebug :app:assembleRelease :app:lintDebug :app:lintRelease :app:testDebugUnitTest :app:assembleDebugAndroidTest
./gradlew --no-daemon --max-workers=2 -PsomewhereTestBuildType=qa :app:assembleQa :app:assembleQaAndroidTest
```

Логи full-check-02, final-02 и final-qa — успешные.
Raw логи сохранены lossless gzip: распаковка даёт исходные байты, SHA указан
в logs/receipt.json. Это сохраняет служебные пробелы Gradle без изменения evidence. Сохранены и предыдущие ошибки:
formatter long lines; ContractTests без registered ChatCapabilities serializer
(137/138); check-toolchain принимал JAVA_TOOL_OPTIONS за JDK version. Исправлены,
провалы не удалены. Два первых скачивания notices завершились timeout/403;
финальный источник OpenJDK pinned LICENSE и официальный CC0 получены и hashed.

`git diff --check` PASS. `npm run agent:check` структурно проверил OpenSpec, но
FAILED на трёх inherited DS baseline ссылках на raw chat.html, composer-smile.svg
и design-publication. Они существуют в main; parent запретил перенос общих raw
в Android implementation diff. Лог agent-check-final сохранён; общего pass нет.

## Незавершённое

Read-state API/UI не имитируются; read marker, unread/reader sheet, отдельный
saved `(id, offset)` и доказанный viewport budget ≤2 dp — следующий срез.
Живые Android Keystore/Compose/process-death/WS-backend проверки, legacy full UI,
TalkBack/Back/large text, независимый feature-test и design-review ещё не выполнены.
Новый MessageQueueStorageTests входит в общий androidTest (включая QA), два
ChatQueueUiTests — в QA. Полный runner не запускать поверх общего fixture;
parent выдаёт отдельное GO на QA5554. Документ review-brief.md передаёт объём без
ожидаемого verdict. qa:ready/design:ready и tasks checkbox не отмечены.
