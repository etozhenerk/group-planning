# Telegram-уведомитель эксплуатации

Применяй [общие правила](../../AGENTS.md) и [соглашения кода](../../docs/development.md).
Это инфраструктурная Cloud Function, не модуль предметного API. Не импортируй backend.
`handler.go` — сборка зависимостей; `internal/notify` — проверка и доставка,
`cloud`, `telegram`, `chart` — адаптеры. Общий контракт клиентов не меняется.

Runtime — golang123, go.mod требует Go 1.23.0. Основные проверки — Go 1.27.2,
совместимость — Go 1.23.12. Для PNG используется только x/image v0.24.0 и stdlib.
Контекст первым аргументом, ошибки без URL/секретов, зависимости передаются явно.
Не добавляй изменяемые глобальные клиенты/токены. Применяй стиль Go из
[backend/AGENTS.md](../../backend/AGENTS.md), но команды ниже относятся только сюда.

Из этой папки:

```sh
go mod download
sh scripts/format.sh --write
sh scripts/format.sh --check
go vet ./...
go test -race ./...
go build ./...
GOTOOLCHAIN=go1.23.12 go test ./...
sh scripts/package.sh
go run ./cmd/preview -output ../local/telegram-preview.png
```

Форматтеры закреплены в tools/go.mod; для них нужен Go 1.27.2. CI повторяет
format/vet/race/build и сборку архива. Из корня: `npm run agent:check`.
Настоящие отправки требуют явно настроенного чата; тесты используют fake HTTP.
Не логируй входящий payload и не помещай token/chat config в примеры или Git.
