# Независимая проверка realtime: обнаружены дефекты

Дата: 27.10.2026. Проверяющий: `/root/chat_sync_backend_review`.
Кандидат: `e794168085968b123e011844ac9b97539af54857`, база `6aac61e8`.
Результат: **failed**, два подтверждённых собственными probes дефекта.
Полный case/platform pass, qa:ready и receipt не выдавались.

## Источники и окружение

Прочитаны feature-test, root/backend AGENTS, protocol/tasks/testing и delta
specs/cases, изученные в предыдущей независимой проверке. Их hashes не изменились
от предыдущего снимка требований. Прочитано добавление backend AGENTS про
Centrifuge и exact delta 45 файлов относительно 6aac61e8.

Код извлечён через `git archive` точного commit в
`/tmp/chat-realtime-independent-e794`. [Source manifest](source-manifest.json)
фиксирует 356 source files и требования; повторное сравнение показывает **0
изменённых исходных файлов**. Добавлены только собственные tests в /tmp.

Go 1.27.2 darwin/arm64, `GOMAXPROCS=1`, `-p=1`. Memory fixtures содержат только
синтетические данные. WebSocket probe проходит реальный HTTP upgrade и masked
RFC6455 frames на отдельном loopback httptest server. Test cleanup остановил
сервер. Управляемое время dispatcher относится только к fixture; системные часы
не менялись. Production, БД, браузеры, эмуляторы и приложение не затрагивались.

## RT-01: обход лимита одной встречи после client unsubscribe

Приоритет: P2. Источник ожидания — protocol.md, раздел «Поток и восстановление»:
личный канал, выведенный сервером из сессии, и одна открытая встреча. Задача 3.1
требует серверных лимитов подписок.

В `backend/internal/realtime/adapter.go:40` общий `ClientChannelLimit: 2`
используется как единственное ограничение. `OnSubscribe` около строки 110
проверяет доступ, но не число meeting-подписок. Клиент может штатной protocol
командой удалить server-side personal subscription и освободить слот.

Воспроизведение в неизменённом кандидате:

1. Создать две встречи, доступные одному синтетическому пользователю.
2. Выполнить native Bearer WebSocket connect; сервер подписывает `personal:u`.
3. Отправить `unsubscribe` для `personal:u`.
4. Подписаться последовательно на `meeting:m` и `meeting:second`.

Ожидание: personal остаётся обязательным, число встреч не превышает одну.
Фактически unsubscribe и обе subscribe-команды вернули успешные ответы без
error. Это не обход прав чужой встречи: обе встречи разрешены. Нарушены
обязательная личная подписка и отдельный лимит открытой встречи.

Probe: `TestIndependentPersonalUnsubscribeCannotExpandMeetingLimit` в
[websocket_independent_test.go](probes/websocket_independent_test.go).
Raw содержит фактические protocol replies без authentication credentials.

## RT-02: наступивший retry deadline откатывает ACK всей пачки

Приоритет: P2. Источник ожидания — protocol.md, durable outbox/retry и задача
3.2: временный сбой должен повторять тот же event, успешная публикация должна
допускать conditional ACK. Повтор публикации допустим после crash, но обычное
истечение рассчитанного backoff не должно превращаться в invalid record.

В `backend/internal/meetings/chat_dispatch.go:71` время retry фиксируется сразу
после ошибки одного PublishChat. ACK выполняются после публикации всей пачки
(около строки 80). Memory и PostgreSQL `FinishChatHint` отклоняют непустой retry,
если он уже не строго позже нового `now`. Поэтому остальные публикации могут
сделать ранее допустимый retry невалидным.

Воспроизведение с двумя синтетическими terminal hints:

1. `a-fails` получает временную ошибку publisher; его retry установлен на 1–2 с.
2. `b-succeeds` публикуется успешно; fixture продвигает своё время на 2 с,
   имитируя завершившуюся работу внутри ещё действующей 30-секундной lease.
3. Dispatcher пытается подтвердить пачку.

Ожидание: transient failure сохраняется для retry, успешный event получает ACK;
обычное течение времени не даёт storage validation error.
Фактически: `Claimed=2 Published=1 Retried=1 Acknowledged=0 Deleted=0`, ошибка
`invalid storage record`. Вся ACK-транзакция не фиксируется; даже успешная
публикация остаётся под lease и повторится после восстановления. Проверка
использует управляемое время и не является latency benchmark серверного worker
с его отдельным двухсекундным context budget.

Probe: `TestIndependentRetryDeadlineElapsedInsidePublishBatch` в
[dispatcher_independent_test.go](probes/dispatcher_independent_test.go).
Дефект воспроизведён на memory adapter; одинаковая валидация обнаружена в SQL
adapter статически. Независимый SQL runtime этим агентом не выполнялся.

## Evidence и повтор

[run01.jsonl](raw/run01.jsonl) — первичный raw Go JSON: оба probes failed.
[result.json](result.json) фиксирует фактический результат; hashes evidence и
probes находятся в [checksums.json](checksums.json).

Для воспроизведения скопировать два сохранённых probe files в packages
`backend/internal/realtime` и `backend/internal/meetings` точного архива под
именами `independent_review_test.go` и `independent_dispatch_review_test.go`.
Команда из backend архива:

```sh
GOMAXPROCS=1 GOCACHE=/tmp/chat-bounded-go-cache \
  /Users/misha/.local/share/somewhere/go-1.27.2/bin/go test \
  -p=1 -count=1 -json ./internal/meetings ./internal/realtime \
  -run '^TestIndependent'
```

Старые raw/probes сохраняются неизменными. Исправление требует нового commit,
нового manifest и нового прогона этих regression probes. По указанию родителя
дальнейший независимый runtime отложен до исправления, чтобы освободить слот
исполнителю. Продуктовый код/specs/cases/tasks не менялись.

Родитель отдельно сообщил PASS девяти guarded SQL tests кандидата e794168:
[внешнее engineering evidence](../2026-10-27-realtime-storage-sql/run01/).
Это не отменяет находки и не является собственным независимым SQL запуском.
Полный SDK/client recovery, dispatcher capacity/latency, proxy failures,
read state и полные case/platform gates этим коротким проходом не проверены.
