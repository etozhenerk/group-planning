# Realtime PostgreSQL: изолированный прогон

Кандидат `e794168085968b123e011844ac9b97539af54857`. Девять integration-тестов прошли, включая миграцию 006, rollback/lease/restart/stale ACK, pending index и прежние sync/journal/feed окна. Точный бинарный hash, время и удаление собственной временной БД подтверждены в receipt.json и sql-live.log.

Прогон создаёт отдельную БД на уже используемой облачной ВМ; production-БД, конфигурация и сервис не изменялись. Это инженерная SQL-проверка, а не полный release/capacity pass. Бинарник хранится в локальном cache и не включён в Git.
