# Независимая проверка web album download4.1

**Вердикт: подтверждены работающий ZIP и основная композиция кнопок; полная feature/design приёмка не завершена. Воспроизводимого продуктового дефекта не установлено.** Это не release-ready.

## Точный кандидат и данные

Frozen `/tmp/somewhere-album-web-ui04-20261029`,253 файла. Inventory SHA256 `e65c2c4c7d659914e46293d8bac7a58464f6e8ad2c2adbdbc9b804938b7b2aec` проверен до и после. С исходной квитанцией различается только текущий `useViewport.ts` вне album scope; frozen bundle не менялся. Browser fixture штатный Go memory, только localhost. Исходный8475 не слушал; он восстановлен с разрешения родителя, старые IDs потеряны ожидаемо. Финальный собственный альбом `81bb3e31-a6c3-462d-a391-78eb4114c026`,103 PNG; empty `2ce274e1-2894-46f4-a60a-a9d0124efccd`. Новые hashes в fixture.json. Секреты/storageState в evidence не копировались.

Chrome156.0.8078.73/macOS27.0.1. Действия ручного прохода выполнены native CUA; API использовался для synthetic setup и отдельной проверки lifecycle. Эталоны открыты через8791. После восстановления нового TLS-interstitial не было, агент его не обходил.

## Подтверждено фактически

- Desktop: «Скачать все» рядом с «Добавить фото»; доступное имя «Скачать все фото». На320×844 две равные по ширине колонки одинаковой высоты; перенос подписи внутри. В preparing второй control показывает общий spinner/«Отменить», третьей кнопки нет. Actual/reference снимки просмотрены, их фото/title/date различаются.
- Нажатие в настоящем Chrome создало системный browser download, UI сообщил только «Скачивание началось», индекс1/103 сохранился. ZIP содержит103 уникальных безопасных имён, CRC всех entries корректны, SHA256 каждого равен своему original. SHA256 архива `bf12a3532e8ca8b4a5342b084a4798b71c8413bf516eafc1f46a20072fd2f2a7`; копия native-chrome-103.zip.
- Независимый повтор исходных59/60 на отдельном8476: **Chromium6/6passed**. Проверены неполученные страницы альбома503 с полнымZIP103, отсутствие fetch/XHR для download, index retention,320 preparing/cancel/error/retry geometry, empty, cleanup при уходе доhandoff, целый ZIP и отсутствиеDELETE послеhandoff, реальный RSVP revoke403, logout401.
- API lifecycle: прежний browser-export404; новый202/ready103; параллельный export429; полное чтение download200/28536bytes; consumed404; следующий202; cleanup204. Постоянного429 после полного скачивания нет.

Ручную отмену не засчитываю: между calls подготовка успела завершиться, следующий click начал новый export. Соответствующий снимок переименован mobile320-second-preparation; это не cancelled evidence. Native error/retry/access/leave не завершены вручную; указанные E2E результаты остаются отдельными доказательствами.

## WebKit: точный оставшийся blocker

Изолированный прогон завершился **7passed/5timedOut**, а не12pass: все6 Chromium и WebKit terminal401. Исходные results/traces сохранены. По поручению родителя выполнен ровно один минимальный повтор WebKit320 preparing/cancel/error/retry: **1passed за8.7s с исходным30s timeout**, без правок продукта/теста/ожиданий.

| Исходный WebKit failure | Наблюдаемый механизм |
| --- | --- |
| ZIP103 | Общий90s budget исчерпан после медленного setup; trace дошёл до album/download и финальных status/index assertions. Завершённого pass нет. |
|320 preparing/cancel/retry | Общий30s budget исчерпан около первого download click после замедленного login/seed. Один изолированный повтор прошёл без изменения лимита. |
| empty/leave-before | Timeout в QA seed `POST /api/v1/meetings`, helpers.ts:162; teardown context также>30s. Ошибка central-directory относится к недописанному traceZIP, не к продуктовому albumZIP. |
| leave-after | Timeout уже в первом `page.goto('/meetings')`; browser launch64.5s, document response pending/status−1. |
| revoke | Timeout в первом `page.goto('/meetings')`; browser launch15.7s, createPage5.6s, assets pending/status−1. |

Непосредственная причина отказов — исчерпание общего тестового бюджета при аномально медленных инфраструктурных фазах. **Точная первопричина задержек хоста не установлена**: CPU/memory/network не измерялись, поэтому это не доказанное объяснение «только нагрузкой». Подтверждённого UI/API mismatch нет; один успешный повтор не превращает все5 исходных failures в pass. Диагностика в webkit-trace-diagnostic.json и webkit-longest-calls.json.

Первый запуск до изоляции был загрязнён: мой config унаследовал широкий mobile testMatch, а live и E2E одновременно использовали Sasha8475. Он остановлен, сохранён отдельно как interfered-*;20passed/4failed/69notrun не используются для приёмки. Показанный тогда live429 соответствует одному held export на пользователя; последующая отдельная API проверка исключила постоянную блокировку после consumption.

## Ограничения приёмки

Не подтверждены полный native manual matrix320/390, реальный телефон/Safari, AT/увеличенный текст/reduced-motion, EXIF-ориентация, новые фото после snapshot,1GiB/диск-full, TTL и foreign-owner download. Dataset состоит из малых PNG. Full design pass не выдан: нет всех matched actual/reference state pairs, шрифты/text scale не измерялись. Формальный design-review.json сохраняетblocked, а не screenshot-only pass.

Design context до/после одинаковый `d732edef46139781e4611e66151404b55f7a6e41c51f02f74678dea3ce5f4701`. Первоначальный design:check указал resolved legacy inventory; после правки родителя финальный design:checkPASS. Это структурная проверка, не приёмка UI. Функциональный plan записан ретроспективно для учёта coverage; текущий sourceHash не выдаётся за frozen source. Полные кейсы и обязательные suites не объявлены passed; задачи/app/cases/manifests не изменялись.

## Очистка

Собственные8475/reference вкладки закрыты; No throttling восстановлен, emulation выключен. Fixture session10806 остановлена, E2E8476 завершён runner. Только3 созданных Chrome ZIP с точным совпадениемSHA удалены из Downloads, QA ZIP сохранён. Свой приватный временный storageState удалён. Production не затрагивался. Подробный журнал — interactions.json; машинная сводка — summary.json.

Ретроспективные checks не импортированы в formal run: schema корректно отклонила времена до создания plan. Исходная попытка сохранена в run.pre-plan-history.json; run.json оставлен без исполненных checks, qa:ready ожидаемо не проходит из-за незавершённого покрытия. Даты прохождения не изменялись ради gate.
