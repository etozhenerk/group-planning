# Инженерная проверка Android — 27 октября 2026

Это проверка исполнителя, не независимая функциональная или визуальная приёмка.

Исходники: `1f899c9ba4202468ecc6e2551935c29a7358441403e0c51661506e62938bb14e`; полный состав — `source-hashes.json`.
Дизайн-система: 1.4.0. Точные хэши токенов, манифеста и APK — `receipt.json`.
Все пути артефактов в receipt указаны относительно корня репозитория.
APK сохранены в `.cache/qa/2026-10-27-telegram-chat/android-implementation/artifacts/`;
бинарный вывод Gradle — в `.cache/qa/2026-10-27-telegram-chat/android-implementation/unit-results/binary/`.
Эти каталоги игнорируются Git. XML-отчёты тестов лежат рядом с этим документом в `unit-results/`.

## Выполнено

- `scripts/check.sh`: toolchain JDK17 / SDK36, clean выполнен на этапе check-3.
- После исправлений запущены все проверки скрипта на финальных исходниках без повторного clean: `formatCheck`, Debug/Release APK, `lintDebug`, `lintRelease`, `testDebugUnitTest`, Debug instrumentation APK — PASS, `check-4.log.txt`.
- QA APK и QA instrumentation APK — PASS, `check-5-qa.log.txt`.
- 126 JVM-тестов, 31 suite: 0 failures/errors/skipped.
- Lint: 0 ошибок, 0 предупреждений; 21 hint. Baseline и suppressions не добавлены.
- `git diff --check -- frontend/android`, `sh -n frontend/android/scripts/test-ui.sh` — PASS.

## Ожидает запуска

- Эмулятор и UI в этом окне не запускались. Доступен только разрешённый `Somewhere_API_36` / `emulator-5554` после отдельного окна; Pixel_10a / emulator-5556 не затрагивался.
- Новые ComposerEditingDeviceTests проверяют Android ICU grapheme deletion; TelegramChatUiTests проверяют cursor/selection, повторную вставку, восстановление, лимит4000, reactions и возврат в одном sheet. Они скомпилированы, но ещё не выполнены.
- Targeted runner: `sh scripts/test-ui.sh chat`; прежние формы/права/ошибки/retry — существующие scopes experience/polls/places/tasks/covers.
- Нужна независимая design-review и feature-test по актуальным cases. Tasks checkbox не менялись.

## Результат реализации

Dock эмодзи расположен под composer; быстрые/полные реакции привязаны к сообщению; список людей с фильтрами отделён. Информация, настройки и Share используют одну шторку с возвратом. Формы имеют прокручиваемое содержимое и закреплённые кнопки. Сохранены полный каталог эмодзи, пять настроек дат, права и реальные controllers/API, draft/retry и обложка. Icons реализованы ImageVector с размерами из токенов; legacy-инвентарь не расширялся.

Во время будущей живой проверки отдельно проверить очень низкое окно с IME и большим шрифтом: ограничение реакции областью ленты, достижимость search/category/results и восстановление фокуса после popup/sheet.
