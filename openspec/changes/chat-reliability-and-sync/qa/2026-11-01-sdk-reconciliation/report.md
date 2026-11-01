# Сверка SDK и зависимостей · 01.11.2026

Дополнение к [независимому spike 27 октября](../2026-10-27-sdk-spike/report.md).
Проверены фактические зависимости текущего приложения; новая установка,
обновление версий и изменение исходников не выполнялись. Это статическая
часть задачи 1.2, а не повторное выполнение исторических сетевых опытов.
Точные файлы, SHA-256 и состояние Swift checkout — в [inventory.json](inventory.json).

| Область | Фактический pin | Совместимость и атрибуция |
| --- | --- | --- |
| Go | Centrifuge 0.40.1, protocol 0.23.1 | Модуль SDK требует Go 1.26.0; приложение закреплено на 1.27.2. Лицензия SDK — MIT. Redis runtime для этого адаптера не требуется. |
| Web | centrifuge 5.8.0 | Точная версия в package.json и общем lockfile, лицензия MIT. Не зависит от React. |
| iOS | SwiftCentrifuge 0.11.0 | Exact remote requirement и Package.resolved; revision `072d41b6a8745057116747778e8bd40cc0c8dcab`. Фактический checkout чистый и совпадает с lock. MIT. |
| iOS runtime | SwiftProtobuf 1.35.0 | Exact pin; revision `9bbb079b69af9d66470ced85461bf13bb40becac`. Checkout чистый. Apache-2.0 с Runtime Library Exception. |
| Android | centrifuge-java 0.8.0 | Закреплён в version catalog. Опубликованный POM требует тот же OkHttp 4.12.0, который использует приложение. SDK — MIT; JVM target приложения — 17. |

Java SDK также подтягивает protobuf-javalite 3.25.5 (BSD-3-Clause) и
streamsupport-minifuture 1.7.4 (GPLv2 с Classpath Exception и CC0).
Их уведомления включены в Android assets `licenses/chat-realtime`; это не
единый комплект под MIT. Полный исходный список и ссылки на опубликованные
лицензии сохранены в [Maven-инвентаре spike](../2026-10-27-sdk-spike/maven-licenses.json).
Swift-уведомления включены в ресурс `Chat-SDK-LICENSES.txt`.

Отдельный остаток атрибуции: установленный SwiftCentrifuge содержит
`Compression.swift` и `SSLSecurity.swift` с Apache-2.0 и copyright Joseph Ross /
Dalton Cherry. В ресурсе приложения сейчас названы SwiftCentrifuge и
SwiftProtobuf, отдельных Starscream/copyright-записей этих авторов не найдено.
Это конкретный вопрос для завершения инвентаря 1.2; полный лицензионный состав
SDK нельзя описывать только верхнеуровневым MIT. Текущие resources и сборка
во время независимого прогона не изменялись.

Виртуализация web закреплена отдельно: прямая зависимость workspace
`@tanstack/react-virtual` 3.14.23 / `virtual-core` 3.19.8. Версии 3.14.21 /
3.19.6 в корневом node_modules принадлежат другой ветке дерева зависимостей;
их наличие не означает, что клиентский импорт разрешается в старый пакет.
Точные обе ветки сохранены в inventory, версии не менялись.

## Границы адаптеров

- Web использует cookie-сессию и отдельную HTTP-проверку при соединении;
  reconnect ограничен интервалом 1–30 секунд. Cleanup останавливает соединение
  и удаляет listeners. SDK offset не становится HTTP cursor.
- iOS использует Bearer в заголовке WSS, native URLSession WebSocket,
  ephemeral URLSession без cookie/cache и явный переход SDK callback на MainActor.
- Android использует Bearer в заголовке, OkHttp без cookie/cache и переход
  callbackFlow к владельцу состояния. Закрытие адаптера не останавливает общий
  OkHttp dispatcher. Переполнение канала требует сверки состояния.
- Во всех клиентах восстановление истории принадлежит HTTP snapshot/catch-up;
  наличие SDK recovery само по себе не заменяет сверку. Сообщения отправляются
  обычными API-командами, WebSocket передаёт уведомления об изменении.

Это описание прочитанного кода. Фактические auth/reconnect/recovery и остановка
после terminal auth должны подтверждаться текущими независимыми plan/run
каждой платформы. Исторический spike действительно выполнял минимальные
сетевые проверки трёх SDK, но его timestamp и hash не переносятся на текущие
сборки. Текущие обязательные прогоны выполняются отдельно; задача 1.2 пока
не отмечена выполненной.

Штатный remote SwiftPM resolve, не завершившийся в первоначальном spike,
позднее был выполнен при интеграции приложения; здесь дополнительно проверено
совпадение точных remote pins с чистыми установленными checkout. Новый fetch
или сетевой resolve 1 ноября этим утверждением не заявляется.
