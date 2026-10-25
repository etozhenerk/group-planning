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

## Установка 25.10.2026, 11:15 МСК

- `backend/v0.1.0-rc.2` и `web/v0.1.0-rc.2` опубликованы GitHub Actions
  с commit `669e3c347dfbf553c964c93082e6601887e5d517`; обе release pipelines
  завершились success. SHA256 архивов: backend
  `1ed6ccc0e507a6f057a5c91b028d09e3e06ce0c603f61faf35442ae3bda6ef9c`, web
  `daba07ce6346c872d601317eb974bea7d8b4a333ae339101aada294f8a6802c1`.
- Установщик проверил manifest/checksums и установил оба компонента в
  `/opt/somewhere/<component>/releases/0.1.0-rc.2`. Backend применил миграцию
  от somewhere_migrator, отозвал запись в schema_migrations у runtime.
- Caddy переключён с 503 на reverse_proxy; прежний конфиг сохранён в
  `/etc/caddy/Caddyfile.before-application`. HTTPS root, `/healthz`, `/readyz`
  возвращают 200; JS/CSS загружаются с корректными MIME. Страница проверена
  во встроенном браузере: вместо заглушки открывается лендинг приложения.
- Deep links `/meetings` и `/auth/return` возвращают HTML; неизвестные
  приглашения обоих форматов возвращают 404. Неизвестный общий SPA-путь
  возвращает HTML 200 и обрабатывается клиентским not-found; проверка
  полноценного действующего приглашения/OG ещё не закрыта.
- Production API успешно перезапущен, readiness вернулась в 200.
  Runtime действительно подключается ролью somewhere к миграции версии 1.
  PostgreSQL не доступна снаружи; Go слушает 127.0.0.1:8080.
- Вход пока **отключён**: перенос существующих OAuth-реквизитов на ВМ
  ожидает отдельного подтверждения пользователя после отказа автоматической
  проверки разрешений. В Git/логи секреты не добавлялись. `/api/v1/me` — 401,
  auth/start — 503; это не успешная проверка реального входа.
- Callback smwhere.ru уже зарегистрирован в Яндекс OAuth; с ВМ доступны
  oauth.yandex.ru/token (405 без POST) и login.yandex.ru/info (401 без токена).
- Службы somewhere/Caddy и backup timer включены. Последний уже выполненный
  backup имеет Result=success/ExecMainStatus=0; новый экспорт в этом прогоне
  не выполнялся. После удаления двух тестовых БД свободно 6,5 ГБ из 9,1 ГБ.
- Repository CI нашёл прежний SC2016 в обёртке gofmt. В `3c4f63f` проверка
  вынесена в отдельный shell-файл; Repository, Backend, Contracts и Telegram
  CI после исправления зелёные. Релизные теги не перемещались.

Сайт опубликован, но полный пользовательский сценарий ещё не принят:
следующий обязательный шаг — разрешённая установка OAuth-реквизитов,
restart, реальный вход и создание/повторное открытие встречи.
