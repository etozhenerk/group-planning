# Независимая iOS-проверка 16.2 · 29.10.2026

Вердикт: **BLOCKED для полной feature/design-приёмки**. Независимый целевой прогон
**7/7 XCUITest PASS**, 0 failures, 154.885 s; процесс завершился с кодом0.
Это новый запуск существующего кандидата, авторский pass не переносился.
Новых подтверждённых пользовательских дефектов в проверенной области не найдено.

## Кандидат и окружение

- Commit `eef5a072cc011bdab6171f0e4ba99d448086cca7`;545 hashes iOS-исходников совпали.
- Обычный simulator bundle: `553e5a7f329d2b6269b8e58ddd2c87804ff224f3c36604a476b5ad0968a37b56`.
- UITest products: `d835f3e72ae4fd070d494b991ed237c9563d2c3dc9b79c39c89df2c086c7948c`.
- Полные manifests проверены до и после запуска, включая `.debug.dylib`, resources,
  test runner и его test bundle; исходные артефакты не пересобирались.
- Xcode27.1/27A9275, iPhone18Pro simulator iOS27.0/24A434,
  UDID `31262733-50DC-46A5-938E-4C462D70F109`, 402×874pt, 1206×2622px.
- Из фактических capture sidecars: ru_RU, Europe/Moscow, contentSizeCategoryL,
  `.SFUI-Regular`/`.SFUI-Bold`, Reduced Motion=false. Это стандартная категория
  iOS «large», а не проверка accessibility enlargement.
- Собственный ephemeral Go memory TLS TestIOSFixture, scope=chat, synthetic
  данные, realtime/read-state enabled. Только SomewhereUITestHost, без физического
  iPhone, production, системных automation обходов и изменения settings.

Начальная sandbox-попытка не получила CoreSimulator XPC. Точный разрешённый
запуск вне sandbox прошёл автоматическое одобрение; это не обход locked Mac.
Runner сохранён в `run-scoped.sh`: производный от штатного test-ui.sh с удалённым
build-for-testing и отдельным resultBundlePath. Установлен только тестовый host.
После завершения собственный fixture остановлен и его временный каталог удалён
штатным trap. Предыдущий chat-fixture-control восстановлен при наличии.

## Фактический независимый прогон

Подробности: `scoped-results.json`, `ui-run-authorized.log`, `xcresult-summary.json`
и `IndependentScoped.xcresult`. Все12 свежих captures с sidecars сохранены в `actual/`
и просмотрены ревьюером; это снимки этого прогона, не исторические материалы.

| Тест | Результат |
| --- | --- |
| Body swipe → reopen draft; без новых requests | PASS |
| Busy task swipe guard → один POST → success dismiss | PASS |
| Revoked preview privacy → rejoin | PASS |
| Invitation body swipe без refresh | PASS |
| Все7 emoji categories, target44/center/selected/frame | PASS |
| Settings → info → chat без дополнительных detail/feed/participants/sync | PASS |
| Slow send → spinner → ACK; readers loading → empty, geometry | PASS |

По снимкам: у форм задачи/места и readers нет dismiss-X; видимый handle сохранён.
Крестик у поля поиска эмодзи — backspace, отдельное разрешённое действие.
Семь category glyph имеют общий центр и selected underline не поднимает выбранную
иконку. Нативные SVG повторяют геометрию published SVG; различие bytes только
`currentColor` → template black, с template-rendering-intent. У pending/ACK
bubble, avatar и metadata сохраняют положение. Readers loading/empty сохраняют
верх панели, handle, заголовок и область списка; skeleton содержит три строки.

## Неполное покрытие

- **TC-SHEET-CONTROLS-NO-CLOSE**: Частичный PASS настоящих XCUITest: info/settings без X, swipe child→parent→chat; place form draft/reopen; task busy reject и success dismiss; readers без X. Полный кейс BLOCKED: VoiceOver escape, focus/keyboard, date/upload/people не пройдены этим ограниченным бинарным набором.

- **TC-SHEET-NO-REFRESH**: Частичный PASS: счётчики detail/participants/feed/sync не выросли после settings/info dismiss; body swipe сохранил draft и не добавил запросов; invitation body не refresh; task POST=1, busy swipe блокирован, success вернул чат; revoked preview сохранил privacy/rejoin. Полный кейс BLOCKED: все применимые панели и отдельное изменение второго аккаунта через realtime не пройдены в этом запуске.

- **TC-READERS-STABLE-VIEWPORT**: Частичный PASS: loading→empty сохраняет точные header.frame и scrollView.frame; swipe возвращает к сообщению; свежие два снимка визуально совпадают по положению панели. Полный кейс BLOCKED: one/many/error/pagination, small-height и accessibility text scale не выполнены; первого кадра презентации отдельной записью нет.

- **TC-CHAT-PENDING-INDICATOR**: Частичный PASS: slow POST, отсутствие текста Отправляем…, реальный spinner, исчезновение на ACK и высота той же chat-row с допуском1pt. Полный кейс BLOCKED: early screenshot уже после AX ожиданий содержит spinner, отсутствие до1999ms не проверено; fast ACK, queued→sending deadline, remount identity/scroll anchor и failed-retry отдельно не измерены.

- **TC-IOS-EMOJI-CATEGORY-ALIGN**: Частичный PASS: все7 категорий hittable; target44×44±0.5pt, единый midY±0.5pt и точная неизменность frame после выбора; selected trait присутствует. SVG geometry/viewBox24×24 совпали с raw после template stroke substitution, frame23 подтверждён чтением источника. Полный кейс BLOCKED: реальное озвучивание VoiceOver, large text и live raw comparison недоступны.


Raw4.0.0 прочитан как HTML/CSS/JS и SVG; текущего живого browser-render/reference
capture нет из-за переданного locked Mac ограничения. Исторические снимки raw
не использовались для pass. VoiceOver, Reduce Motion=true и software keyboard
не переключались. Предыдущая environment-блокировка клавиатуры сохранена;
новый keyboard pass не заявлен. Публикация4.0.0 сама по себе не visual acceptance.

Название `pending-early` вводит в заблуждение, если трактовать его как кадр <2s:
в логе до снимка выполнены несколько AX запросов, и на самом кадре spinner уже
виден. Это пробел evidence, а не доказательство слишком раннего индикатора.
XCUITest сравнивает высоту row, но не измеряет SwiftUI mount identity/все frames.

## Диагностические наблюдения

Raw xcresult содержит два warning `Invalid frame dimension (negative or non-finite)`:
`testBodySwipeKeepsDraftAndDoesNotRefresh()` и
`testBusySheetRejectsSwipeThenClosesAfterOneSubmission()`.
Source location отсутствует. Assertions прошли, видимого сбоя в сохранённых кадрах
нет; root уведомлён. Нужна отдельная локализация источника warning, не изменение
detents на основании прежней keyboard-проблемы. `xcresult-root.json` сохраняет
исходную привязку warning к тестам.

## Gates и границы отчёта

`design:check` PASS. `design:context` до/после совпадает:
`ebc70507d5797a6340a55a59487a87fc0473280e226f2122dcb77fd03794c8d4`.
`design-review.json` содержит все28 состояний task16.2 как blocked, сохраняя
частичные положительные результаты в observations/evidence. `acceptance/`
содержит новый feature-план пяти кейсов и честный run без ложных pass.
План создан, когда ограниченный XCUITest уже выполнялся: исходный запуск
не переименован в automated/manual full acceptance. Сохранены реальные времена.
Обязательные full ios-unit/ios-ui suites этим bounded запуском не заменены;
авторские179 unit не объявлены независимым повтором.

Продукт, тесты, эталоны, manifests и tasks не редактировались. Все записи ревьюера
находятся только в этом QA-каталоге; чужие Android/QA изменения сохранены.
Commit/push и установка на физический iPhone не выполнялись.

Финальная проверка отчётов: `design:inspect-report` — structure=valid,
currentAcceptance=false. `qa:ready` — ожидаемый отказ: пять manual кейсов
и обязательные ios-ui/ios-unit suites blocked, без schema/source ошибки.
`agent:check` и `git diff --check` — PASS. Начальный qa:ready обнаружил
недопустимые `../` evidence paths; они исправлены в собственном отчёте,
исходный лог сохранён, финальный — `qa-ready-final.log`.
