# iOS run04 — независимый live-журнал

Ревьюер `/root/chat_correction_review`, 27.10.2026. Это частичный прогон,
не итоговая приёмка 2.0.0. Полные кейсы не получили pass. После начала проверки
координатор сообщил о предстоящей замене реализации smile на опубликованный SVG;
результаты run04 не переносятся на новую сборку.

## Артефакт и среда

- QA bundle `dev.groupplanning.ios.uitesthost`, simulator
  `31262733-50DC-46A5-938E-4C462D70F109`; обычное приложение не использовалось.
- Переданный frozen артефакт `.cache/qa/ios-chat-correction/run04/SomewhereUITestHost.app`.
  Aggregate SHA-256 `4361ceef1ebb393068eab1907f2fbbf1dcace6fde0e66cd4bb904e5157bfa565`.
  Основание — `qa/2026-10-27-ios-chat-correction/ios-build-run04.json` рядом с
  этим каталогом QA; receipt прочитан, повторная самостоятельная сверка bundle
  в данном журнале не заявляется.
- Начальный design inputHash
  `90a7a3b18677e9d8395dab741b3c9c817a9d85460a2674477c96267e4a7bc75e`,
  сохранён в `design-context-start.log`. Web/Android продолжали изменяться;
  hash не означает общий freeze и не заменяется задним числом.
- DeviceHub показывает iPhone 18 Pro / iOS 27.0; логический viewport 402×874pt
  по handoff координатора. Полный screenshot окна 2232×1988px. macOS 27.0.1
  build 26A434. UI на русском; часовой пояс Moscow по окружению. Точное имя
  фактически загруженного шрифта независимо не измерено.
- Fixture: изолированный Go memory origin `https://127.0.0.1:61441`, актор Саша,
  визуальная встреча `cea00000-0000-4000-8000-000000000001`.
  Функциональная встреча `...0002` в этом фрагменте не открывалась.
- Все действия выполнены ревьюером через CUA DeviceHub, координатами свежего
  screenshot. AX содержит только chrome DeviceHub, а не семантику приложения:
  VoiceOver-фокус и custom accessibility actions по этому проходу не доказаны.
- В боковом inspector наблюдались Reduce Motion off, VoiceOver off; Text Size
  визуально в начальном положении. Точное numeric textScale не измерено.

## Фактические действия и результат

1. Открыта визуальная встреча. В chat нет постоянно видимых отдельных кнопок
   реакций/людей рядом с каждым сообщением. `ios-run04-start.png`,
   `ios-run04-chat-visual.png`.
2. Сфокусирован пустой composer. Placeholder/caret визуально согласованы.
   Первый введённый символ сохранил baseline. `composer-empty-focused`,
   `composer-first`. Ограничение CUA: `typeText("Д")` дало «Ц» из-за раскладки
   physical keyboard. Это не классифицировано как дефект приложения.
3. Проверено, что simulator paste не доставляет переданный текст, а вставляет
   старое clipboard simulator. Этот ввод немедленно очищен через select all /
   Backspace, не отправлен и не сохранён в evidence. Дальше paste не применялся.
4. Через Device → Keyboard → Toggle Software Keyboard открыта реальная системная
   клавиатура. Через globe выбрана «Русская». Экранные клавиши создали черновик
   «До эх после» (IME autocorrect изменил введённое «хх» на «эх»).
   `composer-software-keyboard`, `composer-russian-draft-ime`.
5. Двойное нажатие на «эх» выделило только среднее слово, видны native handles.
   `composer-selection`.
6. Нажата smile. Открыт emoji dock без backdrop и без автофокуса поиска;
   composer остаётся над ним. Затем явным tap сфокусирован поиск и открыта IME.
   Русскими экранными клавишами введено «пицца», показан 🍕.
   `emoji-open`, `emoji-search-ime`, `emoji-search-pizza`.
7. Tap 🍕 заменил выделение: «До 🍕 после». Повторный tap дал «До 🍕🍕 после».
   Dock остался открыт, отправки сообщения не было. `emoji-replace`, `emoji-repeat`.
8. Нажата кнопка возврата к клавиатуре: IME появилась, caret остался после второй
   пиццы перед пробелом. Экранная «а» дала «До 🍕🍕а после».
   `keyboard-return`, `keyboard-caret-insert`.
9. Bubble Тимофея удержан 650ms при открытой IME. IME закрылась, появился quick
   picker, у выбранного сообщения видна обводка. `reaction-quick-ime`.
   Нажат плюс picker: full picker привязан к тому же сообщению и не закрыл
   composer. `reaction-full`. Закрыт крестиком; draft сохранён.
10. Собственный chip 🍕1 удержан 650ms. Открыта нижняя панель людей с выбранным 🍕
    и Сашей; после release собственная реакция не снялась. `people-own-pizza`.
    Выбран 👍: Лена/Маша. `people-thumbs`. Выбрано «Все»: Саша/Лена/Маша.
    `people-all-filtered`. Закрытие вернуло chat с исходными 🍕1 и 👍2 и draft.
11. Короткий tap 👍 добавил своё участие; после завершения запроса видны 👍3,
    selected outline и checkmark. `reaction-tap-settled`. Второй короткий tap
    снял своё участие, вернул 👍2. Первое мгновенное изображение после запроса
    `reaction-tap-added` ещё показывало 2 и не используется как итог.
12. Через плюс открыто menu, затем предложение даты. `plus-menu`, `date-open`.
    Видны две строки: «Сб 31 октября» и «Вс 1 ноября»; при двух удалить нельзя.
    Все пять настроек видны без раскрывающей секции: on/on/on/off/off.
    Deadline «28 октября», без weekday; время «19:08», поля равной видимой
    высоты, в одну строку.
13. Добавлен третий вариант «Пн 2 ноября»: появились три кнопки удаления.
    `date-third`. Удалён средний: остались «Сб 31 октября» и «Пн 2 ноября»;
    кнопки удаления исчезли. `date-removed-middle`.
14. Нажата дата deadline. Открыт календарь «Дата окончания» с выбранным 28 октября,
    кнопкой «Готово» и крестиком. `date-calendar`. Следующее действие ещё не
    выполнено: Mac заблокировался, CUA сообщает, что automatic unlock не удался.

Все краткие имена screenshot выше имеют prefix `ios-run04-` и suffix `.png`.

## Не использовать как доказательство результата

- `ios-run04-people-all.png` ошибочно назван по планируемому действию: после
  увеличения высоты sheet tap по старой координате попал в строку Лены, фильтр
  остался 👍. Корректное состояние «Все» — `people-all-filtered`.
- `ios-run04-reaction-tap-added.png` — кадр до завершения async запроса.
- `ios-run04-composer-first.png` показывает «Ц», а не «Д»: limitation ввода CUA.
- Tool ожидал settled UI перед screenshots. Статичные изображения не
  подтверждают pressed animation, enter180/exit150, easing или Reduce Motion.

## Дефекты дизайна run04

**IOS-04-D01 · needs-fixes · композиция карточки опроса.** В актуальном raw
402×874 карточка места использует компактный miniheader с автором/временем и
tag «Опрос», затем название/пояснение, голоса и deadline после голосов.
В run04 видны дополнительный внешний avatar, отдельные строки «Тимофей» и
«Предлагает новое место», deadline до голосов и более тяжёлая bubble-композиция.
Это изменение иерархии/порядка, а не требование pixel-identical native/web.
Основание: общая композиция/иерархия `docs/design/platforms.md` и принятый
`2026-10-27-telegram-chat/chat.html`. Evidence: `ios-run04-chat-visual.png`
и свежий `reference-chat-402x874.png`.

**IOS-04-D02 · needs-fixes · inline CTA задачи.** Run04 показывает full-width
«Принять задачу», принятый raw — компактную «Взять на себя». Расхождение текста
и иерархии CTA видно на той же паре изображений. Координатор подтвердил,
что оба расхождения остаются в scope исправления до готовности чата.

## Неполные кейсы

| Case | Состояние run04 | Что осталось |
| --- | --- | --- |
| TC-CHAT-COMPOSER-CARET | частично выполнен, blocked | повтор при крупном тексте; точная геометрия нового SVG/target; новая сборка |
| TC-CHAT-EMOJI-SELECTION | частично выполнен, blocked | точная последовательность 🍕→поиск «сердце»→❤️→«!» и recent; сравнение участка длинного чата |
| TC-REACT-FULL-PICKER | частично выполнен, blocked | полный search/category/select flow, low height и доступное управление |
| TC-REACT-PEOPLE-FILTER | частично выполнен, blocked | требуемый functional fixture, собственный 👍, custom action, accessibility focus/announcements, low-height scroll |
| TC-REACT-HOLD-MOTION | частично выполнен, blocked | cancel до порога/при scroll, temporal запись normal/reduced, реакция выбором, custom actions |
| TC-CHAT-DATE-FORM | частично выполнен, blocked | возврат календаря, крупный текст/low height, invalid/duplicate/focus, draft reopen, lost response/retry, второй участник |

Остальные пары case/platform и design screen/platform/state не пройдены этим
проходом; существующая матрица не сужалась. Ни mock, ни unit/UI suite не
подставлены вместо независимого live-доказательства.

## Инженерные проверки

`npm run agent:check` при подготовке завершился 0. `design:check` начала этого
прохода завершился 1: новые literals в Android ic_emoji.xml, iOS ExperienceIcon
и web FeedRecord breakpoint (см. `design-check-start.log`). Координатор уже
исправляет эти нарушения. Этот старый результат сохраняется без переписывания.
На момент записи testing-manifest указывает plan/run нового цикла, но plan.json
по этому пути ещё отсутствует; координатор уведомлён.
