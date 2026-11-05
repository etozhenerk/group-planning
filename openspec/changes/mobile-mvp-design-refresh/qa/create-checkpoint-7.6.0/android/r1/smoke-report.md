# Android Create7.6.0 r1: короткий checkpoint

Вердикт: **needs-fixes / superseded source**. Независимый ограниченный design-review + feature-smoke, не финальная приёмка. Runtime: OK1test15.553с. После передачи batch родитель начал исправления, поэтому evidence относится только к неизменному r1 frozen APK, не к следующей source-ревизии.

APK SHA256 `e33b6c74152fccdab8225842d30bb45102093b91b51ffd2b3f211328a3b043f5`; source `4526433ced2ff36ae258cf49f6026722fb333b47496e92dc8a5ac361f36a83b5`. Проверены байты до установки и после (`review-binding.json`, `installed-after.json`). Только5554/API36:360×800dp/font1, brief320×640dp/font1.8. Источники: approved-designs.json→normalized create, ux.md/create-r4/r5 и общие коррекции, docs/design/components/mobile-mvp.md (поля7.6). Новые raw screenshots/URL/time в reference/.

Весь список замечаний текущего ограниченного прохода:

1. **[P2] Обложка не соответствует принятой композиции.** Вместо card с превью86dp/inset14 — маленький52dp thumbnail/пустая иконка в свободной строке; нет тональной поверхности, подписи «необязательно». [Actual](actual/empty360.png), [filled](actual/filled-cover.png), [raw](reference/empty360.png). Это независимо видно на r1; родитель сообщил о планируемой общей коррекции cover, повтор не запускался.
2. **[P2] Первая ошибка скрыта после автофокуса.** Пустая отправка правильно ставит focus на «Название», но hint «Введите название встречи» расположен y887–923px, за sticky-footer, который начинается y862px над IME. Пользователь видит подсвеченное поле, но не его пояснение. UX явно требует первое поле вместе с подсказкой в центре доступной области. [Actual](actual/validation-first-focus.png), координаты/focus/hint в одноимённой semantics.txt; [raw](reference/validation360.png). Наличие hint в семантике не даёт visual pass.
3. **[P2]320dp/font1.8: дата рвётся на «ДД.ММ» и «.ГГГГ».** Две фиксированные колонки не вмещают шаблон даты; карточка даты становится выше поля времени. [Actual](actual/narrow-large-fields.png). Требуется адаптация крупного текста с читаемым единым значением даты, например перенос группы в строки; конкретную реализацию выбирает исполнитель.
4. **[P2] Отсутствует пояснение необязательного времени под датой/временем.** В raw сразу под группой находится «Время можно уточнить позже · Москва»; native убирает эту связь и показывает только техническое «Часовой пояс · Europe/Moscow» в конце формы после описания. [Actual](actual/empty360.png), `empty360.semantics.txt`; [raw](reference/empty360.png). Пользователь не получает принятую подсказку рядом с временем.
5. **[P2] Дополнительная фиксированная brand-шапка.** В normalized create экран начинается тонким Back и заголовком; native добавляет сверху отдельный somewhere header, постоянно отнимающий высоту у прокрутки, особенно с IME/large. [Actual](actual/empty360.png), [large](actual/narrow-large-fields.png), [raw](reference/empty360.png). Допустимость такого отличия не найдена в предоставленных approved/UX; требуется соответствие принятой иерархии.

Фактически пройдено:

- Открытие новой формы, обязательные поля/легенда, название/дата inline hints и focus первого поля. Исправление названия убирает только его hint; выбор даты убирает hint даты.
- 320dp/font1.8: прокрутка к date/time и последнему полю, видимая закреплённая submit-кнопка прямым тапом; замечания выше. Из-за автофокуса после смены конфигурации IME вновь видим — доказательства честно содержат клавиатуру.
- Dirty system Back→«Закрыть форму?»→«Продолжить» сохраняет название. [Dialog](actual/dirty-back.png).
- Реальный native date dialog, время не выбиралось. Existing QA cover selector подготавливает изображение без системного picker; сформированный thumbnail виден, external photo-provider здесь не принимался.
- Existing cover-create fixture реально создаёт встречу, теряет первый ответ. Unknown notice рядом с действием, редактирование названия/cover блокируется, значения сохраняются. Повтор тем же запросом открывает настоящий чат без промежуточного результата. [Unknown](actual/unknown-retry.png), [chat](actual/created-chat.png). Ошибок работающего маршрута в этом объёме не найдено.

Действия/время — `actual/result.json`; screenshots+capture metadata+semantics — `actual/`; driver — `CreateCheckpoint76.kt`; журнал `smoke.log`. Raw result `observed-pass` описывает выполненные функциональные assertions и не отменяет приведённый needs-fixes design verdict.

Границы: known failure/retry отдельно не выполнялся, cover read/cancel/system picker не выполнялись, полная матрица/сuites/gates не запускались. Нет проверки карт/VoiceOver/TalkBack/OAuth/RSVP. Не заявляется pixel regression. Авторские проверки не заменяли независимый smoke; pass других экранов не переносился.

Очистка: wm/font/settings восстановлены, собственный memory fixture/reverse/remote config удалены, QA-процесс остановлен (`cleanup.json`, restored=true). Root fixtures не затронуты. Код/manifests/tasks/Git не менялись. Устройство5554 свободно.
