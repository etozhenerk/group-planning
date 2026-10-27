# Исправление RT-01 и RT-02

Дата: 27.10.2026. Исполнитель: `/root/ios_chat_diagnosis`.
База: `e794168085968b123e011844ac9b97539af54857`.
Кандидат: `d32deaa07093e50c138089f77f989e7cacc8e43a`.
Worktree: `/Users/misha/.codex/worktrees/chat-bounded-storage/group-planning`.

## Изменения

- RT-01: `realtime/adapter.go` регистрирует `OnCommandRead` до запуска Node.
  Команда client unsubscribe для personal получает 103 до исполнения; обязательная
  серверная подписка сохраняется. `OnSubscribe` дополнительно проверяет отдельный
  лимит одной встречи. Общий лимит двух каналов остаётся защитой на уровне SDK.
  Разрешённый meeting unsubscribe и переход на другую встречу сохраняются.
- RT-02: `meetings/chat_dispatch.go` хранит рассчитанный jitter/backoff как duration.
  Deadline строится от единого времени внутри ACK-транзакции, после завершения всех
  публикаций и получения write lock. Поэтому последующая публикация не превращает
  retry предыдущей в невалидную запись. Строгая storage validation, lease ownership,
  expiry fencing, rollback и повтор после crash не ослаблены.
- Сохранены regression probes независимого reviewer. Dispatcher probe дополнен
  проверкой durable retry и отсутствия повторной публикации успешного события.
  Добавлен JSON/protobuf roundtrip: personal unsubscribe 103, первая встреча success,
  вторая 106, обычное переключение success, personal invalidation продолжает приходить.
- SQL integration fixture `TestChatDispatchElapsedRetryIntegration` проверяет ту же
  смешанную пачку, сохранённое время retry, очищенную lease и повтор только failed ID.
  Миграции и SQL production-код этим исправлением не менялись.

Изменены 6 backend files, 281 additions/3 deletions. Main, frontend, production,
node_modules symlink, plans/specs/tasks и ранее сохранённое evidence не менялись.
Push, deploy, удалённые команды и создание БД не выполнялись.

## Выполненные проверки

Все Go проверки: Go 1.27.2, `GOMAXPROCS=1`, `-p=1`,
`GOCACHE=/tmp/chat-bounded-go-cache`.

- RED: исходные независимые probes на e794168 воспроизвели оба дефекта.
  `/tmp/chat-realtime-fix-red.jsonl`.
- GREEN: оба probes и JSON/protobuf mandatory personal/meeting switch PASS.
  `/tmp/chat-realtime-fix-green.jsonl`. SQL test в этом локальном запуске SKIP
  из-за отсутствующего integration DSN; это не runtime SQL pass.
- Полный `go test -race ./...` PASS: `/tmp/chat-realtime-fix-race.log`.
- `go vet ./...`, `go build ./...`, dependency checker, storage-demo PASS:
  `/tmp/chat-realtime-fix-vet.log`, `/tmp/chat-realtime-fix-build.log`,
  `/tmp/chat-realtime-fix-dependencies.log`, `/tmp/chat-realtime-fix-storage-demo.log`.
- `sh scripts/format.sh --check`, `gofmt -l .`, `git diff --check` PASS:
  `/tmp/chat-realtime-fix-format.log`, `/tmp/chat-realtime-fix-gofmt.log`.
- `npm run api:test` PASS: 74 schemas, 34 fixtures, 452 actual HTTP responses.
  `/tmp/chat-realtime-fix-api.log`. Прежняя единственная OpenAPI warning о
  101 WebSocket upgrade без 2xx сохранена; фиктивный 200 не добавлялся.
- Exact commit crosscompile Linux/amd64 SQL test binary и macOS browser fixture PASS.
  `/tmp/chat-realtime-fix-sql-build.log`, `/tmp/chat-realtime-fix-browser-build.log`.
- После commit worktree clean, кроме ранее существовавшего untracked node_modules.

## Артефакты для повторной приёмки

Linux SQL: `/tmp/postgres-chat-realtime-fix.test`
SHA256: `9e7a17620763178847c7371951af8f4a47f2abf8267653efab4169641ac56b4e`.
Guarded filter: `^(TestChat.*Integration|TestFeedWindowIntegration)$`.
Теперь 10 integration tests: прежние 9 и новый mixed-batch elapsed retry.

Browser fixture: `/tmp/chat-realtime-browser-fix.test`
SHA256: `723913f7047f26ffcb549cfdd628d30f68949153f7405a0b0049607c12a6d6cf`.
Запуск для отдельной клиентской сборки:

```sh
SOMEWHERE_BROWSER_FIXTURE=1 SOMEWHERE_BROWSER_CHAT_REALTIME=1 \
SOMEWHERE_BROWSER_DIST=<isolated-web-dist> SOMEWHERE_BROWSER_ADDR=127.0.0.1:<port> \
/tmp/chat-realtime-browser-fix.test -test.run '^TestBrowserFixture$' -test.timeout 0
```

## Непроверенное и следующий этап

Новый живой SQL и независимый review exact d32deaa ещё не выполнены этим агентом.
Root повторит guarded SQL; независимый reviewer повторит исходные probes.
SQL PASS девяти tests e794168 и JS5.8 undefined/{} PASS старого binary относятся
только к предыдущему кандидату, не подменяют новую приёмку.
Полный SDK/client recovery/capacity и общий case/platform gate не объявляются PASS.
Checkbox не закрыт. Следующий read-state 3.3–3.6 остаётся отдельным turn по root.
