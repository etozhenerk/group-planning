# Android r1 · 2.1.0 · частичный live-журнал

Ревьюер `/root/chat_correction_review`, 27.10.2026. Итог текущего фрагмента:
**needs-fixes / дальнейшие действия blocked**. Полные кейсы не получили pass.

## Идентичность

Управление началось только после явного окончательного handoff исполнителя.
Пользователь через координатора разрешил ADB только для QA emulator-5554.
Обычное приложение и другие устройства не использовались. Первые sandbox
команды не смогли подключиться к ADB (`smartsocket listener: Operation not permitted`);
тот же явно разрешённый5554 стал доступен после штатного approval review
команд вне sandbox. Обхода на другом устройстве не было.

- Установленный package `dev.groupplanning.android.uitesthost`.
- SHA-256 установленного APK, независимо полученный через `pm path`/`sha256sum`:
  `a6ea95da0c190732915d1e915bc7bd479984a9edc19c64dcc62b6c2473ee8c1a`.
  Совпал с переданным APK. `environment-handoff.json`, `apk-disk-verification.json`.
- Все464 файла source receipt независимо сверены без расхождений:
  sourceTreeSha256 `6e6dd71e5f188e5ce2bc2867be87dad82f7fc24bfd865aa9ec53f584bff69b39`.
  Исходный receipt и обновление checks при handoff сохранены раздельно.
- Начальный общий design inputHash
  `d9d204362d8ff69395490a6957f3b757cb949624076c206f2f8eaa1e69906c79`.
  Это snapshot, не final freeze web/iOS; он не заменяется задним числом.
- Android16/API36, sdk_gphone64_arm64,720×1600px,density320 (360×800dp),
  fontScale1.0, timezone Europe/Moscow. Window/transition scales1.0,
  animator_duration_scale=null (системный default). Ориентация portrait,
  accelerometer_rotation1,user_rotation0.
- UI приложения фактически русский; `persist.sys.locale` пустой, Gboard/settings
  изначально English. Переданное предположение о ru-RU системной locale не
  подменяет эти наблюдаемые факты.
- Изолированный API `https://127.0.0.1:52531`, публичная fixture metadata
  сохранена. Открывалась только visual meeting `cea00000-0000-4000-8000-000000000001`.

## Выполненные действия

1. Получены текущий список двух синтетических встреч и AX дерево (`start`).
   Открыта первая визуальная встреча tap по её карточке (`chat-visual`).
2. Наблюдались poll с miniheader/бейджем «Опрос», заголовком, объяснением,
   голосами и deadline после них; у карточки нет avatar/bubble сообщения.
   Task показывает мини-заголовок, название/chevron, статус и компактную
   «Взять на себя». Прежнее iOS-run04 расхождение сюда не перенесено.
   У bubble/chips не видно постоянно отдельных smile/people controls.
   Нижняя навигация списка отсутствует в чате.
3. Tap названия «Заказать пиццу» открыл task details sheet (`task-details`).
   Видны название в header, статус, автор Лена, адресат Саша, допустимые действия
   текущего recipient/organizer. Ни одно accept/decline/cancel не выполнялось.
4. UIAutomator active root sheet содержит только панель, scrim-dismiss и её
   действия. Background chat/header/composer, и второй статус фоновой карточки,
   отсутствуют в этом активном дереве. Это положительное наблюдение modal
   isolation на task details; оно не доказывает TalkBack announcements или
   полноту custom accessibility actions.
5. Системный Back вернул тот же chat (`task-back`), task/reactions не изменились.
6. Tap пустого composer открыл настоящий Gboard (`composer-empty`), затем
   `input text D` ввёл один символ (`composer-first`). По двум кадрам baseline
   первого символа согласован с placeholder/caret; numeric font metric не
   измерена. Повтор large text пока не выполнен.
7. Единственный D очищен Backspace. Удержание пробела650ms не открыло chooser:
   в draft появился пробел (`keyboard-language`). Это setup attempt, не результат
   продуктового кейса. Исходный выбранный IME subtype оказался1594443099.
8. Изменение selected_input_method_subtype на переданный -1807566855 не
   переключило видимый QWERTY (`keyboard-russian`). Штатная Gboard Settings →
   Languages показала **только English (US)** (`gboard-settings`, `gboard-languages`).
   Исполнитель уведомлён и признал, что его ru-RU IME handoff был предположением
   из настроек, не проверкой реальной клавиатуры.
9. Через Add keyboard → Search «Russian» → «Русский (Россия)» → выбранный
   «Русский» → Done добавлена русская клавиатура. Два Back вернули приложение.
   `gboard-russian-enabled` показывает оба языка; `gboard-return` — настоящую
   русскую Gboard. Это временная QA-настройка, требуется cleanup ниже.
10. Закрыт системный баннер о языке. Экранными клавишами и ASCII XX набирался
    «До XX после». Первый быстрый batch дал «До XXпосле» (`composer-russian-draft`),
    последующая серия аппаратных стрелок/space — «До XXпос ле»
    (`composer-russian-draft-spaced`). Ни один из этих setup attempts не принят
    за ожидаемый draft/selection, не отправлен и не классифицирован как
    доказанный app defect: использовалась слишком быстрая последовательность
    ADB/IME событий без поэтапной проверки cursor.
11. Штатный Ctrl+A/Backspace очистил собственный draft (`composer-reset-russian`).
    Ввод повторён через русские экранные клавиши с интервалом250ms: shift,д,о,
    space,ASCII XX,space,п,о,с,л,е. Последующий UIAutomator завершился255.
    Повторный **read-only** capture сообщил `device 'emulator-5554' not found`;
    screenshot также недоступен. Поэтому фактический текст после этого ввода
    неизвестен. Ошибка сохранена в `composer-exact-draft-retry-ax-error.txt`.

Имена screenshot/XML выше имеют suffix `.png`/`.xml`. Продуктовые send/create/
accept/reaction mutations не выполнялись. Draft не отправлен. Изменения
ограничены локальным draft и временной настройкой QA Gboard.

## Замечания

**AND-21-D01 · needs-fixes · русская форма числа в шапке.** AX содержит
«Суббота,31октября · 4 участников». Для4 нужна форма «4 участника», как в raw.
Evidence: `chat-visual.xml`; правило — корректная русская продуктовая копия и
принятый raw `chat.html`/model с четырьмя участниками. Координатор уведомлён.

**AND-21-O02 · design observation, требуется оценка адаптации.** При360dp и
fontScale1.0 короткое fixture-название видно как «Вечер без план…»; дата/число
также обрезаны. `chat-visual.png`. Native Back занимает дополнительную ширину;
это явно отмеченная причина для анализа, а не требование pixel-identical web.
Нельзя объявлять header полностью совпавшим с эталоном по этому кадру.

## Незавершённость и cleanup

Устройство5554 исчезло во время read-only capture, без stop/restart/clear со
стороны ревьюера. Координатор и исполнитель уведомлены. Другие устройства
не используются. До восстановления того же5554 заблокированы все последующие
live действия и cleanup.

После восстановления: проверить фактический draft; завершить сценарии, затем
очистить только собственный draft, удалить **добавленную ревьюером** русскую
Gboard layout через Languages/Edit (вернуть исходный English-only), восстановить
selected_input_method_subtype1594443099. Другие системные настройки ревьюер
не менял. Сервер/fixture/process сохраняются.

Motion screenrecord ещё не начинался: по указанию координатора он отложен до
завершения heavy builds. Статичные screenshots не доказывают enter/exit,
pressed, duration/easing или reduced motion. Composer selection/dock, reactions,
plus/allactions/date, large text/landscape/TalkBack и функциональная встреча
ещё не пройдены. Ни один полный case не получил pass; матрица не сокращалась.

Проверка документов `npm run agent:check` завершилась0 (`agent-check.log`),
`git diff --check` —0. Это не функциональная или визуальная приёмка приложения.
