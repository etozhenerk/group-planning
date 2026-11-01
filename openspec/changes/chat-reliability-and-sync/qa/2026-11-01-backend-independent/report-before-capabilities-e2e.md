# Свежая независимая серверная проверка chat, 01.11.2026

**Результат после клиентского дополнения: 6 cases PASS, 1 case BLOCKED; общий qa:ready не пройден.** Серверные bounded storage/HTTP/SQL действия прошли. Для THROUGH недостающие правила проверены текущими клиентскими integration тестами; CAPABILITIES всё ещё требует живого read UI. Старый backend24/24 не переносился. Checkbox/catalog/runtime не изменены.

## Кандидат и метод

MAIN HEAD `6100ea0af422a6647a3b48e98eaa403183e6c04b` с ранее замороженными native QA изменениями. Продуктовый sourceHash backend/contracts: `eff7cb20a91b9baf51e8b9fade927e3cc4442b40f446b3fe2ae6b0f283c9143e`; каталог415: `84856bf42ba9493c4f47f9152522aa73cd69705d3e968815a9e12a45bcc11b2e`.

[Source before](source-before.json), [source after](source-after.json): **412/412 файлов совпадают**. Go1.27.2; облако Ubuntu24.04/PostgreSQL16.15. Применён feature-test в независимой роли по поручению родителя. Исходный исполнитель runtime/SQL не совпадает с проверяющим.

[План до исполнения](verification-plan.md), [formal plan](feature/plan.json), [окружение](environments.json). Наблюдаемый отдельный TLS API anchor `https://127.0.0.1:55114`; реальные probe endpoints создаются httptest и останавливаются каждым тестом. Fake-provider/синтетические A/B/C/X; реальные OAuth и пользователи не использованы. Ни одного приложения/симулятора не запускали.

13 прежних Go probes использованы только как методы: [inventory](probe-inventory.json), [overlay](overlay.json). Дополнительные QA-only matrix/HTTPS boundary probes имеют отдельный [inventory](probe-matrix-inventory.json) и [overlay](overlay-matrix.json). MAIN backend test/runtime исходники не менялись. Результаты, процессы, время, binary hashes и данные БД новые.

## Исполнение

| Проверка | Фактический результат |
| --- | --- |
| Independent overlay, race/count1 |24 top-level PASS,13 subtests PASS,3 explicit SKIP: только cloud-only parent/child/page selectors без локального DSN |
| Stock targeted supplement, race/count1 |11 top-level PASS,15 subtests PASS,0 skips |
| Дополнительная memory1k/10k/100k + реальные HTTPS invalid/scope |2 top-level PASS,57 subtests PASS,0 skips |
| Обязательный backend-unit-integration через qa:run-suite |PASS, exit0; fresh count1 после feature-plan; local SQL skips не считаются SQL PASS |
| API check + API test |PASS:82 schemas,38 fixtures,561 actual HTTP responses |
| Два cloud selectors, отдельная новая marked DB |2 top-level PASS +3 history subtests PASS; page17.133s, process/recovery0.463s |

Raw: [runtime](evidence/runtime.jsonl), [supplement](evidence/supplement.jsonl), [extra](evidence/current-matrix.jsonl), [summary](evidence/summary.json), [required suite](evidence/required-suite-command.log), [API](evidence/api-test.log), [cloud](sql/stdout.log). Cloud stderr пуст, shell exit0.3 локальных opt-in skips не переименованы в PASS: соответствующие два parent selectors действительно выполнены на ВМ, child исполняется только отдельными дочерними процессами.

Fresh Go format/vet/build/dependency checks уже выполнены на том же неизменном source412 в соседнем независимом SQL прогоне: [results](evidence/backend-static-results.json), [полный исходный отчёт](../../../account-deletion/qa/2026-11-01-cloud-sql-independent/report.md). Повторный полный stock SQL suite не запускался; свежие migration/EXPLAIN/lookup/atomicity сведения взяты из того же отчёта и [raw stock SQL](evidence/stock-sql-current.log), а новые проверки исполнили отсутствовавшую p95 матрицу и реальный multi-process сценарий.

## Cases и задачи

Пошаговые **неизменённые** action/expected и конкретные actual: [interaction](interaction.json). Все перечисленные в нём runtime selectors найдены в свежих PASS records.

| Case | Verdict | Что фактически доказано |
| --- | --- | --- |
| TC-CHAT-PAGE-BOUNDS |PASS |Memory/SQL1k/10k/100k,limits1/50/100,initial/after/before/around; sequence/order/hasMore/tail; uint64/overflow/invalid/cancel/foreign access; copy/snapshot/rollback; index/LIMIT и p95 |
| TC-CHAT-IDEMPOTENCY-LOOKUP |PASS |Bounded 10k text/photo/file before/after31d receipt expiry, legacy captionless hash, sameID/seq/attachment; conflicts/wrong actor/meeting/revoke; copies/rollback/index lookup100k |
| TC-CHAT-READ-STATE-99A5AEEE |PASS |Невалидные/несуществующие/beyond-tail markers, precision/overflow; current access до payload; revoked/delayed request403 |
| TC-CHAT-READ-STATE-E32551D3 |PASS |Empty author readers; nonauthor/outsider/cursor denied;100/101/foreign batch; uppercase canonical, mixed duplicate422 без partial answer |
| TC-CHAT-SECURITY-0E0CB54C |PASS backend |Раздельные revoke/expiry активного WS,3503≤4s; late hint и HTTP/reconnect401; отсутствие private markers в logs/hints. Клиентский UI/cache не заявлен |
| TC-CHAT-SYNC-THROUGH |PASS backend integration |Реальный GoHTTP105→100/5,fixedT/T+1/replay + fresh current client apply-failure/cursor rollback/resume/stale-version/serialized20hints;20/20 targeted unit/integration |
| TC-CHAT-CAPABILITIES |BLOCKED full shared case |Backend PASS disabled legacyfeed/send/retry,404 endpoint gating, no-journal writer/new epoch410/reset/history retained. Новый клиент404fallback/единственный legacy path/readUI не запускался |

Точный mapping сохранён:2.1/2.2 → PAGE+LOOKUP;2.6 → PAGE+LOOKUP+THROUGH+CAPABILITIES;3.6 → THROUGH+CAPABILITIES+SECURITY+два READ-STATE. Технические критерии2.1/2.2 свежими проверками подтверждены. Для2.6/3.6 обновлённые OpenAPI/fixtures/README/feature flags/recovery/rollback/безопасные метрики и локальные проверки подтверждены, но приёмочный mapping включает один blocked shared case. Этот отчёт не разрешает автоматически отметить все четыре задачи.

Документация сверена с текущими [README](../../../../../backend/README.md), [read-state](../../../../../backend/docs/chat-read-state.md), [HTTP metrics](../../../../../backend/docs/http-metrics.md). Required suite включает bounded-cardinality/privacy/private-listener/FlushError regressions; independent runtime faults проверяют отсутствие body/token/cursor/name в errors/logs/journal/hints. Реальное включение флагов/публикация/rollback production не выполнялись.

## Облачные измерения и процессы

54 сочетания ×20 samples (1080 измерений) transaction+SQL+JSON decode; p95 **0.253–2.246ms** при бюджете100ms. Это собственная синтетическая DB на текущей ВМ, не гарантия production/E2E latency.

Test-only процессы: commit-crash exit73/PID127965; новый API PID127971 читает сохранённую delta; publish-beforeACK crash74/PID127977; новый periodic drain без NOTIFY PID127983 повторно публикует тот же event ID и ACK4. SQL abort не оставляет entry/journal/outbox. HTTP account DELETE закрывает WS/удаляет markers/recipients; удалённая встреча теряет history/stream; новый процесс PID127991 доставляет surviving observer terminal invalidation. No-journal writer и epoch rotation затрагивают только свою встречу в disposable DB.

Linux binaries: postgres `6b7fc87b048a59d706ffd8078b6379d0f5ca04deb1be3fb7bb1273f2dd69dff4`, realtime `1a780c90d820d98fd6f462632c395938fecc96e9d488ba0e60dee59cbcdafc66`; [provenance/build](sql/build.json).

## Cleanup и пределы gate

Новая DB marker `somewhere_sdd_chat_20261101_d47cdf4b667ff594`, initial_user_tables0, owner somewhere_migrator super=false/createdb=false. Name/owner/marker проверены до обоих selectors и DROP. **DROP succeeded; remaining_test_databases0**. Before/after health/ready200; somewhere PID88760,caddy3465,NRestarts0 неизменны. Никаких production данных, backup, рестартов, новых ролей/прав, облачных ресурсов или реальных Telegram сообщений.

Собственные remote binaries удалены с guard SHA: [cleanup](sql/binary-cleanup.log). TLS anchor остановлен SIGTERM и завершился PASS; synthetic credential config удалён: [lifecycle](evidence/anchor-lifecycle.log), [receipt](evidence/anchor-cleanup.json).

[qa:ready](qa-ready.log) корректно возвращает **incomplete только для CAPABILITIES**. [Formal report](feature/report) валиден, но не release/task receipt. Для снятия оставшегося gap нужен текущий живой клиентский artifact с capabilities404/disabled fallback/readUI; использовать свежий отдельный plan до исполнения, сохранить catalog expected и source hashes. Серверную проверку не следует объявлять общим клиентским PASS.


## Дополнение: правила текущего клиента

После исходного plan создан [план дополнения](client-supplement-plan.md), затем выполнены пять существующих Vitest files, один worker, без retry: **20/20PASS,0fail,0skip**. [Raw original JSON](evidence/client-supplement.json), [console](evidence/client-supplement.log). Все1030web/package inputs совпали [до](client-source-before.json)/[после](client-source-after.json); production/dist не менялись.

THROUGH теперь доказан серверными HTTP/SQL действиями и независимыми integration правилами фактического client owner: исключение projection apply оставляет предыдущие entries/cursor; следующая загрузка идёт от сохранённого cursor; moving barrier/nonadvancing page отклоняются; старые resource projections не снижают новую revision;20hints не запускают параллельный refresh. Этот backend integration verdict не объявляет browser durability, mobile UI или остальные платформы готовыми.

Исходный5PASS/2BLOCKED сохранён отдельно: [report](report-before-client-supplement.md), [run](feature/run-before-client-supplement.json), [ready](qa-ready-before-client-supplement.log). CAPABILITIES404/disabled owner assertions также PASS, но отсутствие read UI остаётся непроверенным, поэтому case и общий ready по-прежнему blocked.
