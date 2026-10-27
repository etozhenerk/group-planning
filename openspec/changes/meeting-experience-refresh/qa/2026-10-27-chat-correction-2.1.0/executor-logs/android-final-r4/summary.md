# Android r4 · DS 2.3.0

Исправлены атомарное размещение quick/full reaction picker и наблюдение
системного движения. По публикациям 2.2/2.3 добавлены движения emoji dock
и меню по плюсу. Финальный код заморожен; эта запись не является независимой
функциональной или визуальной приёмкой.

## Реализация

- Reaction Popup имеет постоянное окно conversation bounds. Внутренний layout
  измеряет и размещает quick/full одновременно. Session reset r3 и прежние
  enter/exit/pressed токены сохранены.
- Motion preference на API 33+ подписана на фактический ValueAnimator scale,
  с unregister при dispose. API 26–32 читает Settings/default 1 и Power Save,
  подписывается на изменения обоих источников без cached-value гонки.
- Dock использует отменяемый tween высоты/opacity, меню — opacity/translation
  внутри постоянного окна с резервом `space.s8`. Финальная привязка меню прежняя.
  Общий `SurfaceTransition` разворачивает движение от текущего progress;
  старый exit не удаляет повторно открывшуюся поверхность. Reduced visibility
  прямо зависит от open. Exit исключает действия/AX; меню отдаёт focus,
  выбор запускает callback немедленно.

Разбор baseline и core — [diagnosis.md](diagnosis.md). Первый dock-кандидат
с двумя упавшими тестами сохранён в [dock-first](dock-first/diagnosis.md).
Assertions не ослаблялись, задержки в production не добавлялись.

## Точный кандидат и проверки

QA SHA-256:
`8ef5e682a135681386264b99a057d5f0d605975d820c7d8979ff8917df03e269`.
QA test APK:
`a6104bfafd97da8922e5a40a17d7a78fb1286ed4ce1a23cab1069fa78ec428cd`.
Source tree:
`a38999b4448efdd9772f10df0d7e3a5044d8b54fb3a72ea37027e9ea62ae67da`.

Полный список 473 source records, APK hashes и checks —
[source-receipt.json](source-receipt.json). APK лежат только в ignored
`.cache/qa/chat-correction-2.3.0/android-final-r4/`. После финальной сборки
все source records повторно сверены. Формула tree digest указана в receipt:
compact JSON массива files с отсортированными ключами; null обозначает
удалённый tracked путь. Исторические core/dock-first receipts использовали
строки `sha256`, два пробела, `path`, newline и только существующие файлы;
их исходные hashes не переписаны.

Прошли formatApply/formatCheck, Debug/Release/QA, Debug/QA test APK, Lint
Debug/Release, 126 JVM-тестов (0 failures/errors/skipped), 12 изолированных
UI-тестов на установленном QA с указанным hash.

Команды из `frontend/android`, с JDK 17.0.21+9, SDK 36,
`JAVA_TOOL_OPTIONS=-XX:ActiveProcessorCount=2`,
`GRADLE_OPTS=-Dorg.gradle.vfs.watch=false`:

```sh
./gradlew --no-daemon --max-workers=2 formatApply formatCheck -PsomewhereTestBuildType=qa :app:assembleQa :app:assembleQaAndroidTest
./gradlew --no-daemon --max-workers=2 formatCheck :app:assembleDebug :app:assembleRelease :app:lintDebug :app:lintRelease :app:testDebugUnitTest :app:assembleDebugAndroidTest
```

Изолированные классы запускались одной командой `adb -s emulator-5554 shell
am instrument -w -r -e class ... dev.groupplanning.android.uitesthost.test/androidx.test.runner.AndroidJUnitRunner`:
`MotionPreferenceUiTests`, `ReactionPopupLifecycleUiTests`,
`ReactionPickerLifecycleUiTests`, `ReactionFeedbackLifecycleUiTests`,
`EmojiDockLifecycleUiTests`, `ComposerMenuLifecycleUiTests`.
Итог — `OK (12 tests)` за 21.671 s; [журнал](isolated-tests.txt).
Полные команды и окружение — [commands.txt](commands.txt).
Также прошли agent:check, структурный design:check и git diff --check.

Управляемые часы подтвердили промежуточные enter/exit, normal/reduced pressed,
неизменность окна quick/full, session reopen/Back/outside, inert exit,
rapid reversal dock/меню и немедленный callback действия. В runtime:
reaction window `[0,136,720,1416]` для quick и full;
dock enter 281/400 px с intensity 0.698, exit 92 px с 0.227;
menu window `[24,1068,424,440]` неизменен, child y 16.8→12 px,
ширина 400 px неизменна. Это synthetic controlled-clock измерения,
не запись плавности полного экрана. [Runtime](runtime-probe.txt).

## Передача независимому ревью

Только QA emulator-5554, API 36, 720×1600, density 320. После тестов:
window/transition scale 1.0/1.0, animator raw null, fontScale 1.0.
Power Save во время probe false; native/LocalMotion синхронно переключились
1/true → 0/false → 1/true. Исходный raw animator null восстановлен.
[Снимок устройства и installed hash](device-after-tests.json).

App устанавливал root. Исполнитель устанавливал только test APK, запускал
изолированные test Activity и читал их synthetic evidence. API, bootstrap,
fixture runner, очистка app data, обычное приложение и другие устройства
не использовались. MainActivity после тестов исполнитель не запускал.

Для normal live setup явно установить animator scale=1 и проверить runtime;
для reduced — 0, затем восстановить исходную настройку. После завершения
native builds координатор выделяет тихое окно независимому ревьюеру.
Нужны full-screen motion/IME/focus/scroll и функциональная приёмка точного APK.
Полный fixture UI runner на r4 не запускался. API 26–32 fallback собран и
прошёл Lint, но не проверен на устройстве такой версии. Прежние 17/6 UI pass,
core 5 pass и первый dock 7/9 не переносятся на финальный кандидат.

Commit, push, deployment и production install не выполнялись.
