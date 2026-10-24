# Настройка и проверка входа

Сервер реализует Яндекс authorization code + PKCE, собственные профили и сессии.
20 октября 2026 года пользователь перенёс подключение и проверку реального
Яндекс ID в конец разработки. Этот документ сохраняет настройки заключительного
этапа. Пока серверные сценарии используют provider только из `_test.go`;
runtime не имеет входа по вымышленному пользователю. UI можно готовить на fixtures.

Веб получает Secure/HttpOnly-cookie; iOS и Android — сессию через одноразовый
код с отдельным app verifier. Вход не меняет RSVP. БД не требуется: попытки,
профили и сессии живут в памяти и теряются при перезапуске.

## Что заполнить в Яндекс OAuth

Поля сверены с официальной документацией 24.10.2026. Пользователь выбрал
`https://somewhere.ru` для web и API. Это выбранный адрес: регистрация OAuth,
контроль DNS и развёртывание сервиса по нему пока не подтверждены.
Контактную почту владельца нужно указать самостоятельно.

Открой [создание приложения для авторизации](https://oauth.yandex.ru/client/new/id/)
под аккаунтом, которому будет принадлежать приложение.

| Шаг / поле | Что указать |
| --- | --- |
| Тип приложения | **Для авторизации пользователей**. Тип «Для доступа к API» не подходит для входа пользователей. |
| Название вашего сервиса | `somewhere` |
| Иконка | [somewhere-oauth.png](assets/somewhere-oauth.png), 512 × 512, меньше 1 МБ; экспорт существующего знака. |
| Контактная почта | Действующий адрес владельца проекта; выбрать вручную. |
| Платформы | **Веб-сервисы** для принятой серверной схемы OAuth; пояснение для мобильных клиентов ниже. |
| Redirect URI | `https://somewhere.ru/api/v1/auth/yandex/callback` — сохранить точный путь без завершающего `/`. |
| Доступ к данным | **Логин, имя и фамилия, пол** (`login:info`). Сервер сохраняет идентификатор и отображаемое имя; остальные поля этой группы не использует. |
| Завершение | Проверить карточку и нажать **Всё верно**. Сохранить Client ID и Client Secret из карточки приложения. |

Типы приложений описаны в [правилах регистрации](https://yandex.ru/dev/id/doc/ru/register-client),
поля — в [инструкции создания](https://yandex.ru/dev/id/doc/ru/register-auth).
Email, телефон, портрет и дата рождения пользователей для текущего входа не нужны.
Контактная почта владельца в форме не является разрешением читать почту пользователей.

Если кабинет дополнительно показывает поле сайта/домен, укажи публичный origin
сервиса `https://somewhere.ru`, а в поле только для домена — `somewhere.ru`.
Это не отдельное обязательное поле в проверенной инструкции регистрации.
Если появляется поле описания, готовый текст:

> somewhere — сервис для встреч с друзьями: создавайте встречу, делитесь приглашением и обсуждайте детали в общем чате.

Верификация относится к владельцу сервиса. Для личного проекта документация
описывает путь **Снять ограничения → Подтвердить аккаунт через Госуслуги**.
Без подтверждения пользователи видят предупреждение; это не следует путать
с настройкой DNS или callback. Подтверждение владелец выполняет самостоятельно
в [кабинете Яндекса](https://oauth.yandex.ru/).
Источник: [верификация сервиса](https://yandex.ru/dev/id/doc/ru/confirm-account).

### Почему одного серверного клиента достаточно для трёх фронтендов

В принятом проектном потоке web, iOS и Android запрашивают начало входа у Go API.
Яндекс возвращает код на один HTTPS callback сервера; сервер проверяет профиль
и выдаёт собственную сессию. Затем web получает cookie, а мобильный клиент —
одноразовый handoff для обмена на Bearer-сессию. Поэтому в кабинете регистрируется
серверный клиент с платформой «Веб-сервисы». Это вывод из архитектуры проекта
и [документированного code + PKCE flow](https://yandex.ru/dev/id/doc/ru/codes/code-url),
а не утверждение, что Яндекс относит все мобильные интеграции к веб-платформе.

Поля мобильных платформ Яндекса относятся к прямой интеграции приложения,
для которой документация рекомендует LoginSDK. У somewhere запланированы
ASWebAuthenticationSession / Custom Tabs и серверный обмен; LoginSDK не подключён.
Переход на SDK потребует отдельного изменения клиентского и серверного протокола.
Простановка дополнительных галочек сама по себе мобильный вход не реализует.

| Адрес | Где используется |
| --- | --- |
| `https://somewhere.ru/api/v1/auth/yandex/callback` | **Redirect URI в Яндекс OAuth**; единственная точка возврата от провайдера. |
| `https://somewhere.ru/auth/return` | Внутренняя страница возврата веба после серверного callback; в Redirect URI Яндекса не добавляется. |
| `group-planning-ios://auth/callback` | Серверная настройка `SOMEWHERE_IOS_AUTH_CALLBACK` и обработчик iOS; в Redirect URI Яндекса не добавляется. |
| `group-planning-android://auth/callback` | Серверная настройка `SOMEWHERE_ANDROID_AUTH_CALLBACK` и обработчик Android; в Redirect URI Яндекса не добавляется. |

Один выбранный origin должен обслуживать собранный web, `/api/v1`, `/auth/return`
и приглашения `/i/`. Все клиенты используют этот же Go-процесс с memory.Store.
Для проверки с телефона origin должен быть доступен телефону и иметь доверенный
TLS-сертификат. DNS и TLS настраиваются у выбранного владельцем доменного/HTTPS
сервиса; параметры записей зависят от адреса сервера или туннеля. Само внесение
домена в OAuth-форму не разворачивает приложение. `www.somewhere.ru` является
другим origin: callback и API в этом подключении используют `somewhere.ru` без `www`.

### Если понадобится регистрация мобильных платформ / LoginSDK

Это справочные значения из текущих обычных targets. Они не меняют выбранный выше
серверный поток и не относятся к отдельным тестовым hosts.

| Поле Яндекса | Значение / откуда взять |
| --- | --- |
| iOS AppId | `<App ID Prefix>.dev.groupplanning.ios`. Bundle ID уже известен; Prefix нужно взять у зарегистрированного App ID в Apple Developer → Certificates, Identifiers & Profiles → Identifiers. Не подставлять произвольный Team ID вместо неизвестного Prefix. |
| iOS AppStore URL | Реальная ссылка на опубликованное приложение. В репозитории такой ссылки нет. |
| Android package name | `dev.groupplanning.android` из `app/build.gradle.kts`. |
| Android Google Play URL | Реальная ссылка из Google Play после публикации. В репозитории такой ссылки нет. |
| SHA256 Fingerprints | SHA-256 сертификата подписи устанавливаемой сборки. Для локальной отладки — debug-сертификат этого компьютера; для версии из Play — app signing certificate из Play Console. |

Точный iOS App ID Prefix не закреплён в проекте. Ссылки магазинов нельзя заменять
шаблонами; для неопубликованного приложения оставь их пустыми, если форма разрешает.
Если кабинет требует эти данные, прямую SDK-регистрацию нужно завершить после их
получения. Она не является условием регистрации серверного OAuth-клиента.

Получить отпечаток уже собранного Android Debug APK из корня репозитория:

```sh
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify --print-certs \
  frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

Нужна строка `certificate SHA-256 digest`, не SHA-1 и не хеш файла APK.
Debug-отпечаток не подходит для распространения сборки с другой подписью.
Документация: [мобильные поля](https://yandex.ru/dev/id/doc/ru/register-auth),
[сертификаты Android](https://developer.android.com/studio/publish/app-signing).

## Окружение

По умолчанию `SOMEWHERE_AUTH_ENABLED=false`: сервер запускается без секретов,
`/me` отвечает 401, начало входа — 503 `auth_unavailable`. Для реального входа
нужно зарегистрировать приложение в [Яндекс OAuth](https://oauth.yandex.ru/).
Права: только `login:info`, без email, телефона и аватара.

| Переменная | Значение |
| --- | --- |
| `SOMEWHERE_AUTH_ENABLED` | `true`, чтобы включить серверный вход. |
| `SOMEWHERE_PUBLIC_ORIGIN` | Один HTTPS origin web и API, без завершающего `/`, пути, query или fragment. |
| `SOMEWHERE_YANDEX_CLIENT_ID` | Client ID зарегистрированного приложения. |
| `SOMEWHERE_YANDEX_CLIENT_SECRET` | Серверный секрет, только в локальном окружении/хранилище секретов. |
| `SOMEWHERE_IOS_AUTH_CALLBACK` | Точный callback iOS: HTTPS либо схема `group-planning-ios`. Без query/fragment/userinfo. |
| `SOMEWHERE_ANDROID_AUTH_CALLBACK` | Точный callback Android: HTTPS либо схема `group-planning-android`. |
| `SOMEWHERE_SESSION_TTL` | Абсолютный срок, Go duration от `1h` до `720h`; по умолчанию `720h`. |

Callback провайдера вычисляется строго как
`SOMEWHERE_PUBLIC_ORIGIN + /api/v1/auth/yandex/callback`; клиент не передаёт его
в запросе. Мобильный callback настраивается отдельно для каждой платформы.
Если он не задан, вход этой платформы не начинается; веб при этом работает.
Частичная конфигурация при выключенном входе и небезопасные адреса отклоняются
при запуске. Вход через plain HTTP не включается даже для разработки.

Пример конфигурации окружения для выбранного домена (сервис должен быть отдельно
развёрнут за HTTPS proxy; Client ID и секрет нужно получить в Яндекс OAuth):

```sh
export SOMEWHERE_AUTH_ENABLED=true
export SOMEWHERE_PUBLIC_ORIGIN=https://somewhere.ru
export SOMEWHERE_YANDEX_CLIENT_ID='your-registered-client-id'
# SOMEWHERE_YANDEX_CLIENT_SECRET задаётся вне Git; не вставляй его в чат.
export SOMEWHERE_IOS_AUTH_CALLBACK=group-planning-ios://auth/callback
export SOMEWHERE_ANDROID_AUTH_CALLBACK=group-planning-android://auth/callback
export SOMEWHERE_SESSION_TTL=720h
go run ./cmd/server
```

Для этого примера разрешены ровно следующие адреса:

- В настройках Яндекс OAuth: `https://somewhere.ru/api/v1/auth/yandex/callback`.
- Возврат web: `https://somewhere.ru/auth/return?kind=home` либо
  тот же путь с `kind=invitation&token=<исходный токен>`.
- Возврат iOS: `group-planning-ios://auth/callback`.
- Возврат Android: `group-planning-android://auth/callback`.

Native callback получает только `attempt_id` и одноразовый `handoff_code`
или безопасный `auth_error`. Секрета сессии в URL нет. Приложение должно
зарегистрировать свою схему, проверить callback и обменять код с собственным
verifier. iOS уже содержит модели и запросы start/exchange и общую URL scheme;
системный вход и обработчик auth callback ещё нужны. В Android пока есть
запросы me/logout и фильтры ссылок приглашений; start/exchange, Custom Tabs
и фильтр auth callback ещё нужны. Это задачи 6.3 и 7.3.

Web-страница `/auth/return` и начало входа уже реализованы. Страница получает
`/me`, обрабатывает безопасный `auth_error` и открывает исходный контекст.
Настоящий цикл Яндекс ID ещё нужно проверить на выбранном HTTPS origin.

Web и API должны находиться на одном HTTPS origin через proxy. Cookie,
созданная на localhost, не переносится в callback другого домена. Не выставляй
client secret в Vite/мобильную сборку и не коммить `.env`; Go не загружает его
автоматически. Сервер сам слушает HTTP на loopback; TLS завершается на proxy.

### Куда записать полученные значения

Готовый шаблон — [backend/.env.yandex.example](../.env.yandex.example).
Из `backend/` скопируй его в `.env.yandex.local`, задай права `600` и заполни
пустые `SOMEWHERE_YANDEX_CLIENT_ID` / `SOMEWHERE_YANDEX_CLIENT_SECRET` в локальном
редакторе. `.env.yandex.local` игнорируется Git. Секрет не нужен в чате,
мобильных настройках, `VITE_*` или URL. Пустой шаблон намеренно не запускает OAuth.

После настройки домена, TLS и заполнения локального файла:

```sh
# Из корня: обычный web bundle с настоящим провайдером.
npm run web:build
cd backend
set -a
. ./.env.yandex.local
set +a
go run ./cmd/server
```

HTTPS proxy должен вести `https://somewhere.ru` на этот сервер; Go раздаёт
web из `SOMEWHERE_WEB_DIST`. Proxy не должен записывать query callback в access log:
там находятся краткоживущие `code`/`state`. Изменение DNS и выпуск сертификата
выполняются отдельно после выбора сервера/туннеля и подтверждения доступа к домену.

| Клиент | Настройка общего API |
| --- | --- |
| Web | Сборка `npm run web:build`, доступ по `https://somewhere.ru`; API вызывается на том же origin. |
| iOS | Xcode → target `Somewhere` → Build Settings → `SOMEWHERE_API_ORIGIN`: `https://somewhere.ru`. Bundle ID остаётся `dev.groupplanning.ios`. |
| Android | Из `frontend/android`: `./gradlew --no-daemon -PsomewhereApiOrigin=https://somewhere.ru :app:assembleDebug`. Application ID остаётся `dev.groupplanning.android`. |

Эти настройки задают адрес API. Для работы кнопок входа в обычных мобильных
сборках отдельно нужны реализации задач 6.3 и 7.3. После подключения проверяются
первый и повторный вход одним аккаунтом, отмена, возврат к приглашению,
logout/истечение сессии и отказ повторному handoff. Сам вход не сохраняет RSVP.

## Запросы

`POST /api/v1/auth/yandex/start`: JSON с `client_kind` и `return_context`.
Для web обязателен точный `Origin`, а `app_challenge` запрещён. Для native
обязателен base64url S256 challenge от отдельного verifier длиной 43–128 символов.
Контекст — `{ "kind": "home" }` либо
`{ "kind": "invitation", "token": "..." }` для действительной ссылки.
`return_url`, callback URL и чужой user ID не принимаются.

Web получает cookie привязки `__Host-somewhere_auth_<attempt UUID>` на 10 минут;
разные попытки не подменяют друг друга. После callback она удаляется.
Успех устанавливает `__Host-somewhere_session`: Secure, HttpOnly, SameSite=Lax,
Path=/, без Domain. `/me` возвращает профиль, expires_at и CSRF-token, но не секрет
web-сессии. Мутации с cookie требуют точные Origin и `X-CSRF-Token` этой сессии.

Native выполняет `POST /api/v1/auth/mobile/exchange` с attempt_id, handoff_code
и app_verifier. Код живёт 60 секунд и погашается вместе с выдачей сессии.
Далее используется `Authorization: Bearer <session_token>`. Bearer и cookie
не смешиваются; web-секрет не работает как Bearer и наоборот.
`POST /api/v1/auth/logout` отзывает текущую сессию, для web проверяет CSRF
и удаляет cookie. 401 означает недействительную сессию; 403 — нарушение привязки/CSRF.

Callback с неверным/истёкшим state даёт 400, с чужой web-привязкой — 403.
После допустимой отмены или сбоя провайдера выполняется 303 к сохранённому
контексту с `auth_cancelled` / `auth_unavailable`; произвольный текст ошибки
Яндекса не отражается в ответе. Повтор callback не выдаёт ещё один код/сессию.

Яндекс-токен используется только для немедленной проверки профиля по HTTPS.
Проверяются subject и client_id. Access/refresh tokens не сохраняются;
секреты собственных сессий, state, binding и коды передачи хранятся как хеши.
Серверный PKCE verifier временно хранится до обмена/истечения попытки и удаляется.

## Очистка и проверки

Процесс каждые 60 секунд удаляет истёкшие попытки/коды и сессии. Проверка срока
выполняется при каждом обращении: задержка очистки не продлевает доступ.
Профили сохраняются до перезапуска, чтобы повторный вход находил прежний ID.
Отдельный CLI-процесс не может очистить память работающего сервера.

Команды из `backend/`:

```sh
go test -race ./internal/identity/... ./internal/httpapi ./internal/storage/memory ./internal/server
go test ./internal/storage/memory -run '^TestIdentityCleanup$' -v
go test ./internal/identity -run '^TestExpiredHandoffAndInvitationContext$' -v
```

Из корня: `npm run api:test` сравнивает реальные auth/session ответы с OpenAPI,
включая пустые 303/204. Тестовый web и API используют один локальный TLS origin
`https://127.0.0.1:<случайный порт>`, которому доверяет только тестовый клиент.
Тестовый provider внедряется программно из `_test.go`; runtime всегда использует
фиксированные HTTPS endpoints Яндекса и не следует внешним HTTP-редиректам.
Переменных подмены provider URL нет; `SOMEWHERE_DEV_USER`, `SOMEWHERE_AUTH_BYPASS`
и известные override-переменные отклоняются при запуске.

Проверены конкуренция первых входов, привязки state/binding/verifier, отмена,
сетевая ошибка, повторы, сроки, отзыв и очистка, отсутствие открытых секретов
сессий в хранилище/логах и отсутствие автоматического RSVP. Эти проверки
не заменяют реальный вход Яндекс ID: он требует настроенного приложения,
HTTPS-окружения и клиентов и пока не выполнен.

Основа адаптера: [код и PKCE](https://yandex.ru/dev/id/doc/ru/codes/code-url),
[проверка профиля](https://yandex.ru/dev/id/doc/ru/user-information).
