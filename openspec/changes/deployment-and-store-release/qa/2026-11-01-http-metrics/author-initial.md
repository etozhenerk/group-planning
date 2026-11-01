# API instrumentation: результат локальной реализации

01.11.2026. Worktree: `/Users/misha/.codex/worktrees/backend-release-rc4/group-planning`. Перед работой был чистым; переключён detached на согласованный `3d3723b7`. Коммитов, merge и push нет. Main, веб-кандидат, CI, облако, production и секреты не менялись.

**Patch:** `/tmp/somewhere-sdd-observability.patch`, 39 552 байта, SHA256 `7ae843ea751fd6fa96983b54cf39b9a48389fe23f018e6547c715921727ad68a`. Включены новые файлы. Обратный `git apply --reverse --check` проходит. Контрольные суммы девяти файлов: `/tmp/somewhere-observability-source-checksums.json`.

## Исходные пробелы и сделанная часть

В runtime отсутствовал источник HTTP counters, histograms, in-flight и байтов Go. Существующая probe уже измеряла DNS/TCP/TLS/TTFB; системные и PostgreSQL-агрегаты не заменяли API monitoring. Задача 3.9 также требует подключения Monium, панелей и проверки общей кардинальности — это данным patch не выполнялось.

Реализован opt-in `SOMEWHERE_METRICS_ADDR=127.0.0.1:9109` (допускается числовой IPv6 loopback). По умолчанию сбор и listener выключены. На основном origin `/metrics` всегда возвращает 404; отдельный listener допускает только числовой loopback. Его lifecycle привязан к Serve. API DTO, авторизация и схема БД не меняются. Новых production-зависимостей и исходящих HTTP/DNS-запросов нет.

Реализованы семейства:

- API requests: восемь групп и взаимоисключающие исходы `ok`, `redirect`, `client_error`, `limited`, `server_error`, `timeout`, `cancelled`, `informational`. Один 504 вместе с истёкшим deadline даёт ровно один timeout. Bad = server_error + timeout; denominator = ok + redirect + Bad. Health, статика и публичные страницы исключены из обоих API-чисел.
- Histogram: read/write/auth/public × success/error, десять границ из плана, +Inf, sum и count. До наблюдений samples и вымышленные нулевые latency не публикуются. Percentiles вычисляет потребитель с учётом count; counters сбрасываются при перезапуске.
- In-flight: параллельные запросы, завершения, отмены и abort. Traffic: число запросов и фактически прочитанные/записанные body bytes по source × scope api/public/assets. Это байты Go до Caddy compression, без заголовков и WebSocket frames; источники proxy и Go нельзя складывать.
- Пять фиксированных source-классов. Сейчас присваиваются unknown, suspected_bot и предполагаемый link_preview на invitation-пути. **verified_bot и synthetic зарезервированы, но не выдаются без подтверждения источника.** UA, X-Forwarded-For и пользовательский probe-заголовок доказательствами не являются. Обычный браузер остаётся unknown; блокировки по UA нет.
- В registry не сохраняются URL/query, пользовательские ID, IP, raw UA, Authorization или сессии. Размер массивов фиксирован; snapshot рендерится вне mutex.

Отдельный informational нужен существующему WebSocket 101: записывать upgrade в успешные 2xx было бы неверно. Это восемь дополнительных рядов сверх первоначальной оценки семи исходов. Доказанный максимум — **217 samples**: 64 API outcomes + 104 histogram + 4 gauges + 45 traffic. Последний облачный отчёт наблюдал уже 470 custom рядов: перед подключением потребуется сократить системный набор. Лимит 500 относится ко всем источникам вместе.

## Состав patch

- `backend/internal/server/{metrics,metrics_http,metrics_listener}.go`: registry, exposition, middleware и отдельный listener.
- `backend/internal/server/{config,run}.go`: конфигурация и подключение.
- `backend/internal/server/{metrics_test,metrics_writer_test}.go`: 11 тестов, включая таблицу 11 исходов.
- `backend/docs/http-metrics.md`: включение, определения и эксплуатационные ограничения.
- `openspec/changes/deployment-and-store-release/testing.md`: узкий план инфраструктурных проверок. Service-operations уже исключён из продуктового каталога в testing/config.json; legacy, manifest и checkbox не менялись. PASS/receipt не создавались.

## Проверки

Среда: Go 1.27.2 darwin/arm64, memory.Store, временные localhost-порты. Локальная БД/Docker не запускались.

| Команда | Результат / raw log |
| --- | --- |
| `go test -race ./...` | PASS; `/tmp/somewhere-observability-go-test.log` |
| `go vet ./...` | PASS; `/tmp/somewhere-observability-go-vet.log` |
| `go build ./...` | PASS; `/tmp/somewhere-observability-go-build.log` |
| `go run ./cmd/check-dependencies` | PASS; `/tmp/somewhere-observability-dependencies.log` |
| `sh scripts/format.sh --check` | PASS штатного повтора; `/tmp/somewhere-observability-format.log` |
| `gofmt -l .` | PASS, пустой вывод |
| `go run ./cmd/storage-demo` | PASS; `/tmp/somewhere-observability-storage-demo.log` |
| `npm run api:test` | PASS: 82 схемы, 38 fixtures, 562 реальных HTTP-ответа; `/tmp/somewhere-observability-api-test.log` |
| `npm run agent:check` | PASS; `/tmp/somewhere-observability-agent-check.log` |
| `npm run qa:check` | PASS: 415 cases, gaps=[]; `/tmp/somewhere-observability-qa-check.log` |
| OpenSpec strict, deployment-and-store-release | PASS; `/tmp/somewhere-observability-openspec.log` |
| Diff и whitespace новых файлов | PASS; `/tmp/somewhere-observability-untracked-checks.json` |

Новые тесты проверяют cumulative histogram, Inf/sum/count, no-data/reset; тысячу приватных URL/query/UA без роста labels и утечки; spoofed UA/XFF/probe; preview и scopes; 64 параллельных in-flight и scrape; максимум 217 рядов; abort; частичную запись трёх байтов; Flush, ResponseController/write deadline, настоящий WebSocket 101; запущенный Serve, private scrape и закрытие listener. Формат exposition проверяется парсером уже имеющейся indirect-зависимости; go.mod/go.sum не менялись.

Первый focused-прогон сетевых тестов блокировался sandbox bind; повтор с разрешёнными localhost-сокетами прошёл. Первый formattercheck в sandbox сообщил `wsl: ./... matched no packages`; штатный повтор с доступом Go tooling прошёл. Эти первые попытки не объявляются успешными.

В API lint сохранилось существующее предупреждение об отсутствии 2xx у `/api/v1/realtime`, возвращающего 101. Контракт не редактировался. PostgreSQL integration без DSN пропускаются существующими guards; зелёный race не является новой проверкой постоянного хранилища. Независимая функциональная/релизная приёмка не проводилась, QA ready и release receipt не создавались.

## Что осталось перед закрытием 3.9

1. Независимое ревью и приёмка patch. Его можно включить в отдельный backend-кандидат после freeze веба.
2. Подтверждение verified_bot и собственного synthetic probe: актуальный allowlist либо reverse+forward DNS/cache и безопасная trusted-proxy/source-конфигурация. Patch намеренно не считает localhost Caddy доказательством источника. Независимая определённая часть реализована без нового продуктового решения.
3. Внешние Caddy outcomes/байты/proxy timeout, PG pool/worker signals, Unified Agent scrape, сокращение кардинальности, Monium queries/панели/count/no-data/retention и фактический общий лимит ≤500. Эти runtime-дополнения и облачная конфигурация не менялись.
4. Проверки целевой среды: ошибки, редиректы, отмены, preview, DNS/TLS/probe, пропуски, нагрузка/overhead, reset counters, percentile/count и отсутствие двойного счёта proxy/Go. Уже существующая probe DNS/TCP/TLS/TTFB сохранена.

**Задача 3.9 остаётся открытой.** Это проверяемая часть runtime-реализации и локальные code checks, а не полное подключение production monitoring.
