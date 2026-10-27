# Android run03 — целевые проверки прошли

27 октября 2026. Somewhere_API_36 / emulator-5554, Android 16 / API 36.
Дизайн-система 1.4.1; native body 15, header info icon 22, emoji toggle 23.
Это инженерная проверка исполнителя, не независимая функциональная или визуальная приёмка.

## Результат

- TelegramChatUiTests: **4/4 PASS**, 0 failures/errors/skipped.
- ComposerEditingDeviceTests: **3/3 PASS**, 0 failures/errors/skipped.
- Изменённые QA приложение и instrumentation APK успешно скомпилированы. Повтор ICU использовал те же APK без изменений.
- Весь source snapshot после прогона сверён повторно: изменений нет.
- После результата только запущенный для задачи emulator-5554 штатно остановлен. Wipe, новые AVD и другие устройства не использовались.

UI-проверки подтвердили сохранение selection при открытии dock и поиске, замену
выделения, повторную вставку, возврат cursor к IME, Activity recreation, Back с
возвратом фокуса к emoji opener и скрытой IME. Также прошли существующий лимит
4000 codepoints, quick/full reaction с возвратом фокуса к opener, порядок даты и
количества в header, target heading не меньше 48 dp, actual-opener focus для
heading/info, одна шторка для info/settings/Share и сохранение черновика.

Проверки ICU прошли на реальном Android runtime: замена selection и повторная
вставка, удаление целых family ZWJ/skin modifier/flag/combining-mark/heart graphemes,
удаление обратного выделения и отсутствие удаления в начале строки.

## Точный кандидат и evidence

- Source aggregate SHA-256: `45a72cec3154c9135534f72e07cb467a1d3b6b822b7852bc02e4ca3a4ca878ff`.
- QA APK SHA-256: `74ceec478be40f4a90633c301b9b38e6fd6c47f23b3db3b0482725aeb4c36325`.
- QA test APK SHA-256: `23f354bc04f613d509cc2e532c1077e09b0b7966abf9943d14da340699a479b0`.
- [inputs.json](inputs.json): команды, fixture/DS/manifest hashes и реальные repo-relative пути сохранённых APK в игнорируемом `.cache`.
- [source-hashes.json](source-hashes.json): полный состав исходников.
- [results.json](results.json): фактические totals и время завершения.
- `chat.log.txt`, `chat/xml`, `chat/captures`: UI результаты; скопированы до следующего instrumentation run.
- `icu.log.txt`, `icu/xml`: независимый запуск трёх ICU тестов.
- `chat-raw-hashes.json`, `icu-raw-hashes.json`: пути/SHA raw reports и бинарных результатов в `.cache/qa/2026-10-27-telegram-chat/android-implementation/run03/`.
- `evidence-hashes.json`: хэши файлов этого отчёта.

## Границы результата

Первоначальные сборочные результаты и ошибки run01/run02 сохранены без
перезаписи. Полный check.sh на финальном focus-fix, широкие regression scopes,
низкая высота/large text и независимые design-review/feature-test этим целевым
прогоном не заменяются. Acceptance checkbox не менялись; deployment/commit/push
не выполнялись.
