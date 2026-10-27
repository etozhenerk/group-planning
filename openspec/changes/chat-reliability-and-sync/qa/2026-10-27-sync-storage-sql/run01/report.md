# HTTP sync / retention: SQL run01

27.10.2026, 19:10:15–19:10:24 UTC. Commit
`6aac61e80a52fdaa2eb117d16b1c42d06ec1857d`, Linux/amd64 binary SHA256
`78038a7f2e2a4dceb85aaea1be610622da05b866eb76e994a463fd5de0b49e33`.

Все семь integration-тестов прошли, включая новую миграцию 005,
retention/sync и инициализацию stable epoch прежних записей. Повторно прошли
atomic journal/account-outbox, v3 migration, ограниченные запросы на 100 000
изменений и feed/around с uint64. Бюджет journal query — 101 строка;
execution time 0,022–0,514 мс относится только к SQL, не к пользовательской задержке.

[Лог](sql-live.log) и [receipt](receipt.json) фиксируют результат точного
бинарника. [Локальный runner](run.py) и [удалённый runner](remote-check.py)
создали только отсутствовавшую `somewhere_integration`; nonce проверен перед
удалением. Временная база и каталог бинарника удалены. Production не менялся,
локальная БД/Docker не запускались.

Это инженерная проверка текущего серверного среза. Она не принимает dispatcher,
WebSocket, клиентское восстановление, read markers или весь каталог фичи;
полные feature/release gates остаются открытыми.
