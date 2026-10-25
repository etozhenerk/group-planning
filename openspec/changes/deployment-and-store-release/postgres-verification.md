# Проверка PostgreSQL и первого запуска

Дата: 25.10.2026. База проверки — `somewhere_integration` на существующей
облачной ВМ. Production `somewhere` не использовалась для тестовых записей.
Локальная БД/Docker не запускались.

## Реализовано

PostgreSQL 16, pgx v5.11.0, постоянные адаптеры meetings/identity,
встроенная транзакционная миграция с checksum и отдельной DDL-ролью.
Персистентны также place polls, preparation tasks и meeting covers,
появившиеся после исходного плана хранения. API-контракт не менялся.
Backend и web имеют независимые release artifacts и symlink каталоги.

## Проверки

- Go test/race, vet, build, dependency boundaries, format — прошли.
- OpenAPI: 49 схем, 32 fixtures, 341 реальный HTTP-ответ — прошли.
- Web static/unit: 18 файлов, 62 теста; production build — прошли.
- Web e2e: 88 passed, 1 skipped (сквозной web/iOS/Android) за 3,9 минуты.
- Проверки release tooling: 8 passed; agent:check и OpenSpec strict — прошли.
- Реальная БД: повтор миграции, отказ при checksum mismatch, создание
  встречи с отложенным FK задачи, сессии/попытки/профиль, cover, polls/tasks,
  receipts, rollback, read-only/closed/cancelled tx и 12 конкурентных
  добавлений feed через второй пул — прошли.
- Повтор создания с тем же ключом через второй пул вернул тот же результат.
  Второй worker не получил активный lease; после истечения перехватил задачу.
  Устаревший worker отклонён, повтор завершения безопасен, встреча и задача
  завершены атомарно. RSVP записан и прочитан вторым пулом.
- Ошибка SQL в identity не превращается в «нет сессии»: Store возвращает
  безопасную ошибку хранилища, транзакция откатывается.
- Runtime-роль: superuser=false, createdb=false, createrole=false,
  CREATE public=false, UPDATE schema_migrations=false.
- Отдельный процесс API на 127.0.0.1:18080, runtime-роль somewhere:
  `/readyz` 200; при остановке PostgreSQL `/healthz` 200, `/readyz` 503
  с телом `not ready`; после старта БД `/readyz` снова 200 без restart API.
- После restart API/PostgreSQL и pg_dump/pg_restore в чистую
  `somewhere_restore_check` совпали counts и MD5 всех document-таблиц,
  включая sessions, receipts, jobs, polls и cover. Хеши сверялись автоматически;
  содержимое записей не выводилось.

Это функциональная проверка на небольшом тестовом наборе, а не измерение
предельного RPS, полного production RTO или подтверждение всех требований 14.4.
Остаются нагрузочный прогон, расширенные сбои, проверка независимой внешней
копии на актуальных данных и сквозная приёмка мобильных клиентов.
Реальный OAuth и публичный сайт проверяются после установки релизов;
результат записывается отдельным дополнением ниже.
