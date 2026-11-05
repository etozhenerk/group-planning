# Подготовка короткого iOS meetings checkpoint

Только подготовка до handoff нового frozen UIhost. Устройство31262733-50DC-46A5-938E-4C462D70F109 не используется, предыдущий invitation bundle не подставляется. Полная матрица/manifest/gates не создаются.

Источники: approved-designs.json, ux.md §§ «Мои встречи — список/list-r3» и «календарь/calendar-r7», design/meetings-ios.json, общий mobile-mvp контракт. Объём checkpoint уже полного state inventory манифеста.

- Ready/long: настоящие карточки из отдельной memory fixture, одна кнопка meeting-display-toggle с целевым accessible name, footer unread без badge у заголовка; отдельная реальная встреча с длинным именем.
- Toggle→calendar→выбор дня→чат→Back: одна и та же позиция переключателя, имя «Показать календарь»/«Показать список», сохранение выбранного календарного контекста. Даты берутся из fresh fixture designDates, не из старых screenshots.
- Empty/upcoming и past-empty: принятые разные тексты и достижимое создание без дублей; контекст периода сохраняется.
- Первичный503: цельная ошибка и «Повторить загрузку»; повтор читает API. Отдельный503 обновления после готовых карточек: компактная ошибка над ними, карточки остаются, «Повторить обновление» восстанавливает готовый список.
- Короткие visual spot-check accessibility5 и QA-window320×568, фактические nativeWindow/physicalScreen записываются отдельно. VoiceOver не читается и не запускается.

Подготовлены4 targeted метода driver; они ещё не собирались и не запускались. После handoff — temp-copy build runner, подстановка/проверка нового точного bundle, эти selectors, краткий markdown с существующими screenshots/actions и освобождение устройства. Никакого переноса старых pass или повторной560-матрицы.
