# Свежая независимая серверная приёмка chat

Дата: 2026-11-01. Исполнитель независим от реализации: sdd_server_audit. Применён feature-test, делегирование исполнено родителем; новых агентов не создаём.

## До исполнения

Замороженные backend/contracts — source-before.json. Каталог, task/case mapping и expectations сохраняются. Исторические Go probes копируются только как методы, их новые хеши и overlay отделены от продуктового sourceHash; старые результаты не переносятся. Все локальные HTTP/WS — httptest/loopback, fake-provider и собственные synthetic actors. Отдельный TLS fixture служит точным наблюдаемым API anchor, без запуска клиентов.

План: TC-CHAT-PAGE-BOUNDS и TC-CHAT-IDEMPOTENCY-LOOKUP → 2.1/2.2; они и THROUGH/CAPABILITIES → 2.6; THROUGH/CAPABILITIES/SECURITY-0E0CB54C/READ-STATE-99A5AEEE/READ-STATE-E32551D3 → 3.6. Проверяем каждый expected в backend области, клиентский merge/UI и real OAuth не объявляем. Недоказанный expected оставляем blocked.

1. Создать qa:plan семи кейсов на текущем каталоге/исходниках и наблюдаемом loopback API.
2. Выполнить overlay Independent probes с race и целевые stock HTTP/storage/meeting/WS tests; обязательный backend-unit-integration через qa:run-suite, API contract checks.
3. Собрать отдельные Linux postgres/realtime test binaries из того же overlay. Передать на закреплённую ВМ только эти synthetic binaries. Создать НОВУЮ пустую somewhere_integration owner somewhere_migrator с уникальным COMMENT marker; при существующей БД остановиться. До каждого прогона и удаления сверять name/owner/marker. Не использовать production DB/backup.
4. Только два cloud selectors: bounded page SQL p95 (1k/10k/100k × limits1/50/100 ×6 directions ×20; бюджет100ms) и SQL multi-process/recovery/epoch/legacyHTTP. Полный stock SQL suite повторно не исполнять: его свежие migration/index/atomicity сведения уже в account-deletion/qa/2026-11-01-cloud-sql-independent.
5. Сохранить stdout/stderr, exit, timing, IDs результатов и binary hashes; cleanup собственных data/fixture, guarded DROP собственной DB обязательно. Before/after health/ready/PID/restarts, source hashes.
6. Сопоставить каждый шаг raw case с конкретными действиями и assertions; сформировать честный qa:ready или точные gaps, без task checkbox и release PASS.
