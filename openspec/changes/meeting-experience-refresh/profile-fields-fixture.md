# Фикстура повторного входа и полей профиля

Назначение: воспроизводимая предпосылка `TC-PROFILE-YANDEX-FIELDS`.
Сценарий проверяет UI, настоящий HTTP start/exchange и синхронизацию профиля
с **тестовым результатом SDK/provider**. Это не проверка настоящего Яндекс OAuth,
экрана SDK, сети Яндекса или реального аккаунта. Production source sets не менялись.

## Наборы данных

Все три сценария используют один provider subject `fixture-profile-fields`
и display_name `Александр Тестов`. Локальный UUID выдаёт identity; он сохраняется
между входами. Произвольные JSON-поля через HTTP не принимаются: доступны только
три константных документа, декодируемые настоящим `yandex.Provider` через закрытый
test-only transport без внешнего соединения.

| Сценарий | Поля документа провайдера |
| --- | --- |
| `profile-fields-full` | login=`profile_fixture`, first_name=`Александр`, last_name=`Тестов`, birthday=`1990-12-23`, sex=`male`, default_email=`profile@example.test`, default_phone.number=`+79990000000`, default_avatar_id=`fixture/portrait`, is_avatar_empty=false |
| `profile-fields-partial` | birthday=`0000-12-23`, sex=null; остальные optional-поля **отсутствуют** |
| `profile-fields-clear` | birthday=null, default_phone=null, is_avatar_empty=true; first_name и остальные optional-поля **отсутствуют** |

После partial ожидаются прежние имя/фамилия/логин/контакты/аватар, дата без года
и пустой пол. После clear дата, телефон и URL аватара пусты; имя/фамилия/логин/почта
сохранены. Пропущенный телефон не очистил бы известный номер, поэтому здесь
использован явный `default_phone:null`.

**Ограничение изображения:** full возвращает синтетический decoded URL
`https://avatars.yandex.net/get-yapic/fixture/portrait/islands-200`.
Реального аккаунта/bitmap по нему фикстура не предоставляет. Native allowlist
не ослаблялся, loopback URL не подставляется, UI image-response не мокается.
Передача/сохранение/очищение URL проверяемы; показ полноценного bitmap — blocked.
Не ставить полный pass всему `TC-PROFILE-YANDEX-FIELDS` только по этим данным.

## Web

Запустить заново отдельный `TestBrowserFixture` из **нового** test binary обычным
способом. Нельзя использовать прежний хеш backend до этих изменений.
На странице fake-provider выбрать последовательно:

1. «Войти как Профиль: все поля»;
2. после выхода — «Войти как Профиль: неполная дата»;
3. после выхода — «Войти как Профиль: очищение».

Каждый переход проходит обычные start, cookie-bound callback, identity и GET
собственного профиля. Для проверки прежней сессии сохранить отдельный браузерный
контекст с первым входом, не выходить из него и после следующих входов обновлять
его `/profile`. Выход отзывает конкретную сессию и не годится как проверка её
сохранности. Другой участник (обычная Лена) проверяет публичный состав/автора.

## iOS: управляемый вход кнопкой

Штатный воспроизводимый entrypoint после получения окна:

```sh
cd frontend/ios
sh scripts/test-ui.sh profile
```

Он выбирает только `ProfileFieldsUITests`, запускает собственную fixture и
сохраняет evidence трёх входов в xcresult. Следующие шаги нужны для ручного прохода.

Пересобрать только тестовый host `SomewhereUI` штатным build-for-testing. Запустить
отдельный `TestIOSFixture` с `SOMEWHERE_IOS_FIXTURE=1`,
`SOMEWHERE_IOS_FIXTURE_SCOPE=profile` и приватным путём
`SOMEWHERE_IOS_FIXTURE_CONFIG`. Скопировать полученный config в `tmp/ui-fixture.json`
контейнера **dev.groupplanning.ios.uitesthost**, как делает `scripts/test-ui.sh`.

На выбранном QA-симуляторе, не затрагивая обычное приложение:

```sh
SIMCTL_CHILD_SOMEWHERE_UI_SCENARIO=profile-fields \
  xcrun simctl launch "$SOMEWHERE_SIMULATOR_ID" dev.groupplanning.ios.uitesthost
```

Нажать «Пропустить» → «Попробовать», открыть профиль и сохранить evidence full.
Выйти через UI, снова войти и проверить partial; повторить для clear.
Все три входа выполнять **в одном процессе**: `UITestLoginProvider` возвращает
константные SDK results full → partial → clear по очереди. `clear()` не сбрасывает
очередь. Четвёртый вход завершится ошибкой, а новый процесс начинает с full.
Кнопка запускает настоящий `YandexSignIn`, создание PKCE-попытки, HTTP обмен и
`SessionStore`; готовая somewhere-сессия не подставляется при старте этого режима.
Остальные сценарии сохраняют прежний тест отказа сети на start.

## Android: запуск инструментального сценария

Штатный entrypoint на уже выбранном `ANDROID_SERIAL`:

```sh
cd frontend/android
sh scripts/test-ui.sh profile
```

Он выбирает только `ProfileFieldsUiTests`; следующий прямой запуск предназначен
для независимо подготовленного backend/QA APK.

Пересобрать QA APK и instrumentation APK после support-изменений. Запустить
отдельный `TestAndroidFixture` с `SOMEWHERE_ANDROID_FIXTURE=1`,
`SOMEWHERE_ANDROID_FIXTURE_SCOPE=profile` и приватным config-путём. На выбранном
`ANDROID_SERIAL` выполнить adb reverse порта origin и push config в собственный
путь `/data/local/tmp/somewhere-android-ui-<число>.json`; chmod 600.
Переменные ниже должны указывать только на эти выделенные QA-артефакты.

```sh
"$ANDROID_HOME/platform-tools/adb" -s "$ANDROID_SERIAL" shell am instrument -w -r \
  -e fixturePath "$SOMEWHERE_REMOTE_FIXTURE" \
  -e additionalTestOutputDir "$SOMEWHERE_PROFILE_OUTPUT" \
  -e class dev.groupplanning.android.ProfileFieldsUiTests \
  dev.groupplanning.android.uitesthost.test/androidx.test.runner.AndroidJUnitRunner
```

`ProfileFieldsUiTests` запускает `scenario=profile-fields`, нажимает реальные
кнопки входа, открывает профиль, проверяет поля и выходит через UI между стадиями.
Он сохраняет `profile-fields-{full,partial,clear}-{personal,contacts}.png`.
`ProfileFieldsLoginSupport(stage).use { ... }` перехватывает только запуск
`com.yandex.authsdk.internal.AuthSdkActivity` и возвращает synthetic
`YandexAuthToken` через штатный SDK contract версии 3.1.3. Монитор снимается в
`close()` даже при ошибке assertion. Это не подмена HTTP ответа и не обход
`YandexAuthRepository`: start, PKCE, exchange и сохранение сессии настоящие.
Файл `RuntimeFactory` изменён только в `src/qa`; обычный MainActivity не менялся.

После прогона забрать собственный evidence, удалить только собственный remote
config и adb reverse, остановить собственную fixture и QA-процесс. Обычное
приложение и пользовательские эмуляторы не сбрасывать.

## Прежняя сессия и серверная граница

Для native независимая QA может перед UI-цепочкой выполнить отдельный start
(`client_kind=ios` или `android`, challenge S256 собственного verifier), затем
`POST /api/v1/auth/mobile/sdk/exchange` с `oauth_token=profile-fields-full`.
Сохранить выданный somewhere Bearer только в приватном локальном файле; не
подставлять его в UI. После каждого UI-входа тем же Bearer вызвать
`GET /api/v1/me/profile`: UUID тот же, поля обновлены, HTTP 200. Не делать logout
этой вспомогательной сессии до окончания проверки. В evidence не помещать токены.

`TestProfileFieldsFixtureRepeatedHTTPLogin` автоматизирует эту границу отдельно
для web/iOS/Android: три настоящих HTTP входа, один UUID, full→partial→clear,
сохранность прежней сессии, отказ неверному PKCE и повторному exchange.
`TestProfileFieldsFixtureRejectsUnknownSDKTokens` проверяет закрытый список.
Они не заменяют проход UI и не подтверждают отображение синтетического bitmap.

## Состояние проверки

2026-10-27: gofmt, штатный gofumpt/wsl, swift-format, Kotlin formatCheck,
agent:check и diff-check прошли. Новые HTTP-тесты web/iOS/Android, закрытый список
fixture tokens и проверка прежнего design provider прошли с `-race`.
iOS `SomewhereUI build-for-testing`, Android `assembleQa` и `assembleQaAndroidTest`
успешны. Первый Go format-run выявил три пропущенные пустые строки; первая Android
сборка — лишний import member-метода `assertDoesNotExist`. Причины исправлены;
исходные неуспешные логи сохранены вместе с повторными.

UI-сценарии **не запускались**: по указанию координатора они отложены до общего
плана. Показ full-avatar остаётся blocked. Статусы кейса/spec/automation mapping
не менялись, full pass не заявляется. Тяжёлое окно освобождено; временные серверы,
новые симуляторы и Android adb не запускались.

Новые executable/APK и source SHA зафиксированы в
[handoff.json](assets/verification/live-review/2026-10-27-chat-sheets/profile-fields-fixture/handoff.json),
raw JSON и журналы — в соседнем `logs/`. В iOS отдельно указан debug dylib, где
лежит код test host, а не только executable-загрузчик. Прежние build hashes и
результаты UI до support-изменений к этой фикстуре не относятся.
