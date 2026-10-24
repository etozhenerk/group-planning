# Независимые релизы somewhere

Сборка выпускается из существующего Git-тега на коммите, входящем в `origin/main`.
Версии пяти компонентов независимы; backend и web не пересобирают друг друга.
[Workflow](../.github/workflows/releases.yaml) создаёт GitHub Release с готовыми
файлами. Деплой в Yandex Cloud и отправка в магазины — отдельные действия над
этими же файлами. Terraform и настройки хоста хранятся в Git и меняются отдельно.

## Состав

| Тег (пример) | Файлы релиза | Назначение |
| --- | --- | --- |
| `backend/v1.0.0` | `backend-linux-amd64.tar.gz` | Go API и worker в одном процессе, systemd unit, пример env; SQL migrations включаются при наличии каталога |
| `web/v1.0.0` | `web.tar.gz` | Production static bundle React, API того же origin |
| `monitoring/v1.0.0` | `monitoring-functions.zip` | Vendored исходники двух закрытых Cloud Functions: `handler.Handler` и `probe.Probe` |
| `android/v1.0.0` | `somewhere.aab`, `somewhere.apk`, `mapping.txt` | AAB для Play, подписанный release APK для проверки/магазина, R8 mapping |
| `ios/v1.0.0` | `Somewhere.xcarchive.zip`, `Somewhere.ipa`, `dSYMs.zip` | Архив Xcode, App Store Connect export и символы |

Каждый выпуск также содержит `manifest.json` и `SHA256SUMS`. Манифест фиксирует
компонент, версию, тег, commit SHA, build number, проверки, параметры сборки,
имена/размеры/SHA-256 файлов. Контрольные суммы покрывают и манифест.
Неполный набор, лишний файл, symlink или несовпадение хеша запрещают публикацию.
Манифест не заменяет доверие к репозиторию и правам записи в GitHub.

## Выпуск

1. Завершить проверки приложения на нужном коммите `main`. Старые установленные
   мобильные версии должны продолжать работать с новым API.
2. Выбрать **новую** версию компонента. При необходимости использовать `-rc.1`:
   например, `web/v1.2.0-rc.1`; такой GitHub Release помечается prerelease.
3. Из чистого актуального `main` создать аннотированный тег и отправить только его:

   ```sh
   git pull --ff-only origin main
   git tag -a web/v1.2.0 -m 'web 1.2.0'
   git push origin web/v1.2.0
   ```

4. Смотреть **Actions → Component releases**. Ручной запуск принимает уже
   существующий тег, а не имя ветки. Workflow проверяет ancestry, совпадение
   checkout с тегом и чистоту исходников, запускает проверки выбранной платформы.
5. Build имеет только read-доступ. Только отдельный Publish получает
   `contents: write`, скачивает артефакт этого запуска и повторно проверяет hashes
   и тег. GitHub CLI загружает полный набор через draft и затем публикует его.
6. Скачать полный набор из Releases и выполнить `shasum -a 256 -c SHA256SUMS`
   перед развёртыванием/загрузкой. Файлы не пересобирать для переноса окружения.

Нельзя двигать/пересоздавать использованные теги и заменять файлы готового релиза.
Повторный запуск останавливается, если Release уже существует, включая draft.
После сбоя сначала проверить draft и причину; частичный draft разбирается вручную,
автоматического удаления нет. Для исправленного кода нужна новая версия.
Нативная подпись не обещает побайтовую воспроизводимость при повторной сборке.
Временный Actions artifact хранится 14 дней; долговременный источник — GitHub Release.
Список обязательных проверок записан в [build.py](../scripts/release/build.py).
UI/device-тесты Android остаются отдельной приёмкой, как в обычном CI.

## Версии мобильных приложений

`MARKETING_VERSION` / `versionName` берутся из числовой части тега без `-rc.N`.
`CURRENT_PROJECT_VERSION` / `versionCode` — `GITHUB_RUN_NUMBER` этого workflow.
Политика проекта ограничивает его диапазоном 1–9999. Перед первым выпуском
проверить, что он больше всех уже загруженных сборок; при смене workflow или
достижении 9999 нужно отдельно перенести нумерацию, а не обнулять её.
Повтор попытки того же запуска использует тот же номер: такой файл нельзя
загружать повторно, если магазин уже принял предыдущий. Создать новую версию/RC.

В **Repository settings → Secrets and variables → Actions** задать variable
`SOMEWHERE_API_ORIGIN`, например `https://smwhere.ru` после подключения DNS/TLS/API.
Это один HTTPS origin без пути; отсутствие значения блокирует мобильный релиз.
Замена origin требует нового мобильного артефакта. Примеры с `example.invalid`
предназначены только для локальной проверки сборочной обвязки.

### Android

| Secret | Значение |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 файла upload keystore |
| `ANDROID_STORE_PASSWORD` | Пароль keystore |
| `ANDROID_KEY_ALIAS` | Alias upload key |
| `ANDROID_KEY_PASSWORD` | Пароль ключа |

Если ключа ещё нет, владелец создаёт отдельный **upload key** в Android Studio
(Build → Generate Signed Bundle / APK → Android App Bundle → Create new).
Сохранить keystore и пароли в менеджере секретов с резервной копией.
Для Google Play включить Play App Signing; это отличает upload key от ключа,
которым Google подписывает приложение для пользователей. Для другого магазина
сначала проверить его требования к ключу и совместимость обновлений.
Не заменять ключ уже опубликованного APK произвольным новым.

Pipeline декодирует keystore во временный файл с правами 0600 и удаляет его
после сборки. Gradle получает пароли через env; обычная локальная unsigned
`assembleRelease` остаётся доступна. Store-путь включает minify/shrink, Lint,
unit-тесты, проверку APK/AAB подписей и R8 mapping. Тестовый локальный ключ не
должен использоваться для публикации. Аккаунт Google Play создаётся отдельно.

### iOS

| Настройка | Значение |
| --- | --- |
| Variable `IOS_TEAM_ID` | Apple Developer Team ID |
| Secret `IOS_CERTIFICATE_P12_BASE64` | Distribution certificate **с private key**, экспортированный в P12 |
| Secret `IOS_CERTIFICATE_PASSWORD` | Пароль P12 |
| Secret `IOS_PROVISION_PROFILE_BASE64` | App Store distribution provisioning profile |

Apple-аккаунт уже есть; наличие подписей нужно проверить в Xcode → Settings →
Accounts → Manage Certificates. Если подходящего сертификата нет, создать
Apple Distribution и экспортировать вместе с private key из Keychain Access.
В Developer portal создать App Store profile для `dev.groupplanning.ios`
и этой команды, с необходимыми capabilities, включая Associated Domains.
Идентификатор приложения также должен совпасть с записью App Store Connect.
Если существующее приложение зарегистрировано под другим Bundle ID, сначала
согласовать и изменить ID в проекте; не маскировать это параметрами экспорта.

Сборка использует закреплённый Xcode, Release, generic iOS archive, manual signing
и `app-store-connect` export. Проверяются срок/назначение profile, team/bundle ID,
подпись archive, наличие dSYMs, версия/build/origin и сохранение версии в IPA.
Временные keychain/profile удаляются в `finally`, прежний список keychain
восстанавливается. Принудительная потеря runner требует его штатной утилизации;
на общей рабочей машине подписанную сборку предпочтительно не запускать.
Без действующего сертификата и profile IPA не создаётся.

## Развёртывание и откат

- **Backend:** распаковать в `/opt/somewhere/backend/releases/<version>`, создать
  непривилегированного пользователя `somewhere`, конфигурацию поместить в
  `/etc/somewhere/application.env` (0600). Unit запускает бинарник через
  `/opt/somewhere/backend/current`. Переключать symlink атомарно, перезапускать
  службу и проверять readiness/API. Откат — предыдущий каталог, если схема БД
  совместима. Будущие миграции требуют backup и плана совместимого отката.
  **Текущий backend использует memory.Store:** manifest помечает
  `production_ready=false`; перезапуск теряет доменные данные. Это артефакт для
  проверки поставки, не допуск к эксплуатации с реальными данными.
- **Web:** отдельные `/opt/somewhere/web/releases/<version>` и `web/current`.
  Caddy обслуживает static и проксирует API; правила SPA fallback, invite metadata
  и API должны быть проверены на реальном домене. Переключение web не меняет API.
- **Monitoring:** из одного ZIP создаются две версии функций с разными SA и env.
  После проверки переключить стабильные теги функций; откатить теги на предыдущие
  version IDs. Реальные уведомления направлять только в настроенный владельцем чат.
  Точная схема — [инструкция бота](../infra/telegram-bot/README.md).
- **Android/iOS:** сначала загрузить готовые AAB/IPA в внутренний трек/TestFlight,
  проверить вход и основные сценарии с API, затем отдельно публиковать в магазине.
  Откат установленной версии обычно означает новый исправляющий выпуск с большим
  build number, а не замену старого файла в Releases.

Автоматизация этих действий развёртывания/магазинов не входит в release workflow.
Домен, постоянное хранилище и реальные уведомления проверяются отдельно перед
первым production-развёртыванием; наличие зелёного CI не закрывает эти условия.

Источники: [GitHub CLI release create](https://cli.github.com/manual/gh_release_create),
[Android app signing](https://developer.android.com/studio/publish/app-signing),
[Apple archive/export](https://help.apple.com/xcode/mac/current/en.lproj/deva1f2ab5a2.html).
