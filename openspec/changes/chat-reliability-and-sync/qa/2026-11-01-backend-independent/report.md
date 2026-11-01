# Независимая серверная приёмка chat, 01.11.2026

**7/7 выбранных кейсов PASS; обязательный backend suite PASS; qa:ready PASS.** Проверены точные серверные критерии chat 2.1/2.2/2.6/3.6. Для общих клиентских ожиданий дополнительно выполнены текущие integration rules и два адресных Chromium E2E. Общая готовность web/iOS/Android, design, release и stores не заявляется. Tasks, каталог и runtime не редактировались.

## Кандидат и метод

MAIN HEAD `6100ea0af422a6647a3b48e98eaa403183e6c04b` с замороженными рабочими native QA изменениями. Backend/contracts sourceHash `eff7cb20a91b9baf51e8b9fade927e3cc4442b40f446b3fe2ae6b0f283c9143e`; каталог 415 кейсов, hash `84856bf42ba9493c4f47f9152522aa73cd69705d3e968815a9e12a45bcc11b2e`.

Независимый исполнитель sdd_server_audit не писал проверяемый runtime/SQL. Применён feature-test по поручению родителя. [План до исполнения](verification-plan.md), [formal plan](feature/plan.json), [current run](feature/run.json), [qa:ready](qa-ready.log), [финальный formal report](feature/report-final).

Исторические 13 Go probes использованы только как методы: [inventory](probe-inventory.json), [overlay](overlay.json). Новые QA-only memory matrix и HTTPS boundaries имеют отдельные [inventory](probe-matrix-inventory.json) и [overlay](overlay-matrix.json). Старые результаты не переносились. После всех действий **backend 412/412, frontend/package 1030/1030 и 253 файла exact web bundle совпали с inventories**: [backend after](capabilities-backend-source-after.json), [client before](client-source-before.json)/[after](capabilities-client-source-after.json), [bundle](capabilities-artifact.json). Инструменты: Go1.27.2, закреплённые Vitest/Playwright/Chromium; облако Ubuntu24.04/PostgreSQL16.15.

## Свежие результаты

| Проверка | Фактический результат |
| --- | --- |
| Independent Go overlay, race/count1 |24 top-level PASS,13 subtests PASS,3 явных SQL opt-in SKIP без локального DSN |
| Stock targeted supplement, race/count1 |11 top-level PASS,15 subtests PASS,0 skips |
| Memory 1k/10k/100k и реальные HTTPS boundaries |2 top-level PASS,57 subtests PASS,0 skips |
| Required backend-unit-integration через qa:run-suite |PASS, fresh count1 после formal plan |
| API check/test |82 схемы,38 fixtures,561 реальный HTTP-ответ PASS |
| Две cloud пробы на новой marked DB |2 top-level PASS,3 history subtests PASS; page17.133s/process0.463s |
| Текущие клиентские owner/cursor/projection/fallback rules |20/20 Vitest PASS,0 skips/retries,1 worker |
| Адресные E2E текущего web bundle |2/2 Chromium PASS,0 skips/retries;404 и disabled200 |

Raw: [runtime](evidence/runtime.jsonl), [supplement](evidence/supplement.jsonl), [matrix](evidence/current-matrix.jsonl), [summary](evidence/summary.json), [required suite](evidence/required-suite-command.log), [API](evidence/api-test.log), [cloud](sql/stdout.log), [client JSON](evidence/client-supplement.json), [E2E JSON](capabilities-result.json)/[console](evidence/capabilities-playwright.log). SQL skips не переименованы в PASS: оба cloud parent selectors действительно исполнены на ВМ; child вызывается только отдельными дочерними процессами.

Свежие Go format/vet/build/dependency checks уже выполнены на том же неизменном source412 в независимом SQL блоке: [results](evidence/backend-static-results.json), [исходный отчёт](../../../account-deletion/qa/2026-11-01-cloud-sql-independent/report.md). Полный stock SQL suite повторно не запускался. Его свежие migration/EXPLAIN/lookup/atomicity сведения сохранены [здесь](evidence/stock-sql-current.log); новые cloud действия добавили недостающую p95 матрицу страниц и процессы crash/restart/rollback/epoch.

## Кейсы и task mapping

[Interaction](interaction.json) сохраняет исходные action/expected и actual каждого шага. Указанные runtime selectors проверены по свежим PASS records; ожидания не сокращены.

| Case | Свежие доказательства |
| --- | --- |
| TC-CHAT-PAGE-BOUNDS |Memory/SQL 1k/10k/100k,limits1/50/100,6 направлений; точные sequence/order/hasMore/tail/around;uint64/overflow/invalid/cancel/access-before-data;copy/snapshot/rollback;index/LIMIT/p95 |
| TC-CHAT-IDEMPOTENCY-LOOKUP |10k bounded Store отклоняет fullFeed;text/photo/file до/после31-day receipt expiry,тот же ID/sequence/attachments/legacy captionless hash;конфликты text/caption;foreign actor/meeting/revoke;copy/rollback/index lookup100k |
| TC-CHAT-READ-STATE-99A5AEEE |Invalid/nonexistent/beyond-tail/overflow markers;sparse precision/max;текущие права и revoked/delayed403 без private payload |
| TC-CHAT-READ-STATE-E32551D3 |Пустые readers автора;nonauthor/outsider/cursor403;100/101/foreign batch;canonical uppercase/mixed duplicate422 без частичного ответа |
| TC-CHAT-SECURITY-0E0CB54C |Отдельные revoke/TTL2s активного WS,close3503≤4s;late hint/callback/reconnect401;privacy/periodic boundary;backend scope |
| TC-CHAT-SYNC-THROUGH |Реальный Go HTTP105→100/5,fixedT,T+1 следующим циклом,replay;клиентский apply failure сохраняет entries/cursor,resume;stale-version guards;20hints сериализуют refresh |
| TC-CHAT-CAPABILITIES |Текущий живой клиент404/disabled:legacy feed/send/lost-ACK retry и отсутствие read UI;отдельный cloud no-journal writer/new epoch410/fresh snapshot/history preserved |

Mapping: **2.1/2.2→PAGE+LOOKUP;2.6→PAGE+LOOKUP+THROUGH+CAPABILITIES;3.6→THROUGH+CAPABILITIES+SECURITY+два READ-STATE**. Точные engineering criteria и назначенные server cases подтверждены свежими evidence/ready; checkboxes меняет родитель.

README/OpenAPI/fixtures/flags/recovery/rollback/privacy сверены с [backend README](../../../../../backend/README.md), [read state](../../../../../backend/docs/chat-read-state.md), [HTTP metrics](../../../../../backend/docs/http-metrics.md). Required suite включает bounded-cardinality/private-listener/FlushError/privacy regressions. Independent faults проверяют отсутствие body/token/cursor/name в errors/logs/journal/hints. Production flag enable и rollback не выполнялись.

## Последний gap: реальный CAPABILITIES

[План до исполнения](capabilities-e2e-plan.md), QA-only [probe](capabilities.spec.ts)/[config](capabilities.playwright.config.ts). Свежий demo текущих исходников собран в отдельный `.cache/sdd-capabilities-web-20261101`;253 файла и hashes — в [artifact](capabilities-artifact.json). Build/typecheck PASS: [log](evidence/capabilities-build.log). Обычный dist, shared web-demo и пользовательский8790 не использованы. Exact Go TestBrowserFixture binary SHA `fff9b4f15c8da24e9f7a1397cbb5f0c70670e21e90b049cb831120af703ac9a3`, только `https://127.0.0.1:8492`,memory/fakeOAuth,sync/realtime/read выключены.

Два новых browser contexts проходят обычные UI login/create/chat.404 — контролируемый plain-text capabilities fault;disabled — настоящий200 Go. Первый message POST закоммичен201, после чего только ACK скрыт connectionreset. Только canonical GET feed задержан до штатного queue retry: второй POST201 возвращает **тот же key/entryID/sequence**. В canonical history ровно одно сообщение; UI accepted и reload сохраняют одну строку.

Actual menu screenshots и DOM: нет WhoRead/read-receipt/readers-viewport;0 sync/realtime/read-marker/receipts/readers requests,0 WS. Остался единственный legacy HTTP путь. [Network/actions](capabilities-actions.json), [screenshots](capabilities-results); обе PNG визуально просмотрены. Общий design PASS кандидата не заявлен.

Client supplement20 PASS исполняет существующий production owner/cache с mocks на границах: projection apply fault,cursor после последней atomically applied страницы,resume/through guards,older revision rejection,один refresh при20hints. Вместе с реальным сервером это integration proof; browser durability и mobile UI verdict не заявляются.

## SQL и cleanup

54 page configurations ×20 samples =1080 измерений transaction+SQL+JSON decode;p95 **0.253–2.246ms**,budget100ms. Это synthetic isolated DB,не production/E2E SLA. Отдельные процессы:commit crash73/PID127965;new API127971 читает persisted delta;publish-before-ACK crash74/PID127977;periodic drain без NOTIFY127983 повторяет тот же eventID/ACK4. SQL abort не оставляет entry/journal/outbox. Actual HTTP account DELETE закрывает WS/удаляет markers/recipients;deleted meeting теряет history/stream;new process127991 доставляет durable terminal hint. Legacy writer/epoch затрагивали только свою встречу.

Marker `somewhere_sdd_chat_20261101_d47cdf4b667ff594`,initial tables0,owner somewhere_migrator super=false/createdb=false. Guard name/owner/marker перед selectors/DROP; **DROP succeeded,remainingDB0**. Before/after health/ready200,PID88760/caddy3465,NRestarts0 unchanged. [Cloud raw](sql/stdout.log), [binary provenance](sql/build.json), [SHA-guard binary cleanup](sql/binary-cleanup.log).

Собственные Chromium contexts закрыты runner;TLS anchor/BrowserFixture остановлены SIGTERM и завершились PASS;synthetic config удалён,memory уничтожена остановкой: [anchor](evidence/anchor-lifecycle.log), [browser](evidence/capabilities-fixture.log), [cleanup](capabilities-cleanup.json). Artifacts сохранены с hashes. Production DB/backup/cloud config/stores/Telegram,чужие процессы и устройства не использованы.

Исходная история сохранена: [5PASS/2BLOCKED](report-before-client-supplement.md)/[run](feature/run-before-client-supplement.json);затем [6PASS/1BLOCKED](report-before-capabilities-e2e.md)/[run](feature/run-before-capabilities-e2e.json)/[ready](qa-ready-before-capabilities-e2e.log). Новый7/7 основан на конкретных новых действиях. Это **feature-ready выбранных семи backend cases**,не release-ready всего415-case каталога.
