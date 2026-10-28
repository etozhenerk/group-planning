# somewhere для Android

Приложение на Kotlin + Jetpack Compose, минимум Android 8 / API 26.
Клиент работает с общим Go API и следует общей основе дизайна.
Владельцы sync/очереди, хранение и лицензии описаны в [chat-sync](docs/chat-sync.md).
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
| Centrifuge Java SDK | 0.8.0 |
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
sh scripts/test-ui.sh auth
sh scripts/test-ui.sh experience
ANDROID_SERIAL=emulator-5554 SOMEWHERE_GRADLE_WORKERS=1 sh scripts/test-ui.sh sheet-controls
ANDROID_SERIAL=emulator-5554 sh scripts/test-album-gallery.sh
```

`check.sh` выполняет чистую сборку обеих конфигураций, проверку Kotlin-оформления,
Lint, JVM-тесты и сборку instrumentation APK. `test-album-gallery.sh` проверяет
реальный MediaStore только в отдельном QA-приложении: скрытые записи,
публикацию оригинальных байтов/EXIF и удаление только собственных записей.
Использует уже запущенное устройство из `ANDROID_SERIAL`; API и вход не нужны.
`test-device.sh` выполняет
проверки Android Keystore и защищённого контекста приглашения на уже запущенном устройстве.
`test-ui.sh` требует Go 1.27.2 и Python 3: поднимает отдельный HTTPS API из Go-теста,
запускает Compose UI-тесты и затем останавливает только свой сервер. Живое demo
не перезапускается. `sheet-controls` запускает семь проверок закрытия панелей,
сохранения черновиков без refresh, стабильного списка прочитавших и индикатора
отправки; системные настройки устройства этот набор не меняет. Переменная
`SOMEWHERE_GRADLE_WORKERS` ограничивает workers runner (по умолчанию два). Аргумент `calendar` запускает только сценарии календаря:
периоды, месяц, Back, создание из выбранной даты, закреплённую шапку и крупный
шрифт. Без аргумента (или с `all`) выполняется полный UI-набор, включая все
сценарии `experience`, календарь и последующую проверку восстановления после
завершения процесса. Для fixtures используется отдельный application ID
`dev.groupplanning.android.uitesthost`; credential и сертификат передаются приватным
файлом, не аргументами команд. TLS проверяет тестовый CA и имя хоста.
UI-набор требует Android 13 или новее: перед каждым тестом `QaAppLocaleRule`
временно задаёт `ru-RU` через системный API локали самого QA-приложения и после
теста восстанавливает прежнее значение. Язык эмулятора и обычного приложения
не меняется; фактическая локаль снимка записывается в его `.capture.json`.
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
Проверка обычной сборки
не требует запуска эмулятора. `test-device.sh` использует единственное online
устройство; при нескольких устройствах `test-device.sh` и `test-ui.sh` требуют
явный `ANDROID_SERIAL`, проверяют его online-состояние и не затрагивают остальные.
Например: `ANDROID_SERIAL=emulator-5554 sh scripts/test-ui.sh experience`
после проверки нужного serial через `adb devices -l`. `test-device.sh` проверяет хранилище, `test-ui.sh` — интерфейс:
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

Для локальной настройки можно задать `somewhere.api.origin` в игнорируемом
`local.properties`; аргумент `-PsomewhereApiOrigin` имеет приоритет. Команда
`npm run auth:local` из корня обновляет локальное свойство адресом временного
HTTPS-туннеля. После её запуска пересобери приложение. Секрет Яндекса остаётся
на сервере; [подробная инструкция](../../backend/docs/auth.md#локальный-запуск-через-https-туннель).

Без настройки origin приложение открывает знакомство. Адрес должен быть корневым HTTPS
origin; он также ограничивает принимаемые ссылки. Сертификату сервера должна
доверять ОС. Настройка origin не включает подставную сессию.

Для проверки системного открытия приглашения обычной сборкой:

```sh
adb -s <serial> shell am start -a android.intent.action.VIEW \
  -d 'group-planning-android://i/<token>'
```

QA использует отдельную схему `group-planning-android-qa`. Парсер поддерживает
короткий путь `/i/` и прежний `/invitations/`; чужие origin, auth callback,
query/fragment и неканонические токены отклоняются. Debug/Release содержат
`autoVerify` для host API origin и двух путей приглашения; QA не содержит
этого HTTPS-фильтра. Для открытия из мессенджера нужен `assetlinks.json`
с подписью устанавливаемого приложения: [настройка и проверка](../../backend/docs/app-links.md).
Обработчик ссылок сам по себе не подтверждает владение доменом.
Системное Share передаёт исходный HTTPS URL сервера.

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

## Локальный вход через Яндекс

`npm run auth:local` из корня записывает HTTPS API в `local.properties`.
Официальный LoginSDK 3.1.3 подключён из Maven Central и использует Activity Result.
Client ID берётся из `somewhere.yandex.client.id` или `-PsomewhereYandexClientId`,
по умолчанию — публичный ID somewhere. Секрет OAuth в APK не включается.
Для SDK в кабинете Яндекса нужны package name и SHA-256 устанавливаемой подписи;
[настройки OAuth](../../backend/docs/auth.md#регистрация-мобильных-платформ--loginsdk).

Для локальной проверки подходит ARM-образ Android 36 с аппаратной графикой и
компактным экраном. Одновременно запускай только один AVD. Если Android 37 сообщает
`forcing software rendering for GLES`, используй образ 36: смена модели без смены
образа не устраняет программный рендеринг.

`sh scripts/test-ui.sh auth` проверяет ошибку входа и сохранение приглашения
в QA-приложении без реального аккаунта. Полный вход в обычной сборке проверяется
отдельно. Если Chrome при первом запуске предлагает Google-аккаунт или сохранение
пароля, это настройка браузера: для somewhere нужен только вход на странице Яндекса.

## Встречи, файлы и обращения

Нижняя панель открывает встречи, сохранённые приглашения и профиль и видна только
на этих основных экранах. Вложенные экраны обходятся без неё; возврат сохраняет
раздел, календарь и прокрутку. Футера в Android нет. Фотографии и документы
выбираются через Photo Picker/Documents, затем проверяются перед отправкой.
Для каждого файла сохраняются собственные ключи создания и публикации; повтор
продолжает ту же операцию. Локальная очередь и байты зашифрованы Android Keystore
в `noBackupFilesDir`. Потеря доступа очищает очередь конкретной встречи, выход —
всех встреч. HEIC декодируется системным ImageDecoder в JPEG без EXIF на API 28+.

Приватный профиль показывает все предоставленные Яндексом личные поля и контакты.
Отсутствующие компоненты даты рождения не подменяются; публичные карточки участников
содержат только имя/фото. Старые сессии получают новые права при повторном входе.

Формы опросов и задач сохраняют незавершённое заполнение при Back в пределах
открытой встречи. Потерянный ответ повторяется с прежними телом и ключом; успех,
смена встречи и потеря доступа очищают форму. Пояснение места необязательно.

Вайб использует серверный `period=past`, страницы фотографий и ограниченный кеш
трёх снимков в памяти. Свайп, сетка и полный экран сохраняют выбранный снимок.
Все приватные файлы запрашиваются с проверкой сессии только у API origin;
публичные аватары Яндекса загружаются отдельно без Bearer.

Полный локальный каталог Unicode/CLDR берётся из
[`contracts/emoji`](../../contracts/emoji/README.md). Gradle включает JSON и
лицензию в assets; поиск по русским названиям и недавние не требуют сети.

Обращения доступны также из помощи до входа. Диагностика выключена по умолчанию,
почта не подставляется из профиля. Выбранный скриншот и неизменяемое отправляемое
тело сохраняются зашифрованно до подтверждения, повтор использует прежний ключ.
Документы с отложенными реквизитами явно обозначены проектами.

`sh scripts/test-ui.sh experience` проверяет новый профиль, сохранение формы,
нижнюю навигацию, фотостопку, свайп, сетку и выбранный снимок после пересоздания.
В него входят формы чата с крупным текстом и клавиатурой, сохранение черновиков
при закрытии, сведения о встрече с возвратом из системного Share и отзыв
доступа вторым API-клиентом во время открытой формы.
`test-device.sh` дополнительно проверяет реальные шифрованные очереди и каталог.
