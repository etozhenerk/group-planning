# Web15.1/16.1: фокус, touch и панели

03.11.2026. Основной агент проверяет сам по прямому поручению пользователя.
Выпуск исключён из сегодняшнего объёма пользователем и сохраняется в открытой
группе7.3; независимый общий design/qa gate0.3 не закрывается.

## Результат

[Исходный отчёт](results.json):29 успешных применимых проверок,0 flaky.
Команда завершилась кодом1: один дополнительно запрошенный, неприменимый
WebKit-сценарий52 вызвал newCDPSession и получил «CDP session is only available
in Chromium». В обычном playwright.config этот файл отсутствует в testMatch
mobile-webkit. Сам52 успешно прошёл в Chromium с настоящими touch-событиями.
Это не общий зелёный прогон30/30 и не успешный touch-test WebKit.

- 53-pointer-focus:390/1440, Chromium/WebKit — поля сохраняют свой focus,
  указатель не оставляет лишнюю рамку на кнопках/выбранных вариантах/фотостопке,
  клавиатурный focus-visible остаётся. Закрытие фото возвращает фокус.
- 52-album-touch: Chromium — trusted touch по кнопке фото, обе стороны,
  цикл, короткий/вертикальный жест против tap, pointer capture/lost capture.
- 55-sheet-controls: два движка — dismiss не вызывает refresh; body pull
  не закрывает форму, busy guard сохраняет draft, подтверждённое сохранение
  обновляет данные. Крестик отсутствует у мобильной панели и остаётся у desktop.
- 56-readers-stability:390/1440, два движка — viewport/header при loading,
  empty/error/retry/list/pagination; история/resize composer/входящее сообщение.
- 57-pending-metadata: два движка — быстрый ACK без индикатора, медленная
  отправка с отложенным кружком, тот же DOM-node/UI-key/высота/metadata до ACK.

Живой CUA-проход на8466/390×844 дополняет53: открыть фото→закрыть указателем
возвращает фокус в «Открыть фото1», computed outline-style=none, box-shadow=none.
Tab переводит фокус в «Показать сеткой», outline-style=solid, width=3px.
Рамка просмотрена на снимке живого интерфейса; это намеренный keyboard-focus.
Временный viewport браузера восстановлен.

## Подготовка и границы

Первый запуск был остановлен: временный конфиг запускал тесты из корня,
поэтому относительный public/share-card.png не находился; read-state не был
включён в фикстуре. [Первоначальный результат](wrong-fixture-results.json)
сохранён. Повтор сделан из frontend/web с SOMEWHERE_BROWSER_CHAT_READ_STATE=1.
CI/workflow/checker и приложение не менялись.

Проверяется существующий demo-bundle, SHA256 всех его243 HTML/JS/CSS-файлов
сохранены в bundle-sha256.json. Production web после исправления legacy-history
не менялся; изменения этого прохода затронули только QA и SDD. Сегодняшние
web:check231unit и production build остаются применимыми, не повторялись.
Общий release-test, физический Safari и актуальные формальные gates здесь не
заявляются. Нет релиза, production-операций и Telegram.
