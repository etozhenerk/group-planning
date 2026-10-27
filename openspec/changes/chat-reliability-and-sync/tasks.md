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

- [ ] 1.1 Воспроизвести гонку web 100/101/102 через управляемый порядок GET/POST и снять сетевой baseline; сохранить regression и реальные результаты, не выдавая статическое чтение кода за воспроизведение.
- [ ] 1.2 Проверить встроенную Centrifuge и JS/Swift/Java SDK: pin версий, лицензии, auth, reconnect/recovery, совместимость Go/OkHttp/SwiftPM; приложить минимальные успешные проверки на трёх клиентах и перечень зависимостей.
- [ ] 1.3 Проверить топологию API и существующие свидетельства защиты дисков/backup/ключей; записать результаты в security review, не объявлять неизвестное выполненным и не добавлять новый сервис без обновления design.
- [ ] 1.4 Сравнить react-virtuoso с выбранным после spike @tanstack/react-virtual и проверить native lazy-контейнеры на текущих карточках/длинных строках: prepend, resize, focus, keyboard и anchor ≤ 2 единиц; сохранить замеры и выбранные параметры/контейнеры рядом с UX v1.
- [ ] 1.5 Снять серверный baseline ограниченных страниц и text/media retry на memory и изолированной облачной PostgreSQL по validation-plan; записать число прочитанных строк, планы SQL, задержки и статусы недоступных окружений.
- [ ] 1.6 Снять baseline scroll/frame/памяти на web/iOS/Android с текущими опубликованными карточками; записать устройство, сборку, якорь и динамические высоты, отдельно от UI-приёмки 2.1.0 соседнего изменения.

## 2. Backend: ограниченные данные и синхронизация

- [ ] 2.1 Ввести bounded Reader-порты page/around, lookup text intent и entry_id для media retry; проверить memory clone/rollback, initial/after/before/around, пустой хвост, uint64, cancel, access-before-data, lost ACK и прежний API. Полный Feed сохранить для остальных потребителей.
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

- [ ] 4.1 Ввести владельца chat state в допустимых слоях FSD и отдельный receive cursor; первым совместимым патчем сохранить его отдельно от display entries и двигать только после GET merge. Проверить regression 100/101/102, initial=0, empty/multipage/history, precision, lease и смену аккаунта; затем расширить upsert до актуальных projection versions при внедрении sync.
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

- [ ] 7.1 Выполнить серверную матрицу сбоев validation-plan на memory и изолированном SQL; приложить версии, логи без секретов и результаты, оставляя недоступные проверки открытыми. Полный клиентский проход разделён на 7.6–7.8.
- [ ] 7.2 Проверить серверные latency/SQL бюджеты на записанном тестовом окружении; сравнить baseline, измерить горячую встречу и lock wait. Полный commit→visible/frame проверяется вместе с 7.9, серверные замеры его не заменяют.
- [ ] 7.3 Проверить серверную security и совместимость прежнего HTTP, feature flags и rollback epoch; приложить результаты. Клиентские security/совместимость входят в полные проходы 7.6–7.8.
- [ ] 7.4 Подготовить независимые локальные артефакты backend/web/iOS/Android и инструкции включения/отката; проверить воспроизводимость и указать готовность каждой платформы отдельно, без production и store-операций.
- [ ] 7.5 Сверить реализацию с четырьмя specs и UX v1, согласовать дополнения event-feed с соседними изменениями перед sync; выполнить strict OpenSpec validation, agent:check и git diff --check, сохранить итоговый verification report.
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
