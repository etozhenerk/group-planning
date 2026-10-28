# Изолированная среда точного backend-кандидата

Статус 28.10.2026: подготовка, приёмка ещё не начата. По уточнению основного
исполнителя **тег на 788df02a не создаём**: ждём финальный общий commit с web/native
исправлениями. Ни тег, ни GitHub Release, ни production release здесь не созданы.
Backend `v0.1.0-rc.4` пока свободен; непосредственно перед тегом проверить заново.

## Наблюдаемые входы

- [GitHub Releases](published-releases.json): последний backend `v0.1.0-rc.3`,
  web `v0.1.0-rc.2`; полные наборы содержат manifest/SHA256SUMS/archive.
- Чистый attached worktree `/Users/misha/.codex/worktrees/backend-release-rc4/group-planning`
  создан на `788df02a1642c4c05eac8e6cc3e97ff0d3bb7d0f`; MAIN не переключался.
  После финального commit его можно обновить только при повторно проверенной чистоте.
- [QA VM preflight](qa-host-preflight.json): x86_64, PostgreSQL16.15,
  отдельная `somewhere_integration` отсутствует, `127.0.0.1:18084` свободен,
  Caddy/OpenSSL доступны. Это read-only наблюдение, не резервирование ресурсов.
- [Клиентские fixtures](observed-client-fixtures.json): Android QA APK имеет
  проверяемый hash, iOS финального candidate ещё нет. QA/UITestHost не являются
  store/normal release артефактами. UI не управлялся.

## Точный артефакт и процессы

1. После финального commit обновить чистый checkout, получить tags/origin/main,
   выполнить release prepare с фактическими checks и ограничениями. Создать
   annotated tag на SHA карточки и отправить только его. GitHub workflow
   публикует QA-файлы, не production. GET публичного GitHub API не требует токена.
2. Скачать **полный** неизменённый набор `backend-linux-amd64.tar.gz`,
   `manifest.json`, `SHA256SUMS` в новый каталог. Проверить `SHA256SUMS` и
   `scripts/release/common.py::verify`, tag/commit, список без symlink/лишних файлов.
   Сохранить manifest SHA, archive SHA и SHA извлечённых `somewhere-api` и
   `somewhere-migrate`. Не пересобирать бинарник для QA.
3. На owned VM158.160.246.254 создать собственный каталог `mktemp`, передать
   проверенный набор и сверить hashes после передачи. Все файлы/процессы
   идентифицируются receipt этого запуска; production paths/unit/current не трогать.
4. Перед `createdb somewhere_integration` проверить отсутствие БД. Owner —
   существующий `somewhere_migrator`. Комментарий БД — уникальный
   `codex-backend-release-<32 hex>`; сохранить nonce приватно. Запустить **точный**
   `somewhere-migrate` из downloaded archive с DSN только этой БД, затем запустить
   `somewhere-api` от того же непривилегированного OS user на `127.0.0.1:18084`.
   Права роли на production не использовать. Отдельный runtime-процесс не является
   повторным запуском рабочего `somewhere.service`.
5. Для TLS использовать отдельный foreground Caddy, не системную службу:
   `admin off`, `auto_https off`, явный `bind 127.0.0.1`, сертификат/ключ только
   этого QA-запуска, reverse_proxy `127.0.0.1:18084`. Предлагаемый TLS port8474
   требует повторного preflight. Отдельные XDG data/config dirs внутри own tempdir.
   Никаких изменений общего Caddyfile, DNS, firewall, портов80/443 или reload.
6. Pinned SSH `somewhere-admin@158.160.246.254`, existing key/known_hosts из
   `infra/local`, `BatchMode=yes`, `IdentitiesOnly=yes`, `StrictHostKeyChecking=yes`.
   Туннель `-L 127.0.0.1:8474:127.0.0.1:8474`, `ExitOnForwardFailure=yes`.
   API origin на Mac — `https://127.0.0.1:8474`. TLS client проверяет собственный
   QA certificate через `--cacert`, без `-k`. Этот origin становится наблюдаемым
   окружением только после успешных health/readiness и проверки процессов/hashes.

## Runtime config и identity fixture

`SOMEWHERE_STORAGE=postgres`, `SOMEWHERE_DATABASE_URL` указывает только
`somewhere_integration`, `SOMEWHERE_HTTP_ADDR=127.0.0.1:18084`,
`SOMEWHERE_AUTH_ENABLED=true`, `SOMEWHERE_PUBLIC_ORIGIN=https://127.0.0.1:8474`,
`SOMEWHERE_SESSION_TTL=6h`, отдельный случайный32-byte base64
`SOMEWHERE_CHAT_SYNC_KEY`, `SOMEWHERE_CHAT_READ_STATE=true`.
Секреты — отдельный mode0600 env, никогда не command args/log/Git. Флаги production
не изменяются. Для web позже добавить только точный согласованный static bundle,
`SOMEWHERE_WEB_DIST` и совпадающий `SOMEWHERE_WEB_ORIGIN`.

Runtime сохраняет настоящую аутентификацию и фиксированные URL Яндекса. Запрещённые
`SOMEWHERE_DEV_USER`, `SOMEWHERE_AUTH_BYPASS`, `SOMEWHERE_OAUTH_PROVIDER_URL`,
`SOMEWHERE_YANDEX_TOKEN_URL`, `SOMEWHERE_YANDEX_PROFILE_URL` **не задаются**.
Client ID/secret нужны загрузчику конфигурации; до настоящего OAuth допускается
только явно обозначенная synthetic test configuration. Ни synthetic credentials,
ни прямое создание sessions не доказывают работу Яндекса. Реальные OAuth-настройки
подключаются отдельно после согласования QA callback, без изменения production.

[prepare_sessions.py](prepare_sessions.py) создаёт только приватные файлы, SQL сам
не выполняет. Три synthetic пользователя × web/iOS/Android, secret32bytes base64url,
в БД только SHA256(secret), правильные `ClientKind` и TTL6h. SQL проверяет имя БД,
own nonce и пустую identity_users **в той же транзакции**. Выполнить его можно лишь
после миграции своей БД. После seed все бизнес-данные создаются штатным HTTP API,
без изменения тестового бинарника или runtime auth. Session expiry/revoke могут
иметь отдельные адресные fixture-транзакции только внутри этой же БД.

Web использует `__Host-somewhere_session` Secure/HttpOnly/SameSite=Lax/Path=/;
CSRF берётся из настоящего GET `/api/v1/me`, mutations сохраняют Origin/CSRF.
Native использует Bearer правильного ClientKind. Seed — предусловие проверки
прав/поведения после входа, а не результат OAuth case. Тексты/credentials не
записываются в interaction logs. Config/private SQL удаляются после завершения.

## Клиенты и обязательные ограничения

Release-план должен включать все пять profiles: `api`, `web-desktop`, `web-mobile`,
`ios-phone`, `android-phone`, все применимые active cases и required suites.
Для backend каждый env.backend равен SHA256 точного manifest. Нельзя использовать
24-case feature-план вместо этого набора. API executor независим от backend-кода;
web после собственного reaction fix проверяет другой агент.

`qa:plan` сравнивает с commit backend manifest исходники **всех пяти профилей**.
Поэтому ждём финального общего commit и реально собранных клиентов. Нельзя
подставить текущий dirty MAIN либо фиктивные client build/origin для обхода gate.
В release-plan не записаны будущие/непроверенные environments.

Для iOS simulator доступен Mac loopback; для Android5554 можно согласованно
использовать `adb reverse tcp:8474 tcp:8474`, лишь если этот mapping свободен;
после проверки убрать только собственный mapping. Это маршрутизация, не обход
TLS. Exact client должен разрешённым способом доверять QA certificate и иметь
нужный origin. Нельзя перепаковывать нормальную подписанную сборку или отключать
проверку сертификатов. Установка доверенного CA, если потребуется на обычном
клиенте, остаётся отдельным явным действием владельца; недоступность — blocked.
QA cert injection/UITestHost допустимы только как явно обозначенные compatibility
fixtures, не как store acceptance. Native-файлы и UI согласуются с worker/reviewer.

Не закрыты и требуют точного окружения: настоящий OAuth, supported normal-client
identity при его необходимости по кейсам, внешний HTTPS/proxy path, backup/restore,
capacity commit→render. Регистрация QA callback или TLS trust не производится
этой подготовкой. Неподходящие/недоступные сценарии записываются blocked, не pass.

## Завершение

Сначала остановить только PID/executable собственных API/Caddy/SSH, проверить
отсутствие listeners. Проверить nonce БД, удалить только свою БД без FORCE.
Если nonce изменился или есть чужое соединение, cleanup прекращается с ошибкой,
а не удаляет чужой ресурс. Удалить только свои tempdir/keys/session files/mapping.
Сохранить hashes, raw результаты и cleanup receipt без secrets. Production rollout
возможен лишь отдельным этапом после полного `qa:release-ready` и receipt; сейчас
он запрещён текущим поручением основного исполнителя.
