# somewhere для Android

Основа приложения на Kotlin + Jetpack Compose, минимум Android 8 / API 26.
Добавлены API, хранилище сессии и состояние встреч. Видимый интерфейс пока
содержит статичную подпись бренда: онбординг и экраны подключаются отдельно,
вход не имитируется. Границы —
[7.2](../../openspec/changes/gathering-activity-feed/android-data.md), результаты —
[проверка данных и состояния](../../openspec/changes/gathering-activity-feed/android-data-verification.md).

## Инструменты

| Инструмент | Версия |
| --- | --- |
| JDK | 17 |
| Gradle wrapper | 8.14.3, SHA-256 в wrapper properties |
| Android Gradle Plugin | 8.13.1 |
| Kotlin и Compose compiler plugin | 2.2.20 |
| Compose BOM | 2025.11.01 |
| Activity Compose | 1.11.0 |
| Lifecycle ViewModel | 2.9.4 |
| OkHttp | 4.12.0 |
| kotlinx.serialization | 1.9.0, compiler plugin 2.2.20 |
| kotlinx.coroutines | 1.10.2 |
| compileSdk / targetSdk / minSdk | 36 / 36 / 26 |
| SDK Build Tools | 36.0.0 |
| ktlint | 1.5.0, Android Studio style |

Библиотеки зафиксированы в `gradle/libs.versions.toml`; динамических версий нет.
Kotlin compiler plugin имеет ту же версию, что Kotlin; Compose-библиотеки
согласует BOM. Wrapper сгенерирован Gradle, JAR и оба скрипта сохранены в Git.
Системный Gradle не нужен. Сборка ограничена двумя workers и 2 ГБ heap;
параллельные проекты отключены, отдельный Kotlin daemon не запускается.

## Сборка и проверки

Установи актуальный patch-релиз JDK 17 и Android SDK platform 36 / Build Tools 36.0.0.
Старая встроенная Java 17.0.6 на Apple Silicon может падать внутри JIT при Lint;
используй отдельный JDK 17 через JAVA_HOME, без изменения Gradle или подавления Lint.
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
./gradlew --no-daemon :app:assembleDebugAndroidTest
sh scripts/check.sh
sh scripts/test-device.sh
```

`check.sh` выполняет чистую сборку обеих конфигураций, проверку Kotlin-оформления,
Lint, JVM-тесты и сборку instrumentation APK. `test-device.sh` выполняет
пять проверок Android Keystore на уже запущенном устройстве. Команда форматирования без `Apply` не пишет файлы.
Форматтер также проверяет Gradle Kotlin DSL. Файлы имеют отступ 4 пробела,
не более 100 символов в строке, явные импорты; функции Compose — UpperCamelCase.
Kotlin warnings и Lint warnings останавливают сборку. JVM-набор проверяет общие
API fixtures, настоящий HTTPS transport на MockWebServer, отмену запросов,
401/403, очистку кеша, поздние ответы и жизненный цикл ViewModel.
`NO-SOURCE` не считается прохождением этих проверок.

Debug APK: `app/build/outputs/apk/debug/app-debug.apk`.
Release APK: `app/build/outputs/apk/release/app-release-unsigned.apk`;
R8 и удаление неиспользуемых ресурсов включены, публикационная подпись не настроена.
Отчёты Lint: `app/build/reports/lint-results-debug.html` и `lint-results-release.html`.
JVM: `app/build/reports/tests/testDebugUnitTest/index.html`;
instrumentation: `app/build/reports/androidTests/connected/debug/index.html`.
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
не требует запуска эмулятора. `test-device.sh` использует единственное online
устройство или явный ANDROID_SERIAL и отказывается работать при нескольких
эмуляторах. Instrumentation проверяет хранилище, а не пользовательский сценарий;
онбординг, продуктовые экраны и TalkBack ещё не проверены.

## Структура

Один модуль `app`, package/application ID `dev.groupplanning.android`.
Activity отвечает за системное окно; `ui/SomewhereApp` — корень Compose,
`ui/brand` — подпись, `ui/theme` — отображение общей палитры в Material 3.
XML-цвета используются также системным splash. Dynamic Color отключён:
согласованный дизайн не меняет цвета от обоев устройства.
Рисунок знака перенесён из того же SVG, что используется iOS.

`data/api` содержит DTO, запросы и HTTPS transport; `data/session` — Android
Keystore, восстановление через /me и единый снимок сессии с приватными данными.
`data/repository` загружает список, детали, состав и первую страницу ленты;
`state/MeetingListViewModel` владеет запросами через viewModelScope.

ClientRuntime принимает Context и явный ApiOrigin с HTTPS; production origin
ещё не задан. Секрет сессии хранится в зашифрованном файле noBackupFilesDir,
AES-GCM key остаётся в Android Keystore. Cookies, redirects, disk cache и
автоматические повторы отключены. Выход/401 очищает приватные данные, 403 на
чтение встречи — её кеш и незавершённые запросы. Ошибка прав организатора
на настройках не отбирает доступ к чату. После уничтожения процесса профиль
снова проверяется сервером, приватный кеш не восстанавливается с диска.

Следующие этапы подключат UI, пагинацию, отправку и обновление ленты.
Не добавляй сетевые операции внутрь Composable, подставной user ID и debug-обход
входа в обычный target. Тестовые transport/credential storage находятся только
в test source sets.
Правила — [AGENTS.md](AGENTS.md); общий дизайн —
[v0.7](../../docs/design/foundations.md) и
[мобильный онбординг](../../docs/design/mobile-onboarding.md).

Уведомления Lint о новых версиях (`AndroidGradlePluginVersion`, `GradleDependency`,
`NewerVersionAvailable`) остаются информационными: закреплённый совместимый стек
обновляется отдельной проверяемой правкой. Остальные предупреждения Lint блокируют
сборку. Baseline и подавления ошибок кода не используются.
