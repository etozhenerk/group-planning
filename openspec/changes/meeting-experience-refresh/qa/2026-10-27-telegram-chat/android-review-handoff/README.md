# Android — передача живого QA окружения

Окружение для независимой проверки, не результат приёмки. Код приложения не
менялся. Отдельный Go fixture собран из текущего backend, запущен новым процессом
и оставлен живым. Эмулятор и Gradle в этом handoff не запускались.

## Уже доступно

- Origin: **https://127.0.0.1:65193**. Проверка `/healthz` по HTTPS с сертификатом из приватного конфига вернула 200.
- PID fixture: 16576. Новый отдельный процесс, не старый процесс test-ui.sh. Данные хранятся в memory.Store и могут изменяться проверяющим через реальные API/UI.
- Scope: `calendar`; он сохраняет все seed-сценарии и отключает только финальные assertions других автоматизированных наборов.
- Основной scenario: `design`. Это Саша, организатор «Настолки у Саши»; в реальных данных шесть участников. Другие встречи из этого же fixture позволяют проверять роли участника.
- Приватный config: `/Users/misha/Documents/Codex/projects/group-planning/.cache/qa/2026-10-27-telegram-chat/android-review-live/session01/config.json`, mode 0600; родительский каталог mode 0700. Config содержит синтетические credentials и сертификат: не печатать его и не копировать в evidence/Git.
- Credential design действует до `2026-10-27T17:17:28.875659+03:00`. При истечении не использовать старый token; обновление окружения согласовать с root. Перезапуск fixture теряет синтетические изменения и требует нового конфига/origin/adb reverse.
- Бинарник и служебные PID/log находятся в том же игнорируемом приватном session01. Он собран командой `go test -c ... ./internal/httpapi`; запущен с `SOMEWHERE_ANDROID_FIXTURE=1`, `SOMEWHERE_ANDROID_FIXTURE_SCOPE=calendar`, `-test.run ^TestAndroidFixture$ -test.v -test.timeout 0`. Процесс отсоединён от временного runner, его не останавливает завершение UI-теста.

Публичные метаданные без credentials: [environment.json](environment.json).
Backend source/asset hashes лежат рядом. Fixture остаётся до окончания приёмки;
не запускать test-ui.sh для его поддержки, потому что runner создаёт свой
временный сервер и останавливает его в cleanup.

## Точный APK и устройство

Использовать сохранённый **run03** APK с фактически выполненными4 UI + 3 ICU тестами:

```text
/Users/misha/Documents/Codex/projects/group-planning/.cache/qa/2026-10-27-telegram-chat/android-implementation/run03/artifacts/qa/app-qa.apk
SHA-256 74ceec478be40f4a90633c301b9b38e6fd6c47f23b3db3b0482725aeb4c36325
```

Source aggregate `45a72cec3154c9135534f72e07cb467a1d3b6b822b7852bc02e4ca3a4ca878ff`;
DS 1.4.1. Полный check.sh также прошёл на этих исходниках в run04; его новые APK
не подменяют выбранный артефакт handoff.

QA package: `dev.groupplanning.android.uitesthost`; Activity:
`dev.groupplanning.android.MainActivity`. Обычный package
`dev.groupplanning.android` не устанавливать, не запускать и не очищать.

Только существующий `Somewhere_API_36`, serial `emulator-5554`.
Последняя фактически записанная идентичность из run03: Android 16 / API 36,
`BE2A.250530.026.F3`, incremental 13894323, `sdk_gphone64_arm64`, 720×1600 px,
320 dpi, fontScale 1, locale ru-RU, timezone Europe/Moscow.
[Полная исходная capture metadata](last-verified-device.capture.json).
Это предыдущая проверенная identity; после отдельного GO перепроверить actual
properties работающего устройства. Pixel_10a/emulator-5556 не трогать.

## Только после отдельного GO на Android UI

Ни одна команда этого раздела в handoff пока не выполнялась.

1. Проверить `adb devices -l`. Если 5554 уже запущен, убедиться через `adb -s emulator-5554 emu avd name`, что это Somewhere_API_36, и переиспользовать. Если нет — запустить ровно существующий AVD видимым для CUA, без `-no-window`, wipe или клонирования:

```sh
/Users/misha/Library/Android/sdk/emulator/emulator -avd Somewhere_API_36 -port 5554 -no-audio -no-boot-anim -no-snapshot-save
```

2. Дождаться загрузки выбранного serial и проверить имя/OS/build. Команды адресуют только 5554:

```sh
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 wait-for-device
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 emu avd name
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell getprop sys.boot_completed
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell getprop ro.build.version.release
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell getprop ro.build.version.sdk
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell getprop ro.build.id
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell getprop ro.build.version.incremental
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell wm size
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell wm density
```

3. Проверить SHA saved run03 APK и установить только QA package с сохранением данных:

```sh
shasum -a 256 /Users/misha/Documents/Codex/projects/group-planning/.cache/qa/2026-10-27-telegram-chat/android-implementation/run03/artifacts/qa/app-qa.apk
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 install -r -t /Users/misha/Documents/Codex/projects/group-planning/.cache/qa/2026-10-27-telegram-chat/android-implementation/run03/artifacts/qa/app-qa.apk
```

Для доказательства установленного артефакта получить `pm path dev.groupplanning.android.uitesthost`,
скопировать его base.apk в игнорируемый review cache и сравнить SHA. Не выбирать
APK по одному имени приложения на экране.

4. Соединить device localhost с отдельным живым fixture. Конфиг передать по stdin
сразу в private no_backup только QA package; не выводить credentials и не
использовать stale config от остановленного test-ui runner:

```sh
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 reverse tcp:65193 tcp:65193
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell am force-stop dev.groupplanning.android.uitesthost
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell run-as dev.groupplanning.android.uitesthost mkdir -p no_backup
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell -T "run-as dev.groupplanning.android.uitesthost sh -c 'cat > no_backup/ui-fixture.json'" < /Users/misha/Documents/Codex/projects/group-planning/.cache/qa/2026-10-27-telegram-chat/android-review-live/session01/config.json
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell run-as dev.groupplanning.android.uitesthost chmod 600 no_backup/ui-fixture.json
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell am start -n dev.groupplanning.android.uitesthost/dev.groupplanning.android.MainActivity --es scenario design
```

`run-as` допустим для этого debuggable QA APK. Если он отклонён, остановиться и
сообщить root; не ослаблять разрешения/private config. Не использовать pm clear,
удаление данных или production auth. Test instrumentation APK для ручного
handoff не нужен.

5. Подтвердить foreground package QA и открыть окно Android Emulator через CUA
inventory. Навигацию/синтетические изменения для независимого review выполнять
через интерфейс. Шапка «Настолки у Саши» открывает информацию; под composer
раскрывается emoji dock; реакции имеют отдельные picker и people-list.

Для другого подготовленного scenario сначала force-stop только QA app, затем
am start с именем из RuntimeFactory/config, не печатая содержимое credentials.
Синтетические API операции допустимы для подготовки ролей/ошибок по case; права
проверяются тем же реальным API. Изменения живут только в этом memory fixture.

## Evidence и завершение

Зафиксировать actual origin, package/APK SHA, OS/build, device geometry, время и
case IDs в независимом отчёте. Изменения данных между кейсами сохраняются до
явного перезапуска; не объявлять новый чистый seed без такого перезапуска.

После приёмки по согласованию с root остановить именно PID из environment.json
через SIGTERM и удалить только reverse tcp:65193 на 5554. Перед kill сверить PID
с этим session01/httpapi.test, чтобы не затронуть переиспользованный PID.
Эмулятор/fixture не останавливать во время чужого review. Credentials, config,
APK и сырые бинарные результаты остаются в .cache, а не Git.
