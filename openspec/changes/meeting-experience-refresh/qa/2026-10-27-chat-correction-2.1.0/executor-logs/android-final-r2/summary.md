# Android r2 — склонение числа участников

Исправление замечания `AND-21-D01` из независимого
[android-r1-interactions.md](../../reviewer/android/android-r1-interactions.md).
Предыдущие receipts, APK-хеши и результаты `android-final` сохранены.

## Изменение текста

Применён актуальный `product-copy-editor`. Карта шапки не меняется: название
помогает определить встречу, дата и число участников сообщают её текущие факты,
действия открывают сведения и приглашение. Дубли и новые продуктовые обещания
не добавлялись. Единственная изменённая формулировка — форма числа участников.

`MeetingChatHeader.kt` теперь использует `pluralStringResource`; единственный
ресурс `experience_participants_count` заменён с `string` на `plurals`:
`one` — «участник», `few` — «участника», `many` — «участников», `other` —
«участника». Число остаётся `%1$d`. `MainActivity.attachBaseContext` уже задаёт
русскую resource configuration, поэтому правила количества не зависят от языка
системной клавиатуры. Содержимое скомпилированного ресурса проверено через `aapt2`.
Live-подтверждение «4 участника» на r2 остаётся независимому ревьюеру.

Сверка с frozen source r1 обнаружила ровно два изменённых файла:

- `frontend/android/app/src/main/java/dev/groupplanning/android/ui/invitation/MeetingChatHeader.kt`;
- `frontend/android/app/src/main/res/values/experience_strings.xml`.

## Ширина шапки · AND-21-O02

Формат `meetingChatDate` — `EEEE, d MMMM` с русской locale и заглавной первой
буквой. Для fixture он даёт «Суббота, 31 октября», точно как опубликованный raw
`src/pages/chat/ui/conversation.ts`; добавочного года или времени нет.

При ширине 360 dp Android не включает narrow-режим: опубликованный breakpoint
равен 350 dp. По фактическим modifiers остаётся 128 dp для колонки текста:
`360 − 24` внешних отступов `− 3 × 48` targets `− 40` mark `− 4 × 6` gaps.
В raw нет native Back: для текста остаётся около 186 px после собственных
отступов heading, двух targets по 44, mark 40 и трёх gaps по 6.

Таким образом, обрезание короткого fixture-названия объясняется дополнительным
Back и обязательными Android targets 48. Ellipsis названия задан и в raw, и в
Android. Для подзаголовка есть отдельное различие: Android явно задаёт одну строку
с ellipsis; raw задаёт `white-space: nowrap`, но не clipping/ellipsis. Это
зафиксированное отличие адаптации, а не ошибка формата даты. Данный анализ
не объявляет его визуально принятым. Композиция, размеры, переносы и формат даты
в r2 не менялись; новая композиция требует опубликованной ревизии.

## Проверки и передача

На r2 прошли `formatCheck`, Debug/Release/QA APK, Debug/QA instrumentation APK,
Lint Debug/Release и 126 JVM-тестов. Выполнялись incremental-проверки с
`JAVA_TOOL_OPTIONS=-XX:ActiveProcessorCount=2`, `--max-workers=2`, `--no-daemon`
и `GRADLE_OPTS=-Dorg.gradle.vfs.watch=false`. Команды:

```sh
./gradlew --no-daemon --max-workers=2 -PsomewhereTestBuildType=qa formatCheck :app:assembleDebug :app:assembleRelease :app:assembleQa :app:assembleQaAndroidTest :app:lintDebug :app:lintRelease :app:testDebugUnitTest
./gradlew --no-daemon --max-workers=2 :app:assembleDebugAndroidTest
```

Обе команды запускались из `frontend/android` с JDK 17.0.21+9 и SDK 36.
Журналы — `build-check.txt`, `debug-test-build.txt`; источник и точные хеши —
[source-receipt.json](source-receipt.json). APK находятся только в игнорируемом
`.cache/qa/chat-correction-2.1.0/android-final-r2/`.

Финальный QA SHA-256:
`441b4f139ca01973c318000e9e60e3f44515857260315ef18303723dc912ff45`.
Исходники заморожены. Ни ADB, ни API, ни установка, ни UI runner в этой ревизии
не выполнялись: root восстанавливает собственное QA-окружение для независимой
приёмки. Pass прежнего APK на r2 не перенесён; обзор IME и accessibility не подменён
результатом сборки. Commit, push и выкладки не выполнялись.
