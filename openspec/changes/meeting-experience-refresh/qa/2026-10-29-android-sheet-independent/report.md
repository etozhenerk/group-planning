# Независимая проверка Android · sheets 4.0.0

Проверяющий: `independent-agent:/root/android_sheet4_independent`. Дата: 29.10.2026 MSK.
Результат исходного неизменяемого кандидата: **needs-fixes**, полная приёмка **blocked**.
Это не результат нового кода: исполнитель сообщил о правке во время проверки; исходные hash сохранены.

## Точный кандидат и окружение

- `/tmp/android-sheet4-20261028/final/app-qa.apk`: `b2645c02f44a05132e481cd1b5a787184e91d6c02642c2d31b219b02e092d6e5`.
- Source550: `25a9126d617255a0188d72c5bade6b75bb2672d957b439367db35e1a6f8e3709`; перед запуском все550 файлов совпали. Installed APK также прочитан и захеширован.
- Android16/API36, emulator-5554,720×1600px,360×800dp,density2,fontScale1,Europe/Moscow. Instrumentation metadata: ru-RU/en-US, Roboto и NotoColorEmoji. Фактический `animatorsEnabled=false`; normal/reduced motion comparison не выполнен.
- Собственный memory fixture57180, затем собственный TLS relay57568. Запросы в журнале содержат только method/path/status/time. Credentials, ключ relay и config в отчёт не включены.
- Исходный `design:context`: `49114fb3a74d91c3a5c33bcfefc8d0232af45e7fb725311e81c039931a53bd3c`. Каталог и source hash функционального плана — в `functional/plan.json` и `provenance.json`.

## Подтверждённый дефект

**ANDROID-SHEET4-READERS-GAP**: после загрузки список прочитавших меняет позиции второй и третьей строк.
Published4.0.0 и `controls.css` требуют rowHeight55dp с двумя gap12dp. У skeleton центры1180.5/1314.5/1448.5px, у ready many1180.5/1326.5/1472.5px. При density2 это сдвиг второй строки на6dp, третьей на12dp. Внешние header/viewport остаются на месте.

Независимые actual: `evidence/instrumentation/readers-loading-fixed.png`, `readers-fixed-3.png`; измерения: `evidence/reader-pixel-runs.json`. Старый источник помещает ready rows прямо в ActionSheet с formGroupGap18dp, skeleton — во вложенную колонку с12dp. Авторские тесты проверяли внешний bounds, поэтому7 зелёных тестов не заметили сдвиг содержимого. Исполнитель получил finding; продукт, тесты и эталоны ревьюером не менялись.

## Функциональные результаты

| Кейс | Статус исходного APK | Наблюдение |
| --- | --- | --- |
| TC-SHEET-CONTROLS-NO-CLOSE | blocked | Info/settings/date/place/task/readers и expanded participants без X. Реальные Back/body/handle; dirty guard и draft сохранены. Полная upload/invitation матрица не выполнена. |
| TC-SHEET-NO-REFRESH | blocked | Три выделенных окна info/settings/readers —0 watched GET. Task dismiss до повторного открытия —0; само повторное открытие запрашивает participants один раз. Полная матрица всех панелей не выполнена. |
| TC-READERS-STABLE-VIEWPORT | failed | Внешний viewport стабилен; строки ready many смещаются относительно loading. |
| TC-CHAT-PENDING-INDICATOR | passed | Реальные fast/slow ACK, controlled timer/node assertions и timeout→Retry подтвердили требование на этом APK. |

7 instrumentation tests запущены самостоятельно из точного APK, результат `OK (7 tests)` в `evidence/instrumentation.log`. Это scope из handoff, не полный android-ui suite. Component tests используют controlled Compose state/clock; они не подменяют реальный сетевой путь.

Ручные действия выполнены ADB только в QA target. Info: короткий body swipe сохранил панель, handle swipe закрыл её, draft и focus остались. Settings: ввод QA, swipe вызвал confirmation, «Продолжить редактирование» сохранило QA, Back/discard вернуло сведения. Task: draft QA1 сохранился после swipe/reopen, POST201 создал задачу и показал карточку. Второй synthetic участник присоединился, получил read-marker и отправил realtime сообщение: UI показал7 участников, «Прочитали1» и сообщение гостя.

Readers через живой API: delayed loading → controlled503 error → retry → empty; затем после read-marker второго участника one. Header оставался `[32,1030][688,1078]`. Короткий body swipe не изменил empty viewport, Back вернул focus к собственному bubble. Long list и more доступны в exactAPK component test; реальная пагинация и ошибка следующей страницы не выполнены.

Slow ACK: proxy задержал POST на7s; кадры0.505/1.705s без индикатора,2.605s со spinner,8.005s с ACK. Bubble остался на месте; индикатор находится в постоянном metadata. Fast ACK: POST→201 за0.0033s, кадры0.36/1.00/2.71s без индикатора. ExactAPK tests дополнительно подтвердили same semantics ID/bounds, queued→sending без перезапуска и отмену timer. Controlled40s delay вызвал «Проверяем отправку»/«Повторить»; нажатие Retry дало POST201 и одно сообщение QA3. Отложенный первый ответ привёл к ожидаемому BrokenPipe relay после client timeout, не к дубликату UI.

`evidence/manual-interaction.jsonl` фиксирует реальные inputs, `manual-network.jsonl` — запросы, `network-window-summary.json` — границы наблюдений. Отдельно сохранены два сбоя QA harness: первоначальный второй actor POST422 из-за несовпадения header/body idempotency key исправлен только в helper; лишний Back после expanded participants вывел Activity в launcher, затем target явно открыт вновь. Они не представлены как ошибки продукта и не дают pass неисполненным шагам.

## Ограничения и gates

Live raw недоступен при locked Mac; повторной просьбы разблокировать не было. Системные large-text/landscape/normal-versus-reduced настройки не менялись и соответствующие проверки blocked. Нет полного независимого upload/invitation body sweep, полного busy реальной формы, actual reader pagination/error-next-page. Ни один design state не получает pass без reference; many получает needs-fixes по числовому опубликованному контракту и actual.

Исходный `design:check` прошёл как structural check. Полный android-unit и полный android-ui не запускались: candidate не пересобирался, scoped7 не выданы за весь suite. `qa:ready` и `design:inspect-report` проверяются с сохранённым исходным hash; изменение inputs исполнителем ожидаемо лишает этот отчёт актуальности для нового дерева. Новый APK требует отдельного отчёта.

## Очистка

QA процесс остановлен. Удалены только собственные origin/namespace data files, config, remote XML и evidence directory; собственные reverse57180/57568 удалены, остальные reverse сохранены. Memory fixture завершился PASS, relay завершён. Private test credentials/cert keys удалены вместе с собственным временным каталогом. Глобальные настройки и обычное приложение не изменялись. Детали — `evidence/cleanup.json`.

Фактические gates: `agent:check` и `git diff --check` прошли; JSON схемы валидны. `qa:ready` отклонил исходный план: `Stale catalog or unresolved coverage`. Первый design inspect выявил относительные evidence paths; они исправлены в собственном отчёте, повторный результат сохранён в `evidence/design-inspect-corrected-paths.log`. Readiness не заявлена.
