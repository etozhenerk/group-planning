# Backend chat journal / outbox / around — 27.10.2026

Commit: `b91ec8bb322b5e914fd804284bcd3b4ad158a00b`.
Worktree: `/Users/misha/.codex/worktrees/chat-bounded-storage/group-planning`.
Родительские commits 0dc1997, 15bf46c и 4c48037 сохранены. Только 25 backend файлов, 2319 добавлений / 3 удаления. Main, frontend, manifests и node_modules symlink не изменены. Push/deploy/облачных обращений/локальной БД/Docker не было.

## Реализовано

- Reader/Writer модели и порты stable `ChatStream`, reference-only `ChatChange`, durable `ChatHint`. Позиция журнала независима от feed/read. SQL передаёт uint64 десятичными строками в numeric(20,0); preflight overflow сохраняет ErrInvalidRecord и rollback.
- Журнал читает диапазон `after < sequence <= through` с limit+1 и проверкой retained boundary. PostgreSQL использует PK (meeting_id,change_sequence), memory — binary search. RetainedAfter моделируется; worker обрезки ещё не реализован.
- `Service.update` оборачивает writer, сравнивает адресные before/after записи, сохраняет весь набор затронутых ресурсов, затем записывает journal и coalesced outbox в той же транзакции. Одно уведомление на встречу/получателя; ресурсные ссылки не теряются при coalescing. Тексты/имена/голоса/токены не копируются в журнал/outbox.
- Before/after recipients — organiser + RSVP IDs. Это снимок состава, не полный feed; на каждую запись сообщения full Feed не вызывается (регрессия с запрещённым Feed проходит). Стоимость доставки зависит от числа участников. Memory Store по-прежнему клонирует общий snapshot; общей O(1) производительности не заявлено.
- Additive migration 004: streams + backfill epoch существующих встреч; changes; отдельный outbox без FK на meeting. Meeting-target hints удаляются с встречей, personal terminal hints переживают удаление; удалённый user очищается из outbox.
- Bounded FeedAround в memory/PostgreSQL и Service: anchor lookup, bounded стороны, ASC window, оба направления, same View tail, доступ проверяется прежде anchor/data. Старый HTTP/DTO не изменён; HTTP around wiring относится к следующему срезу.

## Mutation coverage и границы

| Путь | Hook | Проверка этого среза |
| --- | --- | --- |
| Создание/правка встречи, cover | SaveMeeting / SaveCover / DeleteCover -> meeting_changed; AppendEntry -> entry_upsert | Создание входит во все fixtures; прежняя полная suite PASS. Отдельной новой live SQL проверки каждой настройки/cover нет |
| Text message | AppendEntry с адресной retry lookup | Message commit; retry до/после receipt expiry; conflict; отсутствие full Feed; отказ outbox откатывает message/journal/hints |
| Media | Pending upload не публикуется; published SaveMedia + AppendEntry coalesce; published DeleteMedia invalidates | Pending upload, publish, retry до/после expiry; одна ссылка на message entry. SQL media live сценарий не добавлен |
| Reactions | Прямая ReactionActive(tuple), SaveReaction -> original entry | Add/no-op; account removal очищает reactions через RemoveUser и invalidates затронутую историю/состав |
| Date polls | SaveDatePoll -> resource ID; CloseJob исключён из сравнения | Hidden vote -> old card; no-op ballot; retry bookkeeping без события; close/duplicate close |
| Place polls | SavePlacePoll -> resource ID; CloseJob исключён | Creator anonymization и сохранение ID вместе с остальными карточками. Отдельные vote/close assertions нового журнала не добавлены; общий hook и прежние suites проверены |
| Preparation tasks | SavePreparationTask -> resource ID | Account removal меняет 2 task cards, оба ID сохранены; обычные transitions покрыты прежней suite, отдельные journal assertions каждого transition не добавлены |
| RSVP/access | SaveRSVP/ DeleteRSVP, history_invalidated при изменении Going membership | Leave invalidates projections и уведомляет отозванного personal recipient |
| Worker status | CompleteTransition переведён с raw Store.Update на Service.update | Claim без события; complete -> meeting_changed |
| Account deletion | Реальный server/accounts.go:29 -> Identity.AccountUpdate -> inner meetings.Service.RemoveAccount -> Service.update/flush; оба adapter AccountUpdate удерживают общую транзакцию | Memory actual accounts.Service.Delete; outer failure rollback journal/outbox/fence; coalescing всех tasks/polls; отсутствие удалённого recipient; terminal hint после удаления встречи |

Явные исключения: SaveTransitionJob lease/claim/fail/recovery; poll CloseJob-only retry/lease; receipt insert/prune; pending media reservation/upload/prune не являются изменением доступного чата и не создают journal event. Invitation insert происходит вместе с Create, который уже пишет meeting/feed events. Прямые adapter Writer вызовы fixtures/storage-demo не являются application command и не получают decorator автоматически. Других production mutation callers вне meetings не найдено; внешний identity путь обработан как выше. Существующий полный Feed в account-removal (successor/история), реакциях и прочих старых потребителях не переписан.

## Проверки

Все Go команды использовали `GOCACHE=/tmp/chat-bounded-go-cache GOMAXPROCS=1`, `-p 1` / `GOFLAGS=-p=1`.

- Red -> green: initial journal tests падали record not found до wiring, `/tmp/chat-journal-red.log`; после hook прошли.
- `go test -race -p 1 ./...` PASS: `/tmp/chat-journal-race.log`. После последних test-only дополнений и SQL query constant extraction выполнены targeted race и SQL compile.
- `go test -race -p 1 ./internal/meetings ./internal/accounts ./internal/storage/memory -run 'TestChat|TestFeedAround|TestAccountTransactionRollsBackChatInvalidation' -count=1` PASS: `/tmp/chat-journal-targeted-race.log`.
- `go vet ./...`, dependency checker, `go build ./...`, storage-demo, format --check, gofmt -l, git diff --check PASS. Логи `/tmp/chat-journal-{vet,dependencies,build,storage-demo,format,gofmt}.log`.
- `npm run api:test` PASS: 65 schemas,32 fixtures,424 actual responses match existing OpenAPI; `/tmp/chat-journal-api.log`.
- SQL tests compile/race PASS, четыре live tests SKIP: SOMEWHERE_TEST_DATABASE_URL не задан. Это не SQL acceptance: `/tmp/chat-journal-sql-compile.log`.
- Скомпилирован Linux/amd64 static SQL binary `/tmp/postgres-chat-journal.test`, SHA256 `b3ed09091ee2c2b48dbf57dc9667f6d5cf58767263acb4e6fa63ea06599ecce3`.
- Suggested guarded remote filter: `-test.run 'TestChat.*Integration|TestFeedWindowIntegration' -test.v`. Включает: atomic range/snapshot/pool reopen/uint64/rollback; outer account transaction + terminal hints; v3->v4 legacy backfill/replay; production journal query EXPLAIN at100k (seed batches1000, standard timeout); around added to FeedWindowIntegration sparse uint64 fixture. Root owns isolated remote harness; я remote не запускал.

Case links (частичное покрытие, не pass всего case/platform): TC-CHAT-PAGE-BOUNDS, TC-CHAT-SYNC-5EFD24A6, TC-CHAT-SYNC-AA76CADB (durable intent/rollback часть; crash/dispatch ещё нет), TC-CHAT-SYNC-THROUGH (storage barrier), TC-CHAT-SECURITY-6DD0CC09 (journal privacy), TC-CHAT-SECURITY-A3B3BFE7 (account atomic invalidation).

## Не реализовано / не проверено

- Dispatcher publish/lease/ACK/backoff/restart/drain, SDK/realtime connection/revoke, retention7days/100k enforcement, stale-outbox invalidation replacement, epoch reset/rotation workflow.
- HTTP snapshot/sync/around/capabilities, signed opaque cursors, current authorized projection materialization, protocol wire decimal DTOs. Новые uint64 модели пока storage/application, не HTTP.
- Read markers/baseline/receipts, client recovery/fallback/outbox/scroll, E2EE decision.
- Live SQL текущей миграции/нового журнала здесь blocked без DSN. Предыдущий SQL run02 bounded-storage PASS относится к прошлому commit; не переносится на новую миграцию.
- Независимый feature-test/qa:ready этого среза ещё не выполнен (все четыре agent slots были заняты). Никакой OpenSpec checkbox не закрыт; task2.1/2.3 остаются частичными. UI не затронут, design review неприменим.
