# Backend realtime и durable dispatcher — checkpoint

Кандидат: e794168085968b123e011844ac9b97539af54857, parent 6aac61e80a52fdaa2eb117d16b1c42d06ec1857d.
Worktree: /Users/misha/.codex/worktrees/chat-bounded-storage/group-planning.
45 файлов, 2142 добавленных / 44 удалённых строк; backend и аддитивный OpenAPI route. Main, frontend,
каталог кейсов, manifests и checkboxes не изменены. Push/deploy/БД/Docker/remote не запускались.
Сохранены 0dc1997, 15bf46c, 4c48037, b91ec8, 6aac61e. Рабочее дерево чисто кроме прежнего node_modules symlink.

## Поведение

- Centrifuge Go v0.40.1 в internal/realtime; embedded MemoryBroker, без Redis runtime/новых сервисов.
- /api/v1/realtime: cookie + exact Origin для web; native Bearer HTTP header, protobuf subprotocol.
  URL query/connect token/headers и data с полями отклоняются. undefined/null/{} — пустые данные SDK.
- personal:<user_id> server-side из сессии, одна client meeting:<meeting_id>. Никакого client publish.
  Hint содержит только schema_version/meeting_id/stream_epoch/decimal latest_change_sequence;
  personal добавляет invalidation/access_revoked. Нет текста, имён, голосов, токенов. HTTP catch-up обязателен.
- Session refresh <=45 с; logout после commit закрывает session, accounts.Delete после внешнего
  AccountUpdate commit закрывает все соединения удалённого пользователя. Rollback не уведомляет.
  RSVP/current access перепроверяется при subscribe, refresh и перед hint; revoke — unsubscribe2003.
  3503 только подтверждённая невалидная сессия, временный storage outage — retryable100/3004.
- Ограничения: 5 соединений пользователя, 1000 активных соединений процесса, 2 канала, input frame4КиБ,
  output queue64КиБ, slow consumer3008; recovery встречи120с/1000hints. Personal без broker history.
- Capabilities realtime=true только при identity+sync key+подключённом adapter; read_state=false.
- Durable claim: 100 intents, lease30с+случайный owner; publish вне транзакции; conditional ACK/backoff,
  stale owner не завершает новую lease. Crash-before-ACK повторяет исходный eventID.
- Dispatcher: максимум10×100 за проход, серверный context budget2с и poll100мс, ACK cleanup100 за batch.
  available_at сдвигается на lease deadline, поэтому активные claims не сканируются в pending prefix.
- Retention: максимум20 коротких транзакций за проход; при more следующий через100мс, иначе раз в минуту.
  Active lease не заменяется. Старый диапазон при dispatch превращается в текущий reference invalidation;
  удалённый получатель пропускается; удалённая встреча не публикуется в meeting channel.
- Migration006: lease_id/lease_until + pair constraint, индекс bounded dispatched cleanup. Старые
  миграции не изменены. Memory сохраняет clone/rollback, но всё ещё клонирует весь snapshot.
- Opt-in TestBrowserFixture получил SOMEWHERE_BROWSER_CHAT_REALTIME=1 для независимого реального JS SDK
  прогона; обычный fixture по умолчанию прежний, fake provider остаётся только test binary.

## Проверено локально

Все Go-команды GOMAXPROCS=1/-p1, GOCACHE=/tmp/chat-bounded-go-cache.

- Финальный полный go test -race -p1 ./... PASS: /tmp/chat-realtime-candidate-race.log.
- go vet/build ./..., check-dependencies, штатный format --check, gofmt -l PASS:
  /tmp/chat-realtime-candidate-{vet,build,dependencies,format,gofmt}.log.
- storage-demo PASS: /tmp/chat-realtime-candidate-storage-demo.log.
- API runtime PASS:74 schemas/34 fixtures/452 actual responses:
  /tmp/chat-realtime-candidate-api.log. OpenAPI имеет одну lint warning operation-2xx-response:
  WebSocket GET корректно отвечает101, фиктивный200 не добавлен.
- agent:check/OpenSpec structural PASS: /tmp/chat-realtime-agent.log. git diff --check PASS.
- Реальные loopback WS: cookie/native auth, duplicate/mixed credentials, Origin/query deny, JSON/native
  protobuf, reconnect personal ownership, foreign subscribe/client publish103, uint64 hint privacy,
  logout/expiry3503, revoke2003, one-meeting limit106, storage failure100 temporary и последующая
  успешная подписка, SDK empty data {}, null; payload с user_id отвергнут101.
- Реальный Centrifuge blocked transport: bounded send queue отключает slow consumer3008.
- Memory: claim rollback, defensive LeaseUntil copy, restart, stale ACK, backoff, cleanup;
  crash после publish до ACK повторяет тот же eventID; cancelled dispatcher завершает lifecycle.
- Backlog regression:1200hints =5 messages/s×60s×4 targets, первый run ограничен1000, второй200,
  failed publish повторяется с прежнимID, все1200 dispatched rows очищаются. Это проверка bounded
  алгоритма, НЕ latency/throughput benchmark.
- Retention2500 старых intents: первый проход2000 и more, следующий дочищает; terminal replacements
  сохраняются. Не заявляется O(1) для memory.Store.

## SQL artifact

/tmp/postgres-chat-realtime.test — Linux amd64 static test binary, пересобран после commit.
SHA256 e35167b525ccec2c04f278e37f863511edbae9e8971062411e566aa805889539.
Guarded pattern: ^(TestChat.*Integration|TestFeedWindowIntegration)$.
Добавлены TestChatDispatchLeaseRollbackRecoveryIntegration и TestChatDispatchPendingIndexIntegration
(5000 pending,100 active claims, EXPLAIN bound100 ready rows); старые7 SQL tests сохранены.
Компиляция PASS, локально живые SQL tests SKIP без integration URL. Remote actual result требует root;
предыдущие PASS b91/6aac не распространяются на006/этот кандидат.

## Browser SDK artifact

/tmp/chat-realtime-browser.test SHA256 3fc26ec629083cbc1b64f1001a1f55023539df6a0336ca5901ed457ac8f40014.
SOMEWHERE_BROWSER_FIXTURE=1 SOMEWHERE_BROWSER_CHAT_REALTIME=1 SOMEWHERE_BROWSER_DIST=<web dist>
SOMEWHERE_BROWSER_ADDR=127.0.0.1:<отдельный порт> /tmp/chat-realtime-browser.test
-test.run '^TestBrowserFixture
Web-агент получил artifact и проверяет pinned JS5.8.0 в отдельном browser. На момент checkpoint его
полный SDK/browser результат ещё не получен; raw WS protobuf regression не выдаётся за живой native SDK.

## Case mapping и границы

Подготовлено серверное покрытие частей TC-CHAT-SYNC-AA76CADB (commit/publish crash),
TC-CHAT-SYNC-BC07BEB1/F6CFB5E9 (reference-only recovery/catch-up boundaries),
TC-CHAT-SECURITY-791FF479/0E0CB54C/1DC708F2/BDBF283F/A3B3BFE7
(auth/expiry/revoke/privacy/account deletion). Полный case/platform PASS не объявлен.
Нужны независимое exact-SHA review, live SQL006/EXPLAIN на изолированной базе, реальные SDK/browser
и native client проверки, reconnect/proxy outage и согласованный 100connections/5msg/s15min capacity
pilot с реальными latency quantiles. Limits/row-count tests этого не заменяют. Read markers/read UI,
клиентский durable outbox и native SDK integration — отдельные этапы; checkbox2.x/3.x не закрыт.
 -test.timeout 0.
Web-агент получил artifact и проверяет pinned JS5.8.0 в отдельном browser. На момент checkpoint его
полный SDK/browser результат ещё не получен; raw WS protobuf regression не выдаётся за живой native SDK.

## Case mapping и границы

Подготовлено серверное покрытие частей TC-CHAT-SYNC-AA76CADB (commit/publish crash),
TC-CHAT-SYNC-BC07BEB1/F6CFB5E9 (reference-only recovery/catch-up boundaries),
TC-CHAT-SECURITY-791FF479/0E0CB54C/1DC708F2/BDBF283F/A3B3BFE7
(auth/expiry/revoke/privacy/account deletion). Полный case/platform PASS не объявлен.
Нужны независимое exact-SHA review, live SQL006/EXPLAIN на изолированной базе, реальные SDK/browser
и native client проверки, reconnect/proxy outage и согласованный 100connections/5msg/s15min capacity
pilot с реальными latency quantiles. Limits/row-count tests этого не заменяют. Read markers/read UI,
клиентский durable outbox и native SDK integration — отдельные этапы; checkbox2.x/3.x не закрыт.
