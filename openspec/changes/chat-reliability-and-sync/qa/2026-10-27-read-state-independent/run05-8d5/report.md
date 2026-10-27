# Повторная независимая проверка read-state

Exact candidate `8d5a5d3ac82b7eceabfdf7c0d1b3fa4fb9c4648f`, parent
`2144ef0607648a4a69c65845351e3ea25cb3bf66`. Reviewer `/root/chat_sync_backend_review`.

**PASS проверенного серверного scope.** RS-01 больше не воспроизводится.
Независимый targeted race: **24 top-level tests, 4 packages PASS**, включая
**8 собственных probes**. Все шесть probes предыдущего кандидата перенесены
без изменения bytes. Исходные [failed report](../report.md) и raw2144 сохранены.
Это не полный task/case/platform gate; checkbox и qa:ready не выставлялись.

## Наблюдаемое поведение

| Проверка | Expected | Actual |
| --- | --- | --- |
| Прежний failing legacy10k probe | После активации author receipts/readers доступны до первого Sync, baseline не receipt | Receipts count0, readers empty, error=nil до Sync; baseline10000, actual0. PASS. |
| Authorization до initialization | Посторонний, неавтор и invalid batch не создают stream | Оба endpoint отказали guest/outsider; mixed existing+missing entry batch отказал; stream отсутствует, hints0. PASS. |
| Continuation без stream | Нельзя создать новую epoch продолжением старой страницы | Непустой orphan cursor вернул sync_reset_required; stream не создан. PASS. |
| Первый authorized вызов каждого endpoint | Lazy init стабильна, без read/journal/outbox эффектов | Отдельные свежие fixtures для receipts-first и readers-first; после3 повторов epoch неизменна, latest change0, changes0, hints0, baseline1/actual0 и timestamp прежние. PASS. |
| Отзыв доступа между транзакциями | Инициализация и повторный snapshot проверяют текущие права | Отзыв organizer после первого View → forbidden и stream не создан. Отзыв после Update → повторный View forbidden без частичного aggregate. PASS. |
| Остальные исходные probes | Исправление не ломает права/markers/lifecycle | Late hint rollback/noop; 103-reader pagination/revoke/delete/expiry; HTTPS max/unread/batch100/101/CSRF/author-only/rejoin/delete; flag off/on; sparse uint64 — PASS на новом candidate. |

Raw — [race.jsonl](raw/race.jsonl). Новый probe —
[legacy boundaries](probes/independent_legacy_fix_review_test.go).
Неизменённые probes: [service](probes/independent_read_review_test.go),
[HTTPS](probes/independent_read_http_test.go),
[uint64](probes/independent_read_boundary_test.go).

## Воспроизведение и точный источник

Извлечён `git archive 8d5a5d3... backend contracts` в
`/tmp/chat-read-independent-8d5`; исходные файлы не менялись. Добавлены только
собственные test-файлы. [Manifest](source-manifest.json) фиксирует SHA256 архива,
исходников, probes, актуальных требований, совпадение всех прежних probes и
0 изменений product source.

Из snapshot/backend, Go1.27.2 darwin/arm64, с `GOCACHE=/tmp/chat-bounded-go-cache`:

```sh
GOMAXPROCS=1 go test -race -p=1 -count=1 -json \
  ./internal/meetings ./internal/httpapi ./internal/storage/memory ./internal/server \
  -run '^Test(Independent(Read|Readers|Legacy)|ChatRead|ChatSync|ChatFixtureOptIn)'
```

HTTPS loopback fixtures содержат только синтетические данные и закрываются
test cleanup. Общие порты/приложения/эмуляторы/production не затронуты.
Review исправления: общий ensure helper проверяет доступ под write lock,
затем оба read endpoint повторяют свой read snapshot. Публичные операции
предварительно проверяют права автора и весь batch. Source-only выводы не
подменяют перечисленные runtime assertions.

## Что этот PASS не покрывает

Результат ограничен backend задачами3.3–3.6 и проверенными частями cases из
[исходного review plan](../review-plan.json). Сохраняются подробно записанные
в [предыдущем отчёте](../report.md) ограничения: нет native/client visibility,
multi-device клиентского приёма, полной mixed-update матрицы, собственного10k
activation race, исторического клиента/бинаря, capacity и общего acceptance gate.

Сервис/storage SQL код исправлением не менялся; root SQL run02 на2144 и его
[независимый разбор raw](../sql-evidence-analysis.json) остаются evidence для
этого прежнего exact binary. Reviewer не запускал SQL на8d5 и не объявляет
старый receipt новым SQL pass. Main full race/API root — внешнее engineering
evidence, не замена этого независимого targeted запуска. Продукт, specs, cases,
tasks и baseline reviewer не менял.
