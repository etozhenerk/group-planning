# Telegram и внешний HTTPS-мониторинг

Go-модуль эксплуатации, независимый от приложения и его ВМ. Код собирается в
один source ZIP с локальными зависимостями и развёртывается как **две закрытые Cloud Functions**
с разными service accounts. [Релиз monitoring](../../docs/releases.md) включает
архив; секреты и конфигурация добавляются при развёртывании.

| Точка входа | Источник вызова | Работа |
| --- | --- | --- |
| `handler.Handler` | Канал Monium Cloud Function | Проверяет alert ID/статус, читает историю, рисует PNG, отправляет в заданный Telegram-чат |
| `probe.Probe` | Timer trigger раз в минуту | Проверяет фиксированный `/readyz` по HTTPS и записывает метрики в Monium |

## Уведомление

Каталог [rules.json](internal/notify/rules.json) содержит пять действующих правил:
CPU, память, свободный диск, PostgreSQL, возраст резервной копии. Входные названия,
annotations, URL и произвольные метки не определяют запрос, адресата или ссылку.
Неизвестный ID/статус или чужие folder/host/environment отклоняются до сети.

Текст содержит статус Monium, последнее известное значение и его время, пороги,
окно, время получения UTC и действие для диагностики. История — последние 60 минут
с шагом 60 секунд, ровно один ряд; null не превращается в ноль. Последняя точка
старше трёх минут отмечается устаревшей. Кнопка **«Открыть графики»** ведёт в
закрытую панель Monium и присутствует при отправке фото и при текстовом fallback.

PNG 1200×700 строится из метрик, это не снимок страницы Monium. Разрывы не
соединяются линией, пороги подписаны. Если источник/рендер недоступен, отправляется
текст с безопасной причиной. Caption ≤900 UTF-16 единиц, PNG ≤1 МиБ.
Telegram: до трёх попыток, общий deadline 30 секунд; 429 учитывает retry_after,
ожидание более пяти секунд возвращает ошибку. После неоднозначного ответа Telegram
возможен дубль; exactly-once и межвызовной дедупликации нет.

## Подготовка владельцем

1. Создать бота через BotFather, сохранить токен в Yandex Lockbox с текстовым
   ключом `telegram-token`. Сам токен не передавать в чат разработки/Git/CLI argv.
   ID секрета можно использовать в конфигурации.
2. Добавить бота в нужный личный чат/закрытую группу, отправить `/start` при личном
   чате и получить numeric chat ID. Для группы разрешить отправку сообщений/фото.
   Chat ID и runtime config хранить в игнорируемом `infra/local/`.
3. Для bot runtime SA назначить `monium.metrics.reader` на каталог и
   `lockbox.payloadViewer` **на конкретный секрет**. Для probe SA —
   `monium.metrics.writer` на каталог, без доступа к Lockbox. Для вызывающих
   Monium/timer SA — `functions.functionInvoker` только на нужную функцию.
   Не делать функции публичными и не назначать editor/admin runtime-аккаунтам.
4. Заполнить [config.example.json](config.example.json) для `BOT_CONFIG_JSON`:
   folder, instance, environment=`production`, secret, chat и dashboard IDs.
   Пример события — [event.example.json](event.example.json). Для probe задать
   `PROBE_CONFIG_JSON`: `{"folder_id":"FOLDER_ID","origin":"https://smwhere.ru"}`.
   Origin без пути/порта, endpoint `/readyz` добавляет код. Event не задаёт URL.

## Версии функций и подключение

Runtime `golang123`, memory 128 МБ, deadline bot 35 с / probe 30 с,
concurrency 1, async retries не более 1, provisioned instances 0.
Установить zone-instances-limit и zone-requests-limit по 1 для стабильного тега.
Эти пределы действуют **на зону**, не обеспечивают глобальную сериализацию;
429 обрабатывается кодом. Срок хранения асинхронных событий проверить по текущим
возможностям сервиса при подключении, произвольный TTL 120 секунд не обещается.
Metadata: gce-http-endpoint enabled, aws-v1-http-endpoint disabled.

В консоли Cloud Functions создать версию закрытой функции: загрузить
`monitoring-functions.zip`, выбрать runtime/entrypoint/SA и лимиты из этого раздела.
В environment добавить единственную переменную `BOT_CONFIG_JSON` с содержимым
локального конфиг-файла. Значение — JSON-строка целиком. Настройки metadata
при необходимости выставить CLI `--metadata-options`; CLI `--environment`
использует map-синтаксис, у этой версии CLI нет `--environment-file`.

Для второй функции использовать `probe.Probe`, отдельный SA/env, deadline 30 с.
Среда содержит JSON-конфиг, **не токен бота**: текущая версия Lockbox читается на
каждый вызов. После выкладки настроить ограниченные async retry/scaling параметры
и стабильный тег через CLI/консоль, затем канал Monium и минутный timer.
Не подключать probe до появления работающих DNS, HTTPS и `/readyz`.

Проверка live: контролируемые Alarm → OK → No data, ссылка/PNG/recipient;
ротация Lockbox, отключение истории, Telegram 429; недоступный API и пропавший
сам probe. Сбой функции/записи метрик должен уходить через **независимый штатный
канал Monium**, а не рекурсивно только через этот бот. Локальные fake HTTP-тесты
не доказывают IAM или доставку настоящих сообщений.

Откат: вернуть стабильный тег к предыдущей версии; при ошибочном адресате сначала
отключить канал. При утечке токена перевыпустить его в BotFather и обновить Lockbox.
Не выводить incoming event, HTTP URL Telegram, response body, IAM и bot token в логи.
Функция пишет только bounded delivery/graph enum, без пользовательского текста.

## Локальная проверка

Команды — в [AGENTS.md](AGENTS.md). `sh scripts/package.sh` кладёт source ZIP в
игнорируемый `build/`; tests, config и CLI preview не входят в архив. Сборка переносит
выбранные `go mod vendor` пакеты вместе с лицензиями в `bundled/`, создаёт локальные
`replace` и проверяет `go get -d ./...` и Linux amd64 build с пустым module cache,
`GOPROXY=off` и `GOSUMDB=off`. Это нужно, потому что облачный `go get` не использует
vendor. В корневом `go.mod` архива нет `go`/`toolchain`: версию плагина задаёт
сборщик Yandex. Исходный `go.mod` проекта сохраняет закреплённую версию.
Совместимость пакета можно проверить `GOTOOLCHAIN=go1.23.12 sh scripts/package.sh`.
`go run ./cmd/preview -output ../local/telegram-preview.png` создаёт демонстрационный
график на синтетических данных без обращения к Telegram или облаку.

[Каталог метрик и план подключения](../monitoring/metrics.md).
Источники: [вход Monium](https://yandex.cloud/ru/docs/monium/operations/alert/create-channel-function),
[MetricsData read](https://yandex.cloud/ru/docs/monium/api-ref/MetricsData/read),
[MetricsData write](https://yandex.cloud/ru/docs/monium/api-ref/MetricsData/write),
[Lockbox payload](https://yandex.cloud/ru/docs/lockbox/api-ref/Payload/get),
[Telegram Bot API](https://core.telegram.org/bots/api#sendphoto).

Требования к архиву: [зависимости Go в Cloud Functions](https://yandex.cloud/ru/docs/functions/lang/golang/dependencies).
