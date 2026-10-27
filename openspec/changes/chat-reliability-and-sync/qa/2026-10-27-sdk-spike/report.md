# SDK spike 1.2 — chat-reliability-and-sync

Дата: 27.10.2026. Независимый технический spike, без внедрения SDK в somewhere.
Код приложения, dependency manifests, frozen UI и tasks/checkboxes не изменялись.
Эксперименты выполнены в `/tmp/somewhere-sdk-spike-20261027`; здесь только отчёт
и evidence. Это не feature-test, не `qa:ready` и не приёмка всей фичи.

## Выбранные версии

| Компонент | Pin | Совместимость и лицензия |
| --- | --- | --- |
| Go monolith | `github.com/centrifugal/centrifuge v0.40.1` | Требует Go 1.26.0; собран Go 1.27.2. MIT. Default MemoryBroker, один процесс. |
| Web adapter | `centrifuge 5.8.0` | Node 22.22.3, TS 6.0.3 strict и React 19.3.1 types проверены. SDK не зависит от React. MIT. |
| Swift adapter | `centrifuge-swift 0.11.0` | Swift tools 6; SDK language mode 5. Runner language mode 6, Swift 6.4/Xcode 27.1. MIT, vendored Starscream Apache-2.0. |
| Swift runtime dependency | `swift-protobuf 1.35.0` | Требует tools 6.2; точные protobuf/abseil submodule commits сохранены. Apache-2.0 с Runtime Library Exception. |
| Java/Android adapter | `io.github.centrifugal:centrifuge-java:0.8.0` | JVM bytecode 8; проверены JDK17, Gradle8.14.3, AGP8.13.1, Kotlin2.2.20, SDK36/min26. MIT. |

Версии сверены через официальный GitHub Releases API, release archives и
Maven Central, а не только поисковый индекс: он показывал более старые релизы.
[versions.json](versions.json) содержит даты, ссылки и SHA-256 исходников.
npm lock, Go sums, Gradle locks и Swift archive/submodule lock сохранены.
Приложение не переключено на новые зависимости.

Java SDK использует существующий OkHttp 4.12.0. Его дополнительные runtime
зависимости: protobuf-javalite 3.25.5 (BSD-3-Clause),
streamsupport-minifuture 1.7.4 (**GPLv2 с Classpath Exception и CC0**).
OkHttp/Okio/Kotlin — Apache-2.0. Нельзя описывать весь комплект как MIT.
Точные списки: [Maven](maven-licenses.json), [npm](npm-licenses.json),
[Go modules](go-module-licenses.json), [Swift](swift-source-lock.json).

## Выполненные проверки

Сервер — настоящая Go Centrifuge, SDK — опубликованные артефакты/неизменённые
исходники точных релизов. Session service и HTTP catch-up — маленькие synthetic
fixture endpoints, не обработчики приложения. Никаких Redis, SQL, Docker,
production credentials, внешних уведомлений или туннеля. Сервер слушал только
127.0.0.1 на динамических портах; запрещённые порты не использовались.

| Проверка | Наблюдение |
| --- | --- |
| Go server build | Успешно, GOMAXPROCS=2, `go build -p 2`. |
| JS реальные соединения | Cookie + exact Origin; чужой Origin →403, чужой канал →103, client WS publish →103. |
| Java реальные соединения | Bearer HTTP header, protobuf WebSocket; чужой канал →103, publish отклонён. |
| Swift реальные соединения | Bearer HTTP header, URLSessionWebSocketTask, protobuf; чужой канал →103, publish отклонён. |
| Все три SDK: reconnect | Серверный 3011 → новое соединение/подписка; пропущенный hint восстановлен, `recovered=true`. |
| Все три SDK: потерянная история | Удалён именно пропущенный hint; следующая подписка `recovered=false`; отдельный HTTP catch-up выполнен. |
| Все три SDK: позиции | Payload sequence остаётся decimal string >2^53; SDK offset не используется как HTTP change_cursor. |
| Все три SDK: lease/revoke | Серверный refresh callback вызван; terminal revoke3503 останавливает reconnect. |
| Shared OkHttp ownership | После `Client.close(1000)` общий OkHttpClient остаётся работоспособен, HTTP запрос выполнен. |
| React types | Минимальный hook adapter проходит TS6 strict с фактическими React19.3.1/@types19.3.0, без skipLibCheck. |
| Android toolchain | Отдельная library с Flow adapter успешно собрана на текущих pins; warnings-as-errors включён для Kotlin. |
| Swift concurrency | Первый runtime обнаружил MainActor callback warning; после явного @Sendable повторный runtime без stderr. Strict concurrency complete + warnings-as-errors typecheck прошёл. |

Основное подключение имеет личный канал, заданный сервером, и открытый meeting
channel. Fixture проверяет session до upgrade/Connect и membership при subscribe.
Команды сообщения не передаются по WS. Hint содержит только schema_version,
meeting_id, stream_epoch, latest_change_sequence. После subscribe/catch-up
SDK recovery не отменяет HTTP сверку.

Результаты: [JS](evidence/js-result.json), [Java](evidence/java-result.json),
[Swift final](evidence/swift-result.json), [команды](commands.md).

iOS cross-compile SDK/runner завершён за 13,54с с SDK27.1 и deployment17.0;
[Mach-O metadata](evidence/swift-ios-macho.txt) подтверждает platform IOSSIMULATOR.
SDKSettings подтверждает установленный SDK27.1; SwiftPM при этом записал
в LC_BUILD_VERSION значение sdk17.0: [metadata](evidence/swift-ios-sdk.json).
Это отдельное ограничение cross-compile, не подтверждение iOS27 runtime.
Runtime на iOS Simulator не запускался. Первоначальный Swift callback warning
сохранён отдельно: [stderr](evidence/swift-initial-runtime.stderr).
Исправленный runner пересобран за 1,12с; [финальный stderr пуст](evidence/swift-runtime.stderr).
Это проверки SDK transport, не session/access lease самого somewhere.

## Требования к адаптерам, выявленные spike

1. **401 во время upgrade не завершает retry автоматически.** JS SDK без сессии
   сделал 8 попыток за 1,1с и остался в connecting. Минимальный generation-guarded
   adapter, проверяющий авторитетный HTTP auth status, остановился после одной
   попытки: [probe](evidence/auth-probe.json), [guarded probe](evidence/guarded-auth-probe.json).
   В приложении нужен существующий session endpoint и классификация 401/403.
   Cookie/header auth не вызывает getToken автоматически.
2. **Expiry и revoke различаются.** Go `DisconnectExpired`=3005 допускает retry;
   окончательно недействительной сессии нужен terminal отказ, например 3503,
   и отмена client owner. `Node.Disconnect(user)` по умолчанию terminal;
   reconnect probe явно использует `WithCustomDisconnect(DisconnectForceReconnect)`.
   Продление lease проверяет существующий session service, не только срок SDK.
3. **Swift queue → actor требует явной границы.** SDK Swift5 callbacks вызываются
   на его очереди. Completion, созданный внутри Swift6 MainActor, дал runtime
   warning. Callback должен быть nonisolated/@Sendable, извлечь Sendable DTO и
   перейти на actor владельца с проверкой account/access generation. SDK DTO
   нельзя без проверки пересылать между actors.
4. **Recovery — подсказка.** JS offsets — Number, Swift — UInt64, Java — long.
   Они не заменяют decimal-string HTTP cursor. HTTP catch-up обязателен после
   subscribe/reconnect независимо от recovered, а потеря stream history допустима.
5. **Lifecycle принадлежит приложению.** Один SDK instance/owner; cleanup на
   background/logout, явная отмена retry/polling и generation checks. JS handler
   не должен выбрасывать исключения; Java listeners не должны блокировать
   SDK thread. `Client.close(0)` подходит для неблокирующего cleanup; общий
   OkHttp dispatcher не закрывать. Типовой Flow bridge здесь проверен сборкой.

Это замечания к интеграции, не найденные дефекты текущего приложения и не
доказательство исполнения полного protocol.md.

## Ограничения

- Штатный remote SwiftPM resolve не завершён: Git fetch остановлен после 6 минут
  без прогресса. Сборка из exact archives + recursive submodules успешна;
  local override даёт SwiftPM identity warning, который upstream обещает сделать
  ошибкой в будущих версиях. Remote exact Package.swift сохранён для нормальной
  интеграции; успешный Package.resolved не заявляется.
- SDK содержит deprecated Security/CFStream API warnings даже при выборе native
  WebSocket. Полная iOS app сборка с её warnings-as-errors не выполнялась.
- JS runtime выполнялся в Node с реальным WebSocket и заголовками; HttpOnly cookie,
  browser same-site/cross-origin, React StrictMode/bfcache и Safari не принимались.
  Swift runtime — macOS host, Java — JVM host; реальные iOS/Android lifecycle,
  background/process death, устройства и frozen UI не проверялись.
- Retry здесь управляемым серверным disconnect; TCP blackhole, heartbeat loss,
  slow consumer/queue overflow, нагрузка 100 connections, TLS/сертификаты,
  latency, battery и прочие performance бюджеты не измерялись.
- HTTP catch-up — stub; SQL/outbox persistence, restart monotonicity и интеграция
  с существующими account/session/RSVP обработчиками относятся к следующим этапам.
- [Размеры](artifact-sizes.json) — standalone spike artifacts, не прибавка к
  release APK/IPA/web bundle/backend binary приложения. Android AAR не включает
  runtime dependencies; native debug binaries содержат symbols.

## Первичные источники

- [Go v0.40.1 release](https://github.com/centrifugal/centrifuge/releases/tag/v0.40.1),
  [go.mod](https://github.com/centrifugal/centrifuge/blob/v0.40.1/go.mod).
- [JS5.8.0 release](https://github.com/centrifugal/centrifuge-js/releases/tag/5.8.0),
  [package.json](https://github.com/centrifugal/centrifuge-js/blob/5.8.0/package.json).
- [Swift0.11.0 release](https://github.com/centrifugal/centrifuge-swift/releases/tag/0.11.0),
  [Package.swift](https://github.com/centrifugal/centrifuge-swift/blob/0.11.0/Package.swift),
  [SwiftProtobuf1.35.0 manifest](https://github.com/apple/swift-protobuf/blob/1.35.0/Package.swift).
- [Java0.8.0 release](https://github.com/centrifugal/centrifuge-java/releases/tag/0.8.0),
  [published POM](https://repo.maven.apache.org/maven2/io/github/centrifugal/centrifuge-java/0.8.0/centrifuge-java-0.8.0.pom).
- [SDK state/token/lifecycle specification](https://centrifugal.dev/docs/transports/client_api),
  [protocol and recovery](https://centrifugal.dev/docs/transports/client_protocol).

## Итог технического spike

Выбранные pins пригодны для дальнейшей реализации адаптеров с перечисленными
условиями auth/actor/lifecycle и лицензий. Все три настоящих SDK прошли
минимальные сетевые сценарии; React typecheck, Android library build и iOS SDK
cross-compile прошли. Полная app integration, remote SwiftPM resolve и продуктовые
platform/runtime gates остаются отдельной работой. Checkbox 1.2 и остальные
задачи этим отчётом не изменялись. `agent:check` и scoped `git diff --check` прошли.
Приложенные [hash сравнения pins](pin-files-comparison.json) совпали; source/deps
приложения не редактировались. Свой loopback server остановлен после проверок.
