# Текущее состояние операционных блокеров — 01.11.2026

Проверка выполнена только чтением, примерно **08:41–08:44 UTC / 11:41–11:44 МСК**. Состояние задач 3.7 и telegram-monitoring-bot 3.1: **blocked для подтверждения текущей готовности**. Получить свежие данные закрытого YC/Monium и служб ВМ не удалось. Исторические ошибки ниже не объявляются подтверждённо действующими сегодня.

## Подтверждено сейчас

- `GET https://smwhere.ru/healthz` — **200**, 08:42:17 UTC.
- `GET https://smwhere.ru/readyz` — **200**, тот же прогон. Это подтверждает публичные health/readiness, но не доставку уведомлений, активность всех служб или состояние Cloud Functions.
- Локальный штатный CLI доступен по `/Users/misha/Documents/Codex/projects/group-planning/.cache/deploy-tools/yc/yc`.
- `yc config profile list`: профиль `somewhere` ACTIVE. `yc --profile somewhere config get folder-id`: `b1g8siv8ve2si1qp04nm`. Токены и содержимое профиля не печатались и не сохранялись.
- Закреплённые SSH key и known_hosts существуют. Чтение секретного ключа/его содержимого не выполнялось.

## Недоступные проверки

### ВМ и службы

SSH только с `IdentitiesOnly=yes`, `StrictHostKeyChecking=yes`, существующим `infra/local/known_hosts`, BatchMode и ConnectTimeout=10 к `somewhere-admin@158.160.246.254`:

```text
ssh: connect to host 158.160.246.254 port 22: Operation timed out
```

Команда предполагала только `date -u`, `systemctl show` для somewhere/postgresql/caddy/unified-agent/postgres-metrics/backup и локальные GET health/readiness. **Удалённые команды не исполнились**: свежих ActiveState/Result/timer значений нет. Ключ/known_hosts не заменялись, сеть/SSH security group не менялись.

### YC get/list

В 08:41:27 UTC начат ограниченный Python-процесс, вызывавший штатный CLI с `--format json --retry 0 --no-browser`. Каждый вызов ограничивался 35 секундами. Результаты:

| Только чтение | Итог |
| --- | --- |
| function get `d4ekh3a1pg1nmo70qu90` (Telegram) | timeout 35 с |
| function version list для этой функции | timeout 35 с |
| function get `d4eq5kamb3hahso52njt` (HTTPS probe) | timeout 35 с |
| trigger get `a1s7n67rcmj53argvhp8` | timeout 35 с |

Дополнительный ограниченный повтор в 08:43:12 UTC закрепил **`--profile somewhere --endpoint api.cloud.yandex.net:443`**, как в сохранённых исходных скриптах. Telegram function get снова завершился timeout через 20 секунд; после этого повторная серия остановлена. Все процессы завершились. Payload, environment, chat ID и токены не выводились.

По этим таймаутам нельзя определить, отказал ли API, сеть, аутентификация или локальный маршрут. Это **не доказательство отказа самого облачного ресурса** и не основание расширять IAM.

### Monium: мьют, каналы и история доставки

Публичный `GET https://monium.yandex.cloud/` доступен с HTTP 200, но возвращает страницу SmartCaptcha (скрипты `/tmgrdfrend/captcha_smart_*`), а не авторизованные сведения проекта. Закрытые GET/list по мьютам/каналам и свежая история доставки **не получены**. Публичная страница не заменяет API состояния.

Сохранённые скрипты `infra/local/notification-signal.py` и `invoke-bot.py` лишь прочитаны: они выполняют запись диагностических метрик/вызов функции и **не запускались**. Чтение MetricsData в текущем адаптере также использует POST, поэтому его не выполняли в этом GET-only блоке. Обход CAPTCHA и провайдерского мьюта не предпринимался.

## Что именно остаётся неизвестным

### Deployment 3.7

Последний подтверждённый 25.10 мьют `monogcb6494lt01sl9fq`, service provider `monitoring`, имел срок до **01.11.2026 02:00 МСК** и селектор `alert.id != 'mon8koqkp9l2t8jqeac0_test_notification'`. Старый срок уже прошёл, но **текущие status/endDate/selectors и наличие других мьютов не прочитаны**. Нельзя утверждать ни продолжение подавления, ни его снятие.

По [официальной документации мьютов](https://yandex.cloud/en/docs/monium/alerts/mutes), истёкший мьют больше не подавляет уведомления. Это описание правил сервиса, а не свежая проверка нашего объекта.

Остаются:

1. Прочитать текущие мьюты проекта и провайдера, статусы пяти рабочих правил и привязки каналов Telegram/email.
2. Прочитать доступную историю доставок после 01.11 02:00 МСК: прежний `Obsolete` не считать текущим статусом без нового ответа.
3. После отдельного разрешения на активный тест повторить настоящие Alarm/OK/No data, проверить получение, изображение/ссылку и отсутствие лавины. В этом блоке активный тест запрещён и не выполнялся.
4. Остальные сценарии задачи — disk/load/backup/DB/metric-loss и anti-storm — по-прежнему не приняты.

Источники истории: `openspec/changes/deployment-and-store-release/native-notifications-verification.md:112`, `infra/monitoring/notification-channels.json:5`, `infra/monitoring/README.md:68`.

### Telegram-monitoring-bot 3.1

В последнем отчёте 25.10 закрытая RC3-функция была ACTIVE, но были async PermissionDenied, `telegram transport failed` и неподтверждённая цепочка Monium → функция → Telegram. **Текущие version ID/tags/async/IAM и исходящая доступность Telegram не подтверждены**: get/list не ответили; функцию не вызывали, Telegram-запросов и тестовых сообщений не отправляли.

Остаются:

1. Прочитать текущие версии, production/latest tags, async configuration, narrow invoker/runtime bindings и привязку канала.
2. После разрешения на активный тест проверить доставку Alarm/OK/No data из облака, отказ ВМ/БД и независимый сигнал отказа функции.
3. Отдельно проверить причину прежнего egress timeout. Исторический timeout и локальная успешная отправка не доказывают текущее состояние Cloud Functions.

Выбор штатного Yandex-бота не закрывает собственную 3.1: это прямо отмечено в конце `openspec/changes/telegram-monitoring-bot/live-verification.md`.

## Границы

Никаких invoke, тестовых сообщений, новых алертов или метрик; никаких PUT/PATCH/POST прикладным API, start/restart, смены IAM, ресурсов, секретов, billing, CI или файлов проекта. Выполнялись только чтение локальных несекретных параметров CLI, get/list ресурсов, публичные GET и неуспешная попытка read-only SSH. Штатный CLI мог вести собственный служебный лог; debug не включался. Токены не извлекались в вывод или файл. Результат сохранён только в этом `/tmp`-отчёте. Задачи 3.7/3.1 не закрыты и PASS не объявлен.
