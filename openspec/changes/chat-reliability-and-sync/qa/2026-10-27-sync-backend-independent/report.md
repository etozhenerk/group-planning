# Независимая проверка backend sync

Проверяющий: `/root/chat_sync_backend_review`. Дата: 27.10.2026.

Точный runtime-кандидат: `6aac61e80a52fdaa2eb117d16b1c42d06ec1857d`.
В проверенных storage/service/HTTP сценариях дефектов не выявлено. Выполнены
собственные независимые probes и целевые тесты кандидата: 28 тестов верхнего
уровня прошли с race detector. Это частичная проверка задач 2.1–2.6, а не полная
приёмка change или основание закрыть целиком связанные case IDs.

## Источники и кандидат

- Прочитаны root/backend AGENTS.md, startup-документы, docs/development.md,
  feature-test, testing/README.md и testing/environments.md.
- Raw requirements: design.md, protocol.md, validation-plan.md, security.md,
  testing.md, tasks.md и четыре delta spec текущего change. Названия из брифа
  соответствуют фактическим файлам.
- Кейсы bounded feed находятся в `testing/cases/chat-reliability-feed.yaml`;
  остальные относящиеся к scope кейсы — в `testing/cases/chat-sync.yaml` и
  `testing/cases/chat-security.yaml`. Прочитан testing-manifest.json.
- Первоначальный journal-кандидат `b91ec8bb322b5e914fd804284bcd3b4ad158a00b`
  изучен статически через точный архив. Его runtime отдельно не запускался.
- Runtime выполнен в `/tmp/chat-sync-independent-6aac`, извлечённом через
  `git archive` точного commit. Dirty worktree не использовался как кандидат.
  [Manifest источников](6aac-source-manifest.json) содержит hashes 340 файлов
  backend/contracts и требований. Повторное сравнение после проверки: ни один
  исходный файл кандидата не изменён; добавлены только отдельные probe tests.

## Окружение и запуск

Go 1.27.2 darwin/arm64, macOS 27.0.1 (26A434), один CPU, `-p=1`.
Изолированный memory.Store и синтетические test-only OAuth профили; живой
HTTPS httptest server слушал только loopback на временном порту. Управляемое
время принадлежит fixture; системные часы не менялись. Native UI, реальные
аккаунты, production, удалённая БД и реальные сообщения не использовались.

Команда финального целевого прогона из каталога `backend` архива:

```sh
GOMAXPROCS=1 GOCACHE=/tmp/chat-bounded-go-cache \
  /Users/misha/.local/share/somewhere/go-1.27.2/bin/go test \
  -race -p=1 -count=1 -json \
  ./internal/meetings ./internal/storage/memory ./internal/accounts ./internal/httpapi \
  -run '^Test(Independent|Chat|AccountTransactionRollsBackChatInvalidation|FeedAndTextRetryNeverReadFullHistory|MediaRetryNeverReadsFullHistory|FeedWindow|FeedAround)'
```

Независимые probes сохранены в [probes](probes/): для воспроизведения скопировать
соответствующий файл как `independent_review_test.go` в packages
`backend/internal/meetings`, `backend/internal/storage/memory` и
`backend/internal/httpapi` точного архива. Они используют fixture helpers из
этого commit. Продуктовый код не подменяется.

## Наблюдения expected / actual

| Проверка | Ожидание по требованиям | Фактическое наблюдение |
| --- | --- | --- |
| Поздний отказ outbox | Ни entry, ни journal, ни часть hints не переживают rollback | При отказе второго и третьего hint весь снимок остался прежним; повтор создал ровно следующую feed/change позицию |
| Revoked text retry | Receipt и истечение его срока не обходят доступ | Повтор отклонён ErrForbidden до и после 31 суток управляемого времени |
| Revoked around | Отказ не раскрывает существование якоря | Существующий и отсутствующий anchors дали одинаковый ErrForbidden |
| Around на uint64 | Окно содержит якорь, ASC, limit, правильные обе границы и независимые копии | Все 10 100 комбинаций 101 anchors × limits 1–100 прошли в разреженном диапазоне до MaxUint64; изменение payload ответа не затронуло store |
| Многостраничный HTTPS sync | Through фиксирован; новый commit относится к следующему циклу | 105 изменений пришли за 3 страницы по 40; 106-е, сохранённое после первого ответа, пришло только следующим циклом; повтор continuation сохранил барьер |
| Scope и отзыв доступа | Чужой cursor отклонён; актуальные права проверяются до выдачи | Для другого допущенного actor — 400; после выхода guest valid и forged cursors дали 403 без тела сообщения |
| Некорректный запрос | Невалидные параметры не становятся успешным пустым ответом | limit 0/101, пустые и несовместимые cursors, дубли и неизвестный параметр — 400; отсутствующий around anchor — 404 |
| Retention/reset | Старый cursor явно сбрасывается, сама история сохраняется | После trim — 410 sync_reset_required с request_id; новый around snapshot вернул сохранённую запись |
| Удаление аккаунта через HTTP | Повтор журнала не возвращает старое имя; сессия отозвана | DELETE /me → 204; старая сессия → 401; sync/around вернули «Удалённый аккаунт» и null avatar; новый организатор — оставшийся going |
| Удаление встречи и terminal hint | Stream удалён, terminal личный hint переживает cascade/retention | Solo stream отсутствовал; hint для сохранённого maybe получателя присутствовал сразу и после 8 суток + MaintainChat |
| Минимизация outbox/logs | Нет текста, прежнего имени, удалённого recipient или cursor в диагностике | Синтетические маркеры отсутствовали в hints/собранных логах; removed recipient отсутствовал |
| Целевые тесты кандидата | Storage parity в памяти, overflow/cancel/clone/rollback, bounded retry, скрытые голоса, card/worker updates, no-op, epoch/expiry | 28 тестов верхнего уровня, включая 5 собственных, прошли с `-race`; полный список в result.json |

Основные собственные probes проверяют наблюдаемое поведение через service,
storage port либо настоящий HTTPS. Статическое чтение само по себе не даёт pass.
Автоматический HTTP probe не объявляется ручным UI или клиентским recovery.

## Прогоны и evidence

- [run01](raw/run01.jsonl): service/memory probes прошли. HTTP listener был
  остановлен sandbox: `bind: operation not permitted`. Это ограничение среды,
  а не продуктовый failure; исходный raw сохранён.
- [run02](raw/run02.jsonl): тот же HTTPS probe с разрешённым loopback прошёл
  без изменения продукта. Обычные probes запускаются без race.
- [run03-race](raw/run03-race.jsonl): финальный целевой набор с добавленным
  независимым deletion/replay probe; все 28 тестов прошли, race detector не
  сообщил гонок. Продолжительность пакетов: meetings 1.518 с, memory 2.712 с,
  accounts 1.365 с, httpapi 1.607 с. Это время тестов, не latency SLA.
- [result.json](result.json) содержит фактические статусы, selectors,
  окружение и отсутствие изменённых source files. [checksums.json](checksums.json)
  фиксирует evidence и probes. Полные case IDs намеренно не объявлены passed.

## Ограничения и незакрытые действия

SQL независимо этим агентом не запускался. Родитель отдельно сообщил успешный
guarded SQL прогон точного `6aac61e8`: [внешнее engineering evidence](../2026-10-27-sync-storage-sql/run01/).
Это отдельный источник, не собственная независимая проверка удалённой БД.
Прежний SQL pass `b91ec8b` не переносится автоматически на новый кандидат.

Не проверены полный dispatcher/crash/restart delivery, Centrifuge/SDK,
клиентские merge/generation/outbox/anchor, read markers/readers/unread,
поддерживаемые реальные клиентские сборки, полный rollout/rollback binary,
EXPLAIN и SQL latency на 1k/10k/100k, p95/p99 и нагрузка 100 connections/5 msg/s.
Имеющиеся HTTP/source tests подтверждают только соответствующий поднабор.
TC-CHAT-SYNC-AA76CADB, BC07BEB1, F6CFB5E9, THROUGH, CAPABILITIES и
TC-CHAT-SECURITY-A3B3BFE7 включают действия вне этого среза. QA receipt и
qa:ready на целый feature не создавались; checkbox не менялись.

При статическом чтении отмечен вопрос для будущего dispatcher/нагрузочного
этапа: MaintainChat обрабатывает максимум 100 expired outbox rows за минутный
цикл. Устойчивость этого бюджета при пилотной интенсивности зависит от удаления
или подтверждения записей dispatcher. Нагрузочного подтверждения здесь нет;
это риск следующего этапа, не установленный runtime-дефект этого среза.

Все временные HTTPS servers завершены test cleanup; собственные memory данные
уничтожены вместе с процессами. Архивы в `/tmp` оставлены для воспроизведения.
Продукт, specs, cases, tasks, tokens, baseline и чужие evidence не изменялись.

Проверка оформления отчёта: `npm run agent:check` прошла
([log](raw/agent-check.log)); `git diff --check` и отдельный whitespace-check
всех новых файлов отчёта не обнаружили ошибок. Эти структурные проверки не
расширяют runtime-покрытие.
