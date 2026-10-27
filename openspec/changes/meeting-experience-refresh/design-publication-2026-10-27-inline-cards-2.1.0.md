# Дополнение токенов inline-карточек · 2.1.0

Исправляем реализации по уже принятому [raw](assets/revisions/2026-10-27-telegram-chat/chat.html).
Его HTML/CSS/TS/SVG и [hash](assets/revisions/2026-10-27-telegram-chat/source-hashes.json)
не меняются. Пользователь ранее поручил перенести весь пакет 1 в 1.

Новые совместимые `component.mobileChat` роли: `inlineMaximumWidth` 440,
`inlineEyebrowIcon` 15, `inlineEyebrowGap` 7, `inlineBadgeRadius` 5,
`inlineBadgeInsetBlock/Inline` 1/5, `inlineVoteRadius` 10,
`inlineVoteInsetBlock/Inline` 9/12, `inlineActionRadius` 10,
`inlineActionInsetBlock/Inline` 9/15, `inlineFootGap` 9,
`inlineTitleAfterGap` 5 и `inlineTaskChevron` 18. Значения извлечены
из `.inline-card/.card-eyebrow/.status-label/.vote-option/.small-action/.card-foot`.
Существующие роли цвета/шрифта/отступа сохраняются; native target 44/48.

Затронуты web, iOS, Android: карточки опросов места/даты и задач в чате.
Поведение API, права и сценарии не меняются; новая версия не уменьшает матрицы.
[Контракт](../../../docs/design/components/chat-actions.md), [UX](ux.md),
[задачи](tasks.md), [manifest](design-manifest.json) обновлены до реализации.
Историческая публикация 2.0.0 и evidence сохранены, snapshot метаданных с hash
лежит в `qa/2026-10-27-chat-correction-2.0.0/publication-snapshot`.
Приёмка 2.1.0 требуется заново; публикация не является pass клиента.
