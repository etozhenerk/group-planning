# Независимая проверка web rc11

## Результат

В проверенном автоматическом объёме новых дефектов не найдено.
Exact `web/v0.1.0-rc.11`, commit
`823d93d36f1b4a223a4b43d28d46654fcfa96f28`:

- Original45 WebKit844×390: **12/12 PASS**, прежний React185 не повторился.
- Сценарии55–58, Chromium и WebKit, realtime/read-state включены:
  **14/14 PASS**.
- Два набора unit по scoped projection/QueryObserver/privacy:
  **10/10 PASS**.

Архив, manifest и APIfixture SHA совпали с переданными значениями;
все254 распакованных файла побайтно совпали с архивом.
Product/source/tests expectations не изменялись. Production не переключался.
Собственный fixture8488 остановлен.

## Что подтверждено

Нижняя панель предложения места не имеет SVG-крестика; доступная ручка,
короткий отменённый drag, закрывающий drag, body-pull, busy guard и успешная
отправка прошли. Body-pull и dismiss не добавляют GET или navigation и
сохраняют черновик. Подтверждённая отправка обновляет данные. В Chromium
использован trusted touch через CDP тестового runner; в WebKit — pointer/mouse
путь сценария. Это не полный ручной проход всех панелей на физическом телефоне.
Desktop modal сохраняет крестик.

«Прочитали»: на390 и1440 оба движка подтвердили viewport189px, неизменные
координату y и высоту панели при loading→empty/error/list, повторе и пагинации;
восемь строк прокручиваются внутри. Проверяются реальные DOM bounding boxes,
а не снимок макета. Прочитанность и guard остаются активны.

Отправка: слот12×12 присутствует и при быстром ACK, и queued→sending.
До задержки индикатор не отображается; при задержанной отправке появляется
круговой статус, переход queued→sending не перезапускает ожидание.
ACK сохраняет DOM-узел, ключ и высоту строки, текст «Отправляем» не виден.
После ACK таймер не добавляет индикатор.

Ошибка реакции после смены virtual range: подтверждённый chip остаётся,
ошибка показана, ручной retry успешен. Chromium получил1 запрос в окне
ошибки, WebKit3, оба меньше установленного предела10; ошибок React нет.
Это проверяет устранение обнаруженного feedback range→query→row height→range.
Unit подтверждают отсутствие переноса данных между user/meeting/access epoch,
reactions/receipts/stream epoch, очистку при denied/disabled, сохранение только
подтверждённого пересечения при GET503 и замену snapshot после retry.

## Harness и ограничения

Использован immutable production bundle с отдельным Go memory fixture3b39.
Synthetic OAuth adapter разрешает только local `/__test/provider` того же
loopback origin и отображает его через разрешённый production authorize URL;
реального Яндекса/Telegram нет. Адаптер не меняет assertions.
В копии harness31 ожидаемая версия взята из manifest. Сценарий47 был
адаптирован автором к844×320, потому что production не содержит demo header;
исходный fit45 остаётся844×390. Этот scoped прогон47 не запускал.
Auth-only fallback patch17 прочитан: он сохраняет перехватbusy/pageshow,
передавая ответ через context adapter вместо его обхода. Его5PASS — отчёт
автора, не результат данного независимого набора.

Первый общий запуск55–58 остановлен: серверный read-state flag не был включён,
поэтому56 не имел нужной кнопки/предпосылки. Он не засчитан ни pass, ни
продуктовым fail. Новый изолированный запуск с обоими флагами дал14/14.
Начальная ошибка harness с двумя копиями Playwright устранена только выбором
идентичных MAIN helpers/tsconfig; продуктовые файлы не менялись.

`design:check` на frozen823 завершился ошибкой stale legacy inventory.
Следующий коммитeef5a072 удаляет obsolete literals и обновляет authority;
`frontend/web` побайтно не менялся относительно823. Это записано как tooling
finding: exact823 design gate pass не заявлен.

**Полная ручная и дизайн-приёмка blocked:** Mac заблокирован. Не проверены
живое сравнение всех композиций/анимаций с raw, все типы панелей, реальная IME,
VoiceOver, увеличенный текст и reduced motion. Восьми обязательным manual
checks feature-плана оставлен blocked. Ниqa:ready pass, ниrelease receipt
этот отчёт не выдаёт. Решение о выпуске по ранее данному owner exception
остаётся за основным агентом; этот отчёт не отменяет ограничений.

## Evidence

`provenance.json` связывает точные артефакты, проверки и SHA логов/trace.
`repeat.log`, `read-scoped.log`, `projection-unit.log` содержат фактические
результаты. `range-error-observations.json` — компактные наблюденияGET503.
Полные14 synthetic traces находятся в игнорируемом
`.cache/independent-rc11-review/read-scoped-results/`; не публиковались в Git.
Feature plan/run — в `feature/`, отдельный blocked design report —
`design-review.json`. Старый rc10 диагностический отчёт сохранён.
