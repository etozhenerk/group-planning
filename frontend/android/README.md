# somewhere для Android

Основа приложения на Kotlin + Jetpack Compose, минимум Android 8 / API 26.
Пока реализован только статичный корневой экран бренда; встречи, API, сессия
и онбординг подключаются следующими задачами. Сборка не имитирует вход.
Сценарий и границы — [7.1](../../openspec/changes/gathering-activity-feed/android-bootstrap.md).
[Результаты проверки](../../openspec/changes/gathering-activity-feed/android-bootstrap-verification.md)
включают чистую сборку, Lint и запуск на одном эмуляторе.

## Инструменты

| Инструмент | Версия |
| --- | --- |
| JDK | 17 |
| Gradle wrapper | 8.14.3, SHA-256 в wrapper properties |
| Android Gradle Plugin | 8.13.1 |
| Kotlin и Compose compiler plugin | 2.2.20 |
| Compose BOM | 2025.11.01 |
| Activity Compose | 1.11.0 |
| compileSdk / targetSdk / minSdk | 36 / 36 / 26 |
| SDK Build Tools | 36.0.0 |
| ktlint | 1.5.0, Android Studio style |

Библиотеки зафиксированы в `gradle/libs.versions.toml`; динамических версий нет.
Kotlin compiler plugin имеет ту же версию, что Kotlin; Compose-библиотеки
согласует BOM. Wrapper сгенерирован Gradle, JAR и оба скрипта сохранены в Git.
Системный Gradle не нужен. Сборка ограничена двумя workers и 2 ГБ heap;
параллельные проекты отключены, отдельный Kotlin daemon не запускается.

## Сборка и проверки

Установи JDK 17 и Android SDK platform 36 / Build Tools 36.0.0.
Для IDE нужна Android Studio с поддержкой AGP 8.13; старые версии IDE
не определяют совместимость командной сборки.
Задай `JAVA_HOME` и `ANDROID_HOME` для текущего shell; локальные пути не коммитятся.
Например, на macOS SDK обычно находится в `$HOME/Library/Android/sdk`.
Если установлен command-line SDK manager:

```sh
sdkmanager 'platforms;android-36' 'build-tools;36.0.0'
```

Из `frontend/android`:

```sh
sh scripts/check-toolchain.sh
./gradlew --no-daemon formatCheck
./gradlew --no-daemon formatApply
./gradlew --no-daemon :app:assembleDebug
./gradlew --no-daemon :app:assembleRelease
./gradlew --no-daemon :app:lintDebug :app:lintRelease
./gradlew --no-daemon :app:testDebugUnitTest
sh scripts/check.sh
```

`check.sh` выполняет чистую сборку обеих конфигураций, проверку Kotlin-оформления,
Lint и доступные unit-тесты. Команда форматирования без `Apply` не пишет файлы.
Форматтер также проверяет Gradle Kotlin DSL. Файлы имеют отступ 4 пробела,
не более 100 символов в строке, явные импорты; функции Compose — UpperCamelCase.
Kotlin warnings и Lint warnings останавливают сборку. Бизнес-логики пока нет;
`testDebugUnitTest` может сообщить `NO-SOURCE`, это не пройденные unit-тесты.
Набор состояния и контрактных тестов добавляется в 7.2.

Debug APK: `app/build/outputs/apk/debug/app-debug.apk`.
Release APK: `app/build/outputs/apk/release/app-release-unsigned.apk`;
R8 и удаление неиспользуемых ресурсов включены, публикационная подпись не настроена.
Отчёты Lint: `app/build/reports/lint-results-debug.html` и `lint-results-release.html`.
CI в [android.yaml](../../.github/workflows/android.yaml) выполняет ту же команду
на Ubuntu 24.04 / Temurin 17, без создания эмуляторов.

## Запуск

Открой эту папку в совместимой Android Studio и запусти конфигурацию `app`.
Или установи Debug APK на уже открытое устройство:

```sh
adb devices -l
adb -s <serial> install -r app/build/outputs/apk/debug/app-debug.apk
adb -s <serial> shell am start -n dev.groupplanning.android/.MainActivity
```

По договорённости используется **только один Android-эмулятор**. Сначала проверь
`adb devices`, затем список существующих AVD. Переиспользуй уже запущенный;
если его нет, запускай один существующий. Не создавай клоны и не сбрасывай данные.
На текущем компьютере доступен `Pixel_XL_API_36`. Проверка обычной сборки
не требует запуска эмулятора. Instrumentation/TalkBack и полный мобильный сценарий
пока не реализованы и не считаются проверенными.

## Структура

Один модуль `app`, package/application ID `dev.groupplanning.android`.
Activity отвечает за системное окно; `ui/SomewhereApp` — корень Compose,
`ui/brand` — подпись, `ui/theme` — отображение общей палитры в Material 3.
XML-цвета используются также системным splash. Dynamic Color отключён:
согласованный дизайн не меняет цвета от обоев устройства.
Рисунок знака перенесён из того же SVG, что используется iOS.

API/Repository/ViewModel и защищённое хранение будут добавляться по мере
реальных сценариев, без пустых модулей. Не добавляй сетевые операции внутрь
Composable, подставной user ID и debug-обход входа в обычный target.
Правила — [AGENTS.md](AGENTS.md); общий дизайн —
[v0.7](../../docs/design/foundations.md) и
[мобильный онбординг](../../docs/design/mobile-onboarding.md).

Уведомления Lint о новых версиях (`AndroidGradlePluginVersion`, `GradleDependency`,
`NewerVersionAvailable`) остаются информационными: закреплённый совместимый стек
обновляется отдельной проверяемой правкой. Остальные предупреждения Lint блокируют
сборку. Baseline и подавления ошибок кода не используются.
