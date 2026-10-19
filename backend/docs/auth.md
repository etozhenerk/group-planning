# Настройка и проверка входа

Сервер реализует Яндекс authorization code + PKCE, собственные профили и сессии.
20 октября 2026 года пользователь перенёс подключение и проверку реального
Яндекс ID в конец разработки. Этот документ сохраняет настройки заключительного
этапа. Пока серверные сценарии используют provider только из `_test.go`;
runtime не имеет входа по вымышленному пользователю. UI можно готовить на fixtures.

Веб получает Secure/HttpOnly-cookie; iOS и Android — сессию через одноразовый
код с отдельным app verifier. Вход не меняет RSVP. БД не требуется: попытки,
профили и сессии живут в памяти и теряются при перезапуске.

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

Пример конфигурации окружения (домен `somewhere.example` — шаблон, а не
развёрнутый сервис; перед реальным входом подставить собственный HTTPS origin):

```sh
export SOMEWHERE_AUTH_ENABLED=true
export SOMEWHERE_PUBLIC_ORIGIN=https://somewhere.example
export SOMEWHERE_YANDEX_CLIENT_ID='your-registered-client-id'
# SOMEWHERE_YANDEX_CLIENT_SECRET задаётся вне Git; не вставляй его в чат.
export SOMEWHERE_IOS_AUTH_CALLBACK=group-planning-ios://auth/callback
export SOMEWHERE_ANDROID_AUTH_CALLBACK=group-planning-android://auth/callback
export SOMEWHERE_SESSION_TTL=720h
go run ./cmd/server
```

Для этого примера разрешены ровно следующие адреса:

- В настройках Яндекс OAuth: `https://somewhere.example/api/v1/auth/yandex/callback`.
- Возврат web: `https://somewhere.example/auth/return?kind=home` либо
  тот же путь с `kind=invitation&token=<исходный токен>`.
- Возврат iOS: `group-planning-ios://auth/callback`.
- Возврат Android: `group-planning-android://auth/callback`.

Native callback получает только `attempt_id` и одноразовый `handoff_code`
или безопасный `auth_error`. Секрета сессии в URL нет. Приложение должно
зарегистрировать свою схему, проверить callback и обменять код с собственным
verifier. Клиентские реализации ещё не созданы; регистрация схем и реальный
цикл на устройствах проверяются в задачах платформ.

Web-страница `/auth/return` тоже ещё не реализована. Она должна получить `/me`,
обработать безопасный `auth_error` и открыть исходный контекст. Одного callback
на backend недостаточно для готового пользовательского входа.

Web и API должны находиться на одном HTTPS origin через proxy. Cookie,
созданная на localhost, не переносится в callback другого домена. Не выставляй
client secret в Vite/мобильную сборку и не коммить `.env`; Go не загружает его
автоматически. Сервер сам слушает HTTP на loopback; TLS завершается на proxy.

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
