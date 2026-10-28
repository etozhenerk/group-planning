# Независимый backend repeat после исправления fingerprint · 28.10.2026

**PASS: 24/24 backend feature cases.** `qa:ready` завершён в MAIN и в отдельной чистой копии без private dotenv. Это функциональная приёмка указанного backend scope, не release receipt и не готовность клиентов.

- План: [plan.json](plan.json), финальный run: [run-fresh.json](run-fresh.json).
- Основной gate: [qa-ready.log](qa-ready.log); чистая копия: [clean-copy-verification.json](clean-copy-verification.json), [clean-copy-qa-ready.log](clean-copy-qa-ready.log).
- Source fingerprint MAIN/clean: `19a5a49dab452daf3074be8c278d81e7fc7aaf60a3840a6861a7850df2e6cdd8`; catalog `ff08c1b54fbbb37ef6c37b3a63da0acd4b6d9ecfb8b00564abf9aac1ce7db0d6`.
- 214 production inputs побайтово сверены с frozen identity `3a3816f7d71b858a5d5e98a7e510ecb6da4c9f57188db5a9b44247bb2da9d96f`; [source-integrity.json](source-integrity.json).

Ревьюер `/root/backend_independent_resume` не менял продукт или ожидания. Повтор использовал прежние probe source и case/selector mapping; каждый исход, timestamp, hash, SQL nonce и process PID получен заново. Старые результаты сохранены. Новый sourceHash не подставлялся в старый run.

## Проверки

Обязательный `backend-unit-integration` выполнен свежим запуском с `GOMAXPROCS=1`, `GOFLAGS=-p=1 -count=1`, Go1.27.2. Первоначальный запуск с Go cache сохранён в run.json; финальная приёмка использует только uncached suite из run-fresh.json.

Независимые runtime probes:37 PASS (24 top-level),3 opt-in SQL helper skip локально; эти SQL сценарии отдельно прошли на ВМ. Supplement:26 PASS (11 top-level). SQL:17 top-level PASS, включая bounded pages/lookup/read-state, удаление100001 sparse/max_uint64 строки с rollback+commit и восстановление в отдельных процессах после commit/publish crash. Нет локальной БД/Docker; рабочая БД и production сервис не изменялись.

54 свежих измерения feed p95: **0.281–2.347ms** при бюджете100ms; unread100k p95 **38.058ms**. Удаление100001:202батча в сумме rollback/commit, максимум1000строк на батч, maxstatement10.552ms. Controlled offline300s/RTT150 recovery640.248917ms; это Go protocol probe, не native commit→render. Подробные факты и assertions — [interaction.json](interaction.json), [metrics.json](metrics.json), raw JSONL и [SQL log](sql/sql-live.log).

Временная QA БД `somewhere_integration` создавалась только после проверки отсутствия, с уникальным comment-маркером; перед обычным drop проверено владение. `DROP FORCE` не применялся. Cleanup своей БД и `/tmp/codex-chat-independent-Jdah5NFa` подтверждён [receipt](sql/receipt.json).

## Ограничения

Этот набор не покрывает пользовательские клиенты, iOS/Android/web жесты, layout, полныйcapacity/commit→render, frame p95 на физическом устройстве, настоящий OAuth, реальный старый production binary rollback, восстановление backup этого кандидата или RPO/RTO. Security audit сохраняет честное различие server-readable text/TLS и E2EE; наличие исторического age job не превращено в подтверждение полного key lifecycle/restore.

Локальный realtime memory API, использованный для фиксации окружения, временно передан root для повторной диагностики iOS; его остановка отмечается отдельным cleanup receipt после handoff. На production ничего не разворачивалось. Новые release tags не создавались. Task checkboxes изменяет root после чтения отчёта.
