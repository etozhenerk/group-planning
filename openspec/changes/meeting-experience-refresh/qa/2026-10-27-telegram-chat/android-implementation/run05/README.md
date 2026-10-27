# Android run05 — исправления после r2

Инженерная проверка, не независимая приёмка. Исправлены только два подтверждённых замечания:

- Карточка с назначенным днём без часа показывает дату и «время уточняем». Реальный назначенный час сохранён; полная строка не ограничена одной строкой или ellipsis.
- Настройки получили отдельную композицию: название/описание, затем дата/время/условия времени/место, затем обложка. Группы и разделители используют опубликованные роли DS 1.4.1. Общий MeetingFields и CreationScreen не менялись. Сохранены удаление времени, timezone/DST, реальные cover actions и прежний controller.

Форма даты, plus/emoji, generated-файлы и эталоны не менялись. Состав шести изменённых файлов и SHA записан в source-changes-from-run04.json. Полный snapshot — source-hashes.json; aggregate вычислен из отсортированных UTF-8 записей `path:sha256\n`.

## Проверки

Полный `sh scripts/check.sh` прошёл с JDK 17.0.21 и SDK 36: clean, formatCheck, Debug/Release, lintDebug/lintRelease, testDebugUnitTest, DebugAndroidTest, QA и QAAndroidTest. 126 JVM-тестов в 31 наборе: 0 ошибок, падений и пропусков. В каждом lint:0 errors, 0 warnings, 21 Hint об известных закреплённых версиях. Design:check, agent:check и git diff --check прошли.

Первая попытка зависла до компиляции в macOS NativeFileWatcher.startWatching0. Thread dump сохранён в игнорируемом cache; остановлен только её Gradle daemon. Оригинальный check-attempt01.log сохранён, exit 1 обозначен инфраструктурной остановкой. Повтор выполнен той же командой с временным `GRADLE_OPTS=-Dorg.gradle.vfs.watch=false`, без изменения Gradle-конфигурации. Его check.log и точный environment находятся рядом.

## Артефакт следующей проверки

Сохранённый QA APK:
`.cache/qa/2026-10-27-telegram-chat/android-implementation/run05/artifacts/qa/app-qa.apk`

SHA-256: `68abec3448475b80608b7deb17c9282b556bb6ba2e8de300115628bccb4e9f71`.

QA instrumentation APK:
`.cache/qa/2026-10-27-telegram-chat/android-implementation/run05/artifacts/androidTest/qa/app-qa-androidTest.apk`

SHA-256: `f913273d00ae38e109698f5f13c228f530b67b62fc98633575948bb21ef91695`.

Все APK и бинарные unit-results остаются в игнорируемом cache; receipt содержит реальные пути и SHA. Публичные XML/logs сохранены здесь. Исходники после сборки совпали со snapshot.

## Что ещё не выполнено

UIrunner не запускался: ожидаются отдельный GO и свежий testAPI. В TelegramChatUiTests теперь 5 проверок: новая проверяет полный label отсутствующего времени и реальный час; existing settings-return дополнена проверкой вертикального порядка полей и достижимости cover при закреплённом Save. Эти assertions скомпилированы, их пользовательский результат пока не проверен. После адресного прогона необходима независимая r3 приёмка точного нового APK.

Восстановленный Somewhere_API_36/5554 пока сохраняет установленный run03. Его временный launcher и cleanup описаны отдельно в [отчёте восстановления](../../../2026-10-27-telegram-chat-1.4.1-r2/android-environment-recovery-01/README.md). Установок/запуска run05 в этом run не было; fixture 22948 не перезапускался. Старые evidence неизменны, checkbox не закрывались.
