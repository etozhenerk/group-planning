# Независимая повторная проверка Android lost-insert fix

Ревьюер `/root/ios_album_independent`, 29.10.2026. Применён `feature-test`; узкий non-UI проход исправления P2. **Вердикт: PASS в указанном scope. Исходный дефект устранён.** Полная приёмка альбома, UI и задача3.3 этим отчётом не закрываются.

## Исходный дефект и результат

Первоначальный FAIL сохранён без изменения в `../2026-10-29-android-pending-independent/`. Из этого же каталога, без редактирования, заново скомпилирован `harness/AlbumIndependentFaultTests.kt`. Его SHA до/после совпадает.

`lostInsertReplyMustNotEraseRecoveryIntent` снова выполнялся через proxy поверх настоящего MediaStore: insert создаёт pending запись, но клиент получает null вместо URI. Теперь `discard()` удаляет запись по durable UUID до очистки журнала; повторный recovery безопасен. Исходный assert прошёл. Состояние зафиксировано в `original-repro-state.log`, результат instrumentation — `original-repro.log`.

Изменение `MediaStoreAlbumOperation.kt:94–98` вызывает `rows.recover(record)` перед `journal.clear()`. При ошибке query/delete/контрольного query до clear выполнение не доходит; close освобождает lock, ошибка передаётся вызывающему. Предикаты `AlbumMediaStoreRows.kt:72–106` не расширены: UUID, владелец, путь, ID и pending повторяются в DELETE. Контрольный query на строках47–49 препятствует ложному успеху при DELETE=0 и оставшейся записи. Committed ветка по-прежнему пропускает discard.

## Реально повторённые проверки

| Проверка | Результат |
| --- | --- |
| Потерянный URI: штатная регрессия | PASS: pending удалён до journal clear |
| Recovery query бросает ошибку | PASS: intent и pending сохранены, lock освобождён; следующий recovery удаляет запись |
| DELETE возвращает0 при существующей записи | PASS: intent сохранён по результату повторного query, lock освобождён; следующий recovery успешен |
| Published/foreign predicates | PASS: опубликованные bytes сохранены; неверные UUID/owner/path не удаляют контрольную запись |
| Активный lock и malformed journal | PASS: cleanup не удаляет pending до устранения причины |
| Исходный независимый lost-insert воспроизводитель | PASS, без изменения теста |
| Публикация между recovery query и DELETE | PASS: опубликованная запись/bytes сохранены, повтор recovery безопасен |
| Journal cleanup failure после полного publish | PASS: SavedCleanupPending с savedCount2 и причиной, обе public копии/bytes сохранены, lock освобождён |

Итого **8/8 device checks PASS**,0 failures. Первые5 выполнены точным штатным QA test APK, следующие3 — независимо пересобранным исходным harness против того же frozen app APK. Новый собственный app APK был собран как зависимость test APK, но не устанавливался. Код продукта на устройстве всё время соответствовал frozen app SHA из receipt.

Защита посторонних записей проверена предикатами на собственных synthetic control URI с неверными UUID/owner/path; настоящий чужой пользователь/приложение и его данные не использовались. Полные3 сценария force-stop/restart, unit suite, Release/Lint и общий gallery E2E в этом узком повторе не запускались; их прежние PASS не пересчитаны как сегодняшние результаты. Не заявляется атомарность между Binder batches100/101.

## Артефакты, окружение и очистка

До и после совпали **14/14 source hash и4/4 frozen APK hash** автора. Source manifest SHA `c59d319afd765e307a89690aa6e1a5a04ce05ed7a21233e3ca99e2a076344a93`. QA app SHA `1d4c893c55a814344ab35c8c703b4cbe308d65e7b7f985da32750755247cc789`; штатный test APK SHA `5dcb78c3ac8183527f690a642a1cd507dc2a713de6602fc1e4cfa8b5cd670366`. Подробности — `receipt.json`, `source-before/after.json`, `artifacts-before/after.json`.

JDK17.0.21, SDK36, единственный выбранный QA `emulator-5554` API36; package `dev.groupplanning.android.uitesthost`. Отдельные build outputs — локальный `gradle-build/`, исключённый из Git. Изменений продукта, штатных тестов, cases, эталонов, manifest и checkbox нет. Исходные материалы прежнего FAIL не перезаписывались.

Synthetic URI/private namespaces очищены finally каждого теста. После прохода QA процесс остановлен, штатный frozen test APK восстановлен (`restored-qa.log`). Настройки/данные обычного somewhere, фотографии пользователя и физическое устройство не затрагивались. Эмулятор свободен для следующего UI-прохода.

API29 и API26–28 runtime, физическое устройство, power loss, системные разрешения UI и полный feature/design/release gate остаются вне scope. Проверка относится к перечисленным неизменным inputs и артефактам.
