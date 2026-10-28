# Независимый iOS gesture review · 28.10.2026

**Needs fixes; полной функциональной/дизайн-приёмки нет.** Проверяющий `/root/backend_independent_resume` не менял продукт. Приложение — frozen UITestHost cb599c2e…; независимый XCTest bundle собран отдельно.

Подтверждены P1 `IOS-COMPOSER-TOGGLE-INSERTS-EMOJI-001` и P2 `IOS-EMOJI-CATEGORIES-DESIGN-002`; точные шаги, артефакт и ограничения — [дефект](defect-composer-toggle.json), [наблюдения](observations.json), [дизайн-отчёт](design-review.json). P1 повторён после чистой установки и с уникальным namespace: composer пуст до двух toggle taps, после них появляется 🥲. Предыдущий ChatSync run вставил 🥰 до Home, поэтому это не доказательство ошибки восстановления черновика.

Три штатных теста и два собственных gesture теста прошли на legacy capabilities. Проверены tap фото/hold реакций, отмена по pan, full picker/grid, люди/фильтры, сохранение draft и anchor≤2pt, portrait и landscape. Это не переносится в realtime приёмку. Свежий realtime профиль явно подтвердил sync/read_state/realtime=true: подписка, send, empty→1 readers, counterpart receive и отсутствие idle poll прошли; дальнейший composer шаг выявил P1.

Сохранены промежуточные ошибки harness: отсутствие XCTest Swift overlay в первом compile; pan короткого помещающегося диалога; ChatSync на выключенном realtime; повтор counterpart RSVP с obsolete expected_revision=0. Их результаты не объявлены багами продукта или pass.

14 выбранных полных кейсов не закрываются: отдельные error/revoke/multi-user/пагинация/VoiceOver/large text/Reduce Motion ещё не пройдены. Landscape software IME не подтверждён; кадры p95 и commit→render не измерялись. Полные ios-ui/ios-unit suites этим reviewer не запускались. Root изменил iOS и shared web inputs после captures; прежние context hashes сохранены. Нужна свежая сборка/повтор после исправлений.
