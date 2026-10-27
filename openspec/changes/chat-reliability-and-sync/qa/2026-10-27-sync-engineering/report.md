# HTTP sync / retention — серверный срез 27.10.2026

Commit `6aac61e80a52fdaa2eb117d16b1c42d06ec1857d`, поверх `b91ec8bb322b5e914fd804284bcd3b4ad158a00b`.
Worktree `/Users/misha/.codex/worktrees/chat-bounded-storage/group-planning`.
39 файлов: backend code/tests/README/.env.example и additive contracts/OpenAPI fixtures. Main/frontend/DS/manifests не изменены. Node_modules symlink сохранён. Push/deploy/production/local DB/Docker не выполнялись.

## Реализовано

- GET `/api/v1/chat-capabilities`: protocol1; sync включается только стабильным signing key; read_state=false, realtime=false. Без ключа sync404, прежние HTTP продолжают работать. Config принимает canonical base64 ровно32bytes; значение не выводится.
- GET `/meetings/{id}/sync`: initial read-only snapshot tail/around с metadata и текущими разрешёнными карточками; changes pages bounded1..100 до fixed through. Последний next_cursor сбрасывает through в idle и следующий цикл получает новые изменения. Regression проверяет arrival после первой и последней страницы.
- HMAC-SHA256 cursor scoped user/meeting/epoch/after/through/expiry; integer positions внутри подписанного payload тоже decimal strings. Неверная подпись/формат/scope400; expiry/epoch/retained range410 sync_reset_required. Current access проверяется в Store.View до cursor/journal/anchor; request_id/error envelope прежний.
- Projection_version — high-water текущего read snapshot. Старое событие материализуется из текущей записи/карточки, не из копии приватных данных. Date poll проходит существующий pollView, скрытые выборы не раскрываются; account deletion replay использует обезличенное имя и history_invalidated. Public avatars/media authors сохранены; реакциям добавлен адресный Reader по entry IDs.
- Lightweight chatSnapshot не перечисляет album/history: meeting+caller RSVP перед доступом, состав после доступа. Snapshot entries+stream boundary принадлежат одной View. История around использует адресный anchor и bounded sides, прежний DTO дополнен range/has_older/has_newer только для around.
- Legacy/direct fixture без stream: initial request после проверки доступа делает адресный EnsureChatStream insert-if-absent, затем новый read-only snapshot. Повторные/concurrent initializers не ротируют epoch; unauthorized request stream не создаёт. Cursor request без stream требует410. PostgreSQL migration004 backfill сохраняется.
- Retention7days/100000 logical changes: cap проверяется в mutation transaction; lifecycle worker при старте/каждую минуту обрабатывает максимум10streams и100старых hints. Физическое удаление журнала пакетами1000; retained boundary немедленно отсекает старый cursor, feed history не удаляется. Worker отменяется и join при остановке.
- Expired pending outbox заменяется новым current invalidation intent с новым event ID, с coalescing target+meeting, в одной transaction с trim/delete. Failure rollback сохраняет старые intents/retained boundary. Terminal personal hints переживают meeting deletion; удалённые recipients исключаются. Dispatcher/publication пока не подключён.
- Additive migration005: invalidation flag, age/retention/reaction indexes; прежние004checksum не менялись.

## Проверено

Все Go с `GOMAXPROCS=1`, `-p1`/`GOFLAGS=-p=1`, `GOCACHE=/tmp/chat-bounded-go-cache`.

- Full `go test -race -p1 ./...` PASS на окончательном коде: `/tmp/chat-sync-final-full-race.log`.
- Targeted sync/retention/privacy/legacy HTTP/storage race PASS: `/tmp/chat-sync-targeted-race.log`, `/tmp/chat-sync-final-targeted-race.log`, `/tmp/chat-sync-legacy-race.log`.
- Legacy stream/no-write-on-denied, fixed through/retry/arrival-after-final, hidden vote, malformed/scope/expiry, account replay names, retention replacement failure rollback, bounded1000 physical delete, uint64 count boundary, lifecycle cancellation.
- Реальный HTTPS fixture: cookie и native Bearer; 401/403, capabilities, snapshot/changes, around, tamper400, retention410/common request_id, fresh snapshot recovery, отсутствие text/cursor в server logs. Signing-disabled flagsfalse/404.
- Final vet/build/dependency/format/gofmt PASS: `/tmp/chat-sync-final-{vet,build,dependencies,format,gofmt}.log`; storage-demo PASS `/tmp/chat-sync-storage-demo.log`; git diff --check PASS.
- API PASS:74schemas,34fixtures,452actual responses: `/tmp/chat-sync-candidate-api.log`. API:check PASS; agent:check/OpenSpec structural PASS `/tmp/chat-sync-candidate-agent.log`.
- Tests-first missing Sync API compilation baseline `/tmp/chat-sync-red.log`; avatar projection assertion red then green `/tmp/chat-sync-avatar-red.log`. Это не воспроизведение UI или прежней ACK race.

## SQL / независимая приёмка

Linux/amd64 static binary `/tmp/postgres-chat-sync.test`.
SHA256 `78038a7f2e2a4dceb85aaea1be610622da05b866eb76e994a463fd5de0b49e33`.
Suggested guarded test filter: `-test.run '^(TestChat.*Integration|TestFeedWindowIntegration)$' -test.v`.
Добавлены `TestChatRetentionAndSyncIntegration`, `TestChatLegacyStreamInitializationIntegration`; прежние journal/around/migration/100k EXPLAIN также включены. Здесь SQL только compile/skip без SOMEWHERE_TEST_DATABASE_URL. Root запускает isolated harness отдельно; b91 live SQL PASS не перенесён на005/этот commit.

Независимый reviewer/root должен принять exact SHA отдельно; qa:ready и checkbox не заявляются. Связанные cases: TC-CHAT-SYNC-THROUGH, TC-CHAT-SYNC-5EFD24A6, TC-CHAT-SYNC-AA76CADB (без dispatcher crash части), TC-CHAT-SECURITY-6DD0CC09/A3B3BFE7, TC-CHAT-PAGE-BOUNDS и протокольная совместимость. Catalog/manifests здесь не редактировались.

## Границы следующего среза

- Centrifuge/auth/Origin/expiry/revoke, dispatcher lease/publish/ack/retry/restart ещё не реализованы; отдельный commit tasks3.1–3.2 следующий.
- Read markers/unread/baseline/receipts, client owners/outbox/fallback/scroll и E2EE decision остаются отдельными этапами.
- Восстановление данных с неполным журналом требует смены epoch оператором; автоматического production rollback/reset endpoint нет. Обычный рестарт не меняет epoch/key. Key rotation invalidates signatures400; deployment key сохраняется стабильным.
- Maintenance ограничивает batch mutations; общий кандидатный обход stream metadata и memory whole-snapshot clone не заявлены как O(1) или проверенный production performance. Live SQL/load/release gates остаются root; production я не менял.
