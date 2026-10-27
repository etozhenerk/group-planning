# Адресный SQL receipts lookup — 2144ef0

Commit: `2144ef0607648a4a69c65845351e3ea25cb3bf66`, поверх read-state candidate `389ebe7ba91442e8c650fb8cc48596613cc1445c`.
Только 2 файла: backend/internal/storage/postgres/chat_read.go и chat_read_plan_test.go. Main/prod не менялись агентом; worktree clean кроме прежнего node_modules symlink. Общий implementation report: /tmp/chat-read-report.md.

## Подтверждённый дефект исходного кандидата

Root выполнил guarded live SQL 389ebe7: **11 PASS / 1 FAILED**, TestChatReadState100kPlanIntegration. Receipts100 использовал Index Only Scan по 100000 feed rows при допустимых100. Execution37.123ms; это нарушение bounded work, несмотря на допустимое время. Unread count36.725ms, first unread0.039ms, activation2.405ms; actual atomic SQL PASS. Удаление temporary DB/directory подтверждено root.
Raw сохранён main: openspec/changes/chat-reliability-and-sync/qa/2026-10-27-read-state-storage-sql/run01/sql-live.log (failure line180+). Этот failed run не перезаписан и не ослаблен ожиданиями.

## Исправление

Flattenable join unnest→feed_entries заменён параметризованным CROSS JOIN LATERAL: каждый requested ID выбирается по существующему primary key с LIMIT1; meeting/author/kind filter применяется к адресной записи. LIMIT не даёт оптимизатору превращать lookup в join со всей message history. Batch сохраняет входной порядок и авторизацию; новых индексов/миграций/timeouts/planner settings нет.

Прежняя 100k EXPLAIN regression сохраняет budget100 и теперь суммирует ActualRows+RowsRemoved по всем feed scan nodes с ActualLoops. Дополнительно проверяет ровно100 результатов в намеренно обратном входном порядке и нулевые receipts от baseline. Query timing budgets не менялись.

## Проверено / не проверено

GOMAXPROCS=1, GOFLAGS=-p=1, прежний cache.
- Targeted race postgres/memory/meetings/httpapi PASS: /tmp/chat-read-lookup-race.log. SQL integration compile/skip без DSN; не live PASS.
- Vet/build/format/diff-check PASS: /tmp/chat-read-lookup-vet.log, /tmp/chat-read-lookup-build.log, /tmp/chat-read-lookup-format.log.
- Новый Linux SQL binary и macOS combined fixture binary собраны. Linux надо повторить тем же guarded harness/filter `^(TestChat.*Integration|TestFeedWindowIntegration)$` (12 tests).
- На момент отчёта live SQL фикса и independent review ещё не выполнены. Production не изменён. Tasks/qa gates не закрыты.
- macOS fixture binary совпал по SHA256 с389: pure SQL query не входит в memory HTTP fixture. Native startup evidence предыдущего binary сохраняет точные bytes; новое SDK/UI поведение этим не принимается.

## Артефакты

- /tmp/postgres-chat-read-r2.test — `eed3c11de570deafad78ec46d38ab0d3567cc54eca5a4fc5d3d8dc8a5cd2dfb7` (Linux amd64 static).
- /tmp/chat-read-httpapi-r2.test — `5bad6c5d42c7c91a3c672f9fd0f8c2de8eb36ec3d6afa3227d64b9db0811798f` (macOS arm64, все3 fixtures).
- Исходные389 binaries и /tmp/chat-read-evidence сохранены.
