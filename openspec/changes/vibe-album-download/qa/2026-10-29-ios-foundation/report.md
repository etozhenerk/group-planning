# iOS album download — paused foundation checkpoint

Дата: 29 октября 2026. Пользователь попросил паузу; новые прогоны остановлены.
Task 3.2 остаётся открытой. Это изолированная **non-UI foundation**, а не готовая функция.
Кнопок, экранов, токенов и manifest UI здесь нет. Физический iPhone и настоящая Photos не использовались.

## Реализация

- Полный `memories/snapshot`, обязательный `next_cursor: null`; фиксируется набор фото на начало операции.
- Проверяются meeting/purpose/status, уникальные ID, тип JPEG/PNG/WebP, размер фото до 10 MiB и сумма до 1 GiB.
- Приватные binary requests строятся на настроенном HTTPS API origin, независимо от download_url из ответа; cookies/cache/redirect отключены. HTTP status, MIME, длина заголовка и фактический размер проверяются до/во время записи.
- Оригинальные байты последовательно пишутся чанками до 64 KiB. UIImage/JPEG-перекодирования нет. Файлы находятся в отдельной папке с правами 0700/0600, complete protection и исключением из backup.
- SessionStore сохраняет прежний in-flight cancellation/401/403 путь; SessionAlbumSource держит исходный access lease на всю операцию, проверяет его после ожиданий и повторно запрашивает meeting перед commit.
- Add-only PhotoKit adapter делает один performChanges для всех ресурсов. После его начала сервис ждёт completion, затем чистит temp; поздняя отмена не выдаётся за отмену уже переданного Photos сохранения.
- Один активный экспорт на процесс; повтор успешного operationID не создаёт копии. Ошибка cleanup содержит savedCount, чтобы UI не предлагал слепо повторить уже успешное сохранение.

## Проверки и ограничения

- swift-format strict прошёл для новых production-файлов, SessionStore и первоначального набора тестов. Последний отдельный cleanup-тест отформатирован.
- Первая параллельная build оказалась промежуточной: AlbumFileBuffer появился после построения списка файлов, поэтому она не является итоговой проверкой.
- Следующий `clean test` в **.build/AlbumFoundationBuild** скомпилировал приложение и тесты. 15 тестов: **11 pass, 4 fail / 6 issues**. Точный вывод сохранён в `evidence/initial-unit-outcomes.log`.
- Падения нашли реальный дефект проверки owned directory: URL родительской папки отличался завершающим слешем. Исправлено хранением канонических path. После исправления повтор не запускался: пользователь попросил паузу. Добавленный тест cleanup/symlink также ещё не запускался. **Текущий exact source hash не имеет зелёного прогона.**
- После завершения тестов Xcode завис на финализации результата. Только наш PID50759 остановлен SIGINT, затем TERM; shell завершился143, simulator lock освобождён trap. Этот `.xcresult` не считается завершённым receipt.
- Не проверены реальный PhotoKit permission/save/atomicity, большие реальные альбомы, нехватка диска, галерея на устройстве и UI-переходы. В сервис ещё нужно подключить UI-состояния подготовки/финального commit; сейчас он возвращает итоговый count.
- Старые .build/DerivedData, TestDerivedData, UITestDerivedData и принятый UI-кандидат не менялись. Simulator settings не менялись.

## Продолжение

1. Повторить narrow clean test для AlbumDownloadTests, AlbumFileBufferTests, SessionAlbumSourceTests, AlbumTemporaryFilesTests и URLSessionTransportTests в отдельной AlbumFoundationBuild; добавить `-collect-test-diagnostics never` и новый resultBundlePath. Пока scope не расширять.
2. Если всё зелёное — независимая проверка foundation, затем публикация согласованного UX и интеграция UI/стадий, отдельно ручная проверка настоящей галереи.
3. Не переносить этот checkpoint в физическую сборку как принятую функцию и не закрывать task3.2.

## Источники и файлы

Apple: [URLSession bytes](https://developer.apple.com/documentation/foundation/urlsession/bytes(for:delegate:)), [Photo library authorization/changes](https://developer.apple.com/documentation/photos/phphotolibrary), [Asset resource creation](https://developer.apple.com/documentation/photos/phassetcreationrequest).

Ownership: `ios-source-files.txt`; точные текущие SHA-256: `source-hashes.json`. Полный временный лог: `/tmp/somewhere-album-foundation-tests.log`. Незавершённый результат: `frontend/ios/.build/AlbumFoundationTests-20261029.xcresult`.

## Сохранение при паузе

Все 22 исходных/config/test файла сохранены в `paused-foundation.patch`.
Проверены обратная применимость к рабочему состоянию и прямая применимость к HEAD;
после этого незавершённые файлы убраны из собираемых исходников.
Восстановление: `git apply openspec/changes/vibe-album-download/qa/2026-10-29-ios-foundation/paused-foundation.patch`.
Повтор тестов после исправления trailing slash ещё обязателен.
