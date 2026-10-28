# Read-only аудит полного backend-релиза: обращения и media

28.10.2026. Источники и SHA256: [release-gap-audit.json](release-gap-audit.json).
Продукт, prod и настройки доставки не изменялись. Этот аудит не закрывает
release gate и не входит в 24 случая технического чата.

## Обращения — незавершённая реализация 8.9

`backend/internal/server/support.go:31` явно блокирует поддержку на PostgreSQL.
Без параметров бота возвращается nil; `backend/internal/httpapi/support.go:27`
отвечает POST503 `support_unavailable`. При заданном боте запуск возвращает
`persistent support storage is not configured`. Просто добавить Telegram
credentials недостаточно. Это подтверждено кодом и существующим
`TestSupportConfigurationAndPersistentGate`, включённым в свежий обязательный suite.

Порт `support.Store` умеет транзакционно хранить обращение, receipt, rate и lease,
но реализован только memory.Support. В миграциях и PostgreSQL adapter нет
постоянной очереди обращений. `Records` содержит PruneRates, но не удаление
обращений по сроку; в модели есть CreatedAt, но политики удаления и фоновой
очистки принятого обращения нет. Memory-лимит 1000 записей/50MiB не заменяет retention.

До полного выпуска этого пути нужны: постоянный adapter и миграция с
идемпотентным receipt, восстановлением lease и прогресса доставки; cleanup по
подтверждённой политике; согласованная граница доверенного proxy для rate limit;
отдельный закрытый канал и операторский повтор; фактическая проверка
принятия → перезапуск → доставка/повтор без потери принятого обращения.
Наличие рабочего приватного Telegram-канала в этом аудите не проверялось.
Реальные сообщения не отправлялись. Срок хранения и условия передачи не
определяю: root подтвердил только реквизиты и страну.

## Media — постоянный adapter есть, полной runtime-приёмки здесь нет

`backend/cmd/server/main.go:70` передаёт
`meetings.WithMediaContent(db.MediaContent())` при PostgreSQL. `files.NewMedia()`
со временной директорией используется в memory-ветке. Migration003 создаёт
`meeting_media` для metadata и `media_blobs` для bounded bytea, FK ON DELETE CASCADE.
PostgreSQL adapter содержит Put/Get/Delete/Prune. Найденной причины объявить
media заведомо временным на PostgreSQL нет.

Прикладной путь резервирует metadata, сохраняет immutable blob вне транзакции,
затем повторно проверяет владельца и членство до фиксации uploaded. Чтение
проверяет текущее членство до и после чтения байтов. Cleanup удаляет
неопубликованные резервации после 24 часов, orphan blobs старше часа;
опубликованная история сохраняется. Эти интервалы относятся к media cleanup,
а не к ещё не определённым срокам поддержки.

Скан текущих postgres *_test.go не нашёл прямых проверок MediaContent,
media_blobs, PrepareMedia, UploadMedia, PublishMedia или MediaBytes. Отчёт
2026-10-27-journal-storage-engineering сохраняет «SQL media live сценарий не добавлен».
Нынешние 24 случая проверяют memory/http idempotent media lookup, но не
подтверждают полный SQL photo/file/album цикл. Для release остаются непроверенными
upload → publish → read после нового процесса, потерянный ответ и rollback,
revoke/delete и blob cascade/orphan cleanup, а также backup/restore именно media.
Их нельзя считать пройденными по наличию adapter или применению migration003.

## Граница вывода

Обращения на PostgreSQL — функциональный blocker полного заявленного набора.
Для media найдено существующее постоянное хранение; недостаёт прямой проверки
точного кандидата, а не доказан дефект adapter. Полный backend release также
требует точного артефакта и всех releaseProfiles: API, web desktop, web mobile,
iOS и Android. Этот аудит и 24-case feature run его не заменяют.
