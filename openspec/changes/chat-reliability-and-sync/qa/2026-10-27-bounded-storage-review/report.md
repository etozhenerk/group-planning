# Независимый технический review bounded storage

Проверяющий: `/root/api_r2_independent`. Проверен commit
`0dc1997c365b0c99effad1b987f8a5bdfa901da5` относительно
`6e69ae85755e7e8c5bc51854befabd9f21c46504` в отдельном чистом worktree
`/Users/misha/.codex/worktrees/chat-bounded-storage/group-planning`.

**Исправляемых дефектов в проверенном срезе не обнаружено.** Это технический
review совместимости initial/after/before и адресных повторов text/media.
Формальный feature-план этого этапа не создан; результат не является
feature-test, qa:ready, закрытием задачи 2.1 или полной приёмкой chat sync.

## Проверенный результат

Свежий запуск 27.10.2026, 17:32:16–17:32:33 UTC: Go 1.27.2 darwin/arm64,
`GOMAXPROCS=2`, `-p 2`, `-race`, `-count=1`, `GOFLAGS=-mod=readonly`.
Команда и временные отметки — [command.json](command.json), исходный Go JSONL —
[targeted-race.jsonl](targeted-race.jsonl).

| Пакет | Passed, верхний уровень | Skipped | Failed |
| --- | ---: | ---: | ---: |
| meetings | 86 | 0 | 0 |
| storage/memory | 20 | 0 | 0 |
| storage/postgres | 1 | 10 | 0 |
| httpapi | 24 | 4 | 0 |
| Всего | 131 | 14 | 0 |

Подробные имена — [test-summary.json](test-summary.json). В число passed входят
три дополнительных независимых эксперимента, подключённые через Go overlay
из `/tmp/somewhere-bounded-review-20261027/window_oracle_test.go`; в приложение
тесты не добавлены. SHA256 эксперимента:
`6d7d1348cd3b9c5c4d9a1f96caaf959a43adf0c91cc1e2b1c504c1b518f8e1ae`.

Дополнительно **424 фактических HTTP-ответа** проверены по неизменному OpenAPI:
схемы, допустимые методы/статусы, пустые ответы, `no-store` и `X-Request-Id`.
[http-contract.json](http-contract.json) хранит маршрут, статус, схему и digest
без тел авторизации, cookie и invitation capability values. Временные полные
captures удалены после проверки.

## Сверка областей

| Область | Независимое подтверждение |
| --- | --- |
| Семантика initial/after/before | 31 520 окон сравнены со старым алгоритмом полного фильтрования и выбора head/tail. Проверены пустые страницы, точная граница, разреженные sequence, limit 1/2/7/50/100, значения около MaxInt64 и MaxUint64. Порядок, `has_more` и `latest_sequence` совпали. |
| Доступ до данных | `feed_service.go:27` вызывает privateSnapshot до FeedWindow; `feed_service.go:72` — до MessageByRequest; media начинает с ownedMedia. Действующие тесты с запрещающими reader/writer spies прошли после отзыва RSVP. |
| Text retry | Прежний ID/sequence сохранён до и после expiry receipt; другое тело конфликтует; одинаковый request ID другого автора изолирован. Bounded-store spy запрещает полный Feed. |
| Media retry | Адресное чтение по сохранённому entry ID возвращает исходное сообщение и вложение; подпись неизменна, права проверены до lookup. При отсутствии записи остаётся ErrInvalidRecord. Прошли media/caption/rollback и HTTP-контрактные проверки. |
| Индексы memory | Независимый эксперимент проверил одинаковый request ID у разных авторов/встреч, чтение обновлённого автора после anonymize, delete/recreate с повторным использованием ID, rollback удаления и отмену добавления. Устаревшие offsets/keys не обнаружены. |
| Независимые копии | Payload и Attachments изменялись у результата lookup и перечитывались в том же snapshot; изменения не попадали в хранилище. Прошли также существующие copy tests. |
| Snapshot/rollback | Прошли существующие тесты удержанного read snapshot во время concurrent commit, rollback index/data, закрытых транзакций, panic и cancellation. PostgreSQL runtime-подтверждение отдельно отсутствует. |
| uint64 | Независимый эксперимент успешно добавил последнюю запись на MaxUint64, следующий append получил ErrInvalidRecord без записи в индексах. SQL cursor использует FormatUint → text → numeric, tail — ParseUint, без сужения до int64. |
| Прежний полный Feed | Порт сохранён. Прошли account removal, reactions и остальные meetings/memory/httpapi regressions; собственный lifecycle-эксперимент также перечитал полный Feed после отменённой записи. |
| Изменения тестовых часов | Два HTTP-теста закрепляют время до своей фиксированной даты встречи. Производственные правила RSVP и HTTP-модели этим не изменены. |

Сверены требования `design.md`, `protocol.md`, `validation-plan.md`,
`testing.md` и `specs/event-feed/spec.md` актуального изменения из основного
checkout. Новый around-порт, sync journal/epoch, unread и client windows
не входят в этот совместимый патч и не объявляются реализованными.

## Непроверенные условия и ограничения

1. **Live PostgreSQL / EXPLAIN — blocked.** Локальный прогон явно очистил
   `SOMEWHERE_TEST_DATABASE_URL`, поэтому все 10 SQL integration tests skipped.
   Сообщение координатора от 27.10.2026 уточняет: прежний SSH доступен, но
   проверка конкретного изолированного target вернула
   `FATAL database "somewhere_integration" does not exist`. Это наблюдение
   координатора, не сетевой запрос данного проверяющего. Новая БД не создавалась,
   production не использовался. Реальные plans/index use, PostgreSQL snapshots,
   rollback, uint64/driver behaviour и бюджеты 1k/10k/100k этим review не приняты.
2. **Memory остаётся с полным копированием snapshot.**
   `storage/memory/store.go:46` вызывает `state.clone`, а `state.go:89` копирует
   все feed slices. Новый reader возвращает ограниченное окно, но этот патч
   не делает общую стоимость memory View независимой от истории. Ограничение
   сохранено и явно описано в новом `meetings/feed_window.go`; замеры p95 и
   стабильной памяти не выполнялись.
3. Четыре live UI fixture-теста skipped: их переменные окружения удалены.
   Браузеры, симуляторы и пользовательские процессы не затронуты. Старые
   мобильные бинарники и полный release/feature workflow не запускались.
4. Проверены четыре целевых пакета и контракт. Отдельные build/vet/format,
   полный `go test ./...`, облачные миграции и deployment в этот независимый
   прогон не входили.

## Сохранность и воспроизведение

[before.json](before.json) и [after.json](after.json) фиксируют одинаковые
HEAD, чистый статус и hashes всех 17 файлов diff. Кандидат, Git и основной
checkout не редактировались. Основной checkout получил только этот отчёт и
evidence. Diff кандидата сохранён в [review.diff](review.diff).

Для повторения независимых экспериментов оставлены только в `/tmp`:
`window_oracle_test.go`, `overlay.json`, `run-review.py`, `validate-http.mjs`.
Временный путь не является постоянным архивом тестов; после очистки `/tmp`
останутся этот разбор, hash эксперимента и исходные результаты.
`git diff --check` кандидата прошёл; результат — [diff-check.json](diff-check.json).
Hashes всех файлов отчёта/evidence — [checksums.json](checksums.json).
