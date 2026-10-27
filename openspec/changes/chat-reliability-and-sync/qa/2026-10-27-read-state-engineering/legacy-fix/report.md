# Исправление legacy read endpoints

Кандидат `8d5a5d3ac82b7eceabfdf7c0d1b3fa4fb9c4648f`, поверх2144. Встреча без chat stream теперь допускает первый authorized запрос receipts/readers до Sync. Инициализация выполняется один раз, повторно проверяет доступ в write/read транзакциях, не меняет actual/baseline и не создаёт journal/outbox. Continuation без epoch требует reset.

Регрессия сначала воспроизвела прежние ошибки, затем TestChatRead/Sync прошли с race. Полный Go race MAIN после фикса PASS; первый запуск был заблокирован песочницей на bind loopback и сохранён отдельно, повтор разрешённого локального HTTP/WS запуска прошёл. API:80 schemas/38 fixtures/482 actual HTTP responses PASS. Форматирование, agent:check, qa:check и diff-check PASS. Storage/SQL не менялись; прежний SQL-run не выдаётся за новую полную интеграционную проверку.

Независимый [повтор](../../2026-10-27-read-state-independent/run05-8d5/report.md) exact8d5:24 tests,8 собственных probes PASS проверенного server scope. Native/read UI, capacity и общий release gate остаются отдельными проверками. Tasks не закрыты.

Логи сохранены lossless gzip, raw и stored SHA256 — в artifacts.json. MAIN содержит дополнительные ранее принятые profile fixture расширения; исправленные четыре service файла byte-for-byte совпадают с frozen candidate, receipt находится в main-integration.
