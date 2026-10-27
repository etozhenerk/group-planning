# Android run04 — полный check.sh прошёл

27 октября 2026. Финальные исходники DS 1.4.1 с исправлениями header и focus.
Это инженерная проверка исполнителя, не независимая визуальная или функциональная приёмка.

## Выполнено

Из frontend/android выполнено `sh scripts/check.sh` с JDK 17.0.21+9 и Android SDK36.
Команда завершилась с exit0; полный вывод сохранён в [check.log.txt](check.log.txt).

- Toolchain, clean и formatCheck — PASS.
- Debug и Release APK — PASS.
- lintDebug и lintRelease — PASS: 0 errors, 0 warnings; по21 информационной подсказке.
- testDebugUnitTest — PASS: 126 тестов, 31 suite; 0 failures/errors/skipped.
- Debug instrumentation APK — PASS.
- Отдельные QA APK и QA instrumentation APK — PASS.
- Эмулятор, UI и инструментальные тесты не запускались. Продуктовые исходники не менялись.

## Точный кандидат

Source aggregate SHA-256 до и после проверки:
`45a72cec3154c9135534f72e07cb467a1d3b6b822b7852bc02e4ca3a4ca878ff`.
Он совпадает с успешным целевым UI/ICU run03; перечень файлов — [source-hashes.json](source-hashes.json).

Чистая сборка дала новые APK hashes. QA приложение:
`b331991803517ad3e4c023265eab9126a499477a870c85f3dcbfb6910c7e940d`.
QA instrumentation:
`074c8b169e49ff0710ff251ff40d589655371086d26e191870aa8cb50a9f821a`.
Все пять APK, их реальные repo-relative пути и SHA — [receipt.json](receipt.json).
Они сохранены в игнорируемом `.cache/qa/2026-10-27-telegram-chat/android-implementation/run04/artifacts/`.
APK из run03 остаются на прежнем месте; байтовое сравнение ZIP entries — [apk-comparison.json](apk-comparison.json).
Все распакованные ZIP entries QA приложения и QA test APK побайтно совпадают с run03; отличается полный APK-контейнер. UI pass из run03 не приписывается новым APK; повтор UI без изменений исходников по поручению не выполнялся.

## Evidence и границы

[inputs.json](inputs.json) содержит команду, окружение, DS/manifest hashes и сравнение исходников с run03.
`unit-results/` содержит31 JUnit XML; бинарные результаты Gradle сохранены в
`.cache/qa/2026-10-27-telegram-chat/android-implementation/run04/unit-results/binary/`.
Логи Lint лежат рядом: lint-results-debug.txt и lint-results-release.txt.
`evidence-hashes.json` фиксирует хэши файлов отчёта.

Все прежние receipt/run01/run02/run03 сохранены. Нет baseline/suppressions,
изменений продукта, эмуляторов, commit/push/deploy или закрытых checkbox.
Независимые design-review/feature-test и общая приёмка остаются отдельными этапами.
