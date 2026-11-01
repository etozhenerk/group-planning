# Диагностика WebKit42, 01.11.2026

Изолированный неизменённый `mobile-webkit` test42 прошёл: 1 passed, 0 skipped/unexpected, 31.124s всего. Стандартный read fixture запущен заново на8458 (`reuseExistingServer=false`), immutable v2 web-dist `/tmp/somewhere-sdd-composer-v2`. 1000×10 POST, timeout240000ms и все assertions сохранены. Это свежий isolated PASS; исходный full-read FAIL сохранён.

## Причина исходного провала

`original-full-read.log`: 9passed/1failed, WebKit42 timeout240s в seedPOST до открытия UI, длительность10.3мин. `original-test-results/` сохраняет исходные PNG/error-context/trace.

`original-trace-summary.json` и `original-trace-posts.json` получены чтением исходного trace. 7080 POST начали выполнение;7072 имеют after в API trace,8 остались незавершёнными к остановке. Первые7000 заканчиваются на93.340s общей монотонной шкалы (~36s от начала seed). Затем общий test trace не содержит событий579.071s:93.670→672.741s. В0-trace разрыв579.086s. После возвращения runner сразу обрабатывает просроченный test timer/AfterHooks.

`host-power-window.log` — read-only `pmset -g log` за12:07–12:18MSK:12:08:02 Clamshell Sleep;12:08:15 Maintenance Sleep длительностью581s;12:17:56 DarkWake. Разрыв trace совпадает с системным сном. Подтверждённая причина данного timeout — прерывание окружения системным сном. Продуктовый дефект WebKitUI/10k-поведения не установлен.

## Гипотеза carryover

В `frontend/web/playwright.read.config.ts` один webServer на оба проекта: Chromium10k остаются в памяти до WebKit10k. `backend/internal/httpapi/browser_fixture_test.go:101` создаёт один `memory.New()`. `backend/internal/storage/memory/store.go` Update клонирует снимок под gate; `state.go` clone копирует feed всех встреч, payloadы, receipts, indices и changes. Стоимость линейна по накопленной памяти на запись и может давать квадратичный суммарный seed. Это свойство temporary store, но оно не объясняет579s отсутствия событий и не установлено причиной timeout. Средние длительности по полным тысячам исходного trace20–43ms без монотонного роста к обрыву. Доказательства отказа/overflow tracebuffer нет.

## Узкое решение

Для установленной причины sourcefix не требуется. Повторить неизменённый required read suite на активном хосте; временный `caffeinate -i` только вокруг процесса, без постоянных настроек. Не увеличивать timeout, не сокращать10k и не отключать trace/assertions.

Если carryover позже подтвердится измерением, минимальная fixtureизоляция — отдельный свежий стандартный сервер8458 на каждый project: последовательные запуски обоих проектов, суммарно все10cases, с сохранением10k APIPOST и всех assertions. Production memory semantics ради теста не менять. Сейчас это изменение не сделано и для установленной причины не требуется.

## Evidence и границы

`solo.log`/`solo-results.json` — первая попытка остановилась ДО fixture/test: sandbox EPERM tsxIPC. Разрешённый повтор: `solo-unsandboxed.log`, `solo-results-unsandboxed.json`, `solo-output-unsandboxed/` (ten-thousand-tail.png). `source-before.json` фиксирует тест/helper/config/serverwrapper. Сеть только loopback;8492/8798 не затронуты. Полный повтор имеет отдельные `full-repeat*` outputs, будет записан дополнением.

## Дополнение: полный повтор

Тот же неизменённый read suite на immutable v2, с временным `caffeinate -i` вокруг процесса: 10 passed, 0 skipped/unexpected/flaky, 101.080s всего, начало12:03:59.692UTC. Chromium42 22.709s, WebKit42 45.212s; остальные8cases passed. Shared store/carryover сохранён штатно; он не воспроизвёл исходный timeout. `full-repeat-results.json`, `full-repeat.log`, `full-repeat-output/` сохраняются отдельно. Исходный failed full suite не заменён и не переименован в PASS. `source-after.json` подтверждает4/4неизменённых входа.
