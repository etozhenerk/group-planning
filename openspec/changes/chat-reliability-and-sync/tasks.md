# Tasks

План реализации рекомендуемой серверной модели из [design.md](design.md).
Исследование, UX v1 и требования подготовлены; ни один пункт реализации
ниже пока не выполнен. Эта задача пользователя не включает код или деплой.
Если вместо рекомендации выбирается обязательное E2EE, сначала обновить
этот пакет по альтернативе из security.md, не добавлять шифрование частично.

## 1. Baseline и проверка зависимостей

- [ ] 1.1 Воспроизвести гонку web 100/101/102 и снять baseline SQL/сети/прокрутки по validation-plan; сохранить результаты и воспроизводящий тест, отличая статические предположения от подтверждённых дефектов.
- [ ] 1.2 Проверить встроенную Centrifuge и JS/Swift/Java SDK: pin версий, лицензии, auth, reconnect/recovery, совместимость Go/OkHttp/SwiftPM; приложить минимальные успешные проверки на трёх клиентах и перечень зависимостей.
- [ ] 1.3 Проверить топологию API и существующие свидетельства защиты дисков/backup/ключей; записать результаты в security review, не объявлять неизвестное выполненным и не добавлять новый сервис без обновления design.
- [ ] 1.4 Проверить react-virtuoso и native lazy-контейнеры на текущих карточках/длинных строках: prepend, resize, focus, keyboard и anchor ≤ 2 единиц; сохранить замеры и выбранные параметры/контейнеры рядом с UX v1.

## 2. Backend: ограниченные данные и синхронизация

- [ ] 2.1 Ввести bounded Reader-порты page/around и прямой поиск idempotency; проверить memory unit-тестами границы, пустой хвост, дубли и прежний API.
- [ ] 2.2 Реализовать порты в PostgreSQL с аддитивной миграцией и индексами; проверить cloud integration/EXPLAIN на 1k/10k/100k без локальной БД и полного чтения JSON, записать результат в отчёт.
- [ ] 2.3 Реализовать stream epoch, change journal и atomic outbox для сообщений/карточек/RSVP/worker; проверить commit/rollback и parity memory/PostgreSQL, включая no-op без лишнего события.
- [ ] 2.4 Добавить snapshot/sync, bounded through_cursor, invalidation и reset; проверить гонку snapshot→subscribe, несколько страниц, порядок/повторы, старую карточку и истечение cursor по chat-sync/spec.md.
- [ ] 2.5 Обновить удаление аккаунта/встречи и retention для новых данных; проверить обезличивание старых диапазонов, отсутствие прежних имён при replay и доставку terminal invalidation после удаления встречи.
- [ ] 2.6 Обновить OpenAPI/fixtures и backend README по новым endpoint/параметрам; выполнить api:check/api:test и проверки Go из backend/AGENTS.md, зафиксировать сохранённую совместимость старых DTO.

## 3. Backend: поток и прочитанность

- [ ] 3.1 Подключить адаптер Centrifuge с cookie/Origin и native session auth, лимитами/expiry/revocation; проверить чужие подписки, завершение сессии и отсутствие текста/токенов в hint/логах.
- [ ] 3.2 Реализовать dispatcher с повтором и mock в memory; проверить crash до publish/после publish, потерю NOTIFY, рестарт, медленного клиента и восстановление без потерь/дублей.
- [ ] 3.3 Добавить отдельные unread baseline и actual read marker; проверить атомарную инициализацию/RSVP, max двух устройств, валидацию позиции и отсутствие ложных receipts при baseline.
- [ ] 3.4 Реализовать unread/first-unread, batch receipt counts и страницы readers для автора; проверить чужие ID, текущий состав, rejoin, скрытые голоса, удалённый аккаунт и стоимость агрегатов на 100k истории.
- [ ] 3.5 Добавить private invalidation списка и receipts_changed, coalescing/no-op; проверить обновление второго устройства, отсутствие цикла read→sync→read и поведение старого клиента без markers.
- [ ] 3.6 Дополнить контракт, fixtures, документацию feature flags/recovery/отката и метрики без текста; выполнить API и Go/race проверки по локальным правилам, записать версии и результаты.

## 4. Web

- [ ] 4.1 Ввести владельца chat state в допустимых слоях FSD и отдельный receive cursor; проверить regression 100/101/102, merge актуальных версий, history pages, lease и смену аккаунта unit-тестами.
- [ ] 4.2 Добавить IndexedDB draft/outbox с несколькими намерениями и stable UI keys; проверить reload после commit, две вкладки/logout, quota failure, одинаковый ID/чужой автор и возврат текста без перезаписи нового draft.
- [ ] 4.3 Подключить SDK adapter, snapshot→subscribe→catch-up и управляемый fallback; проверить reconnect/reset/background, один цикл запросов, отсутствие idle polling и очистку после 401/403.
- [ ] 4.4 Реализовать ограниченную ленту, around/автодогрузку и anchor из UX v1; проверить Playwright Chromium+WebKit длинную историю, resize карточки, ACK, новый хвост при чтении прошлого и фокус.
- [ ] 4.5 Реализовать видимость/read-through, unread в списке, разделитель и readers sheet; проверить два устройства, 500 мс/модальное перекрытие, keyboard accessibility и ошибки списка/повтора.
- [ ] 4.6 Сопоставить UI с UX v1 и согласованным meeting-experience-refresh, включая мобильную клавиатуру и скелетоны; выполнить web check/tests/build/E2E, обновить описание владельцев/адаптеров и приложить реальные результаты отдельно от физического Safari.

## 5. iOS

- [ ] 5.1 Расширить FeedOwner независимыми cursors/ranges/read state и устойчивой очередью; проверить owner tests, process restart/потерянный ACK, generation, несколько pending и protected-storage failure.
- [ ] 5.2 Подключить SDK adapter и scene lifecycle с recovery/fallback; проверить snapshot race, фоновый режим, session expiry, logout и закрытие доступа через fake transport и simulator.
- [ ] 5.3 Реализовать bounded store, загрузку вокруг unread и якорь нативной ленты; проверить prepend/карточки/клавиатуру/поворот/ACK и сохранение места по UX v1.
- [ ] 5.4 Добавить read visibility, счётчики и readers sheet; проверить два устройства, Dynamic Type/VoiceOver, нулевой список, ошибку и возврат фокуса без прокрутки.
- [ ] 5.5 Сопоставить интерфейс с UX v1, обновить документацию владельца/хранилища и выполнить swift-format, unit/UI проверки и чистую simulator-сборку по frontend/ios/AGENTS.md; записать отдельно статус физического iPhone.

## 6. Android

- [ ] 6.1 Расширить Repository/ViewModel и MessageOutbox до очереди с устойчивыми ID и системной защитой хранения; проверить process death, lost ACK, draft, no-op/retry и изоляцию аккаунтов тестами.
- [ ] 6.2 Подключить SDK adapter через Flow и lifecycle, recovery/fallback; проверить auth, reconnect/reset, один запрос, background и revoke через fake transport и эмулятор.
- [ ] 6.3 Реализовать bounded store и LazyColumn anchor/around/автодогрузку; проверить reverse layout, IME/Back, resize карточки, собственный ACK и отсутствие прыжка при новых сообщениях.
- [ ] 6.4 Добавить visibility/read-through, счётчики и readers sheet; проверить два устройства, TalkBack/font scale, ошибки и возврат к исходной строке.
- [ ] 6.5 Сопоставить UI с UX v1, обновить документацию repository/outbox и выполнить wrapper/ktlint, unit/UI, Debug/Release и Android Lint по frontend/android/AGENTS.md; записать отдельно эмулятор и физическое устройство.

## 7. Сквозная приёмка и подготовка выпуска

- [ ] 7.1 Выполнить всю матрицу сбоев validation-plan на совместимом API и трёх клиентах; приложить версии, логи без секретов и результаты каждого сценария, оставляя непроверенные устройства открытыми.
- [ ] 7.2 Проверить latency/SQL/memory/frame бюджеты на записанном тестовом окружении; сравнить baseline, измерить горячую встречу и lock wait, устранить провалы до объявления готовности.
- [ ] 7.3 Проверить security и совместимость прежних поддерживаемых сборок, feature flags и rollback epoch; приложить результаты, не считать структурную валидацию runtime-проверкой.
- [ ] 7.4 Подготовить независимые артефакты релизов backend/web/iOS/Android, инструкции включения/отката и эксплуатационные метрики; проверить воспроизводимость сборок и указать готовность каждой платформы отдельно.
- [ ] 7.5 Сверить реализацию с четырьмя specs и UX v1, согласовать дополнения event-feed с соседними изменениями перед sync; выполнить strict OpenSpec validation, agent:check и git diff --check, сохранить итоговый verification report.

## Workflow follow-up

- Реальный деплой выполняется в отдельной работе по эксплуатации; этим
  исследованием он не запускается. Публикация мобильных клиентов отдельно
  от локальной приёмки, TestFlight ожидает Apple Developer Program.
- После реализации и проверок синхронизировать delta specs и архивировать
  изменение обычными навыками OpenSpec. Сейчас архивировать нельзя.
