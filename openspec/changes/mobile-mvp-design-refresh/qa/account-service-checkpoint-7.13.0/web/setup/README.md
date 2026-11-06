# Профиль — подготовка короткого independent checkpoint

Только read-only подготовка. Новый UI/runtime/build не запускались; pass отсутствует. Current account-service manifest7.13 phasepaused — источник будущего профиля, не готовность. Root пришлёт новый frozen candidate после реализации. Повторно использовать общие helpers из vibe setup; нового runner нет.

Authority: approved profile-r2 (navigation-r2), normalized preparation/references/profile/frame.html; account-service-web.json; ux/profile correction и TC-PROFILE-YANDEX-FIELDS/TC-PROFILE-ACTIONS-ORDER/TC-MOBILE-PROFILE-SIMPLE/AVATAR fallback/privacy. Входы/sha и извлечённые cases в JSON рядом. Макет показывает пример имени; настоящие first/last fields не становятся публичными.

Реальные fixture поля уже есть в browser_fixture_test.go и profile_fields_fixture_test.go: через обычный fake-provider выбрать «Профиль: все поля», затем отдельными browser contexts «Профиль: неполная дата», затем «Профиль: очищение». Все три используют один provider subject fixture-profile-fields. Обычный helper @tests/helpers.login имеет узкий TS union; переиспользуем string-name login из vibe/harness.mjs (без нового login runner).

Full: Александр Тестов, profile_fixture, Александр/Тестов,1990-12-23,male,email profile@example.test,phone+79990000000. Partial: birthday0000-12-23/sexnull; отсутствующие name/login/contacts сохраняют известные значения. Clear: birthdaynull/phonenull/is_avatar_emptytrue; известные first/last/login/email сохраняются. Backend существующий TestProfileFieldsFixtureRepeatedHTTPLogin уже описывает expected и старую сессию; новый прогон здесь не выполнялся.

Короткая последовательность после freeze:

1.390 full→profile ready: снимок/raw; identity/portrait либо честный fallback. «Данные аккаунта» read-only sheet; все server fields; Escape/handle/Back возвращают фокус. Низкая высота+scroll одного view, без отдельного sticky action.
2. Partial→старой sessionA повторно GET me/profile и UI: тот же ID,23декабря без придуманного года, sex «Не указано»; Clear→дата/phone/avatar очищены, пропущенные поля сохранены.320 spot на missing/long без overflow.
3. Второй синтетический участник получает только public DTO id/display_name/avatar_url (public_profile.go whitelist). Не проверять приватность mocked API reply. UI/participants не раскрывают contacts/birthday/sex/login. API meeting/join допустимы только как isolated data setup.
4. Порядок сервисных ссылок/raw и logout последним, нет edit/delete/version в корне. Переход в About и возврат — только сохранность перехода; service redesign будет отдельным checkpoint.
5. Один known logout failure→same profile +retry; pending недублируется; реальный logout→me401/cache очищен, старый приватный экран после Back не открывается. Только свой fixture; не запускать destructive account deletion.
6. WebKit короткий sheet-close/focus и desktop1100 oldcomposition spot. Не расширять в полную матрицу; финальный общий кандидат будет отдельным официальным gate.

Готовые recipes: tests/18-loading-logout.spec.ts:123,164 (cold success/cache/private-state и failed logout);26-account-deletion.spec.ts:105 (не исполнять delete, только existing hides-delete/logout-order test);19-shared-session.spec.ts (два contexts одного профиля);49-service-navigation.spec.ts (return-state); loading-helpers.ts (hold/release), общий failOnce (scoped transportfault). Не переносить их старые pass на новыйhash.

Ограничение фото: profile-fields-full возвращает синтетический https://avatars.yandex.net/get-yapic/fixture/portrait/islands-200, но browser fixture не предоставляет под ним локальную картинку. Это closed provider document; network-photo не доказана. Для screenshot фото нужен явно заданный локальный photo fixture/точный URL transport-fixture, помеченный как fixture; для fallback можно abort только этот exact URL. Не отправлять запросы production provider ради этого smoke. SOMEWHERE_NATIVE_AVATAR_FIXTURE opt-in также возвращает внешний стандартный URL, не локальный endpoint.

От root нужны frozen candidate/dist/origin+scope и решение по доступному local avatar fixture либо честный limit фото. Используем существующие owned reference9130 и общий binding до/после; ownapp будет отдельным port/store и log/pid. Новые OAuth SDK/реальный Yandex/отправка поддержки/удаление аккаунта сюда не входят.
