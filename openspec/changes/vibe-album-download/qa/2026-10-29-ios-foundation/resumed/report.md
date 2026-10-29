# iOS album foundation: возобновлённая проверка

29 октября 2026. Сохранённый patch восстановлен после `git apply --check`; все22 исходных hash совпали. Исправление trailing-slash из паузы теперь проверено. Task3.2 остаётся открытой: UI, настоящая Photos, независимая приёмка и платформенный сценарий ещё не завершены.

## Проверено

- Чистая simulator-сборка и16 прежних узких тестов прошли. Включён ранее не запускавшийся тест cleanup/symlink: чужой target не удаляется.
- Дополнительно проверен настоящий `URLSession.bytes` adapter через существующий локальный URLProtocol: неизменность байтов, ошибочный MIME, короткий/слишком длинный ответ, отмена underlying request. Нет HTTP-запросов во внешнюю сеть. Эти проверки находятся в расширении прежнего serialized suite, чтобы не гоняться за его общим fixture.
- Добавлен401 для file-download пути: сессия/credentials/private state очищены;403, logout/late response и fixed access epoch уже покрыты.
- Итог: **20/20 unit в5 suite, Xcode analyze PASS**, exit0. Swift-format strict, scoped git diff --check и npm run agent:check прошли. Финальный xcresult подтверждает20 pass,0 fail,0 skipped,0 runtime warnings. Snapshot103 фото сохраняется единым вызовом fake library, новые фото после начала не включаются. Отмена/ошибка/отзыв до commit очищают temp и не вызывают сохранение; отмена после начала commit ждёт результата.
- Производственные исходники не менялись относительно восстановленного patch; добавлены только4 проверки. Предыдущие11pass/4fail и остановленный runner остаются историей в соседнем отчёте, а не текущим результатом.

## Границы результата

Функция ещё не подключена к UI. Add-only PhotoKit adapter с одним performChanges скомпилирован, но настоящая галерея/системный permission dialog/реальные крупные фото и atomicity на устройстве не проверялись. Идемпотентность здесь ограничена повтором последнего успешного operationID на том же экземпляре сервиса; гарантий после перезапуска процесса нет. Для UI остаётся подключение состояния подготовки/финального commit и согласованного сценария. Ошибка cleanup содержит savedCount, чтобы не повторять уже успешное сохранение вслепую.

Обычное приложение, физический iPhone, его checkpoint-бандл и прежние DerivedData/TestDerivedData/UITestDerivedData не трогались. Все проверки шли в AlbumFoundationBuild с `dev.groupplanning.ios.unittesthost`; simulator settings не менялись. Собственный runner завершён, lock освобождён.

## Handoff

- `ios-source-files.txt`:23 owned source/config/test файла.
- `source-hashes.json`: freeze для независимой проверки.
- `bundle-hashes.json` и `receipt.json`: точный тестовый bundle и команды/результаты.
- `evidence/test-summary.json`, `evidence/unit-outcomes.log`: автоматические evidence.
- xcresult: `frontend/ios/.build/AlbumFoundationTests-20261029-final.xcresult`.

Прошу независимую проверку non-UI foundation через root. Тестирование не заменяет feature-test/design-review реальной кнопки и сохранения в Photos; checkbox и release-ready здесь не выставлялись. Commit/push не выполнялись.
