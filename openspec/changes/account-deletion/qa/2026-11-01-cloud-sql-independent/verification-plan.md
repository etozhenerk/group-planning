# Независимый SQL verification plan

План зафиксирован 01.11.2026 до первого запуска PostgreSQL test binary.
Исполнитель: sdd_server_audit, не автор PostgreSQL/accounts implementation.
Source/catalog/runtime не меняются; изменения этого прохода — только QA evidence.

## Разрешённая среда

- VM158.160.246.254, pinned SSH key/known_hosts из infra/local; не менять pin.
- Новая пустая somewhere_integration, owner/OS role somewhere_migrator; PostgreSQL16.15.
- Marker database comment: somewhere_sdd_20261101_76a964f2f22e. Проверять marker и owner перед каждым запуском, DDL и финальным DROP. Только эта БД разрешена к удалению.
- Все роли somewhere_migrator/somewhere/somewhere_metrics non-superuser, без CREATEDB/CREATEROLE. До запуска0user tables; свободно5739450368bytes. Production GET health/ready200, services0restarts.
- Binary /tmp/somewhere-sdd-postgres-20261101.test SHA256384028fc984e2f8086922ee4898f7829acb996a7d9d7029dda93519e2bb411fd, Linux/amd64 Go1.27.2; root подготовил из currentstorage/postgres, tests ещё не запускались.
- DSN передаётся только процессу теста: host=/var/run/postgresql dbname=somewhere_integration user=somewhere_migrator sslmode=disable. Это peer в том же хосте, не публичное соединение; паролей нет.
- Синтетические данные stock fixtures, контролируемые часы внутри тестов. Нет реального OAuth/Telegram, рестартов production/API/PostgreSQL, локальной БД/Docker или изменения роли/ресурсов.

## Фактический scope и критерии

| Блок | Stock selectors | Что можно подтвердить |
| --- | --- | --- |
| account-deletion2.5 | TestAccountDeletionAtomicityAndPersistence; TestAccountMigrationUpgradesVersionOne | SQL migration1→current/replay, сохранность старого профиля; rollback общей identity/meetings tx, commit, повторное чтение другим pool, удаление children/profile/provider/session/handoff, persistence fence/receipt и expiry |
| Общее хранилище | TestPersistenceAndAtomicity; TestMigrationChecksumGuard; TestIdentityFailureCannotBecomeUnauthenticated | create+job+receipt, разные типы записей, другой pool, rollback/read-only/closed/cancelled tx, конкурентный feed, checksum/version rejection, SQL-error propagation |
| chat storage | TestFeedWindow*; TestFeedStorageCancellationErrors; TestFeedBoundedQueryPlansIntegration; TestChat*Integration | page/around/highuint64/clone/rollback/cancel, EXPLAIN/index/LIMIT на1k/10k/100k, journal/through/epoch/retention, atomic read markers/outbox/lease/retry, migration legacy,100k read plan/p95 |
| Удаление большой истории | TestMeetingDeletionLargeHistoryIntegration |100001 sparse/maxuint64 feed, реакции, rollback и commit, порции≤1000, соседняя встреча неизменна |
| Фоновые процессы | TestPersistentWorkerLeaseAndIdempotency | другой pool, lease expiry/stale owner/idempotency/переход срока; это не restart production-процесса |
| Поддержка | TestSupportMigration; TestSupportPersistentAcceptanceAndRollback; TestSupportProcessPersistence | постоянная очередь/повтор/rollback, отдельно seed→verify в двух настоящих процессах, synthetic transport, exclusive lease,30-day cleanup |
| Метрики БД | TestBusinessMetricsPersistenceAndPrivacy | установка/replay только в disposable DB, persisted aggregate counters, ACL/privacy; не облачная доставка/новый платный ресурс |

Порядок: один полный binary с -test.v -test.count=1 -test.timeout=20m. TestSupportProcessPersistence без phase обязан SKIP; его не считать PASS. Затем два отдельных процесса только этого selector с SOMEWHERE_SUPPORT_TEST_PHASE=seed и verify; никаких повторов полного suite ради зелёного статуса. После каждого процесса — stdout/timing/exit/top-level+subtest+skip counts. Ошибка остаётся FAIL, независимые блоки продолжаются только без угрозы изоляции.

Локально после plan: API contract; ровно один required backend-unit-integration через qa:run-suite, GOFLAGS=-count=1 (отключить cache); Go format--check/vet/build/dependencies. Локальные SQL skips без DSN не заменяют облачный прогон.

## Catalog/feature-plan границы

Formal feature plan содержит относящиеся backend TC-ACCOUNT-1C58ABFB и TC-CHAT-PAGE-BOUNDS как полные неизменённые expected. Их partial SQL результаты фиксируются по шагам; case PASS/qa:ready не выдаются при недостигнутых expected. Это не сужение требований, каталог/automation не редактируются.

Account SQL stock не выполняет полный DELETE /me HTTP/CSRF/реальный OAuth, потерю ответа клиентом, выбор преемника на SQL, ошибку во второй встрече полного coordinator. TC-ACCOUNT-9A32B220/C8388C19/C479CF83, native/UI и HTTP+SQL путь не засчитываются. Для полной приёмки этих границ нужен отдельный реальный HTTP+SQL harness; вопрос передан root.

Stock SQL page plans подтверждают фактические планы и времена отдельных запросов, но не весь transport/access/p95 пользовательского случая. Cases с dispatcher crash/active subscriptions/replay клиента, read UI и backup retention не выдаются за full PASS по low-level SQL. Gathering14.4/14.5 и chat7.2/7.3 целиком не закрываются.

## Финальная очистка

Сначала сохранить фактический marker/owner, size, migration versions/checksums, user table/role metadata и health/restart counters. Если marker/owner совпадают — удалить только somewhere_integration, без принудительного завершения чужих сессий/без изменения production. Проверить отсутствие БД и прежние health/ready/service PID/restarts. При mismatch ничего не удалять, сохранить blocked и сообщить root. Отчёт не завершать без подтверждённого cleanup либо конкретного blocker.
