# Диагностика доступа YC, 01.11.2026

## Дополнение после повторного входа

После согласия владельца выполнен штатный `yc --profile somewhere init`:
переинициализирован существующий профиль, сохранены прежние cloud/folder и
ru-central1-a. Вход завершён, CLI exit0. Следующий Compute GET вернул
существующую somewhere-mvp **RUNNING**, с прежними VM ID, IP и security group.
Новые ресурсы, роли, права и секреты приложения не создавались/не передавались.
Токен в stdout/чат/Git не печатался.

Истёкшая авторизация из исходной диагностики ниже теперь устранена.
После отдельного согласия владельца внешний IPv4 определён через ipify.
Он отличался от прежнего admin /32. Владелец разрешил заменить ровно это
SSH-правило: замена выполнена атомарно, три остальных правила не изменены.
Порт22 не открыт для всего интернета; ключ и pinned known_hosts сохранены.
Сырые before/after и сравнение правил находятся только в локальном
`/tmp/somewhere-ssh-source-rotation/`; адрес администратора не публикуется в Git.
Локальный игнорируемый `infra/local/current-admin-network.json` содержит текущий
CIDR для следующего Terraform plan: нельзя возвращать прежнее правило из старого
значения. Terraform state вручную не редактировался.

SSH с существующим ключом успешен. `somewhere` и `caddy` active/running,
`postgresql@16-main` active/running; `/healthz` и `/readyz` отвечают200.
Счётчик перезапусков приложения не изменился. На диске10ГБ свободно5.6ГБ.
Проверка не меняла production-БД и не перезапускала сервисы. Сам факт доступа
не является приёмкой мониторинга: provider mute действует до09.11.2026,
доставка алертов и прочие эксплуатационные критерии остаются открытыми.

## Исходная диагностика до повторного входа

Чтение текущего облака пока не восстановлено: **действующая CLI-сессия истекла**, автоматического refresh token нет. Это установленная проблема авторизации, а не подтверждённый отказ Cloud API/ВМ. Штатное получение IAM token с `--no-browser` также упирается в ожидание: процессы ограничены 10 и 5 секундами и завершены. Точный внутренний этап ожидания CLI без debug не установлен; исключать дополнительную gRPC-проблему до повторения с новой сессией нельзя.

При этом documented Compute REST отвечает на предъявленный кэшированный token **401/code16 за 0.080 с**. Кэш указывает expiry **2026-10-29T00:30:18Z**; текущее время 01.11.2026, refresh_token пуст. Секрет прочитан только в памяти существующего credential cache и передан только официальному Compute API для GET списка текущего folder; его значение, stdout авторизации, config/key и ответы с приватными metadata не сохранялись/не выводились. Новых IAM прав/ролей не создавалось.

## Безопасные измерения

CLI1.41.0 darwin/arm64; профиль `somewhere` существует и активен. В profile только subject/cloud/folder/zone, credentials хранятся отдельно. Proxy-переменных и `YC_IAM_TOKEN`/`YC_TOKEN` override в окружении нет. Чтение структуры credential cache сохранило только наличие credential type/refresh и expiry, без значений.

| Проба | Результат | Время |
| --- | --- | --- |
| GET `https://api.cloud.yandex.net/`, HTTP1.1 |404, TLSуспешен|0.040 с|
| Тот же GET, HTTP2 |404, реальноHTTP2|0.041 с|
| GET `https://compute.api.cloud.yandex.net/`, HTTP2 |404|0.043 с|
| GET IAMtoken endpoint безcredentials, HTTP2 |501 длянеподходящегоGET; толькоtransportprobe|0.058 с|
| GET Compute instances BASIC ссуществующимcachedIAM вconfiguredfolder |401, code16|0.080 с|
| `yc … --no-browser iam create-token` |невернулtoken; boundedtimeout|10.009 с|
| Узкийповтортого жеauthcommand |timeout; stderrнепечатается, толькоsafehints|5.011 с|

HTTP2 доступен, поэтому общий запретHTTP2 не объясняет зависание. Быстрые 404/501 — неуспех бизнесметода, но доказательство DNS/TCP/TLS/HTTPreachability.401 с token — уже ответ authlayer, а не connecttimeout. SSH22timeout из rootrecheck — отдельный ещё неразрешённый сетевой факт; новая IAMсессия сама не доказывает и не чинитSSH. SG/IAM/firewall/endpointprofile не менялись.

Первичные безопасные результаты: `/tmp/somewhere-cloud-access-diagnostic/{transport.json,standard-auth-rest.json,cli-auth-wait.json,cached-auth-rest.json}`. Ни один файл не содержит credential values, Authorization header, config/key или authchallenge URL. CLI запускался без debug/debug-grpc; его штатные служебные logs не изучались. Sandbox-only help/version не могли записать штатный log и выдали permissionwarnings; сами разрешённые runtimeпробы не подменяются этими warning.

## Минимальное обновление существующей авторизации

**В пользовательском Terminal с GUI**, из корня проекта:

```sh
.cache/deploy-tools/yc/yc --profile somewhere init
```

В wizard выбрать **переинициализацию существующего somewhere**, затем подтвердить продолжение в браузере. Войти тем же уже разрешённым Яндекс-аккаунтом; код/2FA пользователь вводит самостоятельно в браузере. Вернуться в Terminal и выбрать прежние cloud `b1gslf6gm8gn0v36r53e`, folder `b1g8siv8ve2si1qp04nm`, zone `ru-central1-a`. Не выбирать новый profile, создание cloud/folder, новые роли, организацию или платёжный аккаунт. Endpoint/config других параметров не менять. Команда `init` сама не создаёт облачные ресурсы: опасным был бы отдельный выбор создания в wizard, который здесь запрещён.

Этот путь прямо описан официальной user-auth инструкцией: `init` → переинициализация существующего профиля → подтверждение открытия браузера → выбор прежних cloud/folder/zone. Локальный help CLI1.41 содержит `init`; отдельный `auth login` в его публичном command tree не найден. Указывать `--username` не требуется: без него появляется выбор Яндекс-аккаунта в браузере. OAuth token-страницы с показом секрета открывать/снимать не нужно; IAM token вручную в чат/файл/скриншот не копировать.

Уточнение после проверки фактического authmode: первоначально предложенная команда ниже **не является подтверждённым способом browser-renew именно этого профиля** и не рекомендуется как первый пользовательский шаг:

```sh
.cache/deploy-tools/yc/yc --profile somewhere iam create-token >/dev/null
```

Фактические безопасные признаки (`auth-mode.json`): profile содержит subject-id, но не OAuth `token`/service-account-key; соответствующий credential container — `federation-credentials`, federation-id пуст, cached IAM есть, refresh token отсутствует. Это краткоживущая browser user-сессия, не настроенный OAuth exchange. Help `create-token` гарантирует вывод IAM token вSTDOUT, а `--no-browser` — запрет открытия браузера; они не доказывают успешный browser-renew в данном режиме. Общая фраза docs о повторной авторизации после expiry недостаточна для обещания, что эта конкретная команда восстановит доступ. Поэтому предыдущая рекомендация заменена явным `init` с сохранением прежних параметров.

Фактическое обновление **в этом диагностическом проходе не выполнялось**: browser/authstart не запускались, foregroundauth передаётся пользователю основным агентом. Не ограничивать личный вход/2FA десятью секундами: лимит10сек относился только к unattendedprobe. Остановиться на неожиданном запросе новых полномочий; обычное подтверждение прежнего входа не является расширениемIAM.

После успешного входа основной агент проверяет только чтение, с небольшим 8–10 секtechnicaltimeout:

```sh
.cache/deploy-tools/yc/yc --profile somewhere --endpoint api.cloud.yandex.net:443 --retry 0 --no-browser compute instance list --folder-id b1g8siv8ve2si1qp04nm --format json
```

Сначала подтвердить expiry вбудущем и конкретныйreadresponse. Если renewedCLI снова висит, получитьIAM штатным вызовом в память и повторить documented RESTGET: REST200+gRPCtimeout выделит оставшуюся транспортнуюпроблему. Не менять SG/IAM/endpointконфиг вслепую и не объявлять текущие функции/уведомления готовыми до их read-onlyсостояний и отдельно разрешённых активных проверок.

## Официальные источники

- [Авторизация пользователя CLI](https://yandex.cloud/en/docs/cli/operations/authentication/user): GUI/browser, повторныйвход послеexpiry, существующийprofile/wizard и отсутствиеrefreshбезсоответствующейнастройки. Сменаорганизационнойrefresh/DPoPполитики в этомscope не предлагается.
- [iam create-token](https://yandex.cloud/en/docs/cli/cli-ref/iam/cli-ref/create-token): tokenвSTDOUT и no-browserflag.
- [Ошибки CLI](https://yandex.cloud/en/docs/cli/error): IAMauth/истёкшийилиотозванныйtoken, envIAMoverride.
- [Compute Instance.List](https://yandex.cloud/en/docs/compute/api-ref/Instance/list), [Instance.Get](https://yandex.cloud/en/docs/compute/api-ref/Instance/get): документированныйREST и BASIC безmetadata.
- [IAMtoken REST](https://yandex.cloud/en/docs/iam/api-ref/IamToken/create): POSTissuance допускаетOAuth/JWT и возвращаетBearerдляпоследующихAPI; здесьновыйtokenчерезсамодельныйRESTexchange не выдавался.

Новые SDK/CI/profileconfig не менялись. Записи ресурсов, invoke/Telegram, метрики и новыеpermissions запрещены и не выполнялись. Диагностические процессы завершены.
