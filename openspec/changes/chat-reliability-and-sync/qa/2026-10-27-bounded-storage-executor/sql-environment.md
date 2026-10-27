# Доступность SQL-проверки

27.10.2026 координатор проверил прежний SSH-доступ к существующей облачной ВМ
из `backend/docs/postgres.md` и исторического `postgres-verification.md`.
Выполнена только попытка SELECT current_database/current_user/server_version
через Unix socket, роль `somewhere_migrator`, строго БД `somewhere_integration`.

SSH доступен, PostgreSQL отклонил подключение:

```text
FATAL: database "somewhere_integration" does not exist
```

Это уточняет прежнее отсутствие локальной SOMEWHERE_TEST_DATABASE_URL:
историческая тестовая БД сейчас отсутствует. SQL integration/EXPLAIN остаются
blocked. Новая БД не создавалась, production-данные и конфигурация не читались
и не изменялись; сервисы не перезапускались. В stdout не было реквизитов входа.

Результат выше переписан из вывода конкретного tool-вызова; это краткая запись,
а не автоматически сохранённый raw log. Локальные compile/skip и memory/race
результаты сохранены отдельно и не подтверждают работу SQL на сервере.
