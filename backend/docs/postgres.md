# PostgreSQL: запуск и выпуск

Production использует PostgreSQL 16 и pgx v5.11.0. Все записи встреч,
приглашений, RSVP, ленты, receipts, опросов, поручений, обложек и задач,
а также пользователей, попыток входа и сессий сохраняются в БД.
Memory остаётся режимом локальной разработки без БД/Docker.

## Права и конфигурация

На ВМ `somewhere_migrator` владеет БД и применяет DDL; `somewhere` получает
CONNECT/USAGE и SELECT/INSERT/UPDATE/DELETE прикладных таблиц. Обе роли
не superuser. Для `schema_migrations` runtime разрешён только SELECT.
Соединение на ВМ идёт через Unix socket и peer; порт 5432 наружу не открыт.

```sh
sudo -u somewhere_migrator env \
  SOMEWHERE_DATABASE_URL='host=/var/run/postgresql dbname=somewhere user=somewhere_migrator sslmode=disable' \
  /opt/somewhere/backend/current/somewhere-migrate
```

Runtime: `SOMEWHERE_STORAGE=postgres`, `SOMEWHERE_DATABASE_URL` с ролью
`somewhere`, `SOMEWHERE_WEB_DIST=/opt/somewhere/web/current`, web/public origin
`https://smwhere.ru`. OAuth-секреты хранятся вне Git в защищённом env-файле.
Пул ограничен 10 соединениями, connect 5 с, statement 5 с, lock 3 с.
Для managed заменить DSN на TLS `sslmode=verify-full` с доверенным CA.
Приложение не зависит от superuser-расширений или файловой системы PostgreSQL.

Миграция проверяет checksum и версию под advisory lock и выполняется одной
транзакцией. Runtime не применяет DDL. Несовместимая схема не допускает старт;
последующая потеря связи даёт `/readyz` 503, `/healthz` остаётся проверкой процесса.
Ответы/логи не включают DSN, SQL и значения записей.

Удаление встречи остаётся одной атомарной транзакцией под прежней блокировкой
записи. Лента удаляется порциями не более 1 000 записей: граница очередной порции
выбирается по `(meeting_id, sequence)`, затем удаляется этот диапазон.
Это ограничивает количество построчных FK CASCADE для реакций в одном запросе
при штатном statement timeout. Курсор движется по существующим sequence,
включая пропуски и максимальный uint64; ошибка или отмена откатывает все порции.
История других встреч и их реакции не меняются. SQL-регрессия
`TestMeetingDeletionLargeHistoryIntegration` проверяет 100 001 запись,
предел порции, rollback, полное удаление и изоляцию соседней встречи.

## Независимые релизы

Теги `backend/v…` и `web/v…` создают отдельные GitHub Releases с manifest и
SHA256SUMS. Backend содержит `somewhere-api`, `somewhere-migrate` и systemd unit;
web содержит production dist. Проверять checksums до распаковки.
Установку на подготовленной ВМ выполняет `infra/host/deploy-release.py`.
Архив не содержит env-файлы; конфигурация `/etc/somewhere/application.env`
принадлежит root:somewhere и имеет режим 0640.

Каждый компонент устанавливается в `/opt/somewhere/<component>/releases/<version>`;
`current` переключается атомарно. Backend мигрирует до переключения.
Перед миграцией установщик останавливает `somewhere.service` вместе с API и
встроенными workers. После restart проверяется `/readyz`. При ошибке прежний
backend и его systemd unit возвращаются только при подтверждённо неизменном
наборе версий/checksum миграций. Если схема изменилась или её не удалось прочитать,
сервис остаётся остановленным, `current` указывает на новый принятый артефакт;
оператор восстанавливает его по [инструкции хоста](../../infra/host/README.md#восстановление-backend-после-неудачного-выпуска).
Down-миграций и автоматической смены feature flags нет. Web сохраняет атомарный
возврат своего symlink при ошибке; его релиз не запускает миграции.
Web обслуживает Go webui: сохраняются deep links и серверный Open Graph.

## Проверка без локальной БД

```sh
cd backend
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go test -c \
  -o /tmp/somewhere-postgres.test ./internal/storage/postgres
```

Скопировать binary на ВМ. Создать отдельную БД `somewhere_integration`,
владелец `somewhere_migrator`, и запускать тест от одноимённого OS-пользователя
с `SOMEWHERE_TEST_DATABASE_URL`. Тест отказывается от другого имени БД.
Он проверяет повтор миграции/checksum, атомарное создание встречи и задачи,
все типы записей через второй пул, rollback, read-only/closed/cancelled tx,
параллельную последовательность feed и ошибку SQL в identity.
Без переменной этот набор явно пропускается; обычные Go-тесты его не заменяют.

Перед production отдельно проверить restart PostgreSQL/API, readiness при
отказе БД и восстановление `pg_dump` в чистую БД. Сверять количество и хеши
всех документов, включая sessions/receipts/jobs/covers; не печатать сами записи.
Ежедневные зашифрованные копии и экспорт описаны в `infra/host/README.md`.
При переносе на managed остановить HTTP-запись и worker, сделать финальную
копию, восстановить, сверить данные, сменить DSN и проверить readiness.
После новых записей в новой БД простой возврат DSN запрещён: потребуется
обратный перенос изменений или восстановление с явно согласованным RPO.


## Необязательные бизнес-метрики

Новый backend-релиз содержит `somewhere-migrate -business-metrics`. Обычный запуск
миграций этот модуль не включает. Перед включением проверить его на изолированной
`somewhere_integration`: `TestBusinessMetricsPersistenceAndPrivacy` не должен быть
пропущен. Нужны уже существующие роли `somewhere` и `somewhere_metrics`.

После установки проверенного релиза выполнить на ВМ под DDL-ролью:

```sh
sudo -u somewhere_migrator env \
  SOMEWHERE_DATABASE_URL='host=/var/run/postgresql dbname=somewhere user=somewhere_migrator sslmode=disable' \
  /opt/somewhere/backend/current/somewhere-migrate -business-metrics
```

Схема `observability` содержит checksum установки, суммарные входы по дням UTC,
триггер новых сессий и агрегирующее представление. Этот модуль не меняет версию
прикладной схемы и совместим с API, поддерживающим её текущую версию.
Отдельная миграция удаления аккаунта переводит прикладную схему на версию 2;
её требования к выпуску и откату описаны в [инструкции](account-deletion.md).
Повторное включение проверяет checksum и не сбрасывает числа. Изменение установленного
SQL требует отдельной миграции, подмена checksum запрещена.

После этого заменить `postgres-metrics.py` проверенной версией, перезапустить
`somewhere-postgres-metrics.service`, проверить локальный `/metrics` и девять
`somewhere_business_*` в Monium. Экспортёр имеет SELECT только на представление,
не на профили или сессии. При сбое чтения он не публикует вымышленные нули.
Счётчик не восстанавливает историю до включения; её начало хранится отдельно.

Обычный pg_dump включает observability, триггер и ACL. В restore drill сверить
входы и начало истории, владельца функции, права exporter; проверить новый login
после восстановления. При восстановлении с `--no-acl` восстановить разрешения
явно: USAGE на схему и SELECT на представление для `somewhere_metrics`.
Откат API не требует удаления observability и не обнуляет накопленные входы.
