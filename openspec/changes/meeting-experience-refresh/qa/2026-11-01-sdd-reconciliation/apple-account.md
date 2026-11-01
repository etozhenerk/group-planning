# Apple setup: текущий read-only checkpoint · 01.11.2026

Проверка проведена после сообщения владельца о добавлении оплаченного Apple ID. Прежний отчёт `/tmp/somewhere-sdd-apple-setup.md` описывает состояние ДО добавления и не является текущим blocker.

## Подтверждено штатным Xcode UI

- В Apple Accounts теперь **две учётные записи**: прежняя Personal Team и новая.
- Новый аккаунт открывает **Developer Team «Milhail Malakhov»** (точное написание UI), не Personal Team.
- Роль в выбранной команде: **Admin**.
- **Certificates, Identifiers, & Profiles**: отмечено доступным.
- On Device Testing: **0 Provisioned Devices**.
- **Manage Certificates** новой команды открыл пустую таблицу: видимых существующих сертификатов нет. Создание не запускалось; отсутствия сертификатов на всём портале это не доказывает.
- Запросов пароля/2FA или диалога создания сертификата во время проверки не было.
- Членство активно по прямому сообщению пользователя; срок, тип юридического лица/Individual и роль Account Holder отдельно не проверены. Роль Admin не следует переименовывать в Account Holder.

## Публичный идентификатор выбранной команды

**`8XRYN5DH23`** — идентификатор команды в URL, который Xcode сформировал при нажатии Team → Role Admin → **Manage…**:

`https://appstoreconnect.apple.com/v1/session/switchTo/8XRYN5DH23?targetUrl=/access/users`

Это непосредственная привязка выбранной новой команды к App Store Connect, полученная из штатного Xcode UI. Само поле с подписью **Team ID** в Membership details не было открыто/подтверждено. Перед будущим изменением `DEVELOPMENT_TEAM`/`IOS_TEAM_ID` необходимо подтвердить этот ID в Apple Developer Membership details, а не использовать старый `KMGUVHBG8T`.

Xcode → Settings показывает Team name/role, но не печатает Team ID. Manage открыл страницу App Store Connect; затем просмотрена уже открытая подходящая вкладка **Account - Apple Developer**, где видна выбранная команда «Milhail Malakhov», Program resources и Membership details. Попытка открыть Membership details завершилась техническим `Computer Use server error -10005: noWindowsAvailable`; ранее переход Manage дал `ScreenCaptureKit... Code=-3812 «Сбой из-за недействительного параметра»`. Это ошибки computer-use окна, а не отказ Apple/членства и не запрос логина. После нового указания владельца ограничиться SDD дальнейший просмотр не продолжался.

## Provisioning profile

**Не проверен**. Download Manual Profiles не нажималась, provisioning-файлы и приватные базы не читались. Нет основания объявлять готовым distribution profile или утверждать, что его нет в paid Team. Distribution certificate с private key/P12 не проверен и не извлекался.

## Оставшиеся настройки для будущего этапа

Никакие действия из списка ниже сейчас не выполнены и не требуются для закрытия текущей SDD сверки:

1. Подтвердить Team ID в Membership details; старый Local config сейчас указывает `DEVELOPMENT_TEAM = KMGUVHBG8T`.
2. Когда возобновится mobile release setup, перевести локальную подпись на новую команду; отдельно проверить старое обнуление `CODE_SIGN_ENTITLEMENTS[sdk=iphoneos*]` и штатные Associated Domains.
3. Сверить ownership/доступность Bundle ID `dev.groupplanning.ios`, существующего App ID и записи приложения новой команды; текущий аудит ничего не регистрировал.
4. Отдельно проверить существующий Distribution certificate/profile и настроить `IOS_TEAM_ID`/release inputs только в будущей разрешённой работе. Никаких ключей/P12/секретов в этот отчёт не включено.
5. Затем когда-нибудь проверить подписанный archive/IPA и `associated_application_id`; текущая SDD работа не выпускает store-кандидаты.

**Прямое указание владельца: в сторы ничего не выкладывать.** Не выполнялись upload, TestFlight, регистрация приложений/App IDs, генерация сертификатов/ключей, смена подписи, изменения проекта/GitHub/локальных конфигов, запуск приложения на физическом устройстве. Google Play/RuStore кабинетов пока нет; это будущие внешние шаги.

Для SDD корректная disposition: «Paid Apple ID подключён в Xcode; Developer Team/Admin доступ подтверждён; новый team identifier наблюдён в штатном переходе Xcode, Membership field и distribution signing ещё не проверены. Настройка подписи и stores отложены». Это больше не «ждём оплаты Apple Developer» и не «ждём добавления Apple ID».
