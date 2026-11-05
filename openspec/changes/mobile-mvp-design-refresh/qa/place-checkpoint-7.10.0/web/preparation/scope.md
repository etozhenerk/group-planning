# Подготовка place checkpoint

Только QA tooling; runtime/build до frozen-кандидата не запускались. Prepared driver требует `PLACE_RUN_FROZEN_CHECKPOINT=1`, `PLACE_CANDIDATE_FILE`, `PLACE_BASE_URL`; разрешён только loopback. Итоговые evidence пойдут рядом с переданным candidate независимо от номера checkpoint.

Основание: approved idplace → assets/navigation-r2/nav-place/frame.html SHA `b9519dde810993fa88c253bcbc6e7bdee1cd2e42c9d296364de79f60ffdcd757`; normalized preparation/references/place/frame.html — ручная производная place-r4. Карты исключены явным решением пользователя, не тестируются и не являются gap. Дополнительно UX/specs и testing/cases/place-change-polls.yaml; desktop сохраняет прежнюю композицию.

План: actual/ref390 и320; current-place comparison, обязательное multiline новое место, optional explanation, inline errors/focus для empty/same place и correction; deadline/TZ/note; dirty Stay/Leave в одном Dialog. Затем Known429→retry→реальный commit+lostACK→exact-body/key retry→один poll/card, UI vote. После create и после голоса отдельно GET meeting: место обязано оставаться исходным до окончания опроса, даже при большинстве текущих голосов.

Изолированные fixture Катя/Олег и собственная API-встреча. API contract: POST place-polls `{place,closes_at,explanation?}`, PUT vote `{answer,expected_revision}`. Browser fixture запускает PlacePollWorker; runtime support ещё не проверен. Synthetic429/lostACK только до/после настоящего local API commit. Реальные author/cover/avatar_url берутся только из API; отсутствие avatar_url → силуэт/limit, фотографии макета не подставляются.

Лимиты: не полный каталог/матрица, без карты/геолокации, закрытия/clock-travel/ничьих/конкурентных worker, real mobile IME/VO, других платформ и финальных gates. Будут приняты только реально выполненные ветви. Source/application не меняются.
