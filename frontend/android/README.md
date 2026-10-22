# somewhere для Android

Приложение на Kotlin + Jetpack Compose, минимум Android 8 / API 26.
Клиент работает с общим Go API и следует общей основе дизайна.
Правила разработки — в [AGENTS.md](AGENTS.md), организация файлов —
в [руководстве по коду](docs/code-style.md).

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
sh scripts/test-ui.sh
sh scripts/test-ui.sh calendar
```

`check.sh` выполняет чистую сборку обеих конфигураций, проверку Kotlin-оформления,
Lint, JVM-тесты и сборку instrumentation APK. `test-device.sh` выполняет
проверки Android Keystore и защищённого контекста приглашения на уже запущенном устройстве.
`test-ui.sh` требует Go 1.27.2 и Python 3: поднимает отдельный HTTPS API из Go-теста,
запускает Compose UI-тесты и затем останавливает только свой сервер. Живое demo
не перезапускается. Аргумент `calendar` запускает только сценарии календаря:
периоды, месяц, Back, создание из выбранной даты, закреплённую шапку и крупный
шрифт. Без аргумента выполняется полный UI-набор, включая календарь. Для fixtures используется отдельный application ID
`dev.groupplanning.android.uitesthost`; credential и сертификат передаются приватным
файлом, не аргументами команд. TLS проверяет тестовый CA и имя хоста.
Сервер проверяет, что потерянный ответ и повтор создали ровно одну встречу
и что повторы RSVP и сообщения использовали прежний ключ запроса. Команда форматирования без `Apply` не пишет файлы.
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
instrumentation: `app/build/reports/androidTests/connected/debug/index.html`;
UI: `app/build/reports/androidTests/connected/qa/index.html`;
снимки UI: `app/build/outputs/connected_android_test_additional_output/`.
CI в [android.yaml](../../.github/workflows/android.yaml) выполняет эти Gradle-задачи
на Ubuntu 24.04 / Temurin 17 в отдельных jobs сборки, чекеров и JVM-тестов,
без создания эмуляторов. Итоговая сводка показывает ошибки по этапам;
подробности — в [правилах CI](../../docs/ci.md).

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
эмуляторах. `test-device.sh` проверяет хранилище, `test-ui.sh` — интерфейс:
слайды, Back/пропуск, черновик, date/time panels, крупный текст, приглашения,
Share, три ответа, историю, отправку, настройки и закрытие чата после снятия участия.
В конце два отдельных instrumentation-запуска проверяют восстановление черновика
и неподтверждённой отправки с завершением QA-процесса между ними. Только этот
сценарий запускается командой `sh scripts/test-ui.sh persistence`.
Ручной TalkBack и физическое Android-устройство остаются отдельной проверкой.

## Сервер и приглашения

Адрес API задаётся при сборке, без секретов:

```sh
./gradlew --no-daemon -PsomewhereApiOrigin=https://example.com :app:assembleDebug
```

Без свойства приложение открывает знакомство. Адрес должен быть корневым HTTPS
origin; он также ограничивает принимаемые ссылки. Сертификату сервера должна
доверять ОС. Настройка origin не включает подставную сессию.

Для проверки системного открытия приглашения обычной сборкой:

```sh
adb -s <serial> shell am start -a android.intent.action.VIEW \
  -d 'group-planning-android://i/<token>'
```

QA использует отдельную схему `group-planning-android-qa`. Парсер поддерживает
короткий путь `/i/` и прежний `/invitations/`; чужие origin, auth callback,
query/fragment и неканонические токены отклоняются. Автоматическое открытие
HTTPS из мессенджеров настраивается через Android App Links и `assetlinks.json`
при подключении публичного домена. Обработчик ссылок сам по себе не подтверждает
владение доменом. Системное Share передаёт исходный HTTPS URL сервера.

Открытое приглашение хранится зашифрованным в `noBackupFilesDir` отдельно для
origin. Явное закрытие удаляет контекст. После перезапуска приложение повторно
проверяет сессию и ответ на сервере; локальный выбор не подтверждает участие.

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

ClientRuntime принимает Context и явный ApiOrigin с HTTPS. Секрет сессии хранится в зашифрованном файле noBackupFilesDir,
AES-GCM key остаётся в Android Keystore. Cookies, redirects, disk cache и
автоматические повторы отключены. Выход/401 очищает приватные данные, 403 на
чтение встречи — её кеш и незавершённые запросы. Ошибка прав организатора
на настройках не отбирает доступ к чату. После уничтожения процесса профиль
снова проверяется сервером, приватный кеш не восстанавливается с диска.

`state/AppViewModel` связывает сессию и навигацию, `CreationViewModel` — форму.
`data/drafts` хранит черновик по origin и профилю вне backup, с атомарной записью.
Запрос с ключом сохраняется до отправки; после неопределённого результата поля
замораживаются до повтора, включая перезапуск. Пагинация защищена от позднего
ответа после обновления списка. Выбор даты и времени доступен по всему полю.

Не добавляй сетевые операции внутрь Composable, подставной user ID и debug-обход
входа в обычный target. Тестовые transport/credential storage находятся только
в test/qa source sets. Debug и Release используют отдельный production RuntimeFactory.
Правила — [AGENTS.md](AGENTS.md); общий дизайн —
[v0.7](../../docs/design/foundations.md) и
[мобильный онбординг](../../docs/design/mobile-onboarding.md).

Уведомления Lint о новых версиях (`AndroidGradlePluginVersion`, `GradleDependency`,
`NewerVersionAvailable`, `OldTargetApi`) остаются информационными: закреплённый совместимый стек
обновляется отдельной проверяемой правкой. `targetSdk = 36` меняется вместе
с проверкой поведения на новой платформе, а не вслед за обновлением образа runner.
Проверка `ExpiredTargetSdkVersion` и остальные предупреждения Lint блокируют
сборку. Baseline и подавления ошибок кода не используются.
