# Независимый технический review HTTP metrics · исходная итерация

Дата:01.11.2026. Reviewer `/root/sdd_clients_audit`.
Candidate **только** `/Users/misha/.codex/worktrees/backend-release-rc4/group-planning`, detached HEAD `3d3723b739ab64a5de4132c9eec44d48e12b4b7a` + uncommitted runtime patch. MAIN не изменялся. Это не дизайн/UI review и не полный cloud QA/task3.9 PASS.

**Вердикт: needs-fixes — один независимо воспроизведённый P2 compatibility defect.** Остальные проверенные privacy/cardinality/classification/lifecycle свойства выдержали адресный local scope. Исходный FAIL сохраняется; исправленный кандидат должен получить новую независимую итерацию, а не замену этого отчёта.

## Точный scope и независимость

Прочитаны backend/AGENTS.md, backend/docs/http-metrics.md, deployment observability-plan и service-operations spec; runtime config/run, metrics агрегатор/классификатор/writer/listener, tests, существующий safe HTTP middleware и реальный Centrifuge adapter.

8 файлов кандидата заморожены до и после проверки: hashes совпали; HEAD не изменился. Evidence: `source-before.json`, `source-after.json`, `archive-source-check.json`. Затем оригинальные8 файлов скопированы в собственный evidence как `*.original`, после повторного совпадения hash. Независимые regression tests подключались **Go overlay**, исходники кандидата не правились. Immutable race-enabled `review.test` собран до разрешения автору исправлять patch.

Тестовые выводы ниже — собственные запуски reviewer. Авторские отчёты/итоги не импортировались. Проверялись только synthetic local HTTP/loopback memory данные, никакого production/cloud/Telegram, секретов, БД, миграций, сертификатов или физических устройств.

## P2: metricWriter скрывает ошибки ResponseController.Flush

Файл исходного кандидата `backend/internal/server/metrics_http.go:202`, метод `Flush()`; оригинал сохранён как `evidence/metrics_http.go.original`.

Wrapper реализует `Flush()` без error, вызывает `http.NewResponseController(underlying).Flush()`, записывает `failed=true`, но вызывающему error не возвращает. У него нет `FlushError() error`. `http.NewResponseController(wrapped)` видит интерфейс `http.Flusher`, вызывает `Flush()` и возвращает nil. В итоге wrapper меняет контракт и позволяет обработчику считать фактически неудачный flush успешным.

Независимые два regression tests на одном и том же базовом writer:

| Test | Unwrapped result | Wrapped result | Итог |
| --- | --- | --- | --- |
| `TestIndependentMetricsPreservesUnsupportedFlushError` | `feature not supported` / ErrNotSupported | `nil`, дополнительно committed status200 | **FAIL** |
| `TestIndependentMetricsPreservesRealFlushFailure` | `io: read/write on closed pipe` | `nil`; base FlushError реально вызван | **FAIL** |

Raw `independent-tests.log`: обе ошибки воспроизведены до sandbox socket panic. Это реальные deterministic contract mismatches, а не bind EPERM. Реальный production outage этого случая не исследовался и не утверждается.

Направление исправления: добавить `FlushError() error`, который сохраняет текущую политику implicit status/failed bookkeeping и **возвращает исходную ошибку** underlying ResponseController. Для `http.Flusher` совместимости `Flush()` может делегировать `FlushError()` и игнорировать результат. Два исходных regression assertions менять не требуется. Перед началом исправления root и автор получили сообщение о finding и freeze; reviewer продукт не исправлял.

## Что действительно проверено

### Privacy, labels, cardinality, classification

Собственный повтор candidate tests с `-race -count=1` подтвердил:

- outcome одного завершённого запроса увеличивается один раз для implicit200/201/303/401/404/429/500/504+deadline/deadline без ответа/cancelled/101; итоговая сумма ровно1, inflight возвращается0, второй final WriteHeader не меняет результат;
- 504 вместе с deadline даёт один timeout, отдельного второго Bad нет; 401/404/429 не входят в server_error;
- request-body bytes считаются по фактическому Read, response-body — по успешно записанным n, short write фиксируется как ошибка; недоверенный Content-Length не используется;
-1000 уникальных приватных path/query/UA + Authorization/IP/probe headers не появились в экспорте и не создали новых labels;
- UA, X-Forwarded-For, Authorization/probe headers не способны выдать `verified_bot`/`synthetic`; обычный UA остаётся unknown; Telegram preview на invitation path — только presumed link_preview;
- health/readiness/public/assets исключены из API numerator/denominator, но остаются в отдельных HTTP/traffic families;
- cumulative histogram buckets/count/sum согласованы, пустые группы не публикуют нулевую latency; новый aggregator не наследует старые counters;
-64 конкурентных handler и параллельные scrapes не потеряли completion/gauge, race detector не сообщил data race;
- искусственное заполнение всех **фиксированных** combination arrays дало217 рядов:64 outcomes+104 histogram+4 inflight+45 traffic; per-request route/ID/IP/query/UA не сохраняются в агрегаторе;
- panic/ErrAbortHandler не поглощается, inflight не течёт, partial committed panic учитывается server_error.

Raw `candidate-tests.log`. Это независимый повтор имеющихся tests, дополненный review фактических fixed arrays/constant labels. Production cardinality Monium и глобальный budget500 этим не измерены. verified_bot/synthetic пока намеренно не присваиваются; это честная ограниченная классификация, не готовая trusted-source конфигурация.

### ResponseWriter и реальные loopback сценарии

`TestIndependentMetricsDeadlineForwarding` **PASS**: SetReadDeadline/SetWriteDeadline/EnableFullDuplex сохраняют ErrNotSupported через Unwrap для base без этих возможностей. Flush отличается — P2 выше.

После разрешённого доступа к loopback из неизменяемого original `review.test` выполнено **8/8 PASS**:

1. **Независимый реальный client cancel**: настоящий HTTP client cancelled request; handler увидел Context.Done, один outcome=cancelled, не осталось приватного token/path в scrape.
2. **Независимый HTTP/1 upgrade до закрытия socket**: настоящий101/hijack, socket остаётся открыт; completion=informational уже опубликован, inflight0. Следующие websocket bytes не попадают в HTTP-body counters.
3. **Независимый occupied metrics port**: start runtime возвращает listen metrics error и закрывает supplied API listener; нет тихой внешней экспозиции/продолжения с неработающим scrape.
4. Candidate private listener validator/lifecycle: numeric127.0.0.1/::1 разрешены; wildcard/external IP/DNS/zone/0/out-of-range запрещены; loopback scrape работает, stop закрывает port.
5. Candidate real Serve integration: public `/metrics`404, отдельный loopback endpoint200 и наблюдает public request; Serve cancellation закрывает endpoint.
6. Candidate ResponseController SetWriteDeadline+реальный WebSocket101/hijack работает.
7. Existing cancelled-server closes listener.
8. Existing graceful shutdown drains active request.

Raw `socket-tests-unsandboxed.log`, exit0, race detector без замечаний. Повтор запускал только socket-блок исходного immutable binary; два Flush FAIL не переписывались.

По source review disabled config не создаёт listener/aggregator, включение только при непустом MetricsAddress; отдельный net/http server ограничивает заголовки/таймауты, служебные ошибки логирует безопасным кодом. Runtime defer связывает закрытие listener с Serve return. Endpoint разрешает GET/HEAD, другие methods405, неизвестный путь404. Export не добавляется в публичный router. Настоящий Caddy origin/SG не проверялся.

Реальный адаптер Centrifuge0.40.1 для HTTP/1 возвращает после upgrade, connection loop отделён goroutine; поэтому покрытый duration/completion не равен времени жизни socket. HTTP/2 extended WebSocket, настоящие клиентские реконнекты и production workload не проходили.

## Ошибки окружения сохранены отдельно

Первый sandbox запуск получил `listen tcp127.0.0.1:0 / tcp6[::1]:0: bind: operation not permitted`. На этом candidate suite завершился panic внутри httptest до оставшихся tests. Первый independent suite также дошёл до двух Flush FAIL и одного PASS, затем остановился на socket EPERM. Эти остановки не считаются product failure или пройденными socket tests.

Компиляция immutable binary сначала получила Go build-cache EPERM; разрешённый повтор собрал бинарник. Для runtime socket-блока был разрешён только local loopback; повтор8/8 PASS подтверждает окружение, а не устраняет Flush defect.

## Не принято этим review

- Полный backend suite/vet/build/format/dependencies/api:test/agent:check не запускались этим reviewer; их дальнейшие инженерные итоги относятся к исполнителю/другому прогону.
- PG pool/worker metrics, Caddy timeout до Go, proxy/VM byte counters, external DNS/TCP/TLS/TTFB и сетевые сбои не проверены.
- Unified Agent scrape/Monium import/dashboard/alerts/cloud rollback/cost/cardinality budget не подключались и не менялись. Наблюдение470 legacy rows требует отдельного будущего сокращения/проверки общего набора;217-local не означает ≤500-total.
- Нет cloud rollout, load/SLO/week baseline, production accuracy доказательства или receipt.
- Нет `qa:ready`/`qa:release-ready`/task3.9 PASS. Это узкая runtime iteration; task3.9 по-прежнему включает внешнюю работу.

## Evidence

Каталог: `/tmp/somewhere-sdd-metrics-independent/evidence/`.

- `source-before.json`, `source-after.json`, `archive-source-check.json`, `*.original`: original input identity.
- `independent_metrics_review_test.go`, `overlay.json`: собственные regression/loopback scenarios, без source edits.
- `candidate-tests.log`: собственный повтор имеющихся tests и сохранённый sandbox EPERM.
- `independent-tests.log`: исходные2 Flush FAIL,1 PASS и sandbox socket EPERM.
- `review.test`: неизменяемый исходный race-enabled test binary.
- `socket-tests-unsandboxed.log`: разрешённый loopback repeat8/8 PASS.
- `checksums.json`: SHA256 evidence.

При исправлении patch требуется новая папка/review с новым hash и повтор этих неизменённых regression tests; исходный отчёт и original FAIL сохраняются.
