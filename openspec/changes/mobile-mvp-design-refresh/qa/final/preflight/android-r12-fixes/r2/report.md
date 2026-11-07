# Android R12 tail — независимый targeted preflight R2

**Оба запрошенных tail-target прошли на точном APK34239. Это checkpoint, не formal acceptance полного scope.**

- Source:`81be42a9e80aac499ee4c4c1836748ea7ad17ddb0ce08630f3e6750492891000`.
- Exact immutable APK:`34239e78958708bbc0c9af79ad61f8cd3676688a182cf3559dbd6f295db4e45f`.
- Binding зафиксирован до runtime в `candidate.json`; отдельные fixture/helper/source guards рядом.

## Проверенные действия

**Cached-month/newday error:** API создал51встречу одного месяца; month cache имеет nextCursor, выбран новый день с отсутствующей page и сохранёнными counts. При реальном GET outage сетка/выбор сохраняются, показано «Не удалось обновить встречи» с компактным refresh, большая первичная ошибка отсутствует. Нажатие refresh восстановило данные без изменения дня/месяца/периода. Actual:`actual/cached-newday-*`, model facts:`actual/cached-newday.json`. На снимке выбранная строка прокручена к подписи ошибки; нижняя часть48dp refresh может находиться у границы viewport, оставшийся scroll range есть. Это не проверка всех scroll-состояний всего календаря.

**Roster error/retry:** из реального чата открыта Info с собственной ошибкой GETparticipants. После прокрутки видны нейтральный блок, текст и собственный повтор; измеренный TextLayout проверен на13sp/20sp. Повтор в той же fixture восстановил Ready, Info осталась открыта. Отдельно выполнено при fontScale1 и1.8 на360dp; settled PNG/AX/XML показывают текст и действие. `actual/roster-error-{normal,large}.png`, `roster-recovered-*`; успешный метод8.485s (`roster-runtime.log`). Форма/цвет/отступы сверены с поздним neutral-card override frozen raw, сохранённым в `../roster-error-css-authority.json`; min48 — опубликованная native адаптация.

Первый общий instrumentation run содержит один отрицательный результат **своей QA-подготовки**:51календарная запись заняла первую страницу, поэтому ещё не подгруженная встреча для Info не находилась. Сетевой API факт(firstPage50,targetAbsent,nextCursorPresent), исходный helper и log сохранены в `history/initial-two-target/`. Продуктового дефекта по этому запуску не заявлено. Календарный target уже был выполнен и не повторялся; только roster повторён с явным dataReady в отдельной свежей scenario fixture. Сброса между error и retry не было. Начальный отрицательный suite не переименован в общий pass.

## Границы

Полные204unit/99UI+2persistence на новом formal plan здесь не запускались. Полный check.sh root завершился exit0 до копирования APK (авторское доказательство, hash лога — `source-guards.json`). Прежние проверки5edb/R11 и предыдущие положительные/отрицательные proofs не переписывались и не переносились на34239. Повторялись только две последние исправленные поверхности; нет claims о полном283case/823state scope, TalkBack или новых task gates.

Приложение/канонические тесты/кейсы/manifest/gates не менялись. Публикуемый QA helper — отдельный artifact, исполнялся только в прежнем private CoW instrumentation; CoW app APK не устанавливался. Calendar и roster fixture разделены на границе независимых сценариев, обе — свои Go memory.Store без production получателей. Source/config/binary/helper hashes сохранены без значений credentials. После проверки свои2reverse/config/process удалены, QA app остановлен, wm reset/font1 восстановлены. Source/device/Gradle переданы root.
