# Android Create7.6.0 r2: повтор пяти замечаний

Вердикт: **targeted observed-pass**. Пять найденных в r1 расхождений исправлены в проверенном объёме. Только независимый короткий design+interaction checkpoint; финальная приёмка/полная матрица/gates не выполнялись.

Exact frozen APK SHA256 `2f98bca526f37ee1c8e74f430e6d68bbf10e3b29968d7cc811ac2e31ffbbc8bc`, source `391088243ca4677f734a56d40f9c4d1cb0a6d1bdc64bf001f07eb9fd8b009e74`. Байты сверены до/после smoke (`review-binding.json`, `installed-after.json`). Новый собственный memory fixture, только5554/API36,360×800dp/font1 и320×640dp/font1.8. Источники — approved normalized create, UX/create-r4/r5, общие коррекции и контракт полей7.6; свежие raw reference/empty360.png и validation360.png.

- **Cover:** тональная card с border, превью86dp и inset14dp, подписи «Обложка»/«необязательно»/«Добавить фото». [Actual](actual/empty360.png), [raw](reference/empty360.png). На screenshot при density2 превью172px, горизонтальный inset28px. Системный picker не запускался.
- **Header:** дополнительная somewhere-шапка отсутствует, форма начинается Back→«Новая встреча»→легенда. Тот же fresh actual/raw.
- **Helper:** «Время можно уточнить позже · Москва» находится непосредственно под датой/временем; технический Europe/Moscow удалён с этой поверхности. [Normal](actual/empty360.png), [large](actual/large320-helper.png).
- **First error:** реальный пустой submit фокусирует название, весь hint виден над footer/IME. [Actual](actual/first-error-ime.png), [raw](reference/validation360.png). Геометрия hint y826–862px, видимый scroll viewport y136–862px (`actual/result.json`). Подсказка больше не скрыта панелью.
- **Large:** при320dp/font1.8 дата/время расположены в столбик, полная строка «ДД.ММ.ГГГГ» не ломается; helper и дата с подсказкой доступны прокруткой выше sticky action. [Date](actual/large320-date-time.png), [time/helper](actual/large320-helper.png). Unclipped поля: x20–300dp у обоих, дата y475–530.5dp, время y638.5–694dp.

`smoke.log`: OK1test6.33с; фактические действия/метрики/время — `actual/result.json`; screenshots/capture metadata/semantics — actual/. Первоначальный QA stop сохранён в attempt1/: была ошибочная проверка clipped bounds у поля времени за viewport. Driver исправлен только на unclipped измерение тех же полей, затем целевой проход завершён; дефектом приложения этот stop не объявляется.

Создание/unknown/retry/dirty Back из r1 не повторялись и не переносятся сюда как новые pass; cover-upload/OAuth/RSVP/карты/VoiceOver/TalkBack/полные suites не запускались. Новых наблюдаемых замечаний в этих пяти местах не найдено. Pixel regression не заявляется.

Очистка: wm/font/settings восстановлены, own fixture/reverse/remote и private config удалены, QA-процесс остановлен (`cleanup.json`, restored=true). Root fixtures не затронуты;5554 свободен. Код/manifests/tasks/Git не менялись.
