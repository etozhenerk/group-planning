# Android author qualification · 01.11.2026

Исполнитель /root/sdd_server_audit. Это авторские проверки исправления QA host,
не независимая функциональная/дизайн-приёмка и не основание whole-task checkbox.
Android runtime, backend, catalog, CI, Telegram и релизы в этом этапе не менялись.
MAIN имел ранее интегрированные native changes; они сохранены.

## Результаты

| Проверка | Фактический результат |
| --- | --- |
| Default Compose callback / lifecycle StateFlow | 2 отдельных fresh-process FAIL: продолжение на фоновых callback threads |
| Простой Standard dispatcher | 2 FAIL: initial tasks не запускаются idle detector |
| Standard + public current-task idling resource | 2/2 PASS вместе; effects/collector/apply main, последующее state обновление видно |
| Исходные 10 full failures + motion controls | 17/17 PASS |
| Required checks | clean/format/Debug/unsigned Release/LintDebug+Release/194 unit/Debug instrumentation/QA build PASS; agent:check PASS |
| Первый full после scheduler patch | 83/85 product + 2/2 internal PASS; 2 FAIL, 0 skip; persistence NOT_RUN |
| Второй full после QA action fixes | 84/85 product + 2/2 internal PASS; 1 FAIL, 0 skip; persistence NOT_RUN |
| Текущий Entry class | 6/6 PASS, включая draft и atomic Retry |
| Текущий Saved font1.8 / glyph control | 1 PASS на неизменном runtime |
| Штатный persistence scope | 2 отдельных instrumentation процесса PASS; fixture PASS19.67s |

Полный87 не объявлен PASS. Первый и второй failed runs, source snapshots,
точные JUnit и raw сохраняются отдельно. Бесконечные full циклы прекращены;
дальнейшую независимую live qualification назначает родитель.

## Причины и изменения QA

Pinned Compose UI Test1.9.5 использует UnconfinedTestDispatcher при отсутствии
явного TestDispatcher. Реальный старый stack содержит Recomposer.applyChanges
на OkHttp. Контроли воспроизвели off-main callback и collectAsStateWithLifecycle.
QA factories теперь передают отдельный Standard dispatcher/scheduler на rule.
Публичный IdlingResource перед штатным Compose resource запускает только
scheduler.runCurrent() на main; не продвигает часы и не меняет autoAdvance.
MotionDurationScale и frame durations сохранены. Root независимо проверил
helper delta: `root-helper-review.md`.

Все37 существующих rule call sites изначально меняли только import aliases.
Две внутренние thread regressions включены в штатный all:85product+2internal;
два process-death stages запускаются отдельно.

Последующие адресные QA corrections:

- Entry draft: перед двумя native UiDevice Back тест подтверждает видимое
  набранное значение. Native actions обходят Compose clock; без этого UI Flow
  collector ещё держал прежний empty draft. Старый метод FAIL воспроизведён,
  исправленный сохранил исходные assertions восстановления и прошёл.
- Calendar: существующий «Поход» находился ниже viewport после переключения
  отдельной группы без даты. Обычный performScrollTo перед сохранённым
  assertIsDisplayed проверяет реальную доступность карточки. Требование не
  задаёт автоматическую прокрутку. Старый FAIL и actual bounds/screenshot
  сохранены; runtime не изменялся.
- Entry Retry: снимаемый fault раньше отдельного поиска/idle позволял pending
  refresh восстановить UI до нажатия. Тест получает существующий OnClick при
  удержанном fault, затем атомарно на main снимает отказ и вызывает тот же
  canonical UI callback через performSemanticsAction. QA app и release Retry
  не получили особого пути; expected/таймауты не ослаблены. Full FAIL остаётся
  в истории; isolated old method PASS зафиксирован отдельно, новый весь class6PASS.

## Saved caption: отозванный visual finding

Первоначальная оценка картинки как обрезанной была слишком категоричной.
Контроли на том же runtime/font1.8 показали:

- unclipped и visible Text bounds:81px; область1185..1266 внутри viewport424..1380;
- resolved Typeface Paint.getTextBounds + TextLayoutResult baseline55 ожидают
  строки ink24..63; Android PixelCopy реально показывает24..62;
- независимое декодирование физического PNG тем же foregroundRGB185/185/194
  даёт точно24..62, абсолютные y1209..1247. Глифы рисуются и ниже кажущейся
  границы карточки1242; разница с метрикой —1px raster/AA округления.

Поэтому именно finding «нижние глифы Приглашает Саша обрезаны при1.8» отозван.
Это не общий design PASS. Старые изображения/замечания сохранены; новый
runtime/новый UX ради ошибочной интерпретации leading не вводились.
К Existing Saved UI test добавлены bounds и glyph-ink assertions; они не
требуют размещать подпись внутри Surface и сохраняют исходную композицию.

## Артефакты и source

App QA SHA256 `8936394b18ddd8e3a5b6d5fb2fdf7dfb297b7019ce1beabb50f6c11fe1315090`
оставался прежним во всех контролях. Текущий instrumentation SHA256
`29538d66bd31b9c519d245b4308899c5e39168d379a9f1f1d0ee7e54ec39acf1`.
Synthetic debug certificate414f3f07… из прежнего ANDROID_USER_HOME; обычное
приложение не устанавливалось, ключи/данные не удалялись ради signing mismatch.

Основной raw: `/tmp/somewhere-android-qa-dispatcher-author`:

- `default`, `fixed`, `fixed-pump`, `targeted-2` — отдельные controls;
- `full` — первый87, source1052/1052 MATCH;
- `full-final` — второй87; Android/backend/contracts unchanged, но три root
  testing-tooling files изменились во время run и честно отмечены в source-after;
- `isolated-entry-original`, `isolated-calendar-original`, `calendar-diagnostic`,
  `entry-ui-ack`, `calendar-visible-scroll`, `isolated-list-error-original`;
- `entry-atomic-retry-class`, `saved-glyph-ink-original-runtime`,
  `saved-ink-control/physical-glyph-analysis.json` — текущие targeted;
- `persistence-current` — штатные prepare/restore и fixture log.

Финальный двухфайловый QA delta для независимого root review:
`qa-retry-ink.delta.patch`, SHA256
`6a4a2e38991c8990ccf4abaf7a069cd3435b5f052dbb5da410faaac8778dfced`.
Более ранние patches/failed build prototypes сохранены отдельно. Первая
попытка build использовала другой debug home; install был отклонён, uninstall
не выполнялся. Дальнейшие сборки использовали прежний synthetic key.

Штатный cleanup остановил собственные memory fixtures/QA processes, удалил
их remote configs, reverse mappings и device evidence outputs после pull.
Persistence доказывает unsent queue/process death; он не заменяет отдельный
lost-ACK/canonical reconcile сценарий. Физический Android не проверялся.

## Следующая независимая приёмка

Прочитать exact deltas, проверить текущие artifact/source hashes, затем живой
проход назначенного reviewer на5554. Для account5.2 есть отдельный Android
design manifest с default/large-text/return-from-profile; нужны также session
и отсутствие DELETE при просмотре, а не только отсутствие кнопки на screenshot.
Для chat6.1–6.5/7.8 нужен case-level verdict по34 IDs, а для performance1.6/7.9
текущий UI run не даёт полного100k/frame/memory/commit→visible baseline.
`android-task-case-inventory.json` сохраняет точный manifest mapping27tasks/154IDs.
QA/design gates и whole-task checkboxes до независимой проверки не закрывались.
