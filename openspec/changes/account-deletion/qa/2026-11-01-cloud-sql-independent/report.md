# Независимая квалификация PostgreSQL, 01.11.2026

## Вердикт по task account-deletion2.5

**PASS по точному SQL-критерию задачи**: миграция и интеграционные сценарии выполнены в отдельной облачной БД, без локальной БД/Docker и без изменения production. `TestAccountDeletionAtomicityAndPersistence` и `TestAccountMigrationUpgradesVersionOne` прошли на реальном PostgreSQL16.15 под owner/non-superuser/non-CREATEDB/non-CREATEROLE `somewhere_migrator`.

Проверены upgrade/replay/checksum и сохранность старого профиля, rollback общей identity/meetings транзакции, commit, повторное чтение через независимый pool, отсутствие профиля/provider mapping/session/handoff/meeting/children после commit, сохранность deletion receipt/subject fence/tombstone и их expiry. Это проверка task2.5, а не full lifecycle/HTTP/OAuth/UI/всех account cases. Checkbox оставлен родителю.

## План, окружение и provenance

План создан до выполнения: [verification-plan.md](verification-plan.md), [environments.json](environments.json), [feature plan](feature/plan.json). Catalog/source привязаны CLI; [source-after](evidence/source-after.json): **412/412 backend/contracts файлов неизменны**.

Linux/amd64 binary SHA256 `384028fc984e2f8086922ee4898f7829acb996a7d9d7029dda93519e2bb411fd`. Независимая повторная cross-компиляция текущего frozen source Go1.27.2 дала побайтово тот же SHA: [rebuild](evidence/binary-independent-rebuild.json). Это только build, дополнительный full test не запускался.

SSH использовал исходные key/known_hosts с StrictHostKeyChecking и IdentitiesOnly. Секреты и реальные данные не читались/не сохранялись. Tests получали peer DSN только к somewhere_integration; весь producer/DDL тестов работал non-superuser. Sudo postgres применялся только для создания второй disposable DB с назначением owner, без изменения ролей или production.

## Фактические результаты

| Запуск | Результат | Время | Raw |
| --- | --- | --- | --- |
| Один полный stock PostgreSQL binary | **26 top-level PASS, 1 explicit SKIP, 44 subtests PASS, 0 FAIL**; из26 PASS два чистых unit,24 реальных SQL |75.586s, exit0 | [full](evidence/cloud-full.log), [summary](evidence/cloud-summary.json) |
| Первый support seed после полного suite |1 PASS, exit0 |0.049s |[seed](evidence/cloud-seed.log) |
| Первый support verify в той же загрязнённой fixture DB |**1 FAIL**, exit1; сохранён без перезаписи |0.063s |[verify](evidence/cloud-verify.log) |
| Новая пустая DB: только SupportMigration |1 PASS, exit0 |0.681s |[migration](support-isolated-retry/migration.log) |
| Та же новая DB: seed, отдельный процесс |1 PASS, exit0 |0.046s |[seed](support-isolated-retry/seed.log) |
| Та же новая DB: verify, отдельный процесс |1 PASS, exit0 |0.075430s |[verify](support-isolated-retry/verify.log), [summary](support-isolated-retry/summary.json) |

`TestSupportProcessPersistence` в полном suite ожидаемо SKIP без phase, не PASS. Два последующих процесса проверяют persisted payload/progress, lease и30-day cleanup на изолированном одиночном feedback, с synthetic transport, без Telegram.

Первый verify FAIL — загрязнение предусловия теста: full suite оставляет другие pending feedback с CreatedAt01.11. Контролируемый retention шаг225 перемещает время от28.10 на30дней. Исходный feedback удаляется, но более новые записи ещё допустимы к доставке, а adapter второго worker сообщает ошибку при любой доставке. Ранний lease assertion217 не сработал; ошибка211 возникает при позднем вызове225. Повтор на пустой DB с тем же binary/assertions прошёл. Код/lease assert/таймауты не менялись. Это отдельный изолированный повтор, не сокрытие исходного FAIL.

Дополнительно live SQL подтвердил:

- Общие persistence/read-only/closed/cancelled/rollback/SQL-error guards; version/checksum rejection; миграции1–8.
- Bounded страницы/around/direct lookup, uint64 max/overflow, clone/rollback; EXPLAIN с индексом/LIMIT для1k/10k/100k.100k initial/after/before:0.070/0.052/0.053ms в этом окружении, не общий latency benchmark.
- Read state100k: activation2.931ms,20samples p95 unread39.197ms и receipts2.245ms; бюджет100ms пройден для этих запросов.
- Удаление100001 sparse/max-uint64 entries: rollback+commit,202batch/max1000rows, max statement11.782ms; соседняя встреча/реакции не изменены.
- Journal/through/epoch/retention/migration legacy, atomic markers/outbox и lease/retry; business-metrics persistence/privacy/ACL только в disposable DB.

Числа и query plans: [observations](evidence/sql-observations.log), полный stdout сохранён [здесь](evidence/cloud-sql.stdout.log).

## Локальные обязательные проверки

После plan выполнены fresh `npm run api:test`:82schemas/38fixtures/**561 actual HTTP responses**, PASS. Затем ровно один required `backend-unit-integration` через qa:run-suite, с `GOFLAGS=-count=1`, PASS; локальный DSN отсутствовал, SQL skips не считались облачным PASS. [API/suite results](evidence/api-and-suite-results.json), [suite console](evidence/required-suite-console.log), [formal run](feature/run.json).

Fresh Go format--check/vet/build/dependency boundaries — PASS: [results](evidence/backend-static-results.json). Runtime/catalog/case expected/task statuses не менялись.

## Cleanup и production

Первый marker `somewhere_sdd_20261101_76a964f2f22e`, второй `somewhere_sdd_support_20261101_503f28ba5481a27d`. Перед каждым запуском и DROP проверены name/owner/marker. Обе DB удалены, `remaining_test_databases=0`. Никаких принудительных завершений чужих соединений и рестартов.

До/после обоих прогонов health/ready200; somewhere PID88760, caddy PID3465, counters NRestarts0 неизменны. Role flags не повышались. Полные cleanup/prod metadata: [первый stdout](evidence/cloud-sql.stdout.log), [изолированный повтор](support-isolated-retry/stdout.log). БД второго запуска была создана пустой, initial_user_tables=0. Первый прогон максимум278559767bytes; после cleanup свободно5645926400bytes. ProductionDB не использовалась.

## Пределы приёмки и следующие действия

Formal feature expected TC-ACCOUNT-1C58ABFB и TC-CHAT-PAGE-BOUNDS оставлены **blocked по непокрытым полным шагам**, несмотря на положительный SQL component результат. [Report](feature/report) не объявляет qa:ready. У account stock fixture нет сценария ошибки второй встречи полного coordinator; SQL page tests не заменяют полный transport/access/cursor/p95 sweep. Реальный OAuth, полный DELETE HTTP+SQL, клиентская очистка, backup restore/7-day retention и реальный dispatcher/API restart здесь не пройдены.

Следующие конкретные шаги: использовать этот SQL source/binary/evidence для task2.5; для полного lifecycle отдельно поднять разрешённый изолированный HTTP+SQL harness со штатным accounts coordinator и пройти неизменённые catalog expected. Для chat2.1/2.2/2.6/3.6 родитель поручил отдельный narrow feature проход; его результаты не подменяются этой SQL qualification.
