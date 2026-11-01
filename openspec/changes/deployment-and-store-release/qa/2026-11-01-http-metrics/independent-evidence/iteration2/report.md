# Независимый targeted повтор после FlushError fix · iteration2

01.11.2026, reviewer `/root/sdd_clients_audit`. Candidate только private worktree `/Users/misha/.codex/worktrees/backend-release-rc4/group-planning`, detached `3d3723b739ab64a5de4132c9eec44d48e12b4b7a` + исправленный uncommitted patch.

**Узкий вердикт: PASS в проверенном runtime scope. Исходный P2 Flush error compatibility устранён. Новых дефектов в выполненном наборе не выявлено.** Это не cloud/task3.9/release готовность.

## Свежая независимая идентичность

Перед новым запуском собственными SHA256 проверены10 input files; они совпали с переданным author inventory. После запуска собственный source-after вновь совпал10/10, HEAD тот же. Из8 input files первоначальной итерации изменился только `metrics_http.go`; новый hash `5d03e32797c3a308b940de6d6a7c9d81b1e6c287dc31288a9d45f7fe40538289`.

Авторские14 PASS/формат/vet использованы только как описание изменений, в результаты reviewer не импортированы. Независимый Go overlay подставил **собственный исходный** regression-файл вместо добавленного автором `metrics_flush_test.go`: обе прежние failing assertions сохранены без изменения. Добавлена собственная проверка failed bookkeeping по публичному scrape. Исходники кандидата не редактировались; оригинальные FAIL, tests, binary и отчёт iteration1 сохранены.

## Собственный запуск

`go test -race -count=1 -v -overlay=<iteration2/evidence/overlay.json> ./internal/server -run '^(TestHTTPMetrics|TestIndependentMetrics|TestCanceledServerClosesListener|TestShutdownDrainsActiveRequest)'`

**20 верхнеуровневых tests PASS, 0 failures, exit0**, плюс11 status subtests; race detector не сообщил data race. Local loopback разрешён для этого запуска. Raw `evidence/independent-targeted-tests.log`, машинная сводка `evidence/summary.json`.

### Прежние regressions

- Unsupported flush: unwrapped **и wrapped** вернули `feature not supported` (ErrNotSupported), прежнее nil устранено.
- Реальная underlying flush failure: unwrapped **и wrapped** вернули `io: read/write on closed pipe` (ErrClosedPipe), прежнее nil устранено.
- Собственный failed bookkeeping: ResponseController.Flush и legacy http.Flusher.Flush реально вызвали base2 раза, implicit status200 сохранён; scrape содержит **ровно1** `operation=feed,outcome=server_error`, error histogram count1, inflight0; нет лишнего ok/timeout completion.

Review исправления: `FlushError() error` возвращает исходный underlying ResponseController error и сохраняет `failed=true`; `Flush()` делегирует ему и игнорирует возвращаемую ошибку в соответствии с legacy интерфейсом. Unwrap/Hijack/Write не менялись.

### Важные соседние свойства повторены на новом source

- Настоящий client cancel завершил handler и единожды дал cancelled; приватные path/token не появились в scrape.
- Настоящий HTTP/1 hijack101 учитывается как informational, inflight0 ещё при живом socket; ResponseController deadlines/unsupported full-duplex продолжают делегироваться.
- Private loopback listener принимает scrape; public `/metrics`404, runtime cancellation закрывает private endpoint; wildcard/external/DNS/zone/bad-port значения отклоняются.
- Занятый private port прекращает startup и закрывает supplied API listener; cancelled startup/graceful drain проходят.
- Privacy/source tests:1000 уникальных paths/query/UA не дали dynamic labels/утечек; spoofed headers не присваивают verified_bot/synthetic; unknown и presumed preview сохранены.
- Classification:2xx/3xx/4xx/429/500/504+deadline/cancelled/101 взаимно исключаются, один completion; двойной Bad не появился.
- Cumulative histogram, отсутствующие observations/reset, request/read/short-write bytes,64 concurrent handlers/scrapes, panic cleanup и217-row hard bound повторно прошли.
- Успешный Flush по-прежнему commits200; последующий500 не переписывает уже отправленный статус.

## Ограничения

Это технический runtime patch на local memory/HTTP fixture. Source/Main/cloud/production не менялись, ничего не публиковалось. Полный backend/API/format/vet suite этим reviewer повторно не запускался. Нет Monium/Unified Agent rollout, Caddy upstream timeout, внешних DNS/TLS timings, PG pool/worker, настоящей глобальной cardinality≤500, нагрузочной/SLO приёмки, alerts или release receipt.

Задача deployment3.9 остаётся открытой для этих внешних частей. Independent PASS относится только к перечисленным runtime tests исправленного source. Первоначальный finding не стирается: `/tmp/somewhere-sdd-metrics-independent.md` и исходный `evidence/independent-tests.log` сохраняют прежний needs-fixes/FAIL.

## Evidence

`/tmp/somewhere-sdd-metrics-independent/iteration2/evidence/`:

- `source-before.json`, `source-after.json`, `changed-from-iteration1.json`, `*.current`;
- `independent_metrics_review_test.go`, `overlay.json`;
- `independent-targeted-tests.log`, `summary.json`, `checksums.json`.
