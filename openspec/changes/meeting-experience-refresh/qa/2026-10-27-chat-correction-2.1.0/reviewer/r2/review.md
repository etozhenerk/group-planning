# Независимый review r2 · DS 2.1.0

Вердикт **needs-fixes**. Полного design/functional pass нет. Android r2 проверялся живьём; web/iOS blocked из-за Mac locked. В отчёте сохранены все 1146 design pairs: 2 needs-fixes, 1144 blocked, 0 pass. Функциональная привязка — `../../run-r2.json`; reviewer не менял plan/run/cases/manifest. Старые r1/2.0 evidence сохранены.

## Идентичность и среда

Design inputHash `24fcfab1dc726c74fe7145090d8ea40ff16ca4095513d51bf93ba42cc4035b52` независимо пересчитан в design-context-start.log; design-check.log — PASS. Android установленный APK SHA `441b4f139ca01973c318000e9e60e3f44515857260315ef18303723dc912ff45` подтверждён pm path + sha256sum и совпадает с диском. Source receipt проверен пофайлово: все существующие файлы совпали, 5 отсутствующих записей имеют sha256=null и соответствуют удалениям. SourceTree `2d3a9e84daa2da78bb5cce0ba220f1d0a21594aa1bda9478631421048082a6f0`.

Web snapshot r8 сверён пофайлово, без несовпадений; loaded browser assets не проверены — CUA недоступен. iOS run07 передан parent; текущая установка независимо не проверена. Однократный CUA inventory вернул apps=[], browsers=[], Mac locked. Последующих попыток доступа в рамках r2 не было.

Только emulator-5554: Android 16/API 36, 720×1600px, 320dpi, 360×800dp, fontScale 1.0, Europe/Moscow. App UI Russian, Gboard Settings English; системный locale не утверждается. QA package dev.groupplanning.android.uitesthost, API https://127.0.0.1:52531, parent-owned r2 fixture. Visual meeting cea00000-0000-4000-8000-000000000001; functional meeting0002 не использована. Private config не выводился и не копировался в evidence. Шрифты по рантайму не исследованы.

## Замечания

1. **AND-21-R2-M01:** Reduce Motion quick picker даёт flash неверной позиции, затем скачок примерно 320px за 33ms. Действия, времена и кадры — motion-checkpoint.md. Needs-fixes для chat-reactions-native/android/reduced-motion. Это дефект по фактической записи.
2. **AND-21-R2-C01:** Plus → Предложить дату → Опрос завершится → Дата открывает календарь с заголовком «Дата встречи». Выбор 30 октября изменяет именно deadline. Заголовок неверно называет редактируемое значение. Evidence: date-deadline, date-calendar, date-calendar-selected, date-calendar-return. Needs-fixes для chat-date-native/android/deadline-fields.
3. Прежний AND-21-D01 повторно проверен: AX заголовка теперь «4 участника». Общий screen pass не выдан.
4. Design observation, без нового дефекта: при 360dp/fontScale1 короткий заголовок «Вечер без планов» и строка даты визуально усечены. Нативная Back-кнопка занимает дополнительное место; отдельного решения об адаптации reviewer не принимал.

## Реальные действия и результаты

Времена ниже UTC; соответствующие screenshots и XML лежат в android/.

- **17:27:** список → первая visual meeting. Inline poll показывает eyebrow, badge, title, description, две vote-кнопки и deadline снизу. Inline task показывает eyebrow, title/chevron, status, компактный CTA «Взять на себя». Сопоставлено с неизменёнными raw refs предыдущей сессии; fresh reference из-за CUA не снят, design pass по историческим картинкам не объявлен. Нативные targets 48dp и системные sheet/datepicker — разрешённые адаптации. Постоянных reaction/people кнопок нет; list bottom navigation исчезла в чате.
- **17:28:** hold message 650ms → quick → Все реакции → full → Back. Контекст не занял отдельную страницу, composer видим, draft «До XX после» сохранён. Enter/exit сняты на MP4.
- **17:28–17:29:** Plus → пять действий меню → Back; smile → emoji dock → Back. Send остаётся видимым. После Back AX focused=true на smile opener.
- **17:29–17:30:** hold own 🍕 chip 650ms → people sheet сразу с 🍕 filter и одной Сашей. Tap Все → Саша 🍕, Лена 👍, Маша 👍. Back → собственная 🍕1✓ и 👍2 сохранены, удержание не toggles. Active UIAutomator tree sheet содержит только sheet и scrim-dismiss, без background header/chat/composer. Это подтверждает изоляцию активного AX окна; TalkBack focus/announcements/custom actions не проверены. selected=false на дочернем тексте не трактуется как отсутствие родительской семантики.
- **17:30–17:31:** scales 0, повтор quick → full → Back → dock → Back. Reduced запись закончилась возле dock Back; temporal dock exit не зачтён. Scales восстановлены в 1.0/1.0/null.
- **17:32–17:34:** Plus → Предложить дату. Два distinct варианта 31 октября/1 ноября, удаления нет. Добавить → три варианта, третий 2 ноября; у каждого есть Удалить. Удалить средний → остаются 31 октября/2 ноября с перенумерацией; Удалить исчезает. Scroll → пять defaults on/on/on/off/off. Deadline без weekday; date/time stacked при 360dp, оба поля 96px=48dp, однострочные. Calendar → 30 октября → Готово возвращает выбранный deadline; CTA доступен. Back закрывает неотправленную форму. Active AX background отсутствует при sheet/calendar. Опрос не создавался.
- **17:35–17:39:** composer с реальной Russian Gboard. Попытка CtrlHome/ShiftRight через ADB не создала selection; это не объявлено дефектом приложения. Native hold на XX дал видимый range. Smile → dock сохранил XX выделенным. Tap 😀 → «До 😀 после». Повтор 😀 → «До 😀😀 после». Keyboard button → Gboard; ASCII X → «До 😀😀X после», то есть caret сохранился в середине. Evidence: composer-selected-word, composer-selection-dock, composer-replaced, composer-repeat, composer-caret-return. Сообщения не отправлялись.

## Cleanup и handoff

Первый Ctrl+A/Backspace удалил только X; capture cleanup-draft НЕ доказывает пустой черновик. Затем end + повтор Backspace очистили поле: cleanup-draft-empty.xml содержит EditText text="". Добавленная в r1 Russian раскладка удалена через Gboard Languages → Edit → выбрать только Русский → Remove. cleanup-english-only подтверждает единственную English US/QWERTY. Subtype восстановлен 1594443099. Window/transition 1.0, animator null подтверждены. Клавиатура закрыта, приложение оставлено в visual chat.

**17:41:40Z emulator-5554 и source переданы parent для r3; после этого reviewer не управлял UI.** Ничего не отправлял, не создавал, не голосовал. API/эмулятор не перезапускал; обычный package и 5556 не трогал. Private credentials отсутствуют в evidence.

## Ограничения приёмки

Это focused live checkpoint, не полный проход 120 cases / 310 pairs. Ни один полный feature case не объявлен pass. Не проверены остальные формы/actions, ошибки/retry, другой аккаунт, access revocation, large text, landscape, low height, TalkBack. Исторические raw refs и инженерные PASS не подменяют эти проверки. Незакрытые состояния полной design матрицы явно blocked; частичные положительные наблюдения остаются в журнале. Матрица не сужена. После r3 нужен новый hash и повтор; старый pass не переносится.
