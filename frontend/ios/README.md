# somewhere для iOS

Приложение на Swift + SwiftUI, минимум iOS 17.
Клиент работает с общим Go API и использует SwiftUI, Yandex LoginSDK и SwiftCentrifuge через Swift Package Manager.
Устройство транспорта, очереди и защиты локальных данных — в [руководстве чата](docs/chat-runtime.md).
Правила разработки — в [AGENTS.md](AGENTS.md), организация файлов —
в [руководстве по коду](docs/code-style.md).

## Окружение

- macOS с Xcode **27.1**, build **27A9275**.
- Компилятор **Swift 6.4**, языковой режим **Swift 6** и complete concurrency checks.
- **swift-format** из этой сборки Xcode (`--version` выводит `main`), отдельная установка не требуется.
- Сборочный SDK — **iOS Simulator 27.1**, тестовый runtime — **iOS 27.0**,
  deployment target — **17.0**.
- Схема и target — **Somewhere**, bundle ID — `dev.groupplanning.ios`.

Xcode закреплён в `.xcode-version`, остальные инструменты — в
`Config/toolchain.env`. Swift-режим, deployment target, warnings-as-errors
и параметры приложения задаются `.xcconfig`, отдельно для Debug и Release.
Несовпадение инструмента останавливает проверку с понятной ошибкой.

`Config/Base.xcconfig` опционально подключает игнорируемый `Config/Local.xcconfig`.
В нём можно задать `DEVELOPMENT_TEAM` для подписи на своём устройстве и
`SOMEWHERE_API_ORIGIN` для локального сервера. `npm run auth:local` из корня
обновляет origin по адресу временного HTTPS-туннеля; после запуска пересобери
приложение. Секрет Яндекса в этот файл не добавляется. Подробнее —
в [настройке входа](../../backend/docs/auth.md#локальный-запуск-через-https-туннель).

Если Xcode не выбран по умолчанию, задай его только для нужной команды:

```sh
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer sh scripts/check-toolchain.sh
```

В CI используется preview-образ `xcode-27` с `/Applications/Xcode_27.1.app` из
[официального набора runner-images](https://github.com/actions/runner-images/blob/main/images/macos/xcode-27-arm64-Readme.md).
Образ содержит ту же сборку Xcode и runtime iOS 27.0; статус preview может
влиять на доступность runner. Локально runtime устанавливается командой:

```sh
xcodebuild -downloadPlatform iOS -buildVersion 27.0 -architectureVariant arm64
```

Перед тестами открой одно устройство с iOS 27.0 в Simulator.
Обновлять инструменты следует отдельным изменением вместе с локальной проверкой.
Поддержку SDK и deployment target описывает [Apple](https://developer.apple.com/xcode/system-requirements).

## Проверки и запуск

Из `frontend/ios`:

```sh
sh scripts/check-toolchain.sh
sh scripts/format.sh --check
sh scripts/build.sh
sh scripts/build.sh Release
sh scripts/test.sh
sh scripts/test-ui.sh
sh scripts/test-ui.sh invitation
sh scripts/test-ui.sh feed
sh scripts/test-ui.sh calendar       # календарь, история и создание из выбранного дня
sh scripts/test-ui.sh accessibility
sh scripts/test-ui.sh startup
sh scripts/test-ui.sh native-usability # нативные picker/share, черновики, жесты, вкладки и помощь
sh scripts/test-ui.sh help             # вопросы помощи при обычном и крупном тексте
```

`format.sh --check` запускает строгий lint без записи; `--write` применяет
[swift-format](https://github.com/swiftlang/swift-format) с конфигурацией проекта:
4 пробела, строка до 100 символов, не больше одной пустой строки подряд.
`build.sh` выполняет clean/build/analyze с отключённой подписью на
`generic/platform=iOS Simulator`; Apple Developer account и секреты не нужны.
Для отдельных этапов CI используй `sh scripts/build.sh Debug build` и
`sh scripts/build.sh Debug analyze`; без второго аргумента выполняются все этапы.
Результаты находятся в игнорируемом `.build/DerivedData`.
Сборки и тесты ограничены двумя задачами Xcode (`SOMEWHERE_XCODE_JOBS`).

Результаты и снимки: [основа приложения](../../openspec/changes/gathering-activity-feed/ios-bootstrap-verification.md),
[онбординг, список и создание](../../openspec/changes/gathering-activity-feed/ios-entry-verification.md),
[приглашение, Share и RSVP](../../openspec/changes/gathering-activity-feed/ios-invitation-verification.md),
[лента и настройки](../../openspec/changes/gathering-activity-feed/ios-feed-verification.md),
[аудит экранов и запуск](../../openspec/changes/gathering-activity-feed/ios-accessibility-verification.md).

Открой `Somewhere.xcodeproj`, выбери схему `Somewhere` и доступный iPhone
с iOS 17 или новее, затем Run. Для локальных тестов нужен один открытый iPhone
с runtime iOS 27.0; тестовые скрипты сами устройства не создают.
Сборка для симулятора не проверяет публикацию и подпись на реальном устройстве.
Минимум 17 закреплён в бинарнике; отдельный запуск на iOS 17 ещё не проверен.

В [CI](../../.github/workflows/ios.yaml) сборка Debug/Release, чекеры и тесты имеют
отдельные jobs. Они запускаются при изменениях iOS и общих fixtures.
Сводки и текстовые логи публикуются после прогона; полный `.xcresult` — только
при ручном запуске с `full_diagnostics`. Подробности — в [правилах CI](../../docs/ci.md).
`test.sh` использует
уже открытый симулятор iOS 27.0 и запускает `SomewhereTests`.
Если открыто несколько, задай `SOMEWHERE_SIMULATOR_ID=<UDID>`.
Локально новые устройства не создаются; скрипт не выключает и не удаляет
пользовательский симулятор. Unit и UI запускаются последовательно; общий
lock запрещает одновременный прогон. Только CI создаёт и удаляет своё устройство.
Для доступа к Keychain тестовый хост получает локальную
ad-hoc подпись; сертификат и Apple-аккаунт не нужны. Результат —
`.build/TestResults-*.xcresult`.

`test-ui.sh` требует Go 1.27.2 (или путь `GO_BIN`). Он компилирует test-only
HTTP fixture Go, открывает случайный порт loopback TLS и использует тот же запущенный iPhone.
Отдельная схема `SomewhereUI` использует те же SwiftUI-экраны и отдельный
`SomewhereUITestHost`. Нативные сессии выдаёт тестовый OAuth-provider; `/me`
и операции создания проходят настоящий API. Сертификат проверяется по имени
хоста и отдельному якорю только в test-host; системное доверие не меняется.
Метаданные сессий передаются приватным временным файлом, не аргументами запуска.
Основной target не включает эти исходники и не принимает тестовый вход.
UI-тесты проверяют пустое состояние, ошибку/повтор, выход из формы,
черновик после перезапуска и один ID встречи после потерянного ответа.
Go fixture дополнительно проверяет ключи и ID ответов. Набор `invitation`
запускает только четыре проверки приглашения: публичный экран/ссылки, три
ответа/новая сессия, повтор после потерянного ответа и системный Share.
Он проверяет RSVP-ключ. Набор `feed` проверяет чтение истории без скачка позиции,
отправку с потерянным ответом и явным повтором, фон/возврат, черновик, информацию,
конфликт настроек и повторное редактирование. Go fixture проверяет один ключ
и ID сообщения, чтение истории и успешный PATCH после конфликта.

Наборы `sheet-gestures`, `sheet-media` и `sheet-navigation` проверяют закрытие
панелей и черновики, системные пикеры, Share и возврат к списку. Для фото скрипт
добавляет известный `boardgame.png` из дизайн-пакета в Photos симулятора; существующие
фото не удаляет. `sheet-media` также создаёт синтетический PDF только в Documents
QA-приложения; доступ Files включён только в его `Config/UIInfo.plist`.
Клавиатурные сценарии требуют видимой программной клавиатуры: если она скрыта,
при активном поле используй Device Hub → Device → Keyboard → Toggle Software Keyboard.
Отдельный `sheet-motion` требует включить Reduce Motion в панели настроек Device Hub,
заранее записав исходное значение и восстановив его после проверки. Он проверяет
реальное значение SwiftUI environment и сохраняет его рядом со снимками.
Этот набор не входит в обычный `all`, поскольку требует отдельной настройки ОС.

Набор `accessibility` проверяет обычный и максимальный размер текста, клавиатуру,
Back, подписи, traits и доступность только текущего слайда. Контраст, обрезание
текста, Dynamic Type и hit regions сохраняются как диагностические вложения
для ручного разбора; успешный прогон не означает отсутствия этих замечаний.
Набор `startup` проверяет загрузку и возврат без повторной заставки.
Обычный полный прогон включает UI-наборы, кроме `sheet-motion`, и проверки fixtures.
Результат и снимки —
`.build/UIResults-*.xcresult`. Скрипт завершает только свои процессы; в CI
он также удаляет свой симулятор. Уже запущенный `web:demo` и его данные не затрагиваются.

## Структура

`Somewhere/App` содержит точку входа и корневое представление.
`Somewhere/Data/API` содержит HTTPS-клиент и модели; `Data/Session` — Security/Keychain.
`Somewhere/State` координирует сессию, загрузку и очистку приватных данных.
`Somewhere/Features` содержит экраны и владельцев сценариев; `Data/Drafts` —
защищённый файл черновика, раздельный для каждого профиля.
`SomewhereTests` проверяет контракт, время/DST, черновик, пагинацию и гонки.
`SomewhereUITests` и `SomewhereUITestSupport` входят только в тестовые targets.
`Somewhere/Resources` содержит assets; цвета соответствуют общей
[основе дизайна](../../docs/design/foundations.md).
Xcode автоматически включает файлы внутри синхронизированной группы `Somewhere`;
генератор проекта и CocoaPods не нужны.

Далее небольшие представления, владельцы состояния и адаптеры добавляются
по ответственности. API и Keychain не создаются внутри SwiftUI View.
Общие правила — в [AGENTS.md](AGENTS.md), решения по данным —
в [ios-data.md](../../openspec/changes/gathering-activity-feed/ios-data.md).
Сессия хранится только в Keychain с `WhenUnlockedThisDeviceOnly`; токен
не попадает в UserDefaults, логи и текст ошибки. `401` очищает всю приватную
память, `403` чтения закрывает конкретную встречу. Ошибка прав организатора
не закрывает разрешённую переписку. Ответ старого запроса не восстанавливает
данные после выхода или смены участника.

## Сервер и первый запуск

При холодном запуске системный LaunchScreen переходит в фирменную заставку:
знак слева делает один полный оборот с мягким разгоном и замедлением и останавливается, название
остаётся неподвижным. Минимальная длительность — 1,2 с параллельно восстановлению;
при Reduce Motion знак неподвижен, при возврате из фона заставка не повторяется.
Без конфигурации затем открывается онбординг. Адрес реального
HTTPS API задаётся сборочной настройкой `SOMEWHERE_API_ORIGIN`; сессия
проверяется через `/me`, а при её отсутствии показывается знакомство.
Не используйте UI-test target для пользовательской сборки. Реальное получение
сессии подключится вместе с задачей 6.3.

Начертание подписи согласовано с вебом: системный шрифт, вес около 850,
межбуквенное расстояние −1.3 pt при базовых 25 pt, компактный размер 23 pt.
Знак находится слева. Размер масштабируется через Dynamic Type;
отдельный шрифт или загрузка из сети не используются.

Общий [мобильный онбординг](../../docs/design/mobile-onboarding.md) действует
для iOS и Android: пять слайдов, явный переход к входу на последнем,
пропуск/возврат, адаптация текста и системных настроек движения.
На iOS примеры собраны нативными карточками SwiftUI без растрового лендинга.

## Приглашения и передача ссылки

На экране создания и у организатора доступна нативная панель Share с короткой
HTTPS-ссылкой API. Входящие `group-planning-ios://i/{token}` открывают приглашение;
токен остаётся в защищённом файле до явного закрытия. Проверяются два пути HTTPS
на точном настроенном origin: `/i/` и старый `/invitations/`. Произвольные домены,
параметры и OAuth callback не интерпретируются как приглашения.

Для Universal Links `SOMEWHERE_INVITATION_HOST` должен совпадать с host API origin;
его applinks entitlement включён вместе с доменами Яндекса. Нужны provisioning
profile с Associated Domains и AASA на домене: [настройка и проверка](../../backend/docs/app-links.md).
Без подтверждения ОС HTTPS-ссылка остаётся рабочим веб-приглашением.
UI-test host использует отдельную схему `group-planning-ios-ui`.
RSVP отправляет ожидаемую ревизию и ключ намерения. Подтверждённое снятие
участия отменяет приватные запросы и очищает сообщения/состав. Экран обновляется
после возврата в приложение и периодически в активном состоянии; несохранённый
выбор и неопределённый запрос не перезаписываются фоновым обновлением.

## Локальный вход через Яндекс

`npm run auth:local` из корня настраивает HTTPS API в `Config/Local.xcconfig`.
LoginSDK 3.2.0 закреплён в проекте и Package.resolved. Публичный Client ID задаёт
`SOMEWHERE_YANDEX_CLIENT_ID`; секрет остаётся на сервере. Схема callback и домены
Яндекса находятся в Info.plist/Somewhere.entitlements. Для перехода через приложение
Яндекса на физическом устройстве профиль подписи должен поддерживать Associated
Domains. Personal Team не поддерживает эту возможность; для локального запуска
на физическом iPhone добавь в игнорируемый `Config/Local.xcconfig`:

```xcconfig
CODE_SIGN_ENTITLEMENTS[sdk=iphoneos*] =
SOMEWHERE_YANDEX_WEB_ONLY[sdk=iphoneos*] = YES
```

Так LoginSDK использует системную форму Яндекса с возвратом по собственной
URL-схеме. С платной командой и подходящим профилем эти две локальные настройки
нужно убрать, чтобы SDK мог выбирать приложение Яндекса. Симулятор использует
штатный веб-сценарий SDK, если приложения Яндекса не установлены.

Для запуска с Keychain используй подписанную сборку Xcode Run.
`build.sh` проверяет компиляцию без подписи и не предназначен для установки.
Подписанный simulator app также создаёт `test.sh` в `.build/TestDerivedData`.
Тесты собирают только архитектуру выбранного симулятора (`ONLY_ACTIVE_ARCH=YES`).
`sh scripts/test-ui.sh auth` проверяет ошибку входа и сохранение приглашения
без обращения к реальному аккаунту Яндекса; реальный вход проверяется отдельно.
