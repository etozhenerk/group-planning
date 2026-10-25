# Мониторинг: продолжение 25.10.2026

## Внешняя HTTPS-проверка

Подготовлены probe.tf и четыре mock-теста: отдельные runtime/invoker, только
запись метрик, закрытая функция probe.Probe из monitoring/v0.1.0-rc.3,
256 МиБ / 30 секунд / concurrency 1, лимиты по одному вызову/экземпляру на зону.
Минутный таймер включается только после ручного вызова и проверки записи метрик.
ZIP и manifest сверены по SHA256SUMS. Terraform validate и все 12 mock-тестов прошли.

Общий plan получил таймауты при чтении VPC/Lockbox. Ограниченный plan только
для probe прошёл: 6 create, 0 change, 0 destroy. Apply остановился в configure
provider: TLS handshake timeout при получении endpoints. Ресурсов probe в state
нет; таймер не создавался. Это не успешный деплой. Полный plan после восстановления
сети обязателен. Пользователь сообщил, что VPN сейчас отключить нельзя;
SSH/настройки ВМ отложены, правила доступа не расширялись.

Панель «Обзор» обновлена и перечитана по постоянному URL: прежние PG/backup
сохранены, добавлены шесть графиков HTTPS. Они показывают «Нет данных»; описание
прямо указывает, что функция ещё не запущена. В момент проверки PostgreSQL=1,
возраст копии около 6–7 часов. /readyz один раз успешно ответил 200 с текущей сети,
другие сетевые попытки давали TLS timeout.

## Доставка Telegram

Повторный авторизованный вызов production-функции вернул HTTP 502,
errorMessage=telegram transport failed. Токен/чат не менялись, новый канал к
боевым алертам не привязывался. Отправка из облака не подтверждена. Поддержке
не писали. Не относить этот сбой к инциденту провайдера без доказательства.

## Бизнес-панель

По дополнительному поручению владельца подготовлены постоянные агрегаты:
профили, встречи, чаты/чаты с сообщениями, сообщения, входы всего/сегодня UTC,
начало учёта и успешность сбора. План: business-metrics.md, задача 3.10.

Панель создана в Monium: fbekle0imi8geuvpah9a. Восемь графиков, девять рядов,
без дополнительных пользовательских меток. Источник на ВМ пока не развёрнут;
нулевых значений вручную не добавляли.

В backend добавлен необязательный флаг migrate -business-metrics: отдельная
checksum-миграция observability, триггер новых сессий и агрегирующее представление.
Основная schema_migrations остаётся версии 1 для совместимости прежнего API.
Счётчик входов не привязан к сохранности отдельных сессий и не backfill-ится.
Exporter получает доступ только к агрегатам, на ошибках публикует success=0
и пропускает остальные значения. Миграция в production не запускалась.

## Проверки

Пройдены Go format, race, vet, build, архитектурные границы; 3 теста exporter,
33 теста CI routing, 8 тестов release tooling, actionlint и agent:check.
Контракт: 49 схем, 32 fixtures, 341 реальный HTTP-ответ. JSON пяти панелей создан
генератором; обзор и бизнес-панель проверены в Monium.

Cloud integration TestBusinessMetricsPersistenceAndPrivacy написан, но не
исполнен без доступа к изолированной БД. Он проверяет replay/checksum, дубли,
rollback, logout, конкурентные сессии, UTC, reconnect и границы доступа.
Проверка реального runtime-role, cleanup, restore с новыми агрегатами и поступление
девяти рядов остаются обязательными до включения в production. Локальная БД/Docker
не запускались. Задачи 3.8 и 3.10 остаются открытыми.

## Подготовленный релиз

Код опубликован в main: `4426243792d7bec273763518d039ae7405fd8dd3`.
Из этого commit выпущен [backend/v0.1.0-rc.3](https://github.com/etozhenerk/group-planning/releases/tag/backend/v0.1.0-rc.3),
build number 8. Все четыре job [Actions 40183138125](https://github.com/etozhenerk/group-planning/actions/runs/40183138125)
завершились успешно: проверка источника, сборка, публикация и отчёт.
Опубликованный комплект скачан и проверен через общий verifier: tag, commit,
состав файлов, manifest, размеры и SHA256SUMS совпали.

SHA-256 `backend-linux-amd64.tar.gz`:
`55e2022dbc613fd6a2b7e3d3a46946de0451605638c39e6326a1e390fc64a09a`.
Manifest подтверждает release-tooling-tests, go-format, go-vet, go-race,
host-metrics-tests, dependency-boundaries, api-contract и artifact-build.
SQL integration в этом запуске пропущена без SOMEWHERE_TEST_DATABASE_URL;
успешный CI не заменяет облачную проверку, описанную выше.

Это готовый кандидат на установку, а не развёрнутый backend: на ВМ остаётся RC2.
Новая команда миграций включает учёт только с явным флагом `-business-metrics`;
обычный запуск миграций и установка backend его не включают.

Постоянные ссылки на проверенные панели:
[Бизнес](https://monium.yandex.cloud/projects/folder__b1g8siv8ve2si1qp04nm/dashboards/fbekle0imi8geuvpah9a)
и [Обзор](https://monium.yandex.cloud/projects/folder__b1g8siv8ve2si1qp04nm/dashboards/fben2tnmhjqvh8g0f7n5).
Бизнес-источник и HTTPS probe пока не подключены; их графики показывают «Нет данных».
