# Account deletion: реальный coordinator и PostgreSQL,01.11.2026

**TC-ACCOUNT-1C58ABFB PASS; formal qa:ready PASS2/2.** Недостающий сценарий второй встречи теперь проверен реальным HTTP→accounts coordinator→PostgreSQL UoW. Точный SQL-критерий task2.5 подтверждён; клиентская/realOAuth/общая lifecycle готовность не заявляется. Checkboxes/catalog/runtime не менялись.

## План и source

[План до новых действий](verification-plan.md), [probe](probes/coordinator_second_meeting_test.go), [overlay](overlay.json), [inventory](probe-inventory.json), [resource plan](sql/resource-plan.json).

Formal plan — **неизменённая копия** account-cloud-sql-independent, созданного13:46UTC до всех нынешних SQL/HTTP/client действий. В нём неизменны source/catalog/createdAt/expected: [plan](feature/plan.json), [provenance](formal-plan-provenance.json). Ранее выполненный после него required backend suite count1 PASS остаётся действительным на тех же исходниках; новый полный Go/PG suite не запускался. Второй expected PAGE теперь уже пройден в текущей независимой chat7 приёмке после даты этого плана. [Current run](feature/run.json), [qa:ready](qa-ready.log), [formal report](feature/report).

**412/412 backend/contracts inputs совпали до/после**: [before](source-before.json), [after](source-after.json). Product sourceHash eff7cb20a91b9baf51e8b9fade927e3cc4442b40f446b3fe2ae6b0f283c9143e, catalog84856bf42ba9493c4f47f9152522aa73cd69705d3e968815a9e12a45bcc11b2e. Новые Go test source существуют только как QA overlay; реальные accounts/httpapi/identity/meetings/PostgreSQL файлы не подменены. Go1.27.2, Linux/amd64 test binary SHA **e3e155d484f1359a32bb797bd160795df04133206713faacf085871a56304be2**.

## Реальные действия и результат

Один top-level selector `TestIndependentCoordinatorSecondMeetingSQLRollback`,count1,timeout3m. **PASS0.78s**,wall0.811s,exit0,0skips. [Полный stdout](sql/stdout.log),stderr пуст,[summary](evidence/summary.json),[interaction](interaction.json).

1. Через штатные adapters созданы synthetic profile/provider mapping,две native sessions,handoff и две отдельные встречи с RSVP/history/jobs/cover/task. БД изначально пуста,никаких production данных.
2. Реальный PostgreSQL BEFORE DELETE trigger на второй по фактическому порядку встрече проверяет отсутствие первой **внутри той же транзакции**,после чего увеличивает только отдельную nontransactional QA sequence и бросает SQL exception. Это доказывает,что ошибка вызвана после реального удаления первой встречи; coordinator/domain methods не возвращают искусственный mock error.
3. Настоящий `DELETE /api/v1/me` с Bearer и operation token проходит через httpapi→accounts.New→Identity.AccountUpdate→auth.WithStore+meetings.NewService на общем UoW;ответ500 без SQL/session деталей. Значение sequence подтверждает нужную точку отказа.
4. **Новый независимый pool** видит те же counts/fingerprints всех25business tables,что до запроса. Обе встречи доступны,профиль/provider mapping,обе сессии и handoff сохранены;receipt/tombstone отсутствуют,revocation callback не вызван. Таким образом первая удалённая встреча и частичная обработка второй действительно откатились вместе.
5. После снятия только собственного SQL fault обычный retry завершает204;обе старые сессии дают401,событие отзыва ровно одно. Sessionless receipt replay204 безопасен;созданный после удаления аккаунт с тем же synthetic subject и своей сессией сохраняется. Operation secret как Bearer даёт401;после25h receipt retry401 и новый профиль остаётся на месте. Реальный OAuth этим setup не проверялся.

Raw expectation сохранён: «операция завершилась ошибкой при обработке одной из встреч» → «профиль,сессии и все встречи остаются в исходном состоянии». Дополнительные success/receipt проверки не заменяют этот rollback шаг.

## Сохранённый первый FAIL

Первый binary SHA f620b1399e70716cc029b57571eef2420b2040df979faeecfbc4edbab13c09e3 уже подтвердил SQLfault/HTTP500/равенство всех table fingerprints,но затем ошибся **QA verification fixture**: `Details(Actor{ID})` без обязательного Name вернул «actor required». [Raw FAIL](iteration1/sql/stdout.log),[исходный probe](iteration1/probes/coordinator_second_meeting_test.go),[inventory](iteration1/probe-inventory.json) сохранены. Original binary сохранён локально `/tmp/somewhere-sdd-account-coordinator-iteration1-20261101.test`.

Единственный fixture delta — имя `Synthetic private owner` в verification Actor для существующего Details. Product/assertions/timeouts не менялись. Новая попытка использовала новую пустую БД и новый marker;FAIL не перезаписан и не переименован в PASS. Также сохранены ранние build invocation/sandbox logs и schema-only ошибка отсутствовавшего обязательного поля defect;они не считались продуктовым результатом.

## Cleanup и границы

Первая DB marker somewhere_sdd_account_20261101_9042c1e141dcbe67;повтор somewhere_sdd_account_20261101_017015456203011d. Обе созданы пустыми с owner somewhere_migrator super=false/createdb=false. Перед прогоном/DROP проверены имя,owner,marker. **Обе DROP succeeded,remaining_test_databases0**,загруженные binaries удалены после SHA guard.

До/после health/ready200,somewhere PID88760,caddy PID3465,NRestarts0 unchanged. Никаких productionDB/backup/ресурсов/секретов/рестартов/реальных Telegram сообщений;producer/DDL работал nonsuperuser. [Текущий cleanup](sql/stdout.log),[первый cleanup](iteration1/sql/stdout.log). Временный HTTP server и pools закрыты test cleanup;все synthetic данные удалены с собственной БД.

Соседний [stock SQL отчёт](../2026-11-01-cloud-sql-independent/report.md) сохраняет migration/version1/pool-persistence/atomicity evidence и исходный support verifyFAIL с отдельным isolatedPASS. Настоящий второй-meeting coordinator fault теперь закрывает точный ранее недостающий шаг;новый formal plan не подменяет старые receipts и не заявляет приёмку клиентов/скрытия UI.
