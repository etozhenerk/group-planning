# Android: независимый проход core

Это checkpoint реализации, не функциональный или дизайн-pass. Parent координирует
установку и отдельного независимого исполнителя. Не использовать production и
не запускать общий test-ui runner: он заменяет общий fixture. Единственный ранее
разрешённый QA target — emulator-5554; до отдельного GO никаких install/ADB.

## Источники

Рабочая копия: `/Users/misha/.codex/worktrees/chat-android-sync/group-planning`.
Backend base: `6aac61e80a52fdaa2eb117d16b1c42d06ec1857d`.
Отдельный baseline Android/DS 2.3: `c4b9fb0fd53a08bc021ef04217a1dfc712d59a85`.
Контракт realtime согласован с backend `e794168085968b123e011844ac9b97539af54857`;
этот commit не подменяет backend base клиента и не включается в Android diff.
Для core проверяется capability sync/realtime; read_state остаётся без реализации.
Источники требований и публикации outbox 2.4 записаны в review-inputs.json.
Значения DS не менялись, generated baseline 2.3 сохранён.

## Проход

Использовать актуальные raw requirements/testing/cases; case ID ниже — указатель
объёма, а не ожидаемый verdict. Зафиксировать backend SHA, capability, candidate
SHA, версию Android, устройство и source receipt. Вести собственный отчёт/evidence,
не менять продукт, макеты, cases и source hash.

- TC-CHAT-SYNC-2D68FE69, TC-CHAT-SYNC-THROUGH: задержка ACK102 относительно101,
  история одновременно с sync, несколько страниц с неизменным through.
- TC-CHAT-SYNC-5EFD24A6, BC07BEB1, F6CFB5E9: показанные poll/task/reactions,
  разрыв snapshot→subscribe, reconnect и reset410 с draft/outbox.
- TC-CHAT-SYNC-DC61BB4A, E77C7AE6, 14D92D7D, EB93F8D1, 6EF9F915:
  несколько исходящих, lost ACK, process death, отказ записи, rejected+новый draft.
  Pending и ACK должны оставаться одной строкой; до ACK нет реакций.
- TC-CHAT-SYNC-65C6F806, 60FCAA1D, 6F728A92, TC-CHAT-CAPABILITIES:
  отсутствие idle GET, один fallback при отказе WS, фон/возврат, legacy server.
- TC-CHAT-SECURITY-0E0CB54C, 1DC708F2, 92CE8303, 6A1C1A1A:
  expiry/revoke/account switch, поздний ответ, очистка защищённых intent/draft.
- UI: черновик/selection/IME во время нескольких отправок и независимых обновлений,
  длинная история, стабильный reader anchor, большой шрифт, TalkBack, системный Back.
  Сохранённые DS 2.3 реакции, emoji dock и plus menu входят в регрессию. Нативный
  external-keyboard Escape не является блокером телефонной приёмки.

Новые изолированные instrumentation classes:
`dev.groupplanning.android.ChatQueueUiTests` (QA, две проверки Compose) и
`dev.groupplanning.android.session.MessageQueueStorageTests` (общий androidTest для Debug и QA, Android Keystore).
Они не читают/перезаписывают private bootstrap; общий runner не использовать.
Их компиляция в этом checkpoint не равна запуску. Android Back/живой SDK/API,
перезапуск процесса и многопользовательский E2E ещё не приняты.

## Открытый объём

Read marker/unread/reader sheet — следующий согласованный API/UI срез, не fake-pass.
Текущий owner хранит UUID якоря и LazyListState, но отдельный saved `(id, offset)`
между пересозданиями и доказанный бюджет смещения ≤2 dp ещё не реализованы/не измерены.
Полная функциональная и визуальная приёмка, qa:ready/design:ready остаются открыты.
