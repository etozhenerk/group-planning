# Независимая приёмка backend b973 — 23 passed, 1 failed

Кандидат `b973b3f7b69392fe808a4b98975b51af7e76f1c7`, production inputs в MAIN совпадают со snapshot. Формальный план создан до свежих прогонов. **23 кейса passed, 1 failed, blocked нет.** Готовность фичи и релиза не подтверждена из-за `QA-SQL-CLEANUP-100K-001`.

## Что проверено

Независимые локальные probes выполнены с `-race -count=1`: 70 верхнеуровневых тестов passed; 2 SQL helper tests явно skipped без DSN и не засчитаны как SQL-приёмка. Обязательный `backend-unit-integration` suite passed отдельно; его лог сохраняет факты кеширования пакетов и не подменяет свежие probes.

Проверены read-state, UUID casing и legacy-before-sync, HTTP/WS auth boundaries, session expiry/revoke и поздние запросы, отзыв RSVP между hint и HTTP snapshot, fault diagnostics без содержимого/credentials, fixed-through pagination, text/photo/file idempotency и legacy captionless hash. Восстановление 100 изменений уложилось в 2 s при модели RTT 150 ms. Пять минут offline заданы управляемыми часами приложения; broker retention исчерпан fixture hook. Это не пять минут wall time. При успешном broker recovery также выполнен HTTP catch-up.

После прямого ответа пользователя «Да, разрешаю проверку на нашей ВМ» выполнен guarded SQL run на проектной VM. Прежние отказы автоматической проверки сохранены как история; разрешение больше не является блокером. `sql-run01/sql-live.log` содержит свежий PASS всех 14 основных SQL тестов: journal/outbox atomicity, lease/retry, migration/legacy activation, read-state 100k, retention, bounded page/lookup plans, sparse uint64 и snapshot rollback.

Все 54 сочетания p95 страниц прошли: истории 1k/10k/100k, limit 1/50/100, initial/after-zero/empty-after-tail/before-first/before-tail/around, по 20 измерений с SQL и JSON decode. Диапазон p95 **0.341–2.744 ms**, бюджет **100 ms**. Индексированные entry/intent lookup на 100k плюс свежие text/media probes позволили завершить `TC-CHAT-IDEMPOTENCY-LOOKUP` как passed.

## Единственный дефект

`TestIndependentRepeatFeedSQLLatencyIntegration/100000` упал после успешных измерений в `t.Cleanup`: `repeat_feed_latency_test.go:15`, вызов `Store.Update(context.Background(), DeleteMeeting(id))` вернул `persistent storage unavailable`. Полный subtest занял 36.66 s; вызов удаления занял значительную часть времени, но отдельного замера длительности и исходной SQL cause в логе нет. Причина не установлена: timeout/cascade остаются гипотезами.

Это **ошибка удаления/очистки**, не провал p95 или EXPLAIN. Первый SQL процесс вернул exit1, поэтому его весь прогон не объявляется успешным, а `TC-CHAT-PAGE-BOUNDS` остаётся failed. Бюджеты, требования и продуктовый код не менялись. Внешняя guarded очистка после ошибки успешно удалила только собственную БД и tempdir.

## Восстановление между процессами

Предварительно подготовленный process-only тест выполнен отдельно на новой пустой БД, без повторения большой матрицы и без изменения бинарника. `TestIndependentRepeatSQLProcessRestartDeletionAndEpoch` passed за 1.44 s:

- Commit process PID 54100 аварийно завершился exit73 до publish; API process PID 54106 вернул HTTP200 и delta1.
- Publisher PID 54111 завершился exit74 после publish до ACK; process PID 54116 без NOTIFY повторно доставил тот же event ID и подтвердил четыре hints. SQL rollback не оставил записи/outbox; journal atomicity также проверена основной матрицей.
- Штатный HTTP DELETE аккаунтов с активными WS закрыл соединения 3503, удалил marker/адресные hints и вернул текущую обезличенную projection. Удаление встречи убрало stream/history; новый process PID 54122 доставил surviving observer durable terminal hint без текста/token, acknowledged=3.
- Test-only writer без journal и явная смена epoch у собственной встречи дали HTTP410 на старый cursor; новый snapshot сохранил период rollback. Disabled sync/read оставили legacy feed/send/retry с прежним ID/sequence. Это schema-compatible fallback и имитация writer; старый production binary и rollback схемы не запускались. Клиентские fallback/read UI проверяются отдельно.

Этим завершены `TC-CHAT-SYNC-AA76CADB`, `TC-CHAT-SECURITY-A3B3BFE7` и backend scope `TC-CHAT-CAPABILITIES`.

## Evidence и завершение

`interaction.json` содержит действия, expected/actual и selectors; `source-parity-b973.json` подтверждает 213 production inputs MAIN/snapshot, включая embedded SQL и emoji. `source-integrity.json` подтверждает неизменность исходных файлов snapshot; добавлены только test probes. Raw logs, test source hashes, binary SHA и receipts сохранены в `sql-run01/` и `sql-process-run01/`. Предыдущая запись 19 passed / 5 blocked сохранена без изменений в `before-sql-20261027T223322Z/`.

Оба облачных выполнения завершены; receipts подтверждают удаление собственных БД и временных бинарников/каталогов. Собственных работающих fixtures/processes после выполнения нет; root fixture не останавливался. Production данные, сервисы и настройки не изменялись, активация production не выполнялась.

`qa:ready` выполнен после SQL: exit1, `Functional acceptance incomplete: TC-CHAT-PAGE-BOUNDS/chat-api-r5-b973/manual: failed`. `agent:check` и `git diff --check` passed; hashes всех ссылок evidence совпадают. Следующий шаг завтра: безопасно получить точную SQL cause при удалении 100k в изолированной БД, отделить дефект teardown от продуктового DeleteMeeting, исправить в роли исполнителя без ослабления лимитов, затем повторить затронутую приёмку на зафиксированном кандидате. Только после успешного gate основной агент продолжает отдельную release-проверку точных артефактов.
