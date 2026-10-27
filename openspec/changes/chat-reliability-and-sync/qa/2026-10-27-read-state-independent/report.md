# Независимая проверка backend read-state

27.10.2026, reviewer `/root/chat_sync_backend_review`.
Exact candidate `2144ef0607648a4a69c65845351e3ea25cb3bf66`, read-state base
`389ebe7ba91442e8c650fb8cc48596613cc1445c`.

**Результат: failed — RS-01/P2, receipts/readers старой встречи недоступны после
активации до первого Sync.** Остальные перечисленные серверные проверки прошли.
Полный task/case/platform PASS и qa:ready не выдавались. Изменения root после
этого commit не входят в проверенный кандидат и требуют отдельного прогона.

## RS-01: активация старой встречи не готовит readers/receipts

Предусловия: разрешённый автор A и участник B, существующая история из 10 000
message entries, `meeting_streams` ещё нет — состояние legacy встречи до первой
sync-операции или новой journal mutation. Read flag и signing key включены.

Воспроизведение — собственный
`TestIndependentReadActivationLegacyReceipts` в [probe](probes/independent_read_review_test.go):

1. Создать legacy history через обычные raw Writer-порты, без создания stream.
2. Выполнить успешный `InitializeChatReadState`.
3. У B проверить baseline=10000, actual=0, unread=0.
4. Автором A запросить `QueryReadReceipts` и `MessageReaders` своего подтверждённого
   сообщения, не вызывая Sync.
5. Выполнить Sync и повторить тот же receipt query.

Ожидание: после завершения активации разрешённые read endpoints работают,
возвращают пустой список/нулевые receipts без ложного фактического чтения.
Контракт не требует предварительного Sync для доступа автора к receipts.

Факт: шаг 4 возвращает `record not found` в обоих сервисных вызовах. Receipt
aggregate уже вычислен с count=0, но результат сопровождается ошибкой. После
одного Sync тот же запрос проходит. Это service-level reproduction; HTTP 404
для именно legacy fixture отдельно не запускался, вывод о нём следует из
существующего mapping ErrNotFound в handler.

Причина в exact source: `internal/meetings/chat_read.go:56` инициализирует только
markers; `chat_read.go:174` и `chat_readers.go:88` требуют существующий ChatStream.
Lazy stream init реализован в Sync, но отсутствует у этих двух операций.
Потери данных/утечки персональной позиции в этом probe не обнаружено.

Подтверждение: [service run02](raw/service-run02.jsonl) и независимый
[race run03](raw/race-run03.jsonl). После сообщения о finding root добавил
legacy шаг в TC-CHAT-READ-STATE-8A47BDBD; reviewer кейс не редактировал.
Оба точных состояния кейсов и hashes сохранены: [до](raw/read-state-cases-at-start.yaml),
[после](raw/read-state-cases-after-finding.yaml), [manifest](source-manifest.json).
Содержимое «до» восстановлено удалением только двух добавленных строк и проверено
по SHA256, записанному до прогона.

## Независимые runtime результаты

| Проверка | Expected | Actual |
| --- | --- | --- |
| Late outbox failure | Marker, journal и все hints откатываются вместе | Ошибка второго EnqueueChatHint после первого сохранения: прежние state/stream/changes/hints сохранены. Повтор успешен; через +60 s равный marker не меняет timestamp/version/hints. PASS. |
| Readers pagination | Keyset ограничен, страницы используют текущие права; чужой cursor не даёт данные | 103 readers; первая страница50. После revoke reader050 и удаления051 текущий count101, следующие страницы50/1 без ушедших. Неавтор и outsider получают forbidden; ровно7d cursor expiry — reset. PASS. |
| Реальный HTTPS read-through | Canonical uint64, max и согласованный unread | 0/leading zero/sign/fraction/overflow/несуществующий MaxUint64 отклонены422. При двух чужих и своём сообщении unread2→1→0; поздняя меньшая позиция оставляет marker и projection. Sync явно возвращает first_unread:null. PASS. |
| Реальный HTTPS receipts/права | Весь batch собственный, ≤100 уникальных IDs | 100 IDs приняты,101/пустой/duplicate —422, mixed own+foreign —403 без частичных receipts. Неавтор readers —403, forged cursor —400. PASS. |
| Baseline и rejoin | База не receipt; rejoin не сбрасывает actual | Новый C с baseline после100 сообщений не меняет count; отдельный PUT меняет. B после выхода/возврата сохраняет actual, получает unread98 и правильный first_unread; list согласован. PASS. |
| Удаление аккаунта HTTP | Старый readers cursor не возвращает удалённого C; сессия отозвана | DELETE /me204; count2→1, C отсутствует и при saved cursor; его последующий PUT401. Reader DTO без contacts/individual marker/updated_at, read fields отсутствуют в logs. PASS. |
| Feature flag | Off скрывает операции; re-enable сохраняет позиции | Off MarkRead —not found; два Initialize после re-enable сохраняют baseline/actual, сообщение off-периода unread1. Read без signing key не включается. PASS. |
| Sparse uint64 service/storage | Только реальные message sequences, max без округления | Гапы, system и0 отклонены. Actual=18446744073709551615; retry9007199254740993 сохраняет max; два author receipts по actual равны1. PASS. |

Probes: [service](probes/independent_read_review_test.go),
[HTTPS](probes/independent_read_http_test.go),
[uint64 boundary](probes/independent_read_boundary_test.go).
Всего собственных probes **6: 5 PASS, 1 FAILED**.

Также самостоятельно запущены 10 имеющихся candidate tests с race detector:
activation/message race, baseline/max/noop, read/rejoin/deletion, private hint
fanout и bounded snapshot, rollback, HTTP CSRF/flags/public DTO, memory transaction
copies/cancel/read-only/deletion, startup config и запрет HTTP при failed activation,
fixture flag combinations. Все 10 PASS. Это собственный запуск existing tests,
отдельно от шести самостоятельно составленных probes.

Raw: [race run03](raw/race-run03.jsonl), [добавленные границы run04](raw/boundary-run04.jsonl).
Два ранних harness недочёта сохранены: run01 не скомпилирован из-за неверного
имени timestamp-поля в probe; run02 pagination пытался использовать полный
account-removal через test-only boundedStore, запрещающий Feed. Probe исправлен
на обычный store для этой неограниченной операции. Это ошибки тестовой обвязки,
не дефекты продукта; последующий race run03 подтвердил pagination PASS.
RS-01 воспроизводится независимо от них.

## SQL evidence: самостоятельный разбор внешнего запуска

Root отдельно выполнил guarded isolated SQL exact2144. Reviewer не подключался
к облаку и не запускал БД. Receipt указывает binary SHA256
`eed3c11de570deafad78ec46d38ab0d3567cc54eca5a4fc5d3d8dc8a5cd2dfb7`, exit0,
12 tests PASS, cleanup DB и temporary directory=true. SHA256 raw log независимо
пересчитан и совпал:
`d8a75de5548a439a0b77731fac0897ea3f49da86351cf7184cffda9f00b7253a`.

Из raw EXPLAIN независимо извлечены actual rows с учётом loops и filtered rows:

| 100k history query | Actual feed rows / budget | Execution |
| --- | --- | --- |
| unread-count | 100000 / 100000 | 43.176 ms |
| first-unread | 1 / 1 | 0.040 ms |
| receipts-100 | 100 / 100, 100 PK lookup loops | 1.004 ms |

Warm20 p95: unread60.070 ms, receipts1.624 ms при budget100 ms; activation6.784 ms.
Таким образом прежний full-history receipts scan устранён для этой fixture.
Unread count действительно посещает весь непрочитанный диапазон и имеет100000
heap fetches; его не следует описывать как O(1). Fixture содержит3 текущих
участника и actual0 в плановом batch; это не capacity/many-readers benchmark.
Отдельного EXPLAIN readers keyset в этом raw нет. Детали:
[SQL analysis](sql-evidence-analysis.json), внешний
[log](../2026-10-27-read-state-storage-sql/run02/sql-live.log).

## Воспроизведение, источники и ограничения

Snapshot — `/tmp/chat-read-independent-2144`, получен `git archive` exact commit.
[Source manifest](source-manifest.json) фиксирует374 файлов backend/contracts:
исходные файлы не менялись, добавлены только собственные tests в /tmp.
Прочитаны root/backend AGENTS, feature-test, MAIN read-state spec, protocol,
testing.md/cases/manifest; [review plan](review-plan.json) фиксирует scope/IDs.
Go1.27.2 darwin/arm64, GOMAXPROCS=1, -p=1; memory fixtures синтетические, HTTPS
через loopback httptest. Общие ports, симуляторы и production не затронуты.
Fixture cleanup закрывает только созданные им server/clients/broker; /tmp snapshot
оставлен для воспроизведения.

Из snapshot/backend, после копирования сохранённых probes в соответствующие
пакеты и с `GOCACHE=/tmp/chat-bounded-go-cache`:

```sh
GOMAXPROCS=1 go test -race -p=1 -count=1 -json \
  ./internal/meetings ./internal/httpapi ./internal/storage/memory ./internal/server \
  -run '^Test(Independent(Read|Readers)|ChatRead|ChatFixtureOptIn)'
```

Scope соответствует backend частям TC-CHAT-READ-STATE-068DA926,99A5AEEE,
284DD6EE,8A47BDBD,5869F951,51E51F41,EC05E2CA,E32551D3. Полные cases не закрыты:
marker150/140 проверен эквивалентными реальными меньшими/большими sequence и
uint64 границами; mixed системные/опрос/реакция не пройдены полностью одним
сквозным сценарием; 10k activation/message commit-race не пройден собственным
10k race probe (есть отдельные legacy10k и existing small-history race).
Нет native/UI visibility500ms, coalescing1s, multi-device клиентского приёма hints,
исторического бинаря клиента/сервера при rollback, общей capacity и production
конфигурации. Task3.3–3.6/checkmarks/catalog/manifest reviewer не менял.
