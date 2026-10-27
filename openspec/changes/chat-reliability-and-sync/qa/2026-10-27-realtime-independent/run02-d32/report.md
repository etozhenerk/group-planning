# Независимая повторная проверка серверного realtime

Дата: 27.10.2026. Проверяющий: `/root/chat_sync_backend_review`.
Точный кандидат: `d32deaa07093e50c138089f77f989e7cacc8e43a`, parent
`e794168085968b123e011844ac9b97539af54857`.

**PASS только проверенного серверного scope:** исправления RT-01/RT-02,
серверная авторизация WebSocket, отзыв доступа перед hint, ограничения подписок,
lease/ACK/retry dispatcher и перечисленные ниже regression tests. В этом прогоне
новых дефектов не обнаружено. Это не полный case/platform pass, не qa:ready,
не приёмка native SDK, client recovery, capacity или read-state 3.3–3.6.
Прежний failed [отчёт](../report.md) и raw не изменены.

## Кандидат, требования и окружение

Код извлечён только через `git archive` точного commit в
`/tmp/chat-realtime-independent-d32`. [Manifest](source-manifest.json) содержит
SHA256 архива, 359 исходных файлов backend/contracts, требования, overlays и hashes
probes. Изучен exact delta исправления. Raw requirements/cases, feature-test,
root/backend AGENTS, protocol/testing и ограничения предыдущего прохода сохранены;
hashes требований не изменились. Product source не редактировался.

Commit уже содержит версии прежних независимых tests; только в извлечённом /tmp
снимке два test-файла заменены **байт-в-байт исходными probes из failed evidence**,
чтобы повторить именно прежние проверки. Это явно отражено в `testOnlyOverlays`.
Добавлены два новых изолированных test-файла. У остальных исходных файлов 0
изменений; product-код соответствует commit.

Go 1.27.2 darwin/arm64, `GOMAXPROCS=1`, `-p=1`, общий разрешённый cache
`/tmp/chat-bounded-go-cache`. Реальный HTTP upgrade и masked RFC6455 WebSocket
frames работают через `httptest` на loopback. Только синтетические memory fixtures;
ни production, ни remote SQL, ни браузер/эмулятор не использовались.
Fixture сам закрывает sockets/server/broker; часы dispatcher — инъекция в service,
системные часы и сеть не менялись.

## Наблюдаемый expected / actual

| Проверка | Ожидание | Наблюдаемый результат |
| --- | --- | --- |
| RT-01, исходный probe | Нельзя удалить обязательную personal и получить две meeting subscriptions | Personal unsubscribe возвращает 103; первая meeting принята; вторая отклонена 106. PASS. |
| RT-02, исходный probe | Истечение ранее рассчитанного retry во время следующих публикаций не отменяет всю ACK-транзакцию | После +2 s: claimed=2, published=1, retried=1, acknowledged=2, deleted=1, error=nil. PASS. |
| Отзыв доступа перед публикацией | У уже подключённого клиента нет hint/history от недоступной встречи | После смены organizer и до refresh сервер прислал unsubscribe 2003; в собранных frames до command barrier нет publication/sequence. Recovery subscribe получил 103 без epoch/publications; personal terminal invalidation продолжила приходить. PASS. |
| Неоднозначные credentials / identity spoofing | Нельзя использовать лишний Origin/Bearer, URL query или connect payload как другую identity | Duplicate Origin 403; duplicate Bearer 401; foreign native Origin 403; пустой `?` 400. Connect token, headers и data с user_id — 101 без personal subscription. PASS. |
| Граница lease и stale ACK | Старый worker не подтверждает запись, уже взятую другим worker на точной границе 30 s | Старый published=1, acknowledged=0, deleted=0. Новый lease сохранил durable ID и attempts=2; maintenance не уничтожила активную lease; новый owner успешно ACK/cleanup. PASS. |
| Durable retry после медленной пачки | Успешное событие не публикуется повторно, failed ждёт backoff | После +4 s внутри пачки немедленный drain claimed=0; через +3 s только a-fail, attempts=2, acknowledged=1, deleted=1. PASS. |

Неизменённые regression probes: [WS](probes/websocket_independent_test.go),
[dispatcher](probes/dispatcher_independent_test.go). Новые probes:
[auth/revoke](probes/websocket_adversarial_test.go),
[lease/retry](probes/dispatcher_lease_test.go).

## Runtime и воспроизведение

1. Извлечь `backend` и `contracts` commit d32deaa в отдельный каталог.
2. Поместить сохранённые исходные probes как
   `backend/internal/realtime/independent_review_test.go` и
   `backend/internal/meetings/independent_dispatch_review_test.go`.
   Поместить новые probes как `internal/realtime/independent_adversarial_test.go`
   и `internal/meetings/independent_lease_review_test.go`.
3. Из `backend` выполнить команды с Go указанной версии:

```sh
GOMAXPROCS=1 GOCACHE=/tmp/chat-bounded-go-cache go test -p=1 -count=1 -json \
  ./internal/meetings ./internal/realtime -run '^TestIndependent'
GOMAXPROCS=1 GOCACHE=/tmp/chat-bounded-go-cache go test -race -p=1 -count=1 -json \
  ./internal/meetings ./internal/realtime ./internal/storage/memory \
  ./internal/identity ./internal/accounts \
  -run '^Test(Independent|Realtime|Chat|AccountTransactionRollsBackChatInvalidation|.*Revocation.*|.*Logout.*)'
```

Первый запуск до добавления новых probes: оба исходных tests PASS,
[raw](raw/regression.jsonl). Финальный race-прогон: **39 top-level tests,
5 packages PASS**, включая 6 собственных probes; [raw](raw/adversarial-race-rerun.jsonl).
Запущены также candidate tests logout/expiry, JSON/protobuf personal restriction
и meeting switch, queue bound, crash after publish, lease copies/rollback,
multi-batch retention, journal/privacy, account transaction rollback и sync.
Это собственный runtime запуск существующих tests, отдельно от собственных probes.

Первый расширенный [raw](raw/adversarial-race.jsonl) сохранён с одним падением
**QA harness**: новый probe посылал неподдерживаемый `ping` как command barrier,
сервер корректно закрыл соединение `bad request`. Только этот новый probe заменил
barrier на допустимую запрещённую subscribe-команду с request ID; затем весь
тот же targeted race-прогон выполнен повторно и прошёл. Product и два исходных
regression probes не менялись. Ошибка harness не считается дефектом продукта.

## Границы приёмки

Проверена часть backend требований `TC-CHAT-SECURITY-791FF479`,
`TC-CHAT-SECURITY-0E0CB54C`, `TC-CHAT-SYNC-AA76CADB` и серверных terminal hints
`TC-CHAT-SECURITY-A3B3BFE7`. Полностью эти cases здесь не пройдены: отсутствуют
TLS/proxy deployment, native SDK lifecycle, клиентский HTTP catch-up/reset,
SQL process restart и read markers. Socket fixture подтверждает wire-протокол,
не поведение выпускаемых iOS/Android SDK. Fake time подтверждает lease/backoff
границы, не latency/capacity. 45-second periodic recheck целиком по времени не
ожидался; runtime expiry/logout и recheck перед публикацией пройдены.

SQL reviewer не запускал. Guarded SQL root — отдельное engineering evidence,
новый receipt d32deaa следует учитывать отдельно; результаты старого e794 не
переносятся. Full suite/API результаты исполнителя также не выдаются за этот
независимый прогон. Backend scope PASS не закрывает task/case checkbox; qa:ready
и release-ready receipts здесь не создавались.
