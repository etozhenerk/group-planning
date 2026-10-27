# Синхронизация чата Android

`FeedViewModel` связывает экран с единственным `FeedSync` для открытой встречи.
`FeedRepository` и `ChatRepository` скрывают HTTP, сессию и защищённый outbox.
`SessionRepository` проверяет account/access lease до и после запросов; отзыв
останавливает зарегистрированные операции и удаляет соответствующие локальные данные.

## Получение

После foreground выполняется `/me`, capability и разрешённый snapshot/sync.
Официальный `io.github.centrifugal:centrifuge-java:0.8.0` работает через
`CentrifugeRealtime` и Flow: WSS с проверкой TLS, Bearer в HTTP-заголовке,
protobuf, личная server-side подписка и одна `meeting:<id>` подписка.
Credentials и payload не журналируются, токены не передаются в query.

Snapshot фиксирует окно и change cursor. Каждый subscribe/reconnect требует
HTTP catch-up; SDK offset никогда не используется как cursor данных.
Страница reducer применяется вместе с next cursor; through остаётся неизменным
до окончания цикла. `410 sync_reset_required` и history invalidation заменяют
окно свежим разрешённым снимком, сохраняя допустимые исходящие и якорь.
Проекции проверяют ID/встречу/версию; старое значение не заменяет новое.

Исправная подписка не запускает idle GET. После 10 секунд отказа realtime
один fallback использует 3/6/12/30 секунд с jitter. Контейнер приглашения
не запускает параллельный refresh синхронизированного чата; состав обновляется
по meeting_changed, а не таймеру. Background отменяет
соединение, таймер и отправку. 401 очищает сессию, 403/404 — доступ встречи.
Неподдерживаемая capability/404 capabilities использует прежний HTTP feed.
При `read_state=true` клиент использует подтверждённые сервером markers/readers;
при выключенном флаге не показывает счётчики и не отправляет read-запросы.
ACK не является прочтением. Snapshot может возвращать entry и reaction projection
раздельно: resource_id сверяется с записью окна, reactions — с тем же entry_id.

## Исходящие и хранение

`MessageOutbox` сохраняет несколько намерений и независимый draft, изолированные
по owner/meeting. Старая запись `pending` мигрирует в queue при чтении.
`FileMessageStorage` использует `AtomicFile` в noBackupFilesDir и AES-GCM с
ключом Android Keystore; прежний системный шифр и origin AAD сохраняются.
История и sync cursor остаются в памяти. При проверенном входе другим аккаунтом
его predecessor outbox удаляется; logout/удаление аккаунта очищает всё.

Поле очищается только после успешной атомарной записи intent. Ошибка диска
оставляет текст и не вызывает POST. Последовательный sender сохраняет ID
при неопределённом результате, не пропускает такой head, но пропускает окончательно
отклонённый. ACK сверяет meeting/actor/client_request_id/text/отсутствие вложений.
Возврат отклонённого текста доступен только при пустом draft; короткая операция
восстановления блокирует ввод до завершения локальной записи, чтобы не затереть
одновременно введённый новый текст.

Одна коллекция `FeedRow` использует actor/client_request_id до и после ACK.
Pending не имеет реакций; composer принимает следующее сообщение во время POST.
Окно сервера ограничено 500 строками, guard версий — 1000; исходящие считаются
отдельно. LazyColumn имеет стабильные ключи, автоматическую загрузку границ и
отдельный receive cursor, который history/ACK не продвигают.

## Позиция и прочитанность

`ChatViewport` хранит UUID верхней видимой записи и смещение её верхней границы
в dp в памяти текущей сессии. При первом входе выбирается сохранённая запись,
затем first_unread, затем конец. Reverse LazyColumn переводит свои offsets
в экранную верхнюю координату. Изменение высоты, границы окна и появление новых
строк сохраняют этот якорь; режим следования концу включается только в пределах
64 dp или явным переходом. При отзыве доступа якорь удаляется вместе с данными.

`ChatReadController` получает необрезанную нижнюю границу пузырька и фактическую
видимую область над composer/IME. Непрерывные 500 мс при активном окне без панели
квалифицируют позицию; верх длинного сообщения её не квалифицирует. PUT объединяются
до одного в секунду; отображается только серверный максимум. Квалифицированная
позиция может завершить best-effort PUT при выходе. Background, панели, смена route
и revoke отменяют незавершённую квалификацию. Отложенный ответ календаря не может
вернуть счётчик старше уже полученного read-state.

Свой подтверждённый bubble показывает положительный счётчик. При нуле действие
«Кто прочитал» находится в общем контекстном popup, включая полный emoji picker.
Readers sheet открывается после выхода popup; Back/закрытие возвращает bubble
и прежнюю позицию. Пагинация сохраняет загруженных людей при ошибке; 410 начинает
новый разрешённый снимок. В списке встреч отдельный personal SDK владеет
инвалидациями, без idle polling; календарная временная граница остаётся таймером.

## Проверки

Основная команда — `sh scripts/check.sh`. JVM regression-набор включает
MessageQueueTests, ChatMergeTests, ChatLifecycleTests, ChatWireTests, FeedRowTests
и настоящий TLS upgrade в CentrifugeTransportTests. Изолированные QA-проверки:
ChatQueueUiTests (идентичность Compose node после ACK и активный composer) и
MessageQueueStorageTests (Keystore, повторное открытие, прерванная запись, tamper).
`ChatReadingTests` проверяет 500 мс, перекрытия, coalescing, server max и 410.
`ChatReadUiTests` измеряет экранную позицию на эмуляторе после prepend, изменения
высоты и viewport/reentry. `ChatReadLiveUiTests` использует двух пользователей
реального TLS API и официальный SDK, проверяет read/receipts, Back/IME,
background/foreground, revoke и catch-up после QA-инъекции отказа Flow.
`QaChatProbe` существует только в source set qa: сохраняет вид маршрута/наличие
cursor и lifecycle signals без токенов, cursor values и текста; production и
release не содержат observer или fault injection.
Их сборка не означает запуска на устройстве; фактический результат сохраняется
в QA-отчёте точного кандидата.

## Зависимости

SDK — MIT, protobuf-javalite 3.25.5 — BSD-3-Clause,
streamsupport-minifuture 1.7.4 — GPLv2 с Classpath Exception и CC0.
Это не единый MIT-набор. Полные новые license texts и source hashes входят
в APK assets `licenses/chat-realtime/`; существующие OkHttp/Okio/Kotlin — Apache-2.0.
Pin подтверждён Maven Central и SDK spike изменения chat-reliability-and-sync.
