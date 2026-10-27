# Живой просмотр raw 2.0.0

27.10.2026, `/root/chat_correction_review`, Codex CUA IAB, отдельная скрытая вкладка.
Координатор разрешил просмотр текущего raw и сообщил, что DS/raw заморожены.
URL, время, source hashes и hashes PNG — в `reference-capture.json`.
Это reference-подготовка. Приложения, API и native в этом проходе не проверялись.

1. Открыт raw chat.html по локальному HTTP URL. Установлен viewport 390×844.
   Видны chat header, сообщения, карточки, composer, нет постоянной smile/people
   кнопки у сообщений. Сохранён `reference-chat-390x844.png`.
2. «Добавить» → «Предложить дату». Одна bottom sheet с X; две даты,
   пять switches on/on/on/off/off. Deadline «30 октября», без weekday,
   date/time в одной строке равной высоты. Снимок `reference-date-390x844.png`.
3. 320×760: deadline уходит ниже первого экрана, собственная прокрутка формы
   открывает его. Поля stacked, CTA остаётся внизу. Снимки top/deadline.
4. 390×430: собственная прокрутка открывает deadline, CTA доступен.
   Снимки middle/deadline. 1440×900: одна центрированная модалка над тем же чатом,
   X и CTA доступны; снимок `reference-date-1440x900.png`.
5. X закрывает форму. Пустой composer сфокусирован, введена «Д».
   На двух снимках placeholder/caret/первый символ имеют общую baseline.
   Далее установлен синтетический draft «До XX после» и открыта emoji-панель.
   Composer/Send над grid, keyboard toggle вместо smile, backdrop отсутствует.
   Escape закрывает dock, фокус на emoji opener, draft сохранён.
6. Bubble Тимофея удержан 600 ms через CUA. Quick появляется у сообщения,
   bubble обведён. «Ещё реакции» открывает full с контекстом сообщения,
   search/categories/grid. Сохранены quick/full 390×844.
7. При уменьшении viewport до 390×430 первый захват получен до завершения
   перерасчёта высоты picker: сохранён как transient `reference-reaction-full-390x430.png`.
   Он не является baseline устойчивого состояния. После наблюдения геометрии:
   composer y=372,h=57; reaction-host y=134.84375,h=229 (bottom=363.84375).
   `reference-reaction-full-390x430-settled.png` показывает composer доступным
   и grid со своей прокруткой. 844×390 также сохраняет composer под picker.
8. «Закрыть реакции» возвращает фокус на тот же bubble; draft не изменён.
   Удержан собственный chip 🍕 600 ms. Sheet «Кто отреагировал» открыта
   сразу с selected 🍕1 и Сашей. После отпускания собственная реакция сохранена.
9. Выбран «Все»: видны Саша, Лена, Маша без контактов, фокус остаётся на «Все».
   X возвращает фокус на исходный 🍕1, own state по-прежнему selected.
   Сохранены `reference-people-pizza-390x844.png` и `reference-people-all-390x844.png`.

Фактическая CSS-метрика composer в IAB: lang=ru,
font-family=`-apple-system, system-ui, Segoe UI, sans-serif`, font-size=16px,
line-height=22px, padding=11px 0px 10px 14px. Это CSS stack, не утверждение
о resolved glyph/font в native.

Проверка не доказывает native IME, VoiceOver/TalkBack, реальный API, 180/150 ms
анимацию или работу приложения. Для product acceptance нужны frozen artifact,
свежий design inputHash, наблюдаемые окружения и отдельные фактические действия.
