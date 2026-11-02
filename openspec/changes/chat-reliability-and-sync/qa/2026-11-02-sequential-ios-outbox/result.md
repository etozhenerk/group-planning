# iOS5.1 · устойчивая очередь

Основной агент последовательно проверил текущий runtime; productionкод не менялся.
Добавлен только адресный XCTest через VFS, одинметод24.163sPASS.

Настоящий локальный API записал сообщение, ответ был удержан после серверного
commit. До завершения процесса виден один persistedpending и отдельный новый
draft. После настоящего app.terminate/launch тем же профилем — одна canonical
строка, pending отсутствует, новый draft сохранён. При coldstart выполнен retry
с тем же ключом: сервер зафиксировал2POST/1key/1canonicalID. Actual до/после,
метаданные и XCResult-attachments сохранены в `actual`, итоговый кадр просмотрен.

Важная поправка проверки: XCTest прошёл, но экспериментальная fixture ожидала
ровно1POST и завершиласьFAIL при корректных2POST с одним ID. Исходный FAIL
сохранён в `fixture.log`/`ui.log`. Основной агент проверил фактические счётчики
по контракту идемпотентного повтора в `scoped-result.json`; общий failedrunner
не переименован в PASS. Ожидание fixture исправлено для следующего запуска,
повторять тот же успешный UI-сценарий ради надписиPASS не стали.

Остальные технические условия уже проверены текущим unit211PASS:
ChatOutboxTests — durable-before-send/ошибкаstorage, последовательная очередь,
uncertain/rejected и чужойACK; ChatRepositoryTests — IDs/порядок/draft при
восстановлении, lease/generation, старый writer после revoke/accountswitch;
ChatSyncTests/FeedOwnerTests — frozenlostACKbody/key, cursor/ACK, истечение
сессии/доступа и старый ответ. EncryptedChatStorageTests — AES-GCM/CryptoKit,
настоящий simulatorKeychain, freshnonce, отсутствие plaintext, подмена,
перемещение между встречами, исключениеизbackup и удаление только нужного owner.
Ссылки на исходный unitжурнал:
`../meeting-experience-refresh/qa/2026-11-02-ios-final-r7-independent/acceptance/suites/ios-unit-1793625897786.txt`.

Физический CompleteFileProtection остаётся явным1SKIP: пользователь разрешил
только симуляторы. Это не утверждение физического/общего7.7PASS. Актуальный
stockruntime2282 неизменён; новый VFS добавляет только testметод, overlay Go
управляет доступностью feed до/после coldstart и безопасно считает IDs.
Настоящая системная клавиатура использована при вводе; runner восстановил
исходную настройку minimization=1, fixture/config очищены штатным trap.
Нет независимого нового агента, store/production/Telegram/release действий.
