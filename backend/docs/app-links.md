# HTTPS-приглашения в iOS и Android

Одна ссылка `https://smwhere.ru/i/<token>` работает в web и нативном приложении.
ОС выбирает приложение только после подтверждения связи домена и подписи.
Поддержан также прежний путь `/invitations/<token>`. OAuth callback не относится
к этим маршрутам; само открытие ссылки не сохраняет RSVP.

## Настройка сервера

Сервер формирует публичные JSON из переменных окружения:

| Переменная | Значение |
| --- | --- |
| `SOMEWHERE_IOS_APP_IDS` | Один или несколько полных `application-identifier` подписанных iOS-приложений через запятую |
| `SOMEWHERE_ANDROID_APP_ID` | `dev.groupplanning.android` для обычной сборки |
| `SOMEWHERE_ANDROID_SHA256_CERT_FINGERPRINTS` | SHA-256 сертификатов устанавливаемых APK, пары hex через двоеточие; несколько подписей через запятую |

iOS-идентификатор имеет вид `AppIDPrefix.dev.groupplanning.ios`. Prefix берётся
из подписанного приложения/provisioning profile и может отличаться от Team ID.
Release manifest iOS содержит проверенное `associated_application_id`.
QA targets и их подписи в production-ассоциации не добавляются.

Android package без fingerprints (или наоборот), wildcard, неполный SHA-256
и неверный iOS App ID останавливают запуск. Пробелы вокруг элементов списка
убираются; пустые элементы не принимаются. Регистр SHA-256 нормализуется.
Не настроенная платформа отвечает 404, а не HTML приложения.

Два адреса должны быть доступны по HTTPS без авторизации и redirect:

```text
https://smwhere.ru/.well-known/apple-app-site-association
https://smwhere.ru/.well-known/assetlinks.json
```

GET возвращает `application/json`, HEAD — те же заголовки без тела; успешный
ответ кешируется 5 минут. Проверить их нужно после установки соответствующего
backend-релиза и явной настройки окружения. Наличие исходников не включает
ассоциацию на домене. Настройки содержат только публичные идентификаторы
и отпечатки, не private keys, access tokens или OAuth secret.

## Согласование с мобильной сборкой

Android получает host из `somewhere.api.origin` / `-PsomewhereApiOrigin`.
Обычные Debug/Release содержат `autoVerify` и только пути приглашения;
QA-манифест этих фильтров не содержит. Без настроенного API используется
нерабочий домен `unconfigured.invalid`; это не готовая к раздаче сборка.

Для проверки фактической подписи APK:

```sh
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify --print-certs path/to/somewhere.apk
```

В файле домена нужна подпись устанавливаемого приложения. Для установки через
Play она может отличаться от upload key; используйте сертификат Play App Signing.
Debug fingerprint применим только к соответствующей локальной установке.

iOS задаёт `SOMEWHERE_INVITATION_HOST` рядом с `SOMEWHERE_API_ORIGIN`.
По умолчанию host — `smwhere.ru`; локальная обвязка записывает host туннеля,
release-tooling вычисляет его из origin. Само создание туннеля не публикует
ассоциацию: для него также нужны серверные переменные и подходящий профиль.
В entitlements сохраняются отдельные домены Yandex LoginSDK.

Store-сборка требует Associated Domains в distribution profile и проверяет
точный `applinks:<host>` в подписанных archive и экспортированном IPA.
Локальный `CODE_SIGN_ENTITLEMENTS[sdk=iphoneos*] =` для Personal Team допустим
для разработки с браузерным входом, но не подтверждает Universal Links.
Не добавляйте режим developer в магазинные entitlements.

## Проверка на устройстве

После установки серверной части и подписанной Android-сборки:

```sh
adb -s <serial> shell pm verify-app-links --re-verify dev.groupplanning.android
adb -s <serial> shell pm get-app-links dev.groupplanning.android
```

Дождаться `verified` для нужного домена и открыть настоящую ссылку из другого
приложения. Проверить холодный/тёплый запуск, исходную встречу, отмену входа,
повтор и отсутствие автоматического RSVP. Не использовать `pm set-app-links`
для имитации успешной верификации. `am start` с указанным package/component
проверяет маршрутизацию, но не доказывает связь домена с подписью.

На iOS установить сборку с нужной capability и открыть ссылку из Messages/Notes.
Apple использует CDN для файла ассоциации; обновление файла может примениться
не сразу. Не считать адрес в Safari или `simctl openurl` доказательством всей
цепочки. Отдельно проверить web-путь без приложения. Секретный токен приглашения
и callback авторизации не публиковать в отчётах и логах.

Источники: [Apple Associated Domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains),
[Android: файл ассоциаций](https://developer.android.com/training/app-links/configure-assetlinks),
[Android: проверка App Links](https://developer.android.com/training/app-links/verify-applinks).
