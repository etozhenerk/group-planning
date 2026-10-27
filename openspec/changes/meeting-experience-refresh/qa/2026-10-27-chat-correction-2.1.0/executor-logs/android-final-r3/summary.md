# Android r3 — первый кадр reaction picker и календарь срока

Основание — независимый [motion checkpoint r2](../../reviewer/r2/motion-checkpoint.md),
замечание `AND-21-R2-M01` и evidence `reviewer/r2/android/date-calendar.*`.
Изменения сделаны после GO координатора; прежние APK, отчёты и записи сохранены.
DS остаётся 2.1.0. Эта запись описывает реализацию и сборки, не независимый pass.

## Причина и исправление picker

В r2 режим `full` жил в `ReactionPicker` через `rememberSaveable` даже после
закрытия Popup. На следующем открытии `LaunchedEffect(open)` сбрасывал его только
после первой композиции. Popup мог сначала измерить полную поверхность, затем
получить quick-контент до очередного обновления позиции окна.

Это согласуется с независимыми кадрами 4.359056 s и 4.392122 s: y≈286 px —
верхний fallback разговора для поверхности высотой до 704 px, y≈606 px —
позиция короткой панели над тем же bubble. Связь этих кадров с порядком эффектов
установлена по исходникам; инструментального trace callbacks в r2 нет.
В исходниках используемого Compose UI 1.9.5 `AndroidPopup.android.kt` уже есть
ожидание первого размера и parent coordinates перед показом, поэтому дополнительный
таймер не исправлял бы источник гонки.

В r3 `full` создаётся через `remember` внутри content видимой поверхности
`ReactionPopup`/`AnimatedVisibility`. Он сохраняется при выходе полного picker
и удаляется вместе с поверхностью после exit. Следующее открытие сразу измеряет
quick-контент; отложенного full→quick сброса больше нет. Дополнительно Popup не
создаётся до непустых conversation bounds и bubble anchor.

Нормальные enter/exit и pressed/selected используют прежние токены. Reduce Motion
сохраняет существующее отсутствие scale/translation. Новых таймаутов, токенов,
отключения всех анимаций или изменений emoji dock в этой ревизии нет.

## Календарь срока

`MeetingDateDialog` прежде всегда показывал «Дата встречи», хотя переиспользовался
для окончания опроса. Он теперь принимает title; `PollDeadlineField` передаёт
существующую строку «Опрос завершится». В остальных местах прежний заголовок
«Дата встречи» сохранён через string resource. Порядок полей, выбор даты,
timezone, валидация и передача результата не менялись. Правка соответствует
`product-copy-editor`: caption сообщает факт о том поле, которое действительно меняется.

Изменены ровно пять Android-файлов: `ReactionPicker.kt`, `ReactionPopup.kt`,
`MeetingDateDialog.kt`, `PollDeadlineField.kt`, `values/strings.xml`.
Полная сверка с r2 записана в [source-receipt.json](source-receipt.json).

## Проверки

На r3 прошли форматирование и `formatCheck`, Debug/Release/QA APK, Debug/QA
instrumentation APK, Lint Debug/Release и 126 JVM-тестов. Команды из
`frontend/android`, с JDK 17.0.21+9, SDK 36,
`JAVA_TOOL_OPTIONS=-XX:ActiveProcessorCount=2` и
`GRADLE_OPTS=-Dorg.gradle.vfs.watch=false`:

```sh
./gradlew --no-daemon --max-workers=2 -PsomewhereTestBuildType=qa formatApply :app:assembleDebug :app:assembleRelease :app:assembleQa :app:assembleQaAndroidTest :app:lintDebug :app:lintRelease :app:testDebugUnitTest
./gradlew --no-daemon --max-workers=2 formatCheck :app:assembleDebugAndroidTest
```

Журналы — `build-check.txt`, `debug-test-build.txt`; результаты JVM и Lint лежат
рядом. APK хранятся только в `.cache/qa/chat-correction-2.1.0/android-final-r3/`.
Финальный QA SHA-256:
`f8a608dcb6b2d635dd6a80f74645ab66cbca1d60cc598f2b7bc6b2aff3d4e487`.
Source tree SHA-256:
`05a241be76db2f3ff4fb85f2bda7da762514ef3a806eb3a6b6b47bfdcc550ee6`.

## Повторная приёмка

UI suites на r3 собраны, но не запускались. Root координирует полный UI runner
и независимый live-повтор на точном APK. Ключевой motion-путь: открыть полный
picker, закрыть его, включить Reduce Motion, вновь удержать тот же bubble;
проверить первый видимый кадр quick относительно конечного anchor. Затем проверить
normal full exit, чтобы сохранность выходной анимации была подтверждена наблюдением.
Для caption — открыть дату окончания опроса, убедиться в заголовке, выбрать дату
и проверить изменение срока без изменения предложенных дат встречи.

Ни ADB, ни API, ни install не вызывались. Эмулятор и fixture остаются root-owned.
Сборки не доказывают устранение temporal flash; прежние UI pass на r3 не переносятся.
Commit, push и выкладки не выполнялись.
