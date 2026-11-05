# Date iOS R3 — узкий повтор

Вердикт: **needs-fixes только по оставшемуся deadline layout320**. Полные flows/suites/gates не запускались.

[Binding](artifact-binding.json): artifact `6450b84cbbce6e547faed1455a198771bc1587fb05341153b47e07ba98cba461`, source `101c2a2950613c376575e8df1a0a0f82948b6b3ad3ba06d77c49dacfb104f296`. Все20 файлов frozen/copied host проверены по SHA перед каждым запуском.

- Secondary actions исправлены: 15pt и акцент, реальные AX button bounds220×44pt. Один tap в3pt от нижнего края «Предложить дату», вне текста, открыл «Добавить». [Геометрия](actual/secondary-actions-metrics.json), [до](actual/320-card-secondary-actions.png), [результат нижнего tap](actual/320-card-action-lower-hit.png). Реальный poll/vote создан API только как QA-предусловие; UI создание/голосование/unknown/dirty не повторялись.
- Дата теперь «6 нояб.», слово больше не разрывается посередине. Но на320 дата всё ещё в две строки и поле56pt, время46pt; подписи/верхние края расходятся. [Actual](actual/320-compact-deadline.png), [metrics](actual/320-deadline-metrics.json). Это оставшийся narrow layout; ожидается читаемая компактная дата в той же геометрии строки.

Первый [метод](driver-independent.swift) выполнил card-action, затем failed на56/46 до capture: [журнал](smoke-independent.log). В xcresult нет failure attachments. Поэтому выполнен только короткий form-layout capture-before-assert, без повторного seed/card-action: [driver](driver-layout-proof-only.swift), [журнал](layout-proof-only.log). Его успешное выполнение означает получение actual, не исправление layout. Проверка смены invalid deadline/settings для stale clear отдельно не выполнялась (optional scope).

Context подтверждает настоящий QA UIWindow320×568 на physical Simulator screen402×874, iOS27.0, стандартный текст L. VoiceOver и настройки клавиатуры не читались/не менялись. Своя memory fixture остановлена, приложение завершено runner, lock освобождён; source/device свободны. Код/cases/manifests/tasks/Git не менялись. Новых runtime после получения этого actual не запускалось.
