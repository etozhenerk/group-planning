# Повтор bounded storage на PostgreSQL — run02

27.10.2026, 18:10:09–18:10:21 UTC. Кандидат backend: `4c48037b36773aba5f261dc5003cc36ebdca7b36`.
Бинарник Linux/amd64: SHA256 `718e7b428ce8bee48718ffd08023d05a2ded367013b99c112a4dcb556fcc481d`.

В отличие от сохранённого run01, seed 100 000 записей выполнен транзакциями по 1000; timeout сервера не менялся. Проверка независимости JSONB-копий использует исходное значение, а не побайтовое сравнение с compact JSON. Изменены только тесты, production-код bounded storage остаётся из `0dc1997`.

## Результат

- `TestFeedBoundedQueryPlansIntegration`: PASS на 1k/10k/100k. На каждом объёме initial/after/before/empty-tail проверяют индексный scan и бюджет 51 строки, tail/entry/intent — 1 строку. Execution time отдельных SQL-планов 0.015–0.098 мс; это не HTTP latency и не commit→visible.
- `TestFeedWindowIntegration`: PASS, включая uint64, разреженные позиции, границы/пустые окна, прямые lookup и независимые копии.
- `TestFeedWindowSnapshotRollbackIntegration`: PASS, согласованность снимка/rollback и сохранение предыдущих данных при переполнении sequence.
- Процесс завершён с кодом 0; сырой stdout и receipt приложены. Локальный targeted race также сохранён отдельно.

## Изоляция и очистка

Только специально созданная на существующем сервере `somewhere_integration`. Скрипт отказался бы использовать уже существующую базу; перед удалением проверил свой случайный ownership marker. Вывод подтверждает `removedOwnTemporaryDatabase: true`. Временный удалённый каталог с тестовым бинарником удалён оркестратором. Production-база, конфигурация, службы и timeout не менялись.

## Ограничения

Это инженерная проверка bounded storage; новые sync/realtime/read-state ещё не приняты. Не закрывает целиком задачи 1.5/2.1/2.2: around, полный baseline старой реализации, сквозные бюджеты и независимая функциональная приёмка остаются отдельными. Не переносит PASS на UI или последующие изменения. Failed run01 сохранён без изменений.
