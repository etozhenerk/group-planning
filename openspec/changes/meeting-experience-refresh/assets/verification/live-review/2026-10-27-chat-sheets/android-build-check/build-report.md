# Android: проверка сборки 27.10.2026

Компактные участники приведены к опубликованной геометрии: рамки `spaceS2` / `colorSurface` у имён и счётчика; счётчик использует минимальную высоту `componentParticipantChipHeight` и вертикальное центрирование. Высота может расти вместе с текстом. Макеты, токены и legacy-инвентарь не изменялись этим исправлением.

`sh scripts/check.sh` завершился с кодом 0: formatCheck, чистые Debug/Release, lintDebug/lintRelease, JVM, Debug instrumentation и QA app/instrumentation APK. Основной Gradle-проход занял 2 мин 13 с, QA — 39 с. JVM: 126 тестов в 31 suite, 0 failures/errors/skipped. Оба Lint: 0 warnings/errors, по 21 информационной подсказке Hint.

Логи сохраняют информационное предупреждение версии XML Android SDK и сообщение упаковщика о `libandroidx.graphics.path.so`; эти сообщения не остановили проверку. Первая sandbox-попытка не смогла открыть lock существующего Gradle-кэша; её отдельный лог сохранён. Повтор с разрешённым доступом к кэшу прошёл.

Это свидетельство сборки, а не функциональная или визуальная приёмка. UI/device-тесты не запускались; adb и эмуляторы не использовались. Тяжёлое окно освобождено после завершения процесса.

Точный Git HEAD, сводка тестов, SHA-256 всех пяти APK и хеш полного Android source manifest — в [build-result.json](build-result.json). Полный лог — [check.log](check.log); результаты JVM — [jvm-results.json](jvm-results.json); исходники — [source-files.sha256](source-files.sha256). APK находятся в игнорируемом `frontend/android/app/build/outputs/apk/`.
