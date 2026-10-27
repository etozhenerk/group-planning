# Возобновление Android проверки

Только managed worktree и уже разрешённый `emulator-5554`; package
`dev.groupplanning.android.uitesthost`. Обычное приложение не устанавливать и
не очищать. Не использовать общий test-ui.sh: он заменяет fixture и bootstrap.
Перед новым прогоном согласовать native heavy slot с parent.

## Сборка

```sh
export JAVA_HOME=/Users/misha/Library/Java/JavaVirtualMachines/jdk-17.0.21+9/Contents/Home
export ANDROID_HOME=/Users/misha/Library/Android/sdk
export JAVA_TOOL_OPTIONS=-XX:ActiveProcessorCount=2
export GRADLE_OPTS=-Dorg.gradle.vfs.watch=false
sh frontend/android/scripts/check.sh
```

Wrapper использует no-daemon, workers=2 из gradle.properties. Узкий QA build:

```sh
./frontend/android/gradlew -p frontend/android --no-daemon --max-workers=2   -PsomewhereTestBuildType=qa :app:assembleQa :app:assembleQaAndroidTest
```

## Изолированный API и live

Backend exact `c789772bce4e3af45e47ade9a68cd10b7d9dee0c`, binary
`/tmp/chat-read-httpapi-r4.test`, SHA256
`590e2449b00e90dbc4284f9069997d2a2aadb72d8c3c988aaa4748ecd406be49`.
Следующий запуск требует свежий private config: срок sessions — час.
Не переиспользовать истёкшие credentials и не обращаться к пользовательскому API.

```sh
somewhere_fixture_dir=$(mktemp -d /tmp/android-read-review.XXXXXX)
chmod 700 "$somewhere_fixture_dir"
SOMEWHERE_ANDROID_FIXTURE=1 SOMEWHERE_ANDROID_FIXTURE_SCOPE=chat SOMEWHERE_ANDROID_CHAT_REALTIME=1 SOMEWHERE_ANDROID_CHAT_READ_STATE=1 SOMEWHERE_ANDROID_FIXTURE_CONFIG="$somewhere_fixture_dir/config.json" /tmp/chat-read-httpapi-r4.test -test.run '^TestAndroidFixture$' -test.timeout 0
```

Запустить fixture в собственной сессии; получить порт из private config без
печати credentials. Сделать adb reverse только этого порта. Загрузить config
в `/data/local/tmp/somewhere-android-ui-<число>.json`, mode 600. Установить только
QA/test APK из artifacts.json через `adb -s emulator-5554 install -r -t`.

```sh
adb -s emulator-5554 shell am instrument -w -r   -e fixturePath /data/local/tmp/somewhere-android-ui-<число>.json   -e additionalTestOutputDir /sdcard/Android/data/dev.groupplanning.android.uitesthost/files/read-review   -e class dev.groupplanning.android.ChatReadLiveUiTests   dev.groupplanning.android.uitesthost.test/androidx.test.runner.AndroidJUnitRunner
```

Тест создаёт новую синтетическую встречу с design actor и invite-rsvp actor;
не опирается на ID прошлого запуска. Он отзывает участие гостя только в своей
встрече. Public screenshots и redacted runtime.json появляются в output dir.
В конце удалить только собственные remote config/reverse и остановить только
собственный fixture; bootstrap с credentials не копировать в Git.

Следующий узкий viewport repeat: `dev.groupplanning.android.ChatReadUiTests`.
Прежняя regression группа: `dev.groupplanning.android.ChatQueueUiTests`,
`dev.groupplanning.android.session.MessageQueueStorageTests`,
`dev.groupplanning.android.session.AndroidKeystoreTests`,
`dev.groupplanning.android.ui.feed.ComposerEditingDeviceTests`.
Она не заменяет независимый live review, TalkBack и полный UI suite.

Для motion normal настройку animator scale на QA-эмуляторе задавать явно 1
и проверять runtime; reduced — 0; после вернуть исходное значение. Это
согласованная fixture-семантика Android после прежнего stale ValueAnimator.
Текущий checkpoint не запускал motion measurements и не менял global scales.
