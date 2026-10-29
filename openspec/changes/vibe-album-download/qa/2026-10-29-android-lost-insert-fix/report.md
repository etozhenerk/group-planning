# Android: исправление потерянного ответа insert · 29.10.2026

Автор `/root/android_recovery_finish`. **Авторские проверки PASS; требуется
повторная независимая проверка.** UI, общая задача3.3 и release gate не закрыты.
Первоначальный независимый FAIL сохранён без изменений в
`../2026-10-29-android-pending-independent/`.

## Изменение

В `MediaStoreAlbumOperation.discard()` после очистки известных URI выполняется
`rows.recover(record)` перед удалением private journal. Поэтому успешный insert,
ответ которого потерялся, обнаруживается по durable UUID. Прежние предикаты
package owner, path, UUID и pending применяются в query и самом delete.
Опубликованные неизвестные recovery записи не удаляются. Известные URI текущей
живой операции по-прежнему проходят прежний rollback.

Ошибка recovery сохраняет intent, а закрытие lease освобождает lock. Следующая
операция может повторить очистку. Уже committed операция по-прежнему не удаляет
сохранённые личные копии при ошибке private journal cleanup.

Добавлены три регулярные instrumentation-регрессии в
`AlbumDiscardRecoveryDeviceTests`; штатный `scripts/test-album-recovery.sh`
выполняет их вместе с predicates/lock проверками.

## Проверки

| Проверка | Результат |
| --- | --- |
| Kotlin formatCheck | PASS |
| Unit suite | 182 PASS,0 failures/errors/skipped; XML в `unit-results/` |
| QA и QA AndroidTest сборки | PASS |
| Debug/Release сборки, lintDebug/lintRelease | PASS;0 errors/warnings,22 информационных version hints на вариант |
| Потерянный URI после реального insert | PASS: discard удаляет pending до очистки journal |
| Ошибка recovery query | PASS: intent сохранён, lock освобождён; следующий recovery удаляет pending |
| DELETE возвращает0 при оставшейся записи | PASS: повторный query не даёт стереть intent; следующий recovery успешен |
| Активный/повреждённый journal и guarded delete | 2 PASS |
| Force-stop/restart | 3 PASS: pending,100из101 published, все published до commit; повтор recovery безопасен |
| Gallery bytes/EXIF6/publication и failure rollback | 2 PASS |
| Неизменённый независимый fault harness | 3 PASS, включая исходный `lostInsertReplyMustNotEraseRecoveryIntent` |
| Повтор трёх новых регрессий на финальном штатном QA APK | 3 PASS |
| agent:check и diff --check | PASS |

Итого13 разных device checks и повтор3 на финальной QA-сборке. Три seed процесса
в force-stop runner ожидаемо прерываются; PASS относится к завершённым assertions
нового процесса. `original-run.log` — авторский повтор исходного независимого
теста, а не новая независимая приёмка.

## Артефакты и границы

Изменены только три Android paths: `MediaStoreAlbumOperation.kt`, новый
`AlbumDiscardRecoveryDeviceTests.kt`, `test-album-recovery.sh`. Остальная основа
унаследована от предыдущего автора. `owned-files.txt` и `source-hashes.json`
фиксируют14 Android recovery source/doc paths. Общие testing/specs/manifests
параллельно ведёт корневой агент; они не входят в этот узкий source receipt.

После Debug/Release/Lint корневой агент добавил generated token
`component.button.borderWidth`; recovery его не использует. Финальные QA и
QA AndroidTest пересобраны с текущими токенами и повторно прошли3 регрессии.
Debug/Release артефакты зафиксированы как проверенные до этой публикации;
полного current-UI pass здесь нет. Четыре APK и их SHA256 — в
`artifact-hashes.json`; локальные копии `artifacts/` исключены из Git.

Устройство только `emulator-5554` API36, пакеты только
`dev.groupplanning.android.uitesthost` и `.test`. Настройки и данные обычного
somewhere не менялись. После дополнительного harness восстановлен штатный
QA test APK; все собственные synthetic rows/journals очищены в finally,
QA-процесс остановлен. Не проверялись API29/API26–28, физическое устройство,
power loss, новый UI или системные разрешения нового UI.
