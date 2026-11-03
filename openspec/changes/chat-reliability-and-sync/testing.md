# Тестирование chat-reliability-and-sync

## Android: возврат ко входу · 02.11.2026

Дополнение `TC-CHAT-SECURITY-0E0CB54C`: после401/expiry/revoke внутренний
маршрут встречи без сессии открывает уже принятый последний слайд входа
(`g03/skip-to-last`), а не ошибку обновления с бесполезным повтором. Проверить
доступность CTA, отсутствие приватных строк, сохранение meetingID при
пересоздании и отличие публичного token-приглашения: оно сохраняет preview.
Повторный вход не записывает RSVP. Обычный онбординг по-прежнему начинается
с первого слайда; внешний вид/токены слайдов не меняются.

## Точка отсчёта восстановления · 02.11.2026

Пользователь подтвердил: «До 2 секунд на догрузку после подключения; при сбое
сервера сохраняем повторы с паузами». Для `TC-CHAT-SYNC-BC07BEB1` начало
измеряемой догрузки — фактическая готовность авторизованного соединения/
подписки. Сервер снова доступен → соединение готово измеряется отдельно;
паузы повторов не меняются. Завершение — все 100 изменений применены в UI,
а не только получен HTTP-ответ. Профиль RTT 150 мс и бюджет до 2 с сохраняются.

Предусловия существующего кейса ссылаются на этот документ; его ID, сценарий
snapshot→subscribe и требования к HTTP catch-up, включая SDK recovery,
сохраняются. Если fallback мог догрузить данные до подключения SDK, нужен
отдельный контроль с удержанием канонических HTTP-ответов до готовности
подписки. Исходный Android-замер 7,790158 с от доступности сервера остаётся
историческим FAIL этого профиля. Новый контроль записывается отдельно;
старый результат не превращается в PASS сменой названия метрики. Более
строгие уже успешные замеры web от доступности сети сохраняют свои timestamps.

## iOS: изоляция полного QA прогона · 01.11.2026

В source-suite `ios-ui` проверяется весь штатный набор на одном существующем
симуляторе, после `ios-unit`. Нужны собственные UITestHost/fixture и сохранённые
исходные failures; это не ручная приёмка всех cases и не проверка physical iPhone.
Перед новым планом проверяется настоящая экранная IME: временный профиль
`AutomaticMinimizationEnabled=false`, readback и actual keyboard frame внутри
окна приложения. Исходная настройка восстанавливается после прогона.

Нейтральные предусловия не зависят от прошлого теста: новый QA namespace
очищает только прежние данные UITestHost, а повторный запуск того же сценария
сохраняет draft/outbox/selection. Серверная fixture должна сохранять действующую
сессию на весь source-suite, создавать будущие встречи для rejoin и брать
текущую RSVP revision для второго участника. Это не изменение production TTL,
часовой отсечки или ожиданий кейсов. Общие raw assertions и timeout budgets
сохраняются. Основные связанные cases — TC-CHAT-OUTSIDE-KEYBOARD,
TC-CHAT-SYNC-E77C7AE6, TC-CHAT-SYNC-6F728A92, TC-CHAT-CAPABILITIES,
TC-SHEET-NO-REFRESH и TC-ACCOUNT-FB303DFB.

Regression проверяет границы календаря и устаревшую RSVP revision; затем
выполняются полный simulator unit/UI и независимый проход изменённого setup.
Исторический full run 57/40/2 и успешный IME preflight3/3 не переписываются.


Обновлено 27.10.2026 по разрешению продолжить технический этап после критичных
UI-исправлений. Это спецификация и checkpoint, не результат проверки приложений.
Ни один checkbox не закрыт, product tests/SDK/миграции этой подготовкой не запускались.
Исторический planning-verification.md сохранён. Конкретный следующий кодовый шаг —
web receive cursor (1.1/4.1), параллельно bounded Reader и text/media retry (1.5/2.1/2.2).

## Объём и границы

Полный объём четырёх specs сохранён: независимые позиции приёма/чтения/истории,
ограниченные страницы и окно, sync journal/epoch/through, атомарный outbox,
Centrifuge hints/recovery/fallback, durable client outbox, unread и author readers.
Первый совместимый патч не объявляется реализацией всего change. Старые клиенты,
decimal uint64, session/access lease, отмена, idempotency и приватность обязательны.

Текущий серверный режим остаётся без обещания E2EE. Выбор иной криптомодели —
отдельное решение; cursor и storage-границы не ожидают его. Новые сервисы,
локальная БД/Docker и store administration исключены из этой подготовки.
Пользователь 27.10.2026 разрешил необходимые релизы бэкенда и миграции
production-БД после release-test. Интеграционные и нагрузочные SQL-проверки
по-прежнему выполняются только в изолированной базе.

UI-основа — [контракт chat-actions](../../../docs/design/components/chat-actions.md)
и [UX 2.1.0](../meeting-experience-refresh/ux.md). Сохраняются +→desktop modal/mobile
sheet, native long press сообщения→реакции, long press chip→люди с emoji filter,
tap chip→своё участие, emoji dock и inline-карточки. Приёмка UI 2.1.0 не переносится
на новые состояния. Read/unread/recovery/skeleton UI перед кодом требует отдельного
актуального одобренного контракта и публикации, затем независимого design-review.

## Статический baseline и первый срез

Повтор 28.10.2026 уточнил web-регрессию для `TC-CHAT-SYNC-E77C7AE6`:
тест удерживает POST до commit, затем страница перезагружается при ещё занятом
владении. Проверяются повтор с прежним ключом без ожидания 30 секунд,
одна серверная запись и сохранение нового черновика. Дополнительно сохраняются
two-tab, logout/epoch и fallback без Web Locks. Изменение только черновика не
должно захватывать очередь. Предыдущие отчёты остаются историческими.

[current-state.md](current-state.md) содержит повторное чтение кода 27.10.2026.
Риск web 100/101/102 подтверждён связью query cursor с display entries и ACK merge;
браузерное воспроизведение и измерение latency ещё не выполнены. Сервер GET,
text replay и media publish replay читают полный Feed; SQL EXPLAIN не запускался.

| Первый срез | Case ID | Уровень и критерий |
| --- | --- | --- |
| Web receive cursor | TC-CHAT-SYNC-2D68FE69 | Integration владельца/QueryClient и управляемого transport: 100→ACK102→after100→101/102; empty initial=0, multipage, before не двигает cursor, precision и ошибка применения |
| Reader page/around | TC-CHAT-PAGE-BOUNDS | Memory/SQL integration: initial/after/before/around, limit+1, доступ до данных, cancel, uint64, clone/rollback, SQL не декодирует всю историю |
| Text и media retry | TC-CHAT-IDEMPOTENCY-LOOKUP | Lost ACK до/после expiry receipt, тот же ID/sequence, прежнее тело/caption/attachments, чужой actor/meeting и revoke |

Первый этап не требует SDK, новой БД или endpoint sync. PostgreSQL уже имеет
repeatable-read View и индексы sequence/request; новый индекс добавляется лишь
по результату EXPLAIN. Полный Feed сохраняется для account removal/reactions и
других ещё не перенесённых потребителей. Глобальный write-lock не удаляется.

## Порядок и допустимая параллельная работа

1. Воспроизводимый regression 1.1 и web 4.1 идут отдельно от backend 1.5/2.1/2.2.
   Перед кодом фиксируется конкретный fixture; не выдавать сравнение исходников за pass.
2. Bounded ports/around/direct lookup → change journal/epoch/atomic outbox всех
   writers → snapshot/sync с through/reset. Backend-контракт сохраняет прежний HTTP.
3. SDK spike 1.2 и память/якорь 1.4/1.6 можно готовить параллельно. Realtime
   подключается после durable catch-up; один MemoryBroker требует одного API-процесса.
4. Read baseline/actual и projections готовятся после storage/DTO; UI читает серверный
   max, не считает подключение/ACK прочтением. Приватность и no-op предотвращают цикл.
5. Client outbox/окно готовятся независимо по protocol, но around first-unread требует
   серверной поддержки. Полная приёмка каждого клиента остаётся отдельной задачей.

## Окружения и данные

Правила — [testing/environments.md](../../../testing/environments.md). Общий fixture:
M с организатором A, участниками B/C и посторонним X; тестовые аккаунты, ru-RU,
Europe/Moscow, управляемые часы/барьеры/сбои. Начальный рабочий набор содержит
100 записей, отдельные наборы 1k/10k/100k — только для ограниченных страниц/нагрузки.
Высокие uint64 задаются fixture напрямую, без генерации миллиардов строк.
Нельзя использовать настоящие переписки/credentials или менять системные часы.

| Платформа | Наблюдаемое окружение | Что оно доказывает |
| --- | --- | --- |
| backend / api | Отдельный Go memory fixture; SQL на somewhere_integration с test DSN и DDL/runtime ролями по backend/docs/postgres.md | Memory parity и контролируемые faults; SQL отдельно доказывает LIMIT/index, commit/restart/rollback, persistence. Memory restart persistence не доказывает |
| web / web-desktop, web-mobile | Реальный demo build и отдельный loopback fixture; QueryClient/transport/storage tests, Chromium и WebKit | Model/SDK/IndexedDB и работающий UI; физический Safari — отдельный результат, WebKit его не заменяет |
| ios / ios-phone | Существующий simulator, изолированный UITestHost, owner/transport/protected storage; физический iPhone отдельно | Scene lifecycle/Keychain/Data Protection и живые действия; unit/UI последовательно на устройстве |
| android / android-phone | Существующий emulator, отдельный QA target, repository/Flow/Keystore storage; физическое устройство отдельно | Process death/lifecycle/IME и живые действия; не перезапускать чужой emulator |

До реального прогона environment JSON фиксирует build/API/device/OS/origin/data,
а для SQL — безопасное имя изолированной базы. DSN/токены не включаются в Git.
Нет доступа — blocked соответствующих проверок; доступные memory/client этапы
продолжаются. Нагрузку не направлять на production; тестовую ёмкость существующего
окружения фиксировать до профиля 100 connections/5 msg/s и burst из validation-plan.

## Пирамида и доказательства

Сохранены 46 прежних ID; добавлены только 4 backend/protocol кейса. Всего 50:
4 unit, 32 integration, 14 E2E. Уровень выбирается по проверяемому правилу,
не по численной квоте. Серверные max/rights/counts не размножаются как UI-сценарии;
ключевые UX-пути проверяются на каждом клиенте. Для two-device кейса достаточно
одного counterpart на каждую проверяемую платформу, без девяти одинаковых пар.

Автоматизация unit/integration пока planned/unknown; E2E manual/unknown.
Публикация YAML не означает automated. Существующий iOS cursor test и backend
feed/idempotency tests — полезные кандидаты регрессии, но их прежние файлы/сборки
не присваивают новым кейсам pass. После реализации tests refs добавляются только
с точным path/selector/regular runner и проверенными assertions того же уровня.
Новые тестовые frameworks/runners этой подготовкой не устанавливаются.

Команды приложений остаются в их AGENTS.md. Регулярные runners уже определены
в testing/config.json; полный source-suite не заменяет ручной проход кандидата.
Независимый feature-test выполняет работающую фичу, сохраняет raw/interaction
и UI screenshots. Временные faults и cleanup касаются только собственного fixture.
Для каждого испытания записываются actual и evidence hash; screenshots без действий
и зелёная сборка не подтверждают сценарий. SQL/cloud/performance без запуска — not_run.

## Матрица case/platform

Подробные предусловия, действия, expected и cleanup находятся в YAML-каталоге.
Платформа backend означает API/storage/service проверку; client означает его
реальный owner/adapter либо живой UI в зависимости от указанного уровня.

| Case ID | Сценарий | Уровень | Платформы |
| --- | --- | --- | --- |
| TC-CHAT-SYNC-2D68FE69 | Своя отправка опередила получение чужой | integration | web, ios, android |
| TC-CHAT-SYNC-5EFD24A6 | Изменение уже показанной карточки | integration | backend, web, ios, android |
| TC-CHAT-SYNC-BC07BEB1 | Разрыв между снимком и подпиской | integration | backend, web, ios, android |
| TC-CHAT-SYNC-AA76CADB | Сбой после commit до уведомления | integration | backend |
| TC-CHAT-SYNC-F6CFB5E9 | Курсор вышел за срок восстановления | integration | backend, web, ios, android |
| TC-CHAT-SYNC-E77C7AE6 | Завершение процесса до ответа | integration | web, ios, android |
| TC-CHAT-SYNC-6EF9F915 | Ошибка локального хранилища | unit | web, ios, android |
| TC-CHAT-SYNC-DC61BB4A | Несколько исходящих без сети | integration | web, ios, android |
| TC-CHAT-SYNC-14D92D7D | Таймаут после сохранения | integration | backend, web, ios, android |
| TC-CHAT-SYNC-EB93F8D1 | Ошибка с новым черновиком | unit | web, ios, android |
| TC-CHAT-SYNC-65C6F806 | Исправное соединение без активности | integration | web, ios, android |
| TC-CHAT-SYNC-60FCAA1D | Сервер или прокси не поддерживает realtime | integration | web, ios, android |
| TC-CHAT-SYNC-6F728A92 | Возврат приложения из фона | integration | web, ios, android |
| TC-CHAT-READ-STATE-068DA926 | Запоздалое устройство | integration | backend |
| TC-CHAT-READ-STATE-99A5AEEE | Некорректная позиция | integration | backend |
| TC-CHAT-READ-STATE-55EC5376 | Сообщение получено в фоне | unit | web, ios, android |
| TC-CHAT-READ-STATE-850EBE76 | Длинное сообщение и окно поверх чата | unit | web, ios, android |
| TC-CHAT-READ-STATE-34B98D4D | Явный переход к новым сообщениям | e2e | web, ios, android |
| TC-CHAT-READ-STATE-284DD6EE | Смешанные обновления | integration | backend |
| TC-CHAT-READ-STATE-299278E4 | Чтение на другом устройстве | e2e | web, ios, android |
| TC-CHAT-READ-STATE-8A47BDBD | Существующая большая история | integration | backend |
| TC-CHAT-READ-STATE-5869F951 | База не является подтверждением чтения | integration | backend |
| TC-CHAT-READ-STATE-51E51F41 | Повторное вступление | integration | backend |
| TC-CHAT-READ-STATE-B0815A4A | Два прочитавших | e2e | web, ios, android |
| TC-CHAT-READ-STATE-EC05E2CA | Участник вышел | integration | backend |
| TC-CHAT-READ-STATE-E32551D3 | Нет прочитавших или запрошено чужое сообщение | integration | backend |
| TC-CHAT-READ-STATE-D6A20C5D | Сообщение сохранено, получатель не открыл чат | e2e | web, ios, android |
| TC-CHAT-SECURITY-791FF479 | Подписка с чужого сайта или на чужую встречу | integration | backend |
| TC-CHAT-SECURITY-0E0CB54C | Истечение сессии | integration | backend, web, ios, android |
| TC-CHAT-SECURITY-1DC708F2 | Отзыв между уведомлением и загрузкой | integration | backend, web, ios, android |
| TC-CHAT-SECURITY-6DD0CC09 | Голосование в скрытом опросе | integration | backend |
| TC-CHAT-SECURITY-92CE8303 | Ответ предыдущего аккаунта | integration | web, ios, android |
| TC-CHAT-SECURITY-6A1C1A1A | Исходящее после выхода из встречи | integration | web, ios, android |
| TC-CHAT-SECURITY-0830EED9 | Текущий серверный режим | e2e | web, ios, android |
| TC-CHAT-SECURITY-A91C53BB | Защита backup не проверена | integration | backend |
| TC-CHAT-SECURITY-BDBF283F | Диагностика сбоя | integration | backend, web, ios, android |
| TC-CHAT-SECURITY-A3B3BFE7 | Удаление данных аккаунта | integration | backend |
| TC-EVENT-FEED-304D49BA | Первое непрочитанное далеко от хвоста | e2e | web, ios, android |
| TC-EVENT-FEED-A697B69A | Длительная прокрутка | e2e | web, ios, android |
| TC-EVENT-FEED-025A8CA5 | Повтор после сбоя страницы | e2e | web, ios, android |
| TC-EVENT-FEED-9FADE3B3 | Старые строки и выросшая карточка | e2e | web, ios, android |
| TC-EVENT-FEED-E81D170C | Подтверждение исходящего | e2e | web, ios, android |
| TC-EVENT-FEED-D0C7E8FB | Новое сообщение при чтении прошлого | e2e | web, ios, android |
| TC-EVENT-FEED-722B1526 | Возврат после просмотра списка прочитавших | e2e | web, ios, android |
| TC-EVENT-FEED-CCD3E2A3 | Узкий web с клавиатурой | e2e | web |
| TC-EVENT-FEED-84D3BA20 | Виртуализация и клавиатурный фокус | e2e | web, ios, android |
| TC-CHAT-PAGE-BOUNDS | Границы страницы и пустой хвост | integration | backend |
| TC-CHAT-IDEMPOTENCY-LOOKUP | Адресный повтор text и media после потерянного ответа | integration | backend |
| TC-CHAT-SYNC-THROUGH | Фиксированная граница страниц синхронизации | integration | backend, web, ios, android |
| TC-CHAT-CAPABILITIES | Совместимость старого HTTP и выключенных возможностей | integration | backend, web, ios, android |

## Mapping задач и gates

[testing-manifest.json](testing-manifest.json) классифицирует все 43 task IDs.
1.3 — read-only infrastructure evidence; 7.4 — локальная упаковка; 7.5 — SDD и
структурная проверка. Эти исключения не освобождают продуктовые задачи от приёмки.
7.1 покрывает все backend cases, 7.6/7.7/7.8 — весь соответствующий клиентский набор;
7.2 и 7.9 объединяют server и end-to-end бюджеты без подмены одного другим.

Manifest phase=checkpoint. Пути qa/acceptance/plan.json и run.json — назначение
будущего наблюдаемого прогона, файлы с выдуманным окружением/pass не создаются.
Перед checkpoint готовой части исполнитель создаёт актуальный feature plan через
qa:plan на реально доступных окружениях, независимый агент проводит checks и suites;
manifest указывает на этот план только когда его case/platform пары покрывают
закрываемые задачи. Остальные checkbox остаются открыты. При расширении набора
создаётся новый план/прогон, старые raw и evidence не переписываются.

В полном завершении нужны все 50 применимых кейсов, обязательные source suites,
budget/security результаты и qa:ready; UI дополнительно design:ready по новым
контрактам. Изменение code/spec/design открывает утратившие приёмку задачи.
Глобальный catalog hash меняется при редактировании кейсов: новые планы формируются
после обновления каталога, чужие старые отчёты не исправляются задним числом.

## Статус подготовки

Код приложений/тестов/runner и production не изменялись этой работой. Runtime,
SQL, SDK, физические устройства, latency и новые UI-состояния не проверены.
Результаты структурных qa:check, qa:test, agent:check, OpenSpec strict и diff-check
фиксируются отдельно в отчёте подготовки; они не закрывают продуктовые задачи.


## Web checkpoint, 27.10.2026

Реализация isolated web среза и фактические результаты: [отчёт](qa/2026-10-27-web-sync/report.md).
143 unit/integration и22 Chromium/WebKit проверки проходят на точном candidate;
это не закрывает cases/platform acceptance. Частичные refs добавлены только для web
в chat-sync.yaml; runner web-chat-e2e требует настоящий sync/realtime fixture.
Кейсы с five-minute recovery/RTT, full reset anchor, protected storage faults и
read-state остаются шире текущего покрытия. Независимый проход и gates открыты.

### Web: выбранный контейнер окна

После живого сравнения выбран @tanstack/react-virtual3.14.23 (MIT) с bounded
rangeExtractor и отдельной focus-строкой; react-virtuoso4.18.19 не сохранил focus
при далёком scroll. История обоих spike и синтетической composition проверки —
qa/2026-10-28-web-window/virtualization-spike.md. Кейсы и пороги≤500/≤200,
anchor≤2px, физическая клавиатура/AX и независимая приёмка не ослаблены.

Web read-state checkpoint4.5 использует `playwright.read.config.ts` и exact
read-enabled backend fixture. `41-chat-read-state` проверяет реальные две
сессии, personal unread hint без reload, overlay, zero menu, readers
empty/error/retry/count/focus. `42-chat-first-unread` создаёт10k сообщений и
проверяет bounded around первого unread около5000 и переход к реальному tail.
`43-chat-read-visibility` проверяет конец высокого сообщения и настоящий
adapter при controlled hidden→visible; headless переключение разных contexts
само не даёт background precondition. Физический background/IME этим не заявлен.
Owner unit проверяет499/500ms, max/throttle/abort/retry/late callbacks; query
commit regression сохраняет свежий marker после delayed snapshot и сбрасывает
его при новом stream epoch. Case mapping остаётся partial: readers с двумя
другими пользователями/многими страницами, настоящая IME/AX и motion требуют
независимого прохода. Старые evidence и checkbox не меняются.

Новый `playwright.chat-full.config.ts` выполняет прежний полный набор на
изолированном8458. Read/window/sync suites имеют свои обязательные runners,
потому что им нужны соответствующие capabilities; legacy runner не запускает
их на сервере с выключенными флагами.

### Различимые отказы отправки в Android QA

`FeedPersistenceUiTests` и scope `persistence` проверяют неотправленное намерение:
первая попытка получает управляемый отказ **до commit**, при этом GET ленты
доступен для обычной canonical-сверки. При восстановлении QA transport удерживает
только POST-отказ до явного повтора; production-кнопка работает без обхода. После настоящего
force-stop восстанавливаются тот же request key, строка повтора и новый черновик;
явный повтор создаёт ровно один canonical ID. Это не проверка lost ACK.

Потеря HTTP-ответа **после commit** остаётся отдельным предусловием
`FeedUiTests.historySendRetryInformationAndSettingsFollowSharedDesign`: после
управляемого transport-отказа и явного повтора fixture сохраняет сообщение,
скрывает первый HTTP-ответ, а обычная realtime/sync сверка снимает pending.
Наличие кнопки повтора после уже полученного canonical подтверждения не требуется.
Серверный `feed.verify` полного scope `all` требует один ключ/ID; прикладные
integration-тесты отдельно проверяют replay и lookup. Эти два сценария нельзя
засчитать одним process-death PASS; исходный счётчик posts=1 при lost ACK и sync
сам по себе не доказывает потерю данных.

При временной недоступности canonical history локальный outbox/draft
восстанавливается только после свежих auth и GET конкретной встречи
(организатор или «Приду»). До успешной canonical-сверки POST запрещён, включая
явный повтор. Отказ доступа к встрече не раскрывает локальные сообщения и
очищает их обычным механизмом revocation. Это отдельно проверяется unit/integration;
process-death сценарий выше не заменяет проверку privacy и частичного отказа.

## Android: разделитель и сохранённая позиция · 02.11.2026

Регрессия6.3/TC-EVENT-FEED-9FADE3B3: открыть историю вокруг first_unread,
записать координату самого сообщения под разделителем, открыть настоящую IME,
закрыть Back, принять новое сообщение и собственный ACK из истории, затем
выйти в список и вернуться. Исчезновение уже прочитанного разделителя не
сдвигает сообщение больше2dp. Сохраняемый anchor учитывает измеренный отступ
служебных элементов, а не только внешний контейнер строки. Контроль: заголовок
даты и изменение высоты/prepend, старое значение viewport без дополнительного
отступа, недоступный anchor. Полный профиль10k/frame/memory по7.9 этим адресным
сценарием не заменяется.

## iOS: первое непрочитанное и край окна · 02.11.2026

Регрессия5.3:120 сообщений, серверный read marker60, начальная цель61 в середине.
До открытия сравнить first_unread API с ID цели. После открытия проверяется,
что невидимый хвост не стал прочитанным; затем настоящая IME, закрытие касанием,
поворот landscape/portrait, новый чужой хвост, свой подтверждённый POST и возврат
в тот же чат. Измеряется положение пузырька относительно нижней границы всей
шапки (viewport), а не центрируемой кнопки внутри компактной шапки. Допуск2pt;
системный поворот должен завершиться в пределах5с до проверки конечной геометрии.

Начальная прокрутка использует stable key строки LazyVStack; чтение/сохранение
anchor не запускаются на первом техническом раскладе хвоста до позиционирования.
Конец загруженной страницы при hasNewer не включает режим следования за хвостом
всей беседы. Отдельный существующий history UI-кейс проверяет настоящий prepend,
допуск2pt, локальный retry, возврат приложения и крупный текст. Профиль10k/frame/
memory и полная независимая приёмка остаются отдельными1.6/7.7/7.9.

03.11: `readers-a11y` на iOS покрывает два API-аккаунта, error/retry/empty,
Accessibility XXXL, настоящую речь VoiceOver и обычное закрытие со стабильной
строкой. Coverage partial: жест VoiceOver Escape и возврат его фокуса не
подтверждены доступным API и остаются в 5.4. Экспериментальная UIKit-обвязка
удалена; неуспешный эксперимент не является доказательством дефекта SwiftUI.
Финальный scope и ограничения: [отчёт](qa/2026-11-03-ios-readers/result.md).
