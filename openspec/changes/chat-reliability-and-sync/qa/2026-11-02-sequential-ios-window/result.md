# iOS5.3 — окно, первое непрочитанное и якорь

Основной агент последовательно, только существующий iPhone18Pro simulator
31262733-50DC-46A5-938E-4C462D70F109/iOS27.0 и локальный HTTPS memory fixture.
Ни production, ни store, ни физический iPhone не использованы. Source hashes — source.json.

PASS: новый `testHistoryAnchorSurvivesKeyboardRotationSendAndReentry`,30,519с,
`ios-rotation-settled.log`, xcresult194651-56651.120 настоящих сообщений,
first_unread61 подтверждён API; после открытия marker не уходит в дальний
невидимый хвост. Настоящая экранная IME, закрытие касанием, окончательная
геометрия landscape/portrait, новый хвост, собственный подтверждённый POST и
возврат в чат сохраняют сообщение относительно границы viewport с допуском2pt.
Точный поворот дожидается завершения, максимум5с; допуск не увеличен.
Четыре реальные фотографии экрана — ios-actual/manifest.json, осмотрены.

PASS: `testConversationHistoryRetryBackgroundAndSettings`,71,018с,
`ios-legacy.log`: настоящий HTTP prepend через удержанную страницу, anchor≤2pt,
разные/неподдерживаемые записи, offline отправка и явный retry без дубля,
background/return, настройки/конфликт и большой текст. `ChatWindowTests`
в текущем unit-наборе проверяет500 записей из800 с защитой anchor/pending;
owner tests — cursor/history/access lease, stable intent и projections.

Исправлены начальная прокрутка к ещё не реализованной lazy-строке и ошибочное
включение follow на краю загруженной страницы при hasNewer. Сначала используется
stable key LazyVStack, затем измеренная координата сообщения; начальный
технический расклад не сохраняется как пользовательский anchor и не читает хвост.
До первого позиционирования строка не показывается в неверном месте.

Сохранены первоначальный FAIL и промежуточные сборочные ошибки. Два отдельных
ложных измерения QA исправлены: компактная шапка сравнивается целиком вместо
её центрируемой кнопки; поворот проверяется после системной анимации. Отдельного
5pt-дефекта клавиатуры не подтверждено; пробное изменение defaultScrollAnchor
отменено. Поддержка iOS17 сохранена.

Обязательные проверки PASS: swift-format, полный unit-набор213 (212 успешны,
один physical-device protection skip), чистые Debug/Release build+analyze.
Логи ios-format/ios-unit/ios-debug/ios-release. Полный performance10k/frame/memory
и независимые общие5.5/7.7/7.9/дизайн-gates остаются открыты; их PASS не заявляется.
