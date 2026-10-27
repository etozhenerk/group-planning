# iOS storage и sync DTO: инженерный checkpoint

Worktree /Users/misha/.codex/worktrees/chat-ios-sync/group-planning, baseline51a5caf. Добавлены AES-GCM/Keychain/atomic-file storage, Codable outgoing model, sync DTO/requests и тесты. Это пока не подключено к SessionStore/FeedOwner, runtime SDK/queue отсутствует.

Последний unit suite:143 tests/36 suites PASS. Проверка физического Data Protection выделена отдельным тестом с явным skip на симуляторе: в Simulator API возвращает отсутствие protectionKey. Она остаётся непроверенной на физическом iPhone. AES-GCM tamper/перенос файла между встречами, перезапуск, nonce, backup exclusion, изоляция аккаунтов и удаление key проверены.

Первый/третий прогоны сохранили failure проверки protectionKey в симуляторе; второй заблокирован lock. Первый xcodebuild завис после завершения suite и был остановлен SIGTERM после SIGINT (PID41993); повтор после исправления разделения среды завершился штатно. Последний suite включает точные server fixtures6aac и проверку sync routes/around_entry_id/uint64. Полная feature/design приёмка не проводилась.
