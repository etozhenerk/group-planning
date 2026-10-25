# Текущая реализация и причины доработки

Аудит исходников 25.10.2026, база `ca3e18f`. Это статическое исследование,
не замер production и не воспроизведение каждого дефекта на устройстве.

## Что сохраняем

- Общая лента сообщений, опросов, задач и системных событий; серверные права
  организатора и текущих «Приду».
- Серверные ID, sequence внутри встречи, decimal strings на границе API.
- `client_request_id` совпадает с Idempotency-Key; повтор с тем же телом
  возвращает прежнюю запись даже после истечения receipt. Другое тело отклоняется.
- Snapshot метаданных/ленты, epoch доступа клиентов, отмена и очистка после
  401/403; неизвестные версии записей не ломают всю ленту.
- Нативные lazy-контейнеры и существующая логика следования за нижним краем.
- PostgreSQL и memory.Store, общий HTTP-контракт и независимые релизы клиентов.

## Наблюдения по коду

| Наблюдение | Основание | Следствие и требуемая проверка |
| --- | --- | --- |
| Web polling каждые 3 с, backoff до 30 с | [useConversation.ts](../../../frontend/web/src/entities/meeting/model/useConversation.ts) | Задержка до следующего запроса плюс сеть; простаивающий открытый чат делает запросы. Это настройка, не измеренный p95. |
| iOS опрашивает каждые 3 с; Android 3–30 с | [MeetingFeedScreen.swift](../../../frontend/ios/Somewhere/Features/Feed/MeetingFeedScreen.swift), [FeedViewModel.kt](../../../frontend/android/app/src/main/java/dev/groupplanning/android/state/feed/FeedViewModel.kt) | Сетевую синхронизацию нужно отделить от экрана и связать с foreground. |
| SQL читает всю ленту, сервис фильтрует страницу в Go | [postgres/feed.go](../../../backend/internal/storage/postgres/feed.go), [feed_service.go](../../../backend/internal/meetings/feed_service.go) | Даже пустой after-запрос зависит от размера всей истории. Нужны LIMIT и условия sequence в SQL. |
| SendMessage тоже сканирует всю ленту для повторного ID | [feed_service.go](../../../backend/internal/meetings/feed_service.go) | Использовать существующий уникальный индекс и адресный поиск `(meeting, actor, client_request_id)`. |
| Все изменения встреч сериализуются общим advisory lock | [transaction.go](../../../backend/internal/storage/postgres/transaction.go) | Не заявлять параллельность разных комнат; сначала измерить ожидание. Смена lock требует отдельной проверки аккаунтов/worker, не механического удаления. |
| В web курсор новых записей берётся из последней отображённой записи | [useConversation.ts](../../../frontend/web/src/entities/meeting/model/useConversation.ts), [useSendMessage.ts](../../../frontend/web/src/features/send-message/model/useSendMessage.ts) | Возможная гонка: прочитан хвост 100, чужое 101 сохранено, POST своего 102 пришёл раньше GET; cache уже заканчивается 102, следующий after=102 пропускает 101. Нужен отдельный подтверждённый курсор и regression-сценарий. Это вывод по коду, browser-воспроизведение ещё не выполнено. |
| Web draft/pending — useState, POST отменяется при уходе | [useSendMessage.ts](../../../frontend/web/src/features/send-message/model/useSendMessage.ts) | Нет сохранения исходящего при reload. Подтверждение может потеряться после commit. |
| Pending web лежат возле composer, вне серверного ol | [SendMessage.tsx](../../../frontend/web/src/features/send-message/ui/SendMessage/SendMessage.tsx) | При ACK запись перемещается между двумя контейнерами. Нужен один timeline item со стабильным UI-key. |
| iOS draft/outgoing принадлежат FeedOwner | [FeedOwner.swift](../../../frontend/ios/Somewhere/Features/Feed/Model/FeedOwner.swift) | suspend сохраняет память владельца, но не переживает уничтожение процесса; требуется устойчивый outbox. |
| Android уже пишет draft/pending до POST | [MessageSender.kt](../../../frontend/android/app/src/main/java/dev/groupplanning/android/state/feed/MessageSender.kt), [MessageOutbox.kt](../../../frontend/android/app/src/main/java/dev/groupplanning/android/data/outbox/MessageOutbox.kt) | Сохраняем гарантию и переносим её на другие платформы; текущая модель содержит одно pending, её нужно расширить до очереди. |
| Web рендерит все загруженные entries; prepend опирается на разницу scrollHeight | [FeedTimeline.tsx](../../../frontend/web/src/widgets/conversation/ui/FeedTimeline/FeedTimeline.tsx), [useViewport.ts](../../../frontend/web/src/widgets/conversation/ui/FeedTimeline/hooks/useViewport.ts) | Нет ограничения DOM, позднее изменение высоты строк не покрывается наблюдением firstId/lastId. Проверить вместе с будущими фото и карточками. |
| Нативные lazy-списки есть, массивы записей растут | FeedOwner / FeedViewModel и FeedTimeline платформ | Lazy-rendering не ограничивает данные в памяти; нужны окно, диапазоны и восстановление вокруг якоря. |
| Прочитанность — локальный флаг кнопки прокрутки | useViewport / FeedTimeline | Нет серверной позиции, общего счётчика и сведений о прочитавших. Нельзя выдавать этот флаг за read receipt. |
| Message payload хранит JSON с открытым текстом для сервера | [feed.go](../../../backend/internal/storage/postgres/feed.go), [feed_service.go](../../../backend/internal/meetings/feed_service.go) | HTTPS не является E2EE. Состояние шифрования диска/ключей проверяется отдельно, по коду его не доказать. |

## Регрессии, которые уже покрыты

[Серверные тесты](../../../backend/internal/meetings/feed_service_test.go)
проверяют последовательность страниц и конкурентные сообщения, повтор после
истечения receipt. [Web reliability](../../../frontend/web/tests/02-reliability.spec.ts)
проверяет потерю HTTP-ответа. В iOS есть отдельный тест, что POST и metadata
не двигают курсор приёма: [FeedOwnerTests.swift](../../../frontend/ios/SomewhereTests/Feed/FeedOwnerTests.swift).
Новое изменение дополняет эти гарантии, не объявляет существующую доставку
полностью ненадёжной и не заменяет тесты только проверкой библиотеки.

## Очерёдность

Сначала курсоры, адресные SQL-запросы и единая модель состояния; затем push
и восстановление; затем read state и окно ленты. Простой перевод имеющихся
запросов на WebSocket не исправит пропуск 101, потерю outbox и скачок строки.
