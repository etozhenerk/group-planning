# Состояние и транспорт чата iOS

`FeedOwner` удерживает отдельные HTTP receive cursor прежнего feed, opaque
change cursor и epoch нового sync, границы окна, composer draft и исходящие.
POST ACK не продвигает ни один receive cursor. SDK transport offset/epoch
не копируется в курсор API. Серверные последовательности сравниваются как
канонические decimal strings в диапазоне uint64, без преобразования в Double.

`ChatRealtime` использует официальный SwiftCentrifuge 0.11.0, SwiftProtobuf
1.35.0 и `URLSessionWebSocketTask`. Exact requirements и Package.resolved
фиксируют зависимости; SDK callback bridge передаёт только Sendable-события
на MainActor. Native session передаётся в Authorization header, без URL token,
connect payload и cookie storage. Обычное приложение сохраняет системную TLS
проверку. Только отдельный UITestHost использует точный сертификат своего
loopback fixture через официальный `tlsChallengeHandler`.

Активный экран проверяет сессию/capabilities, получает HTTP snapshot, создаёт
подписку встречи и после её подтверждения обязательно выполняет catch-up.
Hints объединяются на 80 мс; один запрос применяет bounded страницы с неизменной
through-позицией. Исправная подписка не запускает idle GET feed. Неуспешный
transport через 10 с переходит на один HTTP fallback с backoff/jitter;
успешный catch-up на подтверждённой подписке останавливает этот timer. Legacy capability/404
сохраняет прежний HTTP путь. Scene background отменяет задачи/SDK, foreground
повторяет проверку. HTTP 401/403 и private access_revoked очищают приватные данные.

`ChatRepository` — actor над `EncryptedChatStorage`. Для каждого аккаунта
и встречи записываются только draft/intent; приватная история на диск не
кешируется. AES-GCM использует Keychain WhenUnlockedThisDeviceOnly key,
AAD origin/account/meeting, случайный nonce, atomic file write, Complete
Data Protection и исключение из backup. Ошибка save не очищает редактор и
не отправляет POST. Physical Data Protection metadata проверяется отдельно
на устройстве: симулятор не подтверждает этот атрибут файловой системы.

Запись intent предшествует очистке draft. Встреча отправляет один POST,
неопределённый первый результат блокирует последующие до reconcile того же ID.
ACK сверяет аккаунт, встречу, client request ID, kind/version, текст и отсутствие raw attachments. Actor leases и
монотонные поколения сессии отвергают поздние записи после logout/revoke;
ревизия draft защищает новый текст от старого дискового результата. Новая
сессия ждёт завершения очистки прежней. Restore не показывает локальные данные
до успешной HTTP проверки доступа.

Timeline использует actor/client-request key для своей строки до/после ACK,
server ID для остальных; pending не находится в отдельном контейнере.
Окно ограничено 500 серверными строками, связанные проекции также вытесняются.
История и новое направление запрашиваются заранее у границы; при чтении
прошлого своя отправка не включает следование за хвостом. Точные визуальные
и scroll результаты фиксируются отдельной независимой приёмкой кандидата.

Проверки: `sh scripts/test.sh` (контракт, actor, queue, race, storage),
`sh scripts/test-ui.sh` (отдельный QA target), форматирование и clean build/analyze
из AGENTS.md. `SOMEWHERE_IOS_FIXTURE_BINARY` может указывать точный отдельно
собранный Go fixture-кандидат; без него runner собирает backend этой рабочей копии.

Read state включается только capability-флагом. Конец видимого сообщения
квалифицируется после 500 мс без overlay; marker объединяется с максимумом сервера,
отправляется не чаще 1 с, временная ошибка имеет bounded retry. Старый sync
projection_version не возвращает уже снятый unread. При уходе возможна одна
best-effort отправка ранее квалифицированного конца, без подтверждения UI.
Числа/списки read receipts загружаются только из API; собственный ACK их не создаёт.

`chat-sync` UI-сценарий использует второй API-аккаунт из того же ephemeral fixture,
проверяет native subscription, взаимную прочитанность, empty/ready readers,
no-idle sync, background и сохранение draft после relaunch. QA-only сертификат
и второй аккаунт находятся в файле 0600, который runner удаляет. Общие сценарии
sheet/emoji получают независимый путь encrypted storage через QA-only namespace;
обычный target и сценарий restart используют стандартное хранилище без сброса.
Лицензии обеих библиотек включены в `Resources/Chat-SDK-LICENSES.txt`.
