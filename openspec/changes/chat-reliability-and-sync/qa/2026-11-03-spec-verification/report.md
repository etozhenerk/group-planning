# Сверка четырёх specs и UX v1, 03.11.2026

Область: 7.5, OpenSpec verification основным агентом, без новой UI-приёмки,
релизов, Telegram, sync или архивации. Реализация и существующие результаты
сверены с четырьмя delta specs, design/protocol/UX и соседними изменениями.

| Spec | Реализация и проверяемые границы |
| --- | --- |
| chat-sync | backend meetings/chat_sync, chat_journal/dispatch и bounded storage; web createChatUpdates/chatState, iOS ChatRepository/FeedOwner, Android ChatRepository/FeedViewModel. through_cursor отделён от ACK/sequence; intent ID сохраняется, HTTP fallback и terminal auth ограничены. Регрессии chat_sync_test, 38-chat-sync, native ChatSync/ChatQueue. |
| chat-read-state | backend chat_read/chat_readers; web createReadMarker/useReadVisibility, native read controllers. Actual marker отделён от baseline, max устройств и current-members readers. Unit/HTTP и 41/43 web/live native кейсы существуют; оставшаяся полная доступность — 5.4/6.4. |
| chat-security | server auth/Origin/TLS и актуальное членство, lease/generation на клиентах; native EncryptedChatStorage/Keystore, web session-scoped IndexedDB. Старый ответ не восстанавливает приватное состояние. E2EE не обещается; существующий security review отделён от непроверенной конфигурации. |
| event-feed | feed_window/around и ограниченные Reader-порты; web FeedTimeline/TanStack, iOS FeedTimeline, Android LazyColumn. Stable ID/anchor, read visibility, загрузка локальной границы и bounded window реализованы; полные количественные frame/memory/anchor бюджеты остаются 1.4/1.6/7.9. |

Coherence: UX исправлен по уже опубликованному chat-actions: queued/sending без
текста, пустой слот первые 2 с и круговой индикатор позже; mobile readers без
крестика, стабильный viewport, dismiss без refresh. Это устранение устаревшего
описания, не новый дизайн/токены. Контракты и исторические evidence не переписаны.

Дополнения event-feed согласованы как объединение требований перед будущим sync:
gathering-activity-feed сохраняет общую хронологию, роли, автора и актуальные детали;
chat-reliability добавляет bounded window/sync/read/anchor; meeting-experience
сохраняет chat-composition/chat-reactions/media и текущие панели. Удалять или
заменять базовые требования при sync нельзя. Среди этих трёх изменений нет двух
конкурирующих замен одного requirement event-feed.

Completeness: перед закрытием 7.5 выполнено 30/43. CRITICAL для полной готовности:
1.4, 1.6, 4.6, 5.4, 5.5, 6.4, 6.5, 7.2, 7.6, 7.7, 7.8, 7.9 остаются отдельными
открытыми пунктами; завершить их по собственным критериям. Correctness: статическая
сверка находит реализацию требований, но не подменяет недостающие live/perf
результаты и не выдаёт общий qa/design PASS. Coherence: указанные противоречия
устранены; физические устройства и реальные OAuth-циклы здесь не проверялись.

Проверки: strict validation изменения, agent:check и git diff --check — PASS.
Сверка 7.5 завершена; всё изменение готовым или архивируемым не объявляется.
