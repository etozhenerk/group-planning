# Android — инженерная проверка DS 2.1.0

Исполнительская запись от 27 октября 2026 года. Независимые дизайн- и функциональное
ревью продолжаются отдельно; эта запись не объявляет их пройденными.

## Изменения

- Удержание сообщения открывает привязанный к нему picker реакций. Удержание чипа
  открывает людей с выбранным emoji без изменения голоса; короткое нажатие переключает
  реакцию. Постоянные отдельные кнопки реакций и пустая строка удалены.
- Чипы переносятся через `FlowRow`; фон занимает весь Android target 48 dp.
  Enter/exit/pressed/selected используют опубликованные токены и учитывают отключение
  движения. Фокус возвращается к исходному сообщению или чипу.
- Composer использует точный опубликованный smile; остальные значки чата перенесены
  из `src/shared/lib/dom.ts` raw-макета в `ChatSymbol`, включая clipboard с галочкой.
  Неиспользуемые XML-ресурсы удалены без подавления Lint.
- Опросы места/даты и задачи используют компактную inline-композицию: eyebrow,
  нейтральная карточка, голоса перед сроком, компактное действие «Взять на себя».
  Все действия `+` сохраняют мобильные панели.
- Исправлены вертикальное положение поля composer, положение удаления варианта даты
  и реальное обрезание подписи даты без времени в `MeetingCard`. Строгая проверка
  `TextLayoutResult.hasVisualOverflow` сохранена.

## Кандидаты и результаты

Полные хеши, пути и привязка каждого прогона находятся в [receipt.json](receipt.json).
APK сохранены только в игнорируемом `.cache/qa/chat-correction-2.1.0/android-final/`.

| QA APK | Проверки UI | Результат |
| --- | --- | --- |
| `e876af36…e2ecb6` | Chat 6, places 3, tasks 4, date polls 4 | 17 пройдено |
| `a6ea95da…ee8c1a` — финальные glyph | Chat 6 | 6 пройдено |

У этих прогонов разные APK. Places/tasks/date polls не повторялись после последней
замены контуров и равнозначной замены padding на токены. Хеши тестовых APK также
записаны отдельно: ранний `063feb93…4573` сохранён как hash, его бинарник не удержан;
финальный `df83d23f…4a78` сохранён в `.cache`.

На финальных исходниках прошли `formatCheck`, Debug/Release APK, Lint Debug/Release,
126 JVM-тестов, Debug/QA instrumentation APK и QA APK. После сборок
`git diff --check -- frontend/android` прошёл. После сохранения отчёта
`npm run agent:check` также прошёл. Пакет QA —
`dev.groupplanning.android.uitesthost`; использован только `Somewhere_API_36`,
`emulator-5554`, Android 16 / API 36, 720×1600, density 2, font scale 1.

Команды из `frontend/android`, с JDK 17.0.21+9 и SDK 36:

```sh
GRADLE_OPTS=-Dorg.gradle.vfs.watch=false ./gradlew --no-daemon -PsomewhereTestBuildType=qa formatApply :app:assembleQa :app:assembleQaAndroidTest :app:lintDebug :app:lintRelease :app:testDebugUnitTest
ANDROID_SERIAL=emulator-5554 GRADLE_OPTS=-Dorg.gradle.vfs.watch=false sh scripts/test-ui.sh chat
JAVA_TOOL_OPTIONS=-XX:ActiveProcessorCount=2 GRADLE_OPTS=-Dorg.gradle.vfs.watch=false ./gradlew --no-daemon --max-workers=2 formatCheck :app:assembleDebug :app:assembleRelease
JAVA_TOOL_OPTIONS=-XX:ActiveProcessorCount=2 GRADLE_OPTS=-Dorg.gradle.vfs.watch=false ./gradlew --no-daemon --max-workers=2 :app:assembleDebugAndroidTest
```

Ранее те же UI runner-команды с аргументами `places`, `tasks`, `polls` дали указанные
результаты на `e876…`. Полные журналы лежат в `logs/`, отчёты — в `ui-runs/`,
результаты JVM — в [unit-results.json](unit-results.json). Расширение журналов изменено
с `.log` на `.txt`, содержимое сохранено; хеши файлов — в `evidence-hashes.json`.

## Ошибки и ограничения

Сохранены первоначальные Lint failures: неиспользуемый `ic_emoji.xml`, затем
`own_message`. Первое исправлено удалением ресурса, второе — использованием
generated-роли цвета в собственном сообщении. Сохранены UI failure обрезания даты
и неоднозначного локатора статуса задачи, а также ошибочный запуск задачи Gradle
без `-PsomewhereTestBuildType=qa`. Последующие прогоны успешны; тесты не пропускались.

Локатор статуса задачи ограничен активной панелью. Это не доказательство модальности
для TalkBack: реальную accessibility hierarchy проверяет независимый ревьюер.
Motion и Reduce Motion также требуют его отдельной проверки без тяжёлых сборок.

Поправка к исходному handoff receipt: русская Gboard была ошибочно выведена из
settings/dumpsys без проверки открытой клавиатуры. Ревьюер увидел English-only layout
и проверяет русский ввод через штатные настройки IME. Русский язык приложения
подтверждён screenshot. Оригинальный receipt сохранён; поправка записана в `receipt.json`.

Private fixture config, сессии и токены не копировались. Release APK unsigned;
выкладки, обращения к магазинам, commit и push не выполнялись. Эмулятор и долгоживущий
синтетический fixture оставлены независимому ревьюеру.
