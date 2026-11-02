# Независимая проверка Android pending recovery · 29.10.2026

Ревьюер `/root/ios_album_independent`; `feature-test` и code review, non-UI scope. **Вердикт: needs-fixes, один воспроизведённый P2.** Task3.3 и общая приёмка пользовательского сохранения не закрыты.

## P2: потерянный ответ insert уничтожает возможность recovery

Файл `frontend/android/app/src/main/java/dev/groupplanning/android/data/album/MediaStoreAlbumOperation.kt`, строки83–95 (`discard`), связанный участок34–37 (`rows.insert` → `created += uri`).

Если MediaStore создал pending запись, но клиент не получил URI, `rows.insert` возвращает ошибку, а `created` не содержит эту запись. Затем `discard()` обходит только `created`, считает очистку успешной и удаляет `active.json`. Сама pending запись остаётся. Следующий `recoverPending()` не видит intent и тоже не удаляет её. Это потеря учёта собственной незавершённой записи, хотя UUID был корректно записан до insert.

Независимое воспроизведение на реальном MediaStore API36:

1. Создать собственные private journal/UUID и записать Preparing.
2. QA ContentProvider proxy делегирует insert реальному MediaStore, сохраняет URI только для контроля и cleanup, но возвращает клиенту null, моделируя потерянный ответ.
3. Реальный `MediaStoreAlbumOperation.stage()` падает до `created += uri`.
4. Вызвать реальный `discard()`, затем реальный `MediaStoreAlbumGallery.recoverPending()`.
5. Actual: `afterDiscard=true intentRemains=false afterRecovery=true`; собственная строка остаётся pending. Expected: очистка по UUID либо сохранённое намерение для следующего recovery. Проверочный assert падает.

Evidence: `lost-reply-run.log`, `lost-reply-state.log`; воспроизводитель — `harness/AlbumIndependentFaultTests.kt::lostInsertReplyMustNotEraseRecoveryIntent`. Synthetic URI удалён в finally независимо от падения assert. Сам MediaStore не убивался: имитировалась только потеря ответа поверх фактической записи. Такой null допускается [официальным контрактом ContentResolver.insert](https://developer.android.com/reference/android/content/ContentResolver#insert(android.net.Uri,%20android.content.ContentValues)), в том числе при аварии provider.

Направление исправления: перед очисткой журнала подтвердить отсутствие всех собственных pending по durable UUID, включая не попавшие в `created`; при неоднозначном/неудачном cleanup оставить intent. Не расширять predicates и не удалять чужие/публичные recovery записи. Продукт ревьюером не исправлялся.

## Что проверено независимо

До запуска совпали все **19/19 исходных hash** и **4/4 исходных APK hash** автора. Проверен код journal/lease/record, begin/recovery, SQL guards, publish/discard и вызывающий repository; требования и raw `TC-VIBE-EXPORT-RECOVERY` прочитаны.

| Проверка | Независимый результат |
| --- | --- |
| Album unit suite | 14 PASS:9 repository,4 journal,1 private temporary cleanup;0 failed/errors/skipped |
| Frozen QA predicates/lock | 2 PASS на emulator-5554 |
| Три реальных force-stop/restart | 3 PASS: pending,100из101 published, все published до commit; повторный recovery идемпотентен |
| Frozen gallery regression | 2 PASS: original bytes/EXIF6, pending/publication, committed discard no-op, failed stage cleanup |
| Дополнительный fault: publish между query и DELETE | PASS: реально опубликованная в этом окне строка и её bytes сохранены, повтор recovery безопасен |
| Дополнительный fault: all published → journal clear failure | PASS: SavedCleanupPending, savedCount2, причина сохранена, discard не удаляет2 личные копии, journal lock освобождён |
| Дополнительный fault: insert committed → URI reply lost | FAIL, P2 выше |

Три seed instrumentation процесса намеренно прерваны force-stop; их ошибки завершения не считаются PASS. Завершённые restart assertions в `adapter/*-restart.log` — доказательство результата нового процесса. Всего9 успешных device checks и1 failing fault check; авторские182unit/Release/Lint не выдаются за независимо повторённые.

## Code review

- `AlbumPendingJournal.acquire` использует exclusive file lock; обычная активная операция получает Busy. Канал закрывается при неудачном acquire.
- `AlbumPendingLease` читает максимум4097 байт, отклоняет размер>4096, неверную схему/версию/UUID и symlink; ошибка read происходит до MediaStore cleanup. Запись fsync+atomic move без неатомарного fallback. Полная потеря питания не проверялась и не обещается.
- `AlbumMediaStoreRows.delete` повторяет `_id + UUID prefix + package owner + relative path + IS_PENDING` в самом SQL DELETE. Независимый race-тест подтвердил защиту уже опубликованной записи после первоначального query.
- Recovery сохраняет public copies при kill, включая границу100/101; общей атомарности альбома нет. При живой ошибке до завершённого publish обычный rollback может удалять собственные частично опубликованные URI — это явно зафиксировано в текущем Android design/documentation и не выдано за crash recovery.
- `SavedCleanupPending` устанавливается после `committed=true`; repository не теряет тип ошибки, finally вызывает безопасный committed discard. Это подтверждено fault injection после реального MediaStore publish.
- **Пробел выше находится в живом rollback при неизвестном URI**, а не в уже пройденном force-kill восстановлении. Чистые штатные тесты его не покрывали.

## Окружение, границы, очистка

JDK17.0.21, Gradle8.14.3, Android SDK36; единственный выбранный `emulator-5554` API36. Package только `dev.groupplanning.android.uitesthost` и его `.test`. Обычный somewhere, личные фотографии и другие устройства не трогались; настройки эмулятора не менялись.

Первый реальный набор использовал точные frozen APK автора с `SOMEWHERE_ALBUM_SKIP_BUILD=true`; SHA проверены. Для дополнительных fault-тестов собственный Gradle init добавил только QA harness из этого каталога; buildDirectory изолирован здесь в `gradle-build/`. Продукт, штатные тесты, source hash, cases и manifest не изменялись. Первые два fault-теста прошли до добавления третьего воспроизводителя в тот же harness; полный финальный APK с третьим тестом сохранён локально с hash. Исходные авторские APK не перезаписывались.

QA harness и fixture удаляют только известные synthetic URI и собственные journal namespaces. После проверки QA процесс остановлен, исходные frozen QA APK восстановлены (`restored-qa.log`). Образ эмулятора/данные приложения не сбрасывались. Сессии сборки завершены.

API29 runtime, API26–28, физическое устройство, power loss, reinstall/app-data-clear, новый UI и его тексты/permission flow не проверялись. Нельзя закрывать общий feature-test или UI checkbox этим non-UI отчётом.

Подробные результаты: `unit-results/`, `adapter/`, `harness-run.log`, `lost-reply-run.log`. `source-hashes-before.json`/`source-hashes-after.json` фиксируют неизменность scope. Крупные собственные build outputs исключены из Git локальным `.gitignore`, их SHA сохранены.
