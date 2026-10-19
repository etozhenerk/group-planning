# Иллюстрации онбординга · v0.7

Изображения получены из актуальных HTML/CSS-макетов Somewhere в Chromium.
Они показывают существующие состояния интерфейса; это не сгенерированные
картинки чужого приложения. Фото обложки в вырезку приглашения не включено.

| Изображение | HTML-источник для снимка | Исходный экран |
| --- | --- | --- |
| [Приглашение и ответы](example-rsvp.png) | [example-rsvp.html](example-rsvp.html) | [flow-rsvp.html](flow-rsvp.html), блок invitation без обложки, описания и повторной подписи о чате |
| [Открытый опрос](example-poll-before.png) | [example-poll-before.html](example-poll-before.html) | [feed-active.html](feed-active.html), реплика Лены и следующий опрос |
| [Результат опроса](example-poll-after.png) | [example-poll-after.html](example-poll-after.html) | [feed-decided.html](feed-decided.html), те же блоки после завершения |
| [Предложенная задача](example-task-before.png) | [example-task-before.html](example-task-before.html) | [feed-decided.html](feed-decided.html), карточка задачи с автором |
| [Принятая задача](example-task-after.png) | [example-task-after.html](example-task-after.html) | [task-accepted.html](task-accepted.html), задача и два следующих сообщения |
| [Календарь](example-calendar.png) | [example-calendar.html](example-calendar.html) | [hub-calendar-31.html](hub-calendar-31.html), календарь и события выбранного дня |

Вырезки сохраняют шрифты, цвета, данные и формулировки исходных экранов.
Их отдельные HTML-файлы нужны для повторяемых снимков. При изменении текста
или состояния сначала обнови исходный экран и его вырезку, затем PNG.
Не правь надписи в изображении отдельно от макета.

Для обновления снимков открой каждый example-*.html в Chromium с viewport
376×1800 CSS px и сохрани element screenshot для `.example-canvas`.
Высота снимка определяется содержимым блока. Сохраняй PNG с тем же именем.
Проверяй встройку на 320, 393 и 1440 px, подписи alt и оба состояния.

На стартовой изображения размещены как иллюстрации. Для опроса и задачи
radio-группы с CSS показывают состояния «до» и «после». Они независимы,
доступны с клавиатуры и не отправляют реальные голоса или ответы.
Текстовое условие остаётся рядом с иллюстрацией: большинство проголосовавших
после завершения опроса и явное принятие предложенной задачи.
