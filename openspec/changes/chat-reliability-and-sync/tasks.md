# Tasks

Реализация технического этапа разрешена пользователем 27.10.2026 после
критичных UI-исправлений; ни один пункт ниже этой подготовкой не закрыт.
Объём — рабочие backend/web/iOS/Android. Дополнительным поручением 27.10.2026
разрешены необходимые релизы бэкенда и миграции production-БД после проверок
по процессу выпуска; администрирование магазинов остаётся вне объёма.
Криптографическая модель остаётся отдельным решением из security.md: текущая
работа не обещает E2EE и не требует выбора нового стека перед исправлением cursor.

Порядок: 1.1 → 4.1 (совместимый receive cursor), параллельно 1.5 → 2.1 → 2.2;
затем 2.3–2.6 → 3.1–3.2 → клиентский recovery/fallback. Read state 3.3–3.6
готовится после общих storage/DTO; outbox и bounded window — параллельно
на каждом клиенте с тем же контрактом. Зависимости SDK проверяются в 1.2.
Срез не сокращает оставшиеся требования. Кейсы и платформы — [testing.md](testing.md)
и [testing-manifest.json](testing-manifest.json); checkbox требует qa:ready,
UI также требует отдельного актуального design-review/design:ready.

## 1. Baseline и проверка зависимостей

02.11.2026 пользователь уточнил восстановление: до 2 с на догрузку после
готовности авторизованного соединения/подписки; при недоступном сервере
сохраняются повторы с паузами. Метрика и отдельные этапы записаны в
validation-plan.md/testing.md. Это уточнение точки отсчёта не закрывает
1.2/7.9 и не меняет исторические результаты; требуется новый адресный замер.

- [x] 1.1 Воспроизвести гонку web 100/101/102 через управляемый порядок GET/POST и снять сетевой baseline; сохранить regression и реальные результаты, не выдавая статическое чтение кода за воспроизведение.
- [x] 1.2 Проверить встроенную Centrifuge и JS/Swift/Java SDK: pin версий, лицензии, auth, reconnect/recovery, совместимость Go/OkHttp/SwiftPM; приложить минимальные успешные проверки на трёх клиентах и перечень зависимостей. Минимальный технический baseline сверён последовательно: [результат и границы](qa/2026-11-02-sequential-sdk/baseline-1.2.md); полная клиентская матрица не объявляется завершённой.
- [x] 1.3 Проверить топологию API и существующие свидетельства защиты дисков/backup/ключей; записать результаты в security review, не объявлять неизвестное выполненным и не добавлять новый сервис без обновления design.
- [ ] 1.4 Сравнить react-virtuoso с выбранным после spike @tanstack/react-virtual и проверить native lazy-контейнеры на текущих карточках/длинных строках: prepend, resize, focus, keyboard и anchor ≤ 2 единиц; сохранить замеры и выбранные параметры/контейнеры рядом с UX v1.
- [x] 1.5 Снять серверный baseline ограниченных страниц и text/media retry на memory и изолированной облачной PostgreSQL по validation-plan; записать число прочитанных строк, планы SQL, задержки и статусы недоступных окружений.
- [ ] 1.6 Снять baseline scroll/frame/памяти на web/iOS/Android с текущими опубликованными карточками; записать устройство, сборку, якорь и динамические высоты, отдельно от UI-приёмки 2.1.0 соседнего изменения.

## 2. Backend: ограниченные данные и синхронизация

- [x] 2.1 Ввести bounded Reader-порты page/around, lookup text intent и entry_id для media retry; проверить memory clone/rollback, initial/after/before/around, пустой хвост, uint64, cancel, access-before-data, lost ACK и прежний API. Полный Feed сохранить для остальных потребителей.
- [x] 2.2 Реализовать порты в PostgreSQL с аддитивной миграцией и индексами; проверить cloud integration/EXPLAIN на 1k/10k/100k без локальной БД и полного чтения JSON, записать результат в отчёт.
- [x] 2.3 Реализовать stream epoch, change journal и atomic outbox для сообщений/карточек/RSVP/worker; проверить commit/rollback и parity memory/PostgreSQL, включая no-op без лишнего события.
- [x] 2.4 Добавить snapshot/sync, bounded through_cursor, invalidation и reset; проверить гонку snapshot→subscribe, несколько страниц, порядок/повторы, старую карточку и истечение cursor по chat-sync/spec.md.
- [x] 2.5 Обновить удаление аккаунта/встречи и retention для новых данных; проверить обезличивание старых диапазонов, отсутствие прежних имён при replay и доставку terminal invalidation после удаления встречи.
- [x] 2.6 Обновить OpenAPI/fixtures и backend README по новым endpoint/параметрам; выполнить api:check/api:test и проверки Go из backend/AGENTS.md, зафиксировать сохранённую совместимость старых DTO.

## 3. Backend: поток и прочитанность

- [x] 3.1 Подключить адаптер Centrifuge с cookie/Origin и native session auth, лимитами/expiry/revocation; проверить чужие подписки, завершение сессии и отсутствие текста/токенов в hint/логах.
- [x] 3.2 Реализовать dispatcher с повтором и mock в memory; проверить crash до publish/после publish, потерю NOTIFY, рестарт, медленного клиента и восстановление без потерь/дублей.
- [x] 3.3 Добавить отдельные unread baseline и actual read marker; проверить атомарную инициализацию/RSVP, max двух устройств, валидацию позиции и отсутствие ложных receipts при baseline.
- [x] 3.4 Реализовать unread/first-unread, batch receipt counts и страницы readers для автора; проверить чужие ID, текущий состав, rejoin, скрытые голоса, удалённый аккаунт и стоимость агрегатов на 100k истории.
- [x] 3.5 Добавить private invalidation списка и receipts_changed, coalescing/no-op; проверить обновление второго устройства, отсутствие цикла read→sync→read и поведение старого клиента без markers.
- [x] 3.6 Дополнить контракт, fixtures, документацию feature flags/recovery/отката и метрики без текста; выполнить API и Go/race проверки по локальным правилам, записать версии и результаты.

## 4. Web

- [x] 4.1 Ввести владельца chat state в допустимых слоях FSD и отдельный receive cursor; первым совместимым патчем сохранить его отдельно от display entries и двигать только после GET merge. Проверить regression 100/101/102, initial=0, empty/multipage/history, precision, lease и смену аккаунта; затем расширить upsert до актуальных projection versions при внедрении sync.
- [x] 4.2 Добавить IndexedDB draft/outbox с несколькими намерениями и stable UI keys; проверить reload после commit, две вкладки/logout, quota failure, одинаковый ID/чужой автор и возврат текста без перезаписи нового draft.
- [x] 4.3 Подключить SDK adapter, snapshot→subscribe→catch-up и управляемый fallback; проверить reconnect/reset/background, один цикл запросов, отсутствие idle polling и очистку после 401/403.
- [x] 4.4 Реализовать ограниченную ленту, around/автодогрузку и anchor из UX v1; проверить Playwright Chromium+WebKit длинную историю, resize карточки, ACK, новый хвост при чтении прошлого и фокус. Адресные4/4Chromium/WebKit плюс готовая проверка10000: [результат](qa/2026-11-02-sequential-web-window/result.md).
- [x] 4.5 Реализовать видимость/read-through, unread в списке, разделитель и readers sheet; проверить два устройства, 500 мс/модальное перекрытие, keyboard accessibility и ошибки списка/повтора.
- [ ] 4.6 Сопоставить UI с UX v1 и согласованным meeting-experience-refresh, включая мобильную клавиатуру и скелетоны; выполнить web check/tests/build/E2E, обновить описание владельцев/адаптеров и приложить реальные результаты отдельно от физического Safari.

## 5. iOS

- [x] 5.1 Расширить FeedOwner независимыми cursors/ranges/read state и устойчивой очередью; проверить owner tests, process restart/потерянный ACK, generation, несколько pending и protected-storage failure. Адресный реальный coldstart/aftercommit плюс текущие owner/storage-проверки: [отчёт](qa/2026-11-02-sequential-ios-outbox/result.md).
- [x] 5.2 Подключить SDK adapter и scene lifecycle с recovery/fallback; проверить snapshot race, фоновый режим, session expiry, logout и закрытие доступа через fake transport и simulator. Сверены готовые адресные owner/transport/simulator-проверки: [отчёт](qa/2026-11-02-sdd-closeout/ios-5.2.md); полная7.7/performance7.9 остаются отдельными.
- [x] 5.3 Реализовать bounded store, загрузку вокруг unread и якорь нативной ленты; проверить prepend/карточки/клавиатуру/поворот/ACK и сохранение места по UX v1.
- [ ] 5.4 Добавить read visibility, счётчики и readers sheet; проверить два устройства, Dynamic Type/VoiceOver, нулевой список, ошибку и возврат фокуса без прокрутки. [Пройденная часть и недоступный жест VoiceOver](qa/2026-11-03-ios-readers/result.md).
- [x] 5.5 Сопоставить интерфейс с UX v1, обновить документацию владельца/хранилища и выполнить swift-format, unit/UI проверки и чистую simulator-сборку по frontend/ios/AGENTS.md; записать отдельно статус физического iPhone. [Проверки, документация и отдельный остаток 5.4](qa/2026-11-03-ios-readers/result.md).

## 6. Android

- [x] 6.1 Расширить Repository/ViewModel и MessageOutbox до очереди с устойчивыми ID и системной защитой хранения; проверить process death, lost ACK, draft, no-op/retry и изоляцию аккаунтов тестами. Проверены настоящий aftercommit/coldstart и адресные условия очереди/ACK/rejoin: [отчёт](qa/2026-11-02-sequential-android-outbox/result.md).
- [x] 6.2 Подключить SDK adapter через Flow и lifecycle, recovery/fallback; проверить auth, reconnect/reset, один запрос, background и revoke через fake transport и эмулятор. Последовательная проверка и исправленный переход после401: [результат](qa/2026-11-02-sequential-sdk/android-6.2.md); полный performance/source-wide допуск остаётся отдельным.
- [x] 6.3 Реализовать bounded store и LazyColumn anchor/around/автодогрузку; проверить reverse layout, IME/Back, resize карточки, собственный ACK и отсутствие прыжка при новых сообщениях.
- [x] 6.4 Добавить visibility/read-through, счётчики и readers sheet; проверить два устройства, TalkBack/font scale, ошибки и возврат к исходной строке. [Исправление и фактическая проверка на API 36](qa/2026-11-03-android-readers/result.md).
- [x] 6.5 Сопоставить UI с UX v1, обновить документацию repository/outbox и выполнить wrapper/ktlint, unit/UI, Debug/Release и Android Lint по frontend/android/AGENTS.md; записать отдельно эмулятор и физическое устройство. [Проверки и ограничения](qa/2026-11-03-android-readers/result.md).

## 7. Сквозная приёмка и подготовка выпуска

- [x] 7.1 Выполнить серверную матрицу сбоев validation-plan на memory и изолированном SQL; приложить версии, логи без секретов и результаты, оставляя недоступные проверки открытыми. Полный клиентский проход разделён на 7.6–7.8.
- [ ] 7.2 Проверить серверные latency/SQL бюджеты на записанном тестовом окружении; сравнить baseline, измерить горячую встречу и lock wait. Полный commit→visible/frame проверяется вместе с 7.9, серверные замеры его не заменяют.
- [x] 7.3 Проверить серверную security и совместимость прежнего HTTP, feature flags и rollback epoch; приложить результаты. Клиентские security/совместимость входят в полные проходы 7.6–7.8.
- [x] 7.4 Подготовить независимые локальные артефакты backend/web/iOS/Android и инструкции включения/отката; проверить воспроизводимость и указать готовность каждой платформы отдельно, без production и store-операций.
- [x] 7.5 Сверить реализацию с четырьмя specs и UX v1, согласовать дополнения event-feed с соседними изменениями перед sync; выполнить strict OpenSpec validation, agent:check и git diff --check, сохранить итоговый verification report. [Сверка и оставшиеся ограничения](qa/2026-11-03-spec-verification/report.md).
- [ ] 7.6 Выполнить весь применимый web-набор из testing.md: unit/integration и независимые живые Chromium/WebKit-пути; отдельно зафиксировать физический Safari, raw/evidence и qa:ready, не переносить pass от UI 2.1.0.
- [ ] 7.7 Выполнить весь применимый iOS-набор из testing.md: owner/storage/transport и независимый живой проход; зафиксировать simulator/физический iPhone отдельно, raw/evidence и qa:ready.
- [ ] 7.8 Выполнить весь применимый Android-набор из testing.md: repository/storage/transport и независимый живой проход; зафиксировать emulator/физическое устройство отдельно, raw/evidence и qa:ready.
- [ ] 7.9 Проверить полный commit→visible, offline recovery, bounded memory/frame и anchor бюджеты на web/iOS/Android по validation-plan; сохранить трассу каждого этапа и сравнение с 1.6, без измерений на production.

## Workflow follow-up

- Необходимые релизы бэкенда и миграции production-БД разрешены пользователем
  27.10.2026 и выполняются после release-test с отдельным receipt точного кандидата.
  Публикация клиентов и администрирование магазинов остаются отдельной работой.
- После реализации и проверок синхронизировать delta specs и архивировать
  изменение обычными навыками OpenSpec. Сейчас архивировать нельзя.


## Web implementation checkpoint, 27.10.2026

Изолированная реализация4.2–4.3 и основы4.1/4.4 описаны в
[web report](qa/2026-10-27-web-sync/report.md):143/143 source tests и22/22 actual
Chromium/WebKit checks. Независимые feature/design gates остаются открыты;
checkboxes не меняются. Основной агент интегрирует только own delta после baseline
ad7597e и сохраняет более позднюю main редакцию keyboard/IME и authority hashes.

## Backend acceptance checkpoint, 28.10.2026

Задачи2.1–3.6 закрыты после независимого прохода24/24 backend cases,
SQL/process-restart на отдельной облачной БД и qa:ready.
[Отчёт](qa/2026-10-28-backend-independent-resume/report.md) фиксирует точный
production source hash и ограничения. Дополнительно OpenAPI:80 schemas,
38 fixtures и484 реальных HTTP-ответа; проверка контракта прошла.
Приёмка клиентов, capacity/commit→visible, физические устройства и полный
release receipt остаются открытыми. Production в этом checkpoint не менялся.

## Reproducible acceptance follow-up, 28.10.2026

Повтор CI на `f59e6a08` выявил невоспроизводимый source hash: в локальный
отпечаток попал игнорируемый приватный dotenv-файл, которого нет в Git.
Ошибка воспроизведена в чистом снимке коммита. Код backend/contracts побайтово
совпадает; содержимое приватного файла не публикуется. Предыдущий отчёт и его
hashes сохранены. Задачи 2.1–3.6 временно открыты до нового независимого прогона
с воспроизводимым набором исходников; прежний pass на новый hash не переносится.

Повтор завершён: [новый независимый отчёт](qa/2026-10-28-backend-fingerprint-repeat/report.md),
24/24 и обязательный uncached suite прошли, qa:ready одинаково успешен локально
и в чистой копии без приватных dotenv. Задачи 2.1–3.6 снова закрыты по новому
plan/run-fresh; testing-manifest ссылается на этот прогон.

## Outbox acceptance follow-up, 28.10.2026

Новый детерминированный web-regression проверяет перезагрузку при удержанном
POST до commit и добавлен к TC-CHAT-SYNC-E77C7AE6. Общий catalogHash изменился.
Код backend не менялся; прежние отчёты сохранены, задачи 2.1–3.6 временно открыты
до свежего независимого прогона на новом каталоге. Web-очередь, календарь и
подтверждённые реквизиты проходят новую приёмку; старые pass не переносятся.

## Backend fixture acceptance, 28.10.2026

После исправления native fixture и публикации дизайн-системы 2.5.2
выполнен новый независимый серверный проход: 24/24, обязательный Go suite,
SQL и повторный `qa:ready` в MAIN и чистом снимке. Задачи 2.1–3.6 снова закрыты.
[Точный отчёт](qa/2026-10-28-backend-fixture-final/report.md) сохраняет hash
631d726ccefd1d836ff02e0842ec4228ae4a8aa6ad12ca638fb9e09ded92ba66
и границы проверки. Старые прогоны остаются историей. Полный выпуск, media
на PostgreSQL и постоянная поддержка этим проходом не приняты.

## Support persistence follow-up, 28.10.2026

Форма поддержки сохранена по уточнению пользователя; ошибочная замена на почту
отменена до коммита. Новый PostgreSQL-адаптер и срок30дней меняют серверный
source/catalog: отчёт631d остаётся историческим. До свежего qa:ready задачи
2.1–3.6 открыты; прежний результат не переносится на новый кандидат.

## Сверка 01.11.2026

Документально выполненные пункты отмечены по точным исходным критериям;
основания и оставшиеся проверки — в [сверке SDD](../meeting-experience-refresh/qa/2026-11-01-sdd-reconciliation/report.md).
Старые продуктовые PASS не перенесены на новые исходники или каталоги.

## Серверная приёмка 01.11.2026

Задачи2.1/2.2/2.6/3.6 закрыты по свежему независимому проходу на текущем
source/catalog: [отчёт](qa/2026-11-01-backend-independent/report.md),
qa:ready7/7. Проверены bounded memory/PostgreSQL1k/10k/100k, реальные
процессы/HTTP/rollback и текущий web-клиент при404/выключенных capabilities.
Исходные blocked5/2 и6/1 сохранены; недостающие действия выполнены, а не
исключены из кейсов. Другие задачи/backend-кейсы и готовность клиентов целиком
этим проходом не принимаются.

## Quantitative baseline · 01.11.2026

Пункт1.5 закрыт после [независимого memory/SQL прохода](qa/2026-11-01-retry-baseline/report-independent.md):2160page samples,720service retries,SQLplans/row bounds,source412unchanged,qa:ready2/2. Нагрузка7.2 и клиентские budgets7.9 остаются отдельными открытыми критериями.

## Гонка курсора web · 01.11.2026

Пункт 1.1 закрыт по текущему независимому integration-проходу на 1440/390 CSS px:
реальный Go HTTP, управляемый порядок 100/чужой 101/собственный ACK 102 и
production-model проверки. [Отчёт](../meeting-experience-refresh/qa/2026-11-01-web-final-independent/report.md),
[scoped qa:ready 2/2](../meeting-experience-refresh/qa/2026-11-01-sdd-reconciliation/chat-1.1-ready.txt).
Все пять обязательных web suites пройдены на source949d; один отдельный
межплатформенный сценарий явно пропущен. Ошибочный плановый descriptor
Native Chrome/backend412 сохранён и сопоставлен с фактическим Chromium
headless/backend413. Это приёмка технической гонки, а не нативного ввода,
дизайна или остальных задач web-чата.

Пункт 3.3 закрыт по текущему независимому серверному проходу: монотонный max
двух устройств, атомарная база большой истории, отдельный actual marker без
ложного receipt, повторное вступление и проверка позиции.
[Точные assertions](qa/2026-11-01-server-union-independent/feature/evidence/chat-interaction.json),
[scoped qa:ready](../meeting-experience-refresh/qa/2026-11-01-sdd-reconciliation/chat-3.3-ready.txt).
Это серверная логика прочитанности; видимость сообщений и readers UI клиентов
остаются самостоятельными открытыми задачами.

Пункты 2.3/2.5/3.1/3.4/3.5 закрыты по текущему независимому серверному
проходу и [scoped qa:ready](../meeting-experience-refresh/qa/2026-11-01-sdd-reconciliation/chat-server-current-ready.txt).
Тот же gate обновил ссылки ранее принятых 1.5/2.1/2.2/2.6/3.6 на текущие
413 inputs. [Действия](qa/2026-11-01-server-union-independent/feature/evidence/chat-remaining-interaction.json)
и [SQL differential qualification](qa/2026-11-01-server-union-independent/feature/evidence/sql-differential-qualification.json)
разделяют новые HTTP/Go проверки и ранее выполненные SQL-опыты с побайтно
совпадающими пересобранными бинарниками. Старые timestamps не перенесены.
Нагрузка горячей встречи/lock wait и клиентский reset с сохранением outbox/якоря
этим не приняты; соответствующие пункты остаются открытыми.

Пункт 4.1 закрыт после [независимой проверки владельца web chat state](../meeting-experience-refresh/qa/2026-11-01-web-final-independent/chat-state-4.1.md)
и [qa:ready 8/8](../meeting-experience-refresh/qa/2026-11-01-sdd-reconciliation/chat-4.1-ready.txt).
Помимо гонки 100/101/102 проверены through=T/T+1 и повтор страницы, сбой apply,
обновление старого опроса и обезличивание, поздние sync/send/read и IndexedDB
callbacks после смены аккаунта/отзыва одной встречи при сохранении другой.
Одни и те же заранее запланированные текущие действия честно разделены между
задачами через shared-action provenance, без повторов ради отдельных галочек.
Визуальная композиция и остальные возможности чата этим не принимаются.

Пункты 2.4/3.2/7.1/7.3 закрыты после завершения независимой серверной матрицы
36/36 и [канонического task gate](../meeting-experience-refresh/qa/2026-11-01-sdd-reconciliation/chat-server-final-ready.txt).
Последний пробел F6 закрыт совместным [реальным web-контролем смены epoch](qa/2026-11-01-web-epoch-independent/report.md):
настоящий подписанный cursor получает 410, новый разрешённый снимок сохраняет
якорь/очередь/черновик, поздний ответ старой истории действительно доставлен
после него и не меняет окно. Исторический неоднозначный контроль сохранён,
не принят за итоговый PASS. Серверные нагрузочные бюджеты 7.2 и клиентские
сценарии 7.6–7.9 остаются самостоятельными открытыми задачами.

## Новое исправление fallback · 01.11.2026, 23:00 МСК

Независимая проверка обнаружила настоящее расхождение с protocol.md:91.
На web исправный HTTP при отсутствующем realtime сбрасывал backoff и давал
постоянные 3 секунды; при HTTP-ошибках web и native включали лишний шаг 24 секунды.
iOS также умножал следующий базовый интервал на ранее применённый jitter.
Внесён минимальный патч трёх клиентов и регрессии по исходному контракту
3→6→12→30. Спецификации, каталог, backend и опубликованный UI не менялись.

Исторические полные PASS: web949d, iOS8f49 и Android53ab сохранены с исходными
hash. После изменения клиентского source пункты web1.1/4.1 открыты до новой
квалификации; прежние факты не выдаются за выполнение нового кода. Три независимых
проверяющих получили новый frozen-кандидат; сначала unit, затем обязательные
платформенные проверки. Серверные принятые критерии на 413 inputs не затронуты.

Android6.3: [адресная проверка и исправление позиции после прочтения](qa/2026-11-02-sequential-android-window/result.md); полный performance7.9 и общий приёмочный7.8 остаются открыты.

iOS5.3: [реальное окно/первое непрочитанное и исправления](qa/2026-11-02-sequential-ios-window/result.md). Общие performance/независимая приёмка остаются в5.5/7.7/7.9.
