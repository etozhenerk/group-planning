# Интеграция закрытых HTTP-метрик в main · 01.11.2026

Локальный runtime-срез 3.9 перенесён из private worktree после независимого
повтора. Все **9** backend inputs побайтово совпали с исправленным кандидатом:
`main-runtime-checksums.json`. Полный исходный patch сохранён, при интеграции
применена только область `backend/*`: приватный вариант testing.md не перезаписал
общий расширенный план. Нового клиентского UI/API/SQL migration нет.

## Что реализовано

Opt-in numeric-loopback listener, bounded HTTP counters/histograms/inflight/bytes,
взаимоисключающие outcomes, сохранение cancel/101/Hijack/FlushError, закрытие
listener со временем жизни API. На public origin `/metrics` — 404. Метки не
содержат query/URL/ID/UA; недоверенные UA/XFF не дают verified_bot/synthetic.
Максимум exporter — 217 рядов. По умолчанию сбор и listener выключены.

## Фактические проверки после переноса

На main выполнен один успешный набор с `set -eu`:

- `sh scripts/format.sh --check`, `go vet ./...` — PASS;
- `go test -race ./...` — PASS всех пакетов (HTTPAPI 10.954s, server 1.521s,
  realtime 3.478s); реальная PostgreSQL без предоставленного test DSN не заявляется;
- `go run ./cmd/check-dependencies`, `go build ./...` — PASS;
- `gofmt -l .` — пусто;
- `npm run api:test` — PASS: 82 schemas, 38 fixtures, **560** actual HTTP responses.
  Существующее предупреждение OpenAPI operation-2xx-response для WebSocket101
  сохранено, не отключалось.

Первый запуск в sandbox не мог bind loopback/read штатный Go cache и дал ошибки
окружения; он не объявлен продуктовым PASS. Повтор с разрешёнными loopback/cache
прошёл. Фактический вывод сохранён в tool transcript текущего чата; отдельного
нового raw log этих main-команд не создавалось. Предыдущие private author562
ответа не переименованы в новый main560.

## Независимая проверка и история

`independent-initial.md` и `independent-evidence/evidence/` сохраняют исходный
FAIL потери FlushError. `independent-evidence/iteration2/report.md` и evidence
сохраняют свежий **20/20 PASS** с собственным reviewer overlay, включая оба прежних
failing assertions, реальные cancel/101/listener/privacy и 217-series bound.
Вердикт относится к тем же backend bytes; не является cloud/release PASS.

Архив перенесён из `/tmp` без переписывания исходных абсолютных путей/hashes.
Воспроизводимый test source/overlay/raw logs сохранены; временный скомпилированный
`review.test` не копировался. Исходный checksum inventory с его записью оставлен
историческим, не объявляется полным inventory этого документального архива.

## Оставшаяся часть 3.9

Задача целиком остаётся открыта. Требуются cloud scrape/панели, общий лимит500
со всеми источниками (исторические470 требуют сокращения), Caddy/probe/PG/worker,
trusted sources, нагрузка и внешние сценарии. Ничего не выкатывалось, порт/секреты/
IAM/CI не менялись. Исторические v2 web-проверки не перенесены на новый broad hash.
