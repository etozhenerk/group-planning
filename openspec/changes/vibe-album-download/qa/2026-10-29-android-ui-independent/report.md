# Android: независимая проверка сохранения альбома UI4.1

**Вердикт: 7/7 выполненных проверок PASS; полная функциональная и дизайн-приёмка остаётся открытой.** В выполненном объёме подтверждённого дефекта продукта не найдено. Это не разрешение на общий checkbox или релиз.

## Кандидат и независимость

Ревьюер `/root/ios_album_independent`; MAIN. Установлены точные сохранённые QA APK автора без пересборки. Хэши APK, 18 UI-входов и 557 Android source/config входов проверены до и после. Все совпали; 5 сохранённых APK также неизменны. Общий design inputHash до/после: `d732edef46139781e4611e66151404b55f7a6e41c51f02f74678dea3ce5f4701`.

Отчёт автора использован для запуска; его unit188, Debug/Release/Lint и recovery результаты не подменяют этот проход. Исходники, тесты, эталоны, manifest, cases и tasks не изменены. Runner основан на штатном read-only скрипте: собственный локальный Go HTTPS memory fixture, точные APK, отдельный evidence путь. Никаких Telegram-сообщений или production данных.

## Выполнено на работающем приложении

`run-album-download-65420/instrumentation.log`: **7 tests, 0 failures,29.055s**.

1. Три полноэкранных `AlbumDownloadUiTests`: соседние действия и доступное имя «Сохранить все фото»; сохранение на выбранном2/3; удержанная подготовка, отмена и уход Back; реальная ошибка snapshot и явный повтор.
2. Два `AlbumActionLayoutTests`: контейнер320dp, LocalDensity fontScale1 и1.8; равные кнопки и сохранение высоты idle/preparing/saving; disabled после передачи системе; callbacks permission/retry/partial; empty без save. Это тест компонента, **не полный экран320 или системный крупный шрифт**.
3. Два соседних `ExperienceUiTests`: свайпы влево и вправо переходят к следующему фото,3→1; не открывают fullscreen; индекс переживает recreation и grid/Back. Для одного фото свайпы не открывают fullscreen, tap открывает.

В двух успешных операциях тест реально прочитал по3 новых MediaStore записи через ContentResolver: count совпал со snapshot, IS_PENDING=0, имя содержит snapshot ID, SHA256 содержимого совпал с оригинальными network bytes. QA probe задерживает/отклоняет snapshot и измеряет ответ, но не заменяет MediaStore адаптер. Поэтому вывод о записи основан не только на надписи «Фотографии сохранены».

При отмене и уходе во время подготовки набор собственных записей равен baseline даже после отпускания позднего ответа. Cleanup теста удаляет только разницу собственных QA URI относительно `before` с owner QA и `Pictures/somewhere/`; старые/чужие записи не входят в predicate. Отдельного post-cleanup запроса галереи после suite не было; дополнительный blanket cleanup не выполнялся.

## Визуальная сверка и геометрия

Просмотрены живые ready/preparing/saved/error PNG, снимки компонентов и запись взаимодействий с contact sheet. Сопоставлены опубликованные ready/preparing/partial reference390×844; root-assisted provenance находится в отдельном JSON. Эталоны не изменены. Actual использует360×800dp и synthetic gradients вместо фото reference — pixel-equivalence не заявляется.

На полном экране две кнопки имеют равные top/height/width, не пересекаются, иконка сохранения отцентрована. На actual360dp номинальные размеры48dp height/156dp width/gap8dp соответствуют опубликованной роли; geometry assertions сравнивают фактические semantics bounds. Подготовка сохраняет top фотографии и размеры кнопок, выбранный индекс2/3 остаётся. При крупном тексте компонент переносит строки внутри слов, но текст не обрезан; снимки компонента без полного screen inset не считаются дефектом настоящего экрана.

Есть известная неоднозначность эталона: вложенный `<p>` получает muted из общего CSS вместо наследования error родителя. Native показывает published error color. Это конфликт render reference с token, а не основание произвольно перекрасить приложение. Строгое совпадение error/partial не принято.

Окружение: emulator-5554, Android16/API36,BE2A.250530.026.F3,720×1600px,density2,360×800dp,fontScale1,Roboto/NotoColorEmoji,ru-RU,Europe/Moscow. Полные capture JSON рядом с PNG. **`animatorsEnabled=false`**, хотя window/transition scale1; настройки не менялись. Запись подтверждает переходы и порядок действий, но не качество нормальных анимаций. Системная large-font/reduced-motion ветка существующего теста намеренно skipped без разрешения на Android settings; компонентная LocalDensity1.8 выполнена.

## Границы по raw cases

- `TC-VIBE-EXPORT-GALLERY`: фактическая запись3+3 оригиналов, сохранение индекса, отмена/ошибка/повтор — пройдённый поднабор. Полный экран320/крупный текст, API26–28 permission/Settings-return, реальная задержка записи, diskfull/save-error/partial остаются непроверенными.
- `TC-VIBE-EXPORT-ALL`: baseline3фото подтверждён; >100,EXIF/mixed aspect,duplicate names и изменение snapshot во время операции в UI не проверялись.
- `TC-VIBE-EXPORT-ACCESS`: live logout/revocation/foreign export не проверены.
- `TC-VIBE-EXPORT-RECOVERY`: не перезапускался этим проходом; старый независимый recovery отчёт сохранён отдельно, сюда не переносится.
- TalkBack и нормальные анимации остаются непроверенными.

Все11 Android state entries в `design-scoped-review.json` честно оставлены blocked для полной дизайн-приёмки с конкретными выполненными наблюдениями. Источник блокировки — перечисленные непокрытые условия, а не изменение замороженных inputs. Никакие задачи/checklist не закрыты.

## Evidence и завершение

Собственный `run-ui.sh`, лог instrumentation, PNG+capture metadata, motion-contact, исходная mp4 (локальный ignored файл), source/artifact before-after JSON и reference provenance сохранены здесь. Полные кадры/rawvideo не являются самостоятельным pass. Fixture и adb reverse очищаются собственным runner; обычное приложение, пользовательские данные, физический телефон и глобальные настройки не затрагивались. Подробные результаты технической валидации — в отдельных логах после подготовки отчёта.

Финальная валидация: `design:inspect-report` exit0 (отчёт blocked, не gate PASS), `agent:check` PASS, scoped `git diff --check` PASS. После проверки выполнен force-stop только QA package на emulator-5554. Слот освобождён.
