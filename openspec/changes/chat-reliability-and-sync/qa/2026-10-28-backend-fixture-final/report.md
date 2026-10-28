# Независимая приёмка backend — финальный fixture, 28.10.2026

**24/24 выбранных backend case/platform-пар прошли; `qa:ready` прошёл в MAIN
и отдельной чистой копии.** Это feature-проверка технического чата, не разрешение
полного backend-релиза. Продукт, ожидания, tasks и manifests проверяющий не менял.

## Точный кандидат

- Каталог: `1110fd0c1782e588ba66b6015b8b4aa0634d0f22cfa9b34157236d748291c274`.
- Backend source: `631d726ccefd1d836ff02e0842ec4228ae4a8aa6ad12ca638fb9e09ded92ba66`.
- Production: 214 входов,
  `3a3816f7d71b858a5d5e98a7e510ecb6da4c9f57188db5a9b44247bb2da9d96f`.
- Snapshot: `/tmp/somewhere-backend-fixture-final-20261028`.
  Все 391 исходных входа snapshot заново сверены с MAIN; отличий нет.
- Go 1.27.2, GOMAXPROCS=1, GOFLAGS=-p=1; тесты запускались с `-count=1`.

Снимок включает актуальное исправление test-only overdue place-poll fixture
и новый regression-файл, в том числе ещё не закоммиченные публичные inputs.
Private dotenv не копировался. Пробы прежнего независимого прохода переиспользованы
как методика и исходный код; результаты, процессы, базы, измерения, timestamps
и evidence hashes созданы заново после нового плана. Предыдущие ff08/2037/1110
прогоны сохранены отдельно и не переименованы в текущую приёмку.

## Выполнено

Обязательный `backend-unit-integration` завершился с exit 0. Независимый
runtime-набор: 37 PASS, 3 ожидаемых локальных SQL opt-in SKIP; supplement:
26 PASS. SQL-проверки выполнены отдельно на разрешённой ВМ в собственной
временной базе: 17 верхнеуровневых PASS, включая реальные отдельные процессы.

Проверены HTTP/SDK права, Origin, срок и отзыв сессии, минимальность уведомлений,
read-state и legacy-границы, bounded pages/through, lost-response idempotency
для текста и media, race snapshot/subscribe, восстановление после отключения,
durable outbox, rollback, удаление аккаунта/встречи и terminal delivery после
нового процесса. Пошаговые действия, expected/actual и точные selectors каждого
из 24 случаев находятся в [interaction.json](interaction.json); gate-результат —
[run-fresh.json](run-fresh.json).

Свежие измерения:

- 54 SQL feed-замера: p95 от 0,340 до 2,618 мс.
- Unread на истории 100 000: p95 39,396 мс.
- Удаление истории 100 001: 202 пачки, максимум 1000 строк,
  самый долгий statement 12,207 мс; rollback и commit проверены.
- Управляемые offline 300 секунд, истечение broker history, RTT 150 мс:
  восстановление 100 ID без дублей за 622,507 мс, после recovered=true
  дополнительно выполнен HTTP catch-up.

Чистая копия содержит 567 публичных inputs, catalog/spec/test refs и evidence,
без .git и runtime secrets. Её sourceHash и catalogHash совпали с MAIN;
`qa:ready` вернул ready=true, expected=24, checked=24, pending=[].
`npm run agent:check` и проверка whitespace прошли.

## Очистка

SQL driver сначала проверил отсутствие `somewhere_integration`, создал её
с уникальным nonce-комментарием и проверил его перед обычным DROP без FORCE.
Своя база удалена; удалены только два загруженных тестовых бинарника и каталог
`/tmp/codex-chat-independent-oKB2boDR`. Продовые данные и сервисы не менялись.
Receipt: [sql/receipt.json](sql/receipt.json).

Собственный HTTPS API на 127.0.0.1:57697 остановлен SIGTERM, fixture завершился
PASS. Предыдущий собственный API49557 также закрыт с отдельным receipt в его
историческом QA-каталоге. Стенды пользователя и других проверяющих не затронуты.
Бинарник нового fixture сохранён для независимых native-прогонов:
`/tmp/somewhere-backend-fixture-final-20261028/httpapi.test`, SHA256
`2f3ace38249765736153eb42924ec6a152f3971cce89175784bb88d3aaf07207`.

## Границы результата

Этот набор не включает клиентские 10k scroll/frame/anchor бюджеты,
commit→render latency, capacity под целевой нагрузкой, UI/IME/VoiceOver,
все releaseProfiles, реальный OAuth, точный release bundle и его rollout.
Offline 300 секунд моделируются контролируемыми часами; это не пяти­минутный
тест реальной мобильной сети. SQL restart — собственные тестовые процессы;
production old-binary rollback не выполнялся.

TLS и серверный доступ к тексту не являются E2EE. Проверка backup-кейса
подтверждает честно сохранённые ограничения: исторический age job не доказывает
актуальное прикладное восстановление, управление ключами или шифрование диска.
Восстановление production backup в этом прогоне не выполнялось.

Отдельный [read-only аудит release gap](release-gap-audit.md) выявляет незавершённую
постоянную поддержку: на PostgreSQL endpoint намеренно отвечает 503, а включение
бота блокирует запуск до реализации очереди. Постоянное media-хранилище
подключено, но полный SQL media upload/publish/read/restart/restore путь этими
24 случаями не принят. Это остаётся за границей данного feature pass.
