# Android «Предложить дату» — R1 checkpoint

Вердикт: **needs-fixes**. Это короткий независимый design-review + feature-smoke frozen R1, не финальная приёмка, не полный manifest и не gate.

APK SHA256 `e31e69f78630ca854aec59f69858c37b68046335bdc8c31a18b6be4aeac5594a`; source кандидата `1996b582831f175258cf0b90e6709993c07f2c18f4a4ca4ad5305ebbf7518904`. Установленные APK bytes совпали: [installed-after.json](installed-after.json). Входы и SHA кадров: [review-binding.json](review-binding.json).

## Замечания одним пакетом

1. **P2 — окончание опроса складывается в колонку уже на 360dp.** Дата `[40,1011][680,1107]`, время `[40,1189][680,1285]`; принятый nav-date/date-r1 показывает два равных поля в строке. Actual [bottom360.png](bottom360.png), [bottom360.xml](bottom360.xml); raw [reference-form360.png](reference-form360.png). `PollDeadlineField.kt:68` сравнивает ширину содержимого с viewport breakpoint.
2. **P2 — карточка остаётся прежней композицией.** Фактическая новая карточка: «Новая дата встречи», plain checkbox-строки, actor/time внутри верхнего ряда, отсутствуют note/отдельный weekday/тональные варианты/«Неанонимный опрос». Эталон: «Когда встретимся?», заголовок 20/700, note, date+weekday, тональные варианты, footer, actor/time снаружи. Actual [created-card360.png](created-card360.png), raw [reference-card360.png](reference-card360.png); `DatePollCard.kt:30`, `DatePollBallot.kt`, общий poll feed header.
3. **P2 — системный Back изменённой формы не открывает dirty-confirm.** В свежей форме нажал «Добавить дату», появился третий вариант, затем системный Back: осталась форма с тремя датами, подтверждения нет. Actual [dirty-back-repro.png](dirty-back-repro.png), [dirty-back-repro.xml](dirty-back-repro.xml). Ранее то же наблюдалось после включения «Анонимный опрос». `CreateDatePollSheet.kt:30–46` / `ActionSheet.kt` закрытие. Из-за этого Stay/Leave не пройдены; требуется targeted повтор после исправления.

## Фактически выполнено

- Точный frozen APK, emulator-5554/API36, normal360×800dp; нативный календарь, добавление третьей даты, выбор даты-дубликата, submit → hints только у совпадающих дат, удаление третьего варианта → исходные две даты. [added360.png](added360.png), [duplicate360.png](duplicate360.png), XML/actions.
- Все пять параметров присутствуют, initial значения true/true/true/false/false; anonymous реально переключён. Отдельно все комбинации параметров не прогонялись. Deadline day/time/TZ «По московскому времени» доступны после прокрутки, footer остаётся закреплённым. Изменение/очистка deadline и его required errors этим коротким проходом не покрыты.
- Создана своя будущая встреча через реальный authenticated API poll-owner: старые stock-даты октября уже в прошлом. App открыл её по настоящему invitation token; ответов/акторов не подменял.
- Реальная отправка опроса: fixture выполнил POST и потерял ответ; UI показал «Создание опроса не подтверждено», поля заблокировались, Back сохранил лист, «Повторить отправку» завершило создание. [unknown360.png](unknown360.png), [unknown-back.xml](unknown-back.xml). В реальном feed ровно один `date_poll_created`: [feed-after.json](feed-after.json). Wire key/body отдельно не перехватывались, поэтому самостоятельный wire-exact verdict не заявляется.
- Выбор первой даты → «Проголосовать» → карточка с 1 голосом/«Выбрана»/«Опрос завершён · дата выбрана», feed `date_poll_applied`. [voted360.png](voted360.png).
- Один существующий dirty-form capture 320×640dp/font1.8: даты перенеслись на две строки, текст и submit видны; полная прокрутка/параметры при large не проверялись. [form320-large.png](form320-large.png).

## Ограничения и cleanup

Два raw reference capture выполнены непосредственно из утверждённого normalized frame. Android raw без web-адаптации листа также сохранён как [reference360.png](reference360.png); его высокий лист выходит за viewport, это ограничение reference presentation, а не runtime pass. Данные/состав участников у raw и actual разные; сравнивалась композиция.

Новых app/test builds не было: ADB + frozen APK. Unit/build родителя не заменяют этот smoke. Финальные design:ready/qa:ready, полная матрица, reduced motion, VoiceOver/TalkBack, карты и остальные сценарии не запускались. Device globals восстановлены, QA app остановлен, свои fixture/config/namespace/reverse удалены, только собственный server остановлен: [cleanup.json](cleanup.json). Source/device RELEASED; приложение/Git/tasks/эталоны не менялись.
