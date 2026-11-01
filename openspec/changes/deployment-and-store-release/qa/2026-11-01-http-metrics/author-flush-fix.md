# Узкое исправление FlushError после независимого ревью

01.11.2026. Только private worktree `/Users/misha/.codex/worktrees/backend-release-rc4/group-planning`, detached HEAD `3d3723b7`. Main и замороженный веб-кандидат не изменялись; commit/merge/push не выполнялись.

Независимый reviewer воспроизвёл два FAIL: обёртка теряла `http.ErrNotSupported` и `io.ErrClosedPipe` при `http.NewResponseController(writer).Flush()`. Его исходные evidence в `/tmp/somewhere-sdd-metrics-independent/evidence/` не менялись. До исправления повторно проверены восемь hashes из `source-after.json`.

Исправлено только поведение `metricWriter` в `metrics_http.go`:

- `FlushError() error` сохраняет implicit 200, делегирует underlying ResponseController и возвращает его ошибку; при ошибке выставляет failed для счётчика server_error.
- Legacy `Flush()` вызывает FlushError и игнорирует возвращаемую ошибку согласно интерфейсу http.Flusher.

Два независимых regression tests перенесены без изменения assertions в новый `metrics_flush_test.go`; добавлен meaningful тест failed bookkeeping, implicit 200 и единственного завершения при двух вызовах underlying flush. Из прежних восьми файлов изменился **только metrics_http.go**; проверка hashes остальных семи прошла.

## Проверки

- `go test -race ./internal/server -run 'Test(HTTPMetrics|IndependentMetrics)' -count=1 -v` — PASS: 14 верхнеуровневых tests, включая оба прежде падавших, legacy Flush, WebSocket 101, listener и все прежние metrics tests. Raw: `/tmp/somewhere-observability-flush-fixed-tests.log`.
- `go vet ./internal/server` — PASS; `/tmp/somewhere-observability-flush-fixed-vet.log`.
- `sh scripts/format.sh --check` — PASS; `/tmp/somewhere-observability-flush-fixed-format.log`.
- `gofmt -l` затронутых файлов — пусто.
- `git diff --check`, whitespace новых файлов и обратный apply-check обновлённого полного patch — PASS.

Полный backend race/vet/build и 562 HTTP-контрактных ответа были проверены до этого исправления и сохранены в прежнем отчёте. После изменения повторены targeted checks, а не заявлена новая полная продуктовая/релизная приёмка. Независимому reviewer требуется свежий проход по новым hashes; исходный FAIL не переписан в PASS.

## Артефакты

- Обновлённый **полный patch**: `/tmp/somewhere-sdd-observability-flush-fixed.patch`, 42 665 байт.
- SHA256: `79f5175b30b7d8c874287c58f01de67f3f36aae74de80c10a47cc8d57d252d34`.
- Дополнительный **инкрементальный patch относительно первоначального patch**: `/tmp/somewhere-sdd-observability-flush-only.patch`.
- Новые source hashes: `/tmp/somewhere-observability-flush-fixed-checksums.json`.
- Прежний patch `/tmp/somewhere-sdd-observability.patch`, его hash и исходные отчёты сохранены без изменений.

Задача 3.9 остаётся открытой; cloud/Monium, общая кардинальность ≤500 и live-приёмка не выполнялись. Результат параллельного read-only блока операций: `/tmp/somewhere-sdd-operations-current.md` — публичные health/readiness 200, закрытые YC/Monium и SSH не дали свежих данных.
