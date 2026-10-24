# Первые RC — 25.10.2026

## Source

По поручению владельца репозиторий `etozhenerk/group-planning` переведён в Public.
Видимость подтверждена интерфейсом GitHub и REST API без авторизации.
До переключения Gitleaks 8.30.1 проверил все доступные Git refs: 83 коммита
с изменениями, 6,79 МБ, совпадений секретов нет. Это результат автоматического
сканирования, а не гарантия отсутствия любых конфиденциальных данных.
Локальные SSH-ключи, `.env`, Terraform state и `infra/local` в историю не входили.

Три неизменяемых тега указывают на `ae96212d514b27c3f2cc4b18ef04f1b667dd657c`.
Позднее добавленные задачи подготовки не входят в эти RC. Backend и web
выпускаются независимо. Первые попытки Actions остановились до runner из-за
исчерпанной квоты приватных репозиториев; после смены видимости выполнен Re-run
all jobs, attempt 2, без перемещения тегов и изменения платёжных настроек.

## Verified artifacts

| Компонент | Выпуск | Workflow |
| --- | --- | --- |
| Backend | [v0.1.0-rc.1](https://github.com/etozhenerk/group-planning/releases/tag/backend/v0.1.0-rc.1) | [40137072282](https://github.com/etozhenerk/group-planning/actions/runs/40137072282) |
| Web | [v0.1.0-rc.1](https://github.com/etozhenerk/group-planning/releases/tag/web/v0.1.0-rc.1) | [40137072174](https://github.com/etozhenerk/group-planning/actions/runs/40137072174) |
| Monitoring | [v0.1.0-rc.1](https://github.com/etozhenerk/group-planning/releases/tag/monitoring/v0.1.0-rc.1) | [40137072325](https://github.com/etozhenerk/group-planning/actions/runs/40137072325) |

Для всех трёх завершены Validate → Build → Publish → Summary. Артефакты собраны
GitHub Actions на Ubuntu, опубликованы как prerelease, скачаны обратно через
публичные release URLs и проверены `scripts/release/common.py:verify`.
Состав, размеры, SHA-256, manifest и SHA256SUMS совпадают; commit во всех
манифестах соответствует тегам.

| Файл | SHA-256 |
| --- | --- |
| backend-linux-amd64.tar.gz | `b6aaf717298f6590111d30eecc21630e223222b4fee6b3c3dabae0ecb2f92223` |
| web.tar.gz | `fe6d6e632ff8065aaf9d719c3154d194d41bb20e18579c6a116cc53fc8a2ac4b` |
| monitoring-functions.zip | `443f2ccb8b1123b2da872f527427d5d2a6a999acbd906cac7cc02ad1daae2e1e` |

Backend прошёл release tests, Go format/vet/race, dependency boundaries,
HTTP API contract и Linux-сборку. Monitoring прошёл release tests,
Go format/vet/race, совместимость runtime Go 1.23 и упаковку двух entrypoints.

Web прошёл статические/unit-проверки, полный прогон 75 браузерных тестов,
production-сборку и публикацию. Опубликованный архив также скачан и проверен.

## Исправление облачной упаковки Monitoring

Выпущен [monitoring/v0.1.0-rc.2](https://github.com/etozhenerk/group-planning/releases/tag/monitoring/v0.1.0-rc.2)
из `e2a85dc082c1657c1f9289943121a9ce889e6498`,
[workflow 40139737529](https://github.com/etozhenerk/group-planning/actions/runs/40139737529),
все четыре job успешны. RC1 сохранён без изменения.
Новая упаковка заменяет vendor локальными replacement-модулями для облачного
`go get` и не закрепляет версию Go в корневом модуле архива по требованиям Yandex.
Скачанный набор проверен по manifest и SHA256SUMS; SHA-256 ZIP
`51969732c55503a1e4692609d1da40f70aff190d753466022eceaa3f902bc73d`.
RC2 выявил второе требование Cloud Functions: обработчик должен быть в
`package main`. Выпущен [monitoring/v0.1.0-rc.3](https://github.com/etozhenerk/group-planning/releases/tag/monitoring/v0.1.0-rc.3)
из `23c51c99822093bbc58bd5ead6e74705010e0746`,
[workflow 40140431474](https://github.com/etozhenerk/group-planning/actions/runs/40140431474).
Сборка теперь проверяет настоящий `-tags=ycf -buildmode=plugin`; опубликованный
ZIP скачан и проверен, SHA-256
`f70c031b8ddeaba82354cfc1e6d8f6e415dc5c53cac0a591544a68c5c74e0dc3`.
Результаты настоящего деплоя — в [отчёте бота](../telegram-monitoring-bot/live-verification.md).

## Limits

- Создание релизов не выполняло деплой приложения. Backend помечен
  `production_ready=false`: он использует memory.Store и теряет данные при рестарте.
- HTTPS-probe не развёрнут; ZIP сам по себе не является подтверждением доставки
  уведомлений. Токен и получатель настроены отдельно от релиза, live-статус —
  в отчёте бота выше.
- Android/iOS tags не создавались: настоящие подписи не настроены, магазинные
  артефакты не опубликованы. Публичный репозиторий не устраняет эти зависимости.
- Минуты стандартных hosted runners публичного репозитория бесплатны;
  larger runners и хранение сверх применимых лимитов учитываются отдельно.
  [Правила GitHub](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
