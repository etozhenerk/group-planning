# Подключение Telegram — 25.10.2026

## Release and configuration

Владелец создал `@somewhere_alerts_bot`, нажал Start и разрешил отправку в свой
личный чат. Получатель получен из единственного private `/start`; chat ID
хранится только в игнорируемой локальной конфигурации и runtime environment.
Токен загружен в Lockbox вне Terraform state и не хранится в репозитории.

Функция: `somewhere-mvp-telegram`, ID `d4ekh3a1pg1nmo70qu90`.
Runtime и invoker — разные service accounts. Runtime читает метрики каталога
и payload одного секрета. Invoker имеет только права просмотра/вызова этой
функции. Публичных IAM-bindings нет. Лимиты: 128 МБ, 35 с, concurrency 1,
async retry 1, zone instances/requests 1, без provisioned instances.
Используется стандартное журналирование функции; код не пишет токен, event или URL Telegram.

## Deployment findings

- `monitoring/v0.1.0-rc.1` успешно собран в CI, но настоящий Cloud Functions
  builder запускает `go get`, игнорирующий vendor. Сборка остановилась по
  timeout `proxy.golang.org`; работающий деплой RC1 не заявляется.
- `monitoring/v0.1.0-rc.2` исправляет упаковку: зависимости поставляются как
  локальные replacement-модули, в корневом `go.mod` архива нет `go`/`toolchain`.
  Пакет проверен офлайн с пустым module cache на Go 1.27.2 и 1.23.12;
  SHA-256 в обоих случаях `51969732c55503a1e4692609d1da40f70aff190d753466022eceaa3f902bc73d`.
- RC2 прошёл загрузку зависимостей в облаке, но сборщик потребовал
  `package main` для `-buildmode=plugin`. Исправление RC3 переводит оба entrypoint
  в main и добавляет реальную plugin-сборку с тегом `ycf` в упаковку. Локально
  прошли format/vet/race/build, Go 1.23 tests и offline plugin package; SHA-256
  `f70c031b8ddeaba82354cfc1e6d8f6e415dc5c53cac0a591544a68c5c74e0dc3`.
- Provider Yandex 0.239.0 перезаписывает `log_options.folder_id` пустым
  `log_group_id`, поэтому явный каталог в этом блоке не используется. Это не устранило
  отдельный отказ авторизации асинхронной версии.
  Блок `log_options` больше не передаётся, сохраняется стандартное журналирование.
  Отдельная лог-группа не создана: Cloud Logging закрыт для новых клиентов
  с 22.10.2026, API отвечает Unavailable. Используется переход на Monium.
  Дополнительные широкие IAM-роли для обхода не выдавались.
- Provider может оставить объект без версии и выдать warning. После apply
  требуется проверить новый ACTIVE version ID и реальный вызов. Postcondition
  по version ID не используется: provider сохраняет старое значение на стадии
  plan и такая проверка блокирует исправление объекта без версии.
- Terraform validate и восемь mock-тестов прошли; они не доказывают доставку.

## Live status

Деплой исправленного RC и проверка настоящей доставки выполняются.
Задача 3.1 остаётся открытой до проверки всех её сценариев. Probe не подключён:
публичные DNS, HTTPS и рабочий `/readyz` ещё не готовы. Независимый штатный
email-канал существует, но получение письма владельцем пока не подтверждено.
