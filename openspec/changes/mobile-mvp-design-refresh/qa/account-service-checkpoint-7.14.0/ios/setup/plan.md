# Профиль iOS7.14 — подготовка независимого checkpoint

Статус: **setup-only, not-run**. Нет frozen handoff/candidate; pass, sourceHash и actual не фиксируются. Продукт/кейсы/токены не менялись, simulator/build/fixture не запускались. Scope — профиль, не redesign Help/About/документов. Их ссылки проверяются только как переход/возврат.

## Authority и ожидаемое

`approved-designs.json` idprofile → assets/profile-r2/frame.html, normalized preparation/references/profile/frame.html; принят «окаю, го некст». Последняя UX-коррекция выше исторических «ожидает одобрения»: полный display_name, без названия somewhere над меню и публичного пояснения под фото. Контракт mobile-mvp «Профиль и сервис7.14»: title28/34/650; avatar88/r28; name28/32.2/650; подпись «Вход через Яндекс ID»; отдельная read-only mobileSheet; строки15/label100/gap16/font14/21; меню58/icon22/chevron16; выход последним48/r14. Native safe area вместо декоративных макетных insets.

Raw-панель «Данные аккаунта»: privacy «Эти данные видны только вам», source «Получены из Яндекс ID», сначала «Контакты» (почта/телефон), затем «Личные данные» (логин/имя/фамилия/дата/пол). Нет редакторов/клавиатуры. Main содержит один вход в эти данные, помощь/проблема/о приложении/документы и последний logout. Удаления/версии на main нет.

Manifest account-service-ios сейчас7.13/phasepaused исторический; это не пауза текущей работы и не актуальная приёмка. Родитель обновляет manifest/candidate перед handoff. Мы его не исправляем.

## Минимальный runtime после handoff

Переиспользовать `/private/tmp/invitation-ios-independent-7.4/frontend/ios`, существующие `ProfileFieldsUITests`, `ResponseGate`, `NativeChatCounterpart`, `ExperienceScreenshot`, `SettledGeometry`. Не создавать новую инфраструктуру. Один небольшой checkpoint-класс/пара методов в temp-copy; compile только QA при необходимости, затем заменить mainApp точным frozen artifact и проверить20-file SHA/aggregate. Никакого запуска host, случайно пересобранного из старой temp-copy.

1. **Полный профиль/панель/возврат**. `SOMEWHERE_UI_SCENARIO=profile-fields`, ru_RU, без LOGIN_OUTCOMEoverride: SDK сам выдаёт full→partial→clear. Пропустить onboarding при наличии, реальный UI start/exchange, вкладка profile. Main actual402; identity/fullname/avatar и action order. Открыть «Данные аккаунта», зафиксировать actual после settledgeometry, несколько полей/порядок контактов, textFields/textViews=0. Закрыть видимым nativegrabber (не Text.swipeDown), actual-before-assert; проверить достижимость исходной строки/scroll. Один service link→Back только при готовом предыдущем экране. Скрытое удаление проверить по всей AX, включая panel.
2. **Три UIlogin stages на одном app process**. Адаптировать существующий `testProfileFieldsAcrossThreeUILogins`: теперь перед expectField нужен вход в panel, перед logout — dismiss. Full birthday23декабря1990, sexМужской, phone+79990000000; partial birthday23декабря без1990, sexНеуказано; clear birthdayНеуказано, phoneНеуказан, нейтральный силуэт. FirstnameАлександр/lastnameТестов/loginprofile_fixture/emailprofile@example.test сохраняются при omittedproviderfields. Последнее состояние capture, никаких демонстрационных подстановок.
3. **Profile error/logout/privacy (одна самостоятельная короткая проверка)**. Existing gate `/api/v1/me/profile`→503: ошибка не заменяется отсутствующими полями; release→повтор→серверные данные. Для logoutfailure использовать **before-request offline**, methodPOST/path`/api/v1/auth/logout`, а не подменённый503 послеуспешного serverlogout: иначе server уже отзывает session. Ошибка оставляет профиль доступным; release→retry→signedout; foreground/back в том же процессе не раскрывает прежние privatefields. `profile-fields` при новом launch сам удаляет credentials, поэтому relaunch этого scenario НЕ доказывает persistedlogout/privacy. Межпользовательскую APIprivacy и прежнюю действующую сессию отдельно принимать при доступном existinghelper, иначе явный limit — UIлогины не доказывают их.

Один320/large spot по фактическому handoff, не новая матрица: header/name/read-only rows/lastfield и достижимый dismiss. `SOMEWHERE_UI_VIEWPORT=320x568` — QA UIWindow bounds, physical402×874 записывается отдельно. Не запрашивать/включать VoiceOver.

## Правильные предусловия/доказательства

- SDKfixture `UITestLoginProvider` исполняет реальные native start/exchange/PKCE/API с fake-provider. Это НЕ external YandexOAuth proof. Full/partial/clear не являются тремя разными людьми: subject одинаковый fixture-profile-fields. ИхUIпереходы должны выполняться по порядку, provider-nextProfile сбрасывается при новом app launch.
- Backend profile_fields_fixture_test.go сохраняет distinction omitted/null. Partial не передаёт first_name/last_name/contacts; clear передаёт birthday:null/default_phone:null/is_avatar_empty:true. Сохранение известных контактов и явное очищение различать.
- `SOMEWHERE_UI_HTTP_TRACE` хранит только path→count, без HTTPmethod; одна запись `/api/v1/me` не доказывает отсутствие DELETE. Во время просмотра можно использовать существующий ResponseGate methodDELETE/path`/api/v1/me`/hold-before и assert `requested==false` перед release; это проверка конкретного окна взаимодействий. Никаких действительных DELETE/удалений аккаунта.
- Старые ProfileFieldsUITests ищут поля inline и старое имя заголовка. Не объявлять их pass нового sheet без изменения QAшагов. Не запускать ExperienceAccessibilityUITests целиком; содержащие VoiceOver методы исключены. Из неё можно переиспользовать только отдельный recovery-flow.
- Settled helper ≥0.7s стабильных frame/window, semantic readiness до geometry; actual ДО assertion. Стабильная presentation scale у sheet не равна конечномуpixelpass: записать environment/anchorframes, неassert48пораннемупереходу. Nativegrabber — самостоятельное действие на видимой ручке.
- Capture full/partial/clear main/panel + axevidence/actions и serverbinding. Только syntheticfixturePII, токены/cookies/CSRF/certprivatevalues не выводить/не копировать вQA.

## Cases и finalgate-граница

Targeted: TC-PROFILE-YANDEX-FIELDS, TC-PROFILE-CC2372B4, TC-PROFILE-EBBA2EA5, TC-PROFILE-ACTIONS-ORDER, TC-MOBILE-PROFILE-SIMPLE, TC-MOBILE-AVATAR-MAPPING/FALLBACK. Privacy TC-PROFILE-842701DD/C6FA6B4C — только фактически выполненные steps, не автоматический pass UIлогинов. Backend3integrationcases не выполняются этим коротким nativecheckpoint. Все оставшиеся manifeststates/mandatorysuites/fullcasegate — один раз по финальному общему кандидату, без переноса pass.

## Готовая команда по frozen handoff

Тот же simulator `31262733-50DC-46A5-938E-4C462D70F109`, fixture binary `/private/tmp/native-invitation-fixture-7.4-r2b/httpapi.test`, scopeaccessibility. Установить точный frozen mainApp в уже имеющийся IndependentDerivedData, приватный `ui-fixture.json` и `.build/chat-fixture-control.json` chmod600. Existing scripts/simulator.sh lock+traprelease. Запускать `test-without-building -only-testing:SomewhereUITests/ProfileCheckpoint714Tests`, env`SOMEWHERE_IOS_SKIP_VOICEOVER=1`, без fullsuites. Candidate/fixture/API hashes и actualcapturedAt связываются только после handoff. Остановить только собственную fixture; сохранить rootprocesses и состояние устройства.
