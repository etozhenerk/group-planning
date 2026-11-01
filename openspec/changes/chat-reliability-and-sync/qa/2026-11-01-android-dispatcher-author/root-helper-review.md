# Независимая проверка QA scheduler helper

Reviewer: /root. Исполнитель проверяемого изменения: /root/sdd_server_audit.
Проверены только QA helpers и подключение в runner; функциональная приёмка
продуктового Android этим чтением не заменяется.

Проверенный delta SHA256:
7e4d7fd46f38c8686ed6efebdaeb3e06846fae24ea10b27f11bef6e50cbf5693.

Текущий helper явно создаёт отдельный scheduler и StandardTestDispatcher на
rule; прежний MotionDurationScale остаётся в effectContext. Объект idling
resource регистрируется раньше штатного Compose resource. Проверены реальные
pinned исходники Compose UI Test1.9.5: TestDispatcher выбирается из effectContext,
registry опрашивает ресурсы последовательно; штатный resource регистрируется
в withComposeIdlingResource. Публичный IdlingResource требует main thread;
helper дополнительно проверяет Looper. runCurrent исполняет только текущие
задания, не переводит виртуальное время и не меняет autoAdvance.

Новых глобальных dispatchers, потоков, таймеров, production-обходов и изменения
ожиданий продукта нет. Две новые регрессии проверяют background callback,
настоящий lifecycle Flow collector, UI-текст, main-thread effect/apply и
следующее независимое обновление состояния; обе включены в штатный all runner.
Default/fixed controls сохранены отдельно, простое введение Standard сначала
не прошло, текущая интеграция проверяется новым positive и исходными failures.

Блокирующих замечаний к этим двум helpers не найдено. Следующая обязательная
граница: адресные реальные UI/animation проверки и затем один current full suite.
Код-review не объявляет успешными ещё не законченные instrumentation/postconditions.
