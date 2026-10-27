# Прочитанность чата

Read state включается отдельно от транспорта: `SOMEWHERE_CHAT_READ_STATE=true`
при настроенном `SOMEWHERE_CHAT_SYNC_KEY`. По умолчанию флаг выключен. До его
включения capabilities возвращает `read_state=false`, новые операции — 404,
`my_read_state`/`first_unread` начального sync остаются null. Старые клиенты
сохраняют прежний HTTP-путь. WebSocket, POST ACK и baseline не означают чтение.

## Активация и хранение

Аддитивная миграция 007 создаёт markers и индексы; она не запускает функцию.
Перед началом HTTP при включённом флаге сервер выполняет один атомарный
bootstrap под существующим meeting write lock. Для текущих organizer/going
вставляется baseline на текущем хвосте и actual=0. INSERT-if-absent сохраняет
уже существующие значения при рестарте, повторном включении и rejoin. Сообщение,
конкурирующее с первой активацией, попадает либо в baseline, либо в unread;
фактический marker от этого не продвигается. Ошибка/отмена bootstrap прерывает
запуск HTTP. Это отдельная стоимость активации, не обычного запроса чата.

Новые встречи и going RSVP создают baseline в своей предметной транзакции.
Счётчик — чужие записи kind=message после max(baseline,actual), включая текст
и опубликованные вложения. Карточки, служебные записи и реакции не считаются.
Список читателей использует только actual, исключает автора, удалённые аккаунты
и участников без текущего доступа. Удаление аккаунта очищает markers атомарно;
удаление встречи удаляет их вместе с историей. Memory сохраняет те же правила,
но по-прежнему копирует snapshot целиком и не переживает рестарт процесса.

## Контракт

Все позиции, версии и счётчики передаются decimal strings. `first_unread` — UUID
entry_id либо null, никогда sequence. При включённой функции `my_read_state`
содержит actual, в том числе "0" при отсутствии фактического чтения; baseline
передаётся отдельно как `unread_baseline_sequence`.

- `PUT /api/v1/meetings/{id}/read-marker`: `{read_through_sequence}`. Допустима
  существующая запись message; сервер возвращает max всех устройств, baseline,
  unread_count, first_unread и projection_version. Повтор/меньшая позиция — no-op
  без изменения updated_at, журнала и outbox.
- `POST /api/v1/meetings/{id}/read-receipts/query`: `{entry_ids}` от 1 до 100
  уникальных собственных сообщений. Ответ `{receipts:[{entry_id,reader_count}],
  projection_version}`. Весь batch проверяется до выдачи агрегатов.
- `GET /api/v1/meetings/{id}/messages/{entry_id}/readers?cursor&limit`: только
  автору, current members, public id/display_name/avatar_url, reader_count,
  next_cursor и projection_version. Cursor HMAC связан с автором, встречей,
  epoch и сообщением; права повторно проверяются каждой страницей. Изменившийся
  снимок при получении профилей возвращает 410 для обновления списка.
- Snapshot/changes содержат private read state текущего пользователя. Начальное
  окно без явного around_entry_id выбирается около первого unread, иначе хвост.
  Личный список и calendar возвращают optional unread_count/first_unread.

Cookie-команды сохраняют Origin/CSRF. Bad cursor — 400; expired/чужой epoch —
410 sync_reset_required; недоступная встреча — прежние 403/404; неавтор — 403;
невалидная позиция — 422. При disabled флаге маршруты возвращают 404.

Actual advance атомарно добавляет один receipts_changed, meeting hint и private
hint только читающему пользователю для его остальных устройств. Generic payload
не содержит ни персональных позиций, ни текста. RSVP/account deletion создают
invalidation для актуального состава. Чтение sync не пишет actual; no-op PUT
не запускает цикл read→sync→read. Клиент обязан сам проверить видимость 500 мс,
foreground и отсутствие перекрывающего окна, с coalescing не чаще раза в секунду.

## Проверки и откат

`TestChatReadState100kPlanIntegration` на изолированной integration-БД отдельно
фиксирует activation latency, EXPLAIN, row budgets и 20 warm samples unread и
batch receipts с p95 ≤100 мс. Exact unread count может читать диапазон индекса
всех непрочитанных; JSON истории целиком не загружается. Receipt batch ограничен
100 адресными entries, readers — limit+1. SQL timings не переносятся на memory
и не заменяют end-to-end latency. Обычные HTTP request metrics сохраняют только
метод/шаблон маршрута/код/время; body, read positions и signing key не логируются.

Выключение флага скрывает новую возможность и сохраняет markers. Readiness
сверяет точный набор версий/checksum: прежний binary, не знающий миграцию007,
не совместим с новой схемой лишь потому, что она аддитивна. Оперативный fallback
сохраняет совместимый binary и выключает `SOMEWHERE_CHAT_READ_STATE`; отключение
`SOMEWHERE_CHAT_SYNC_KEY` дополнительно отключает sync/realtime, при этом read flag
должен быть false. История, markers, таблицы и прежний signing key сохраняются;
ключ понадобится при повторном включении. Возврат старого артефакта допускается
только после отдельной проверки его схемной совместимости, без down-миграций.
Координированное включение допустимо после готовности клиентских schema/UX и
независимой приёмки точного backend и клиентских артефактов.

## Изолированные клиентские fixtures

Test binary `httpapi.test` поддерживает прежние TestBrowserFixture,
TestIOSFixture и TestAndroidFixture. Только в этих opt-in тестах доступны
`SOMEWHERE_BROWSER_CHAT_REALTIME=1`, `SOMEWHERE_IOS_CHAT_REALTIME=1` или
`SOMEWHERE_ANDROID_CHAT_REALTIME=1`. Дополнительный `*_CHAT_READ_STATE=1`
включает прочитанность; один read flag даёт HTTP sync без realtime.
Прежние fixture flags/config обязательны, credentials/certificate записываются
в приватный config с режимом 0600. Native scope `chat` не запускает проверки
других UI-сценариев. Результат создания fixture не является SDK/UI pass.
