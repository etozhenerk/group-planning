# Backend read state — кандидат 389ebe7

2026-10-27. Commit `389ebe7ba91442e8c650fb8cc48596613cc1445c`, base `d32deaa07093e50c138089f77f989e7cacc8e43a`.
Worktree `/Users/misha/.codex/worktrees/chat-bounded-storage/group-planning`.
41 backend/contracts files, 2426 additions / 27 deletions. Main/frontend/prod не менялись этим агентом; node_modules symlink сохранён. Push/deploy/БД/Docker не выполнялись. Root отдельно сообщил об интеграции в main, main race PASS и текущем guarded SQL run; этот отчёт не присваивает ещё незавершённому SQL PASS.

## Реализовано

- `SOMEWHERE_CHAT_READ_STATE` default false, требует sync signing key. Capabilities отражают runtime flags; унаследованные OpenAPI const:false убраны.
- Migration 007: durable actual/baseline markers numeric uint64, participant/position indexes, partial covering message index. Миграция необходима до нового runtime даже при read flag=false: account deletion очищает marker table.
- Активация до HTTP: current organizer/Going, INSERT-if-absent baseline=tail и actual=0 под Store.Update lock. Ошибка/отмена прерывает запуск. New meeting/Going RSVP задают baseline атомарно, rejoin/restart сохраняют markers.
- PUT read-marker проверяет существующую доступную message position, применяет max всех устройств; старое/равное значение не меняет updated_at, journal/outbox.
- Snapshot/changes: actual, отдельный baseline, unread_count, UUID first_unread; first_unread:null явно очищает anchor. Без explicit anchor окно вокруг первого unread. List/calendar несут private counters разрешённой страницы.
- Batch receipts для 1..100 собственных entries; scoped author-only readers с limit+1 и HMAC cursor user/meeting/entry/epoch. Только actual и current members, автор/удалённые аккаунты исключены; DTO public id/display_name/avatar_url. Origin/CSRF сохранены.
- Read advance атомарно даёт receipts_changed, meeting hint и private hint только читателю для остальных устройств. No-op не создаёт read→sync→read. Membership/account removal invalidates projections; markers очищаются атомарно при account/meeting deletion. HTTP hydration повторно проверяет version/access, при изменении возвращает 410.
- OpenAPI, fixtures, backend/docs/chat-read-state.md. Test-only browser/iOS/Android shared adapter/dispatcher lifecycle с отдельными *_CHAT_REALTIME=1 / *_CHAT_READ_STATE=1; default совместим. Native scope=chat.

## Проверки исполнителя

Go 1.27.2; GOMAXPROCS=1, GOFLAGS=-p=1, GOCACHE=/tmp/chat-bounded-go-cache.

| Проверка | Результат / raw |
| --- | --- |
| go test -p=1 -race ./... | PASS, /tmp/chat-read-frozen-race.log; SQL integration SKIP без DSN |
| go vet ./... | PASS, /tmp/chat-read-frozen-vet.log |
| go build ./... | PASS, /tmp/chat-read-frozen-build.log |
| go run ./cmd/check-dependencies | PASS, /tmp/chat-read-dependencies.log |
| go run ./cmd/storage-demo | PASS, /tmp/chat-read-storage-demo.log |
| format --check / gofmt -l | PASS, /tmp/chat-read-frozen-format.log, /tmp/chat-read-frozen-gofmt.log |
| npm run api:test | PASS, 80 schemas / 38 fixtures / **482 actual HTTP responses**, /tmp/chat-read-frozen-api.log |
| npm run agent:check | PASS, /tmp/chat-read-agent-check.log |
| git diff --check / staged diff | PASS; после commit только прежний node_modules untracked |
| Actual enabled HTTP capture | 17 выбранных ответов, /tmp/chat-read-evidence/enabled-http.json |
| Native TLS startup | iOS + Android native Bearer capabilities/list/snapshot PASS, /tmp/chat-read-evidence/native-fixture-startup.json |

API lint оставляет прежнее предупреждение о websocket 101 без 2xx. Прежний 452-response PASS не покрывал enabled realtime/read-state. Теперь actual HTTP test собирает реальный adapter и read flag=true. Native fixture startup не является SDK/UI PASS; config mode0600, собственные PID остановлены, private configs удалены. Прежний d32 SQL PASS не переносится.

## Регрессии и mapping

- TestChatReadBaselineActualMaxAndNoOp: TC-CHAT-READ-STATE-068DA926, 99A5AEEE, 5869F951 и часть 284DD6EE (own/foreign, max/no-op).
- TestChatReadRejoinReadersAndAccountRemoval: 51E51F41, EC05E2CA, E32551D3, account-removal privacy. Полный raw case с промежуточными событиями и клиентами остаётся независимому проходу.
- TestChatReadSnapshotAnchorCursorScopeAndPrivateHints: bounded first-unread window, readers paging/cursor scope, private hint fanout/no-op.
- TestChatReadCommitFailureRollsBackMarkerJournalAndHints и TestChatReadActivationRacesMessageWithoutInventedReceipt: атомарность/cancel boundary и activation/message serialization без ложного чтения.
- TestChatReadMarkersRollbackCopiesUint64AndCancellation: memory copy, MaxUint64, rollback, readonly/retained transaction/cancel, delete cascade, invalid timestamp.
- TestChatReadHTTP + OpenAPI aggregator: enabled/disabled flags, CSRF, malformed/overflow/author-only, public reader DTO, explicit null clearing, private list.
- Server activation/config tests; TestChatFixtureOptInCapabilities: все 3 платформы × realtime/read combinations.
- TestChatReadStateAtomicIntegration и TestChatReadState100kPlanIntegration скомпилированы, live SQL выполняет root. 8A47BDBD и SQL часть остальных не принимаются этим отчётом.

Mapping является implementation evidence, не полным case/platform PASS. Tasks3.3–3.6, manifest/catalog и checkbox не менялись. Независимому reviewer нужны актуальные main testing/cases/chat-read-state.yaml, security/sync cases и openspec change protocol/testing/manifest. Feature-test прочитан; независимый проход координирует root после освобождения слота.

## SQL и стоимость

Linux amd64 static binary /tmp/postgres-chat-read.test. Прежний guarded harness, integration env; `-test.v -test.run '^(TestChat.*Integration|TestFeedWindowIntegration)$'`: **12 tests**, 2 новых read-state. Agent live SQL не запускал.

100k fixture seed батчами1000 под штатным timeout. Activation latency отдельно: current participant metadata + indexed tail lookup, без загрузки JSON истории. Exact unread count — O(unread) диапазон message index, не O(1). EXPLAIN feed budgets: count100000, first-unread1, batch100 адресных entries100. P95≤100ms для unread и batch receipts, 2 warmup +20 samples. Реальные plans/timings неизвестны до root SQL; seqscan/timeout не подкручены. Memory.Store по-прежнему clone всего snapshot; SQL budgets не распространяются на него.

## Клиентские fixtures / ограничения

macOS arm64 combined /tmp/chat-read-httpapi.test поддерживает TestBrowserFixture, TestIOSFixture, TestAndroidFixture.
Native env: SOMEWHERE_IOS_FIXTURE=1, SOMEWHERE_IOS_FIXTURE_CONFIG=<private path>, SOMEWHERE_IOS_FIXTURE_SCOPE=chat, SOMEWHERE_IOS_CHAT_REALTIME=1; optional SOMEWHERE_IOS_CHAT_READ_STATE=1; `-test.run '^TestIOSFixture$'`. Для Android заменить IOS→ANDROID, TestIOSFixture→TestAndroidFixture. Для browser прежние flags + optional SOMEWHERE_BROWSER_CHAT_READ_STATE=1.

Global read flag не включать до готовности клиентских schema/UX и независимых gates. Root сохраняет main profile fixture extensions при интеграции. Не проверены этим агентом: live SQL exact commit, independent feature-test, production migration/release, actual client SDK read-state, multi-device visibility500ms/coalescing1s/overlay/background/readers UI. qa:ready и общий PASS не заявлены.

## Артефакты SHA256
- /tmp/postgres-chat-read.test: `d73c6acbe73330f4e31ce901588dc944aad67f851297be687a0b94516d0fdfa7`
- /tmp/chat-read-httpapi.test: `5bad6c5d42c7c91a3c672f9fd0f8c2de8eb36ec3d6afa3227d64b9db0811798f`
- /tmp/chat-read-evidence/enabled-http.json: `af5aa8b609fffebf13afbba32d8e140b1140fff5a21ec9538cfb50c1b4276272`
- /tmp/chat-read-evidence/native-fixture-startup.json: `6ad0ca941f602215785c60dfc0ee7fafdfe273a9998511f47d14f9786d9e8534`

## Обновление после guarded SQL run01

Root подтвердил 389ebe7: 11 SQL tests PASS, один FAILED — receipts100 читал100000 индексных записей вместо budget100. Failed raw сохранён в main qa/2026-10-27-read-state-storage-sql/run01. Подготовлен отдельный fix commit2144ef0607648a4a69c65845351e3ea25cb3bf66; точные результаты/новые артефакты/ограничения — /tmp/chat-read-sql-fix-report.md. Общий read-state SQL PASS до повторного live run не заявляется.
