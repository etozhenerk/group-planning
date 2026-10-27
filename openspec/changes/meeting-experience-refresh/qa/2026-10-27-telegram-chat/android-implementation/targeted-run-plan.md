# Целевые Android прогоны

Scope chat в scripts/test-ui.sh запускает только четыре TelegramChatUiTests.
Он использует существующий локальный HTTPS TestAndroidFixture с scope calendar:
fixture всегда создаёт design-сценарий; ограничения calendar отключают только
проверки операций других наборов. Production auth не используется.
Три ComposerEditingDeviceTests доступны в том же QA instrumentation APK и
запускаются отдельной командой без API fixture.

Только существующий Somewhere_API_36 на serial emulator-5554. После разрешения
окна проверить adb devices -l и adb -s emulator-5554 emu avd name; при отсутствии
запустить этот AVD с -port5554, без wipe и создания устройств. Pixel_10a/5556 не
используется. runner сам не запускает устройства.

Из frontend/android, только после GO:

```sh
export JAVA_HOME=/Users/misha/Library/Java/JavaVirtualMachines/jdk-17.0.21+9/Contents/Home
export ANDROID_HOME=/Users/misha/Library/Android/sdk
export ANDROID_SERIAL=emulator-5554
sh scripts/test-ui.sh chat
./gradlew --no-daemon -PsomewhereTestBuildType=qa -Pandroid.testInstrumentationRunnerArguments.class=dev.groupplanning.android.ui.feed.ComposerEditingDeviceTests :app:connectedQaAndroidTest
```

Перед каждым прогоном сохранить входные source/API fixture/APK/DS SHA и имя
устройства в новом runNN/inputs.json. После первого тестового набора, даже при
FAIL, немедленно скопировать outputs/androidTest-results/connected,
outputs/connected_android_test_additional_output и reports/androidTests/connected
в .cache/qa/2026-10-27-telegram-chat/android-implementation/runNN/chat.
Логи, JUnit XML и PNG/capture.json перенести в OpenSpec runNN/chat, сохранить SHA.
Только затем запускать ICU и архивировать аналогично в runNN/icu. Бинарные
protobuf/Gradle output сохранять в .cache, не Git. Существующие runNN не
перезаписывать. Повтор после исправления — run02 с новым source/APK SHA;
первоначальные run01 ошибки и expected results остаются неизменными.

После FAIL завершить текущие наборы, сохранить evidence, штатно остановить
только свой emulator5554 и явно освободить тяжёлое окно перед source-разбором.
Ни один инженерный прогон не закрывает acceptance checkbox.
