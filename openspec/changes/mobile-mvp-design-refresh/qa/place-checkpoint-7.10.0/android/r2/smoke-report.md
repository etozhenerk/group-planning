# Android Place R2 — targeted повтор

**Observed-pass в заданном объёме**, новых замечаний нет. Не финальная приёмка, не полный manifest и не gate.

Exact frozen APK `28d6fc5d1eb451385d924fdf304ba2cd2c7371c3e9e9b196aa67911d19bebbfa`, source кандидата `7ba2fdd3e435be40e984b6a5d20516950234a62a7c2b66af6e67b076499484ad`, DS7.10. Installed bytes совпали: [installed-after.json](installed-after.json). Normal360×800dp/API36; только два actual capture.

- **Selected card исправлена:** «За» со светлой OwnMessage-заливкой, тёмным OwnText у label и count. Actual [selected-card360.png](selected-card360.png), [selected-card360.xml](selected-card360.xml); fresh raw [reference-selected-card360.png](reference-selected-card360.png). Кнопки48dp по actual bounds; read-only binding `PlaceVoteButton.kt`/generated DesignTokens:14sp, line-height21, r12, padding12, OwnMessage#e0dce8/OwnText#27252d. Точная попиксельная регрессия не заявляется.
- **Одна empty hint:** submit пустой формы → «Укажите новое место», правильный focus, error/hint и footer доступны с IME. Actual [empty-hint360.png](empty-hint360.png), [empty-hint360.xml](empty-hint360.xml); exact text подтверждён действием над raw new-place field: [reference-empty-hint360.png](reference-empty-hint360.png), [reference-state.json](reference-state.json). Первый reference locator захватил соседнее поле; corrected run по наблюдённому placeholder. Это QA-предусловие, не продуктовая находка.

Reference clock05Nov10Z фиксирует активный raw опрос до его демо-deadline21:00; actual/серверные часы не менялись. Выбранная карточка подготовлена реальными API данными; UI create/vote/retry/dirty/unknown и старые API функциональные проверки не повторялись. Read-only result style и same-place hint не прогонялись, R1 pass на них не переносится. Новых app/runner builds, large матриц, VO/TalkBack, карт и gates нет.

[Binding/SHA](review-binding.json). [Cleanup](cleanup.json): globals не менялись и совпали, own config/namespace/reverse удалены, QA app и только свой fixture остановлены, restored=true. Source/device RELEASED. Только QA-файлы; приложение, Git, tasks, эталоны не менялись.
