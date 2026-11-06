# Профиль iOS7.14 — независимый checkpoint R1

Вердикт: **PASS в выполненном коротком scope на402×874**. Существенных расхождений с approved profile-r2 в просмотренных ready/private-panel/full/partial/clear состояниях не найдено. Это не final gates, не полная manifestматрица и не checkbox-приёмка остальных платформ/состояний.

Точный frozen artifact `9ddf27494f01ff47cd53e4d833c3648bfd36743888810e01b227440fb5832c91`, source `360724f5d2f63885f59741fbb429f3ed18305d7ad8c5f52a6694dbc715ff2ceb`, input `0953ff9ea4ce087d7d5005e12efe61b4637df3dc7a07b46252e89ccc3da27cb6`. Все20 файлов immutable app и копии проверены SHA; после QAhelperfix mainApp снова заменён frozen: [binding](artifact-binding.json), [rerun binding](helper-rerun-binding.json), [candidate](candidate.json).

## Реальные действия и actual

**Serial full→partial→clear PASS107.588s**, [лог](serial-helper-rerun.log), [driver](ProfileCheckpoint714Tests.swift). Переиспользован canonical ProfileFieldsUITests с независимыми capture/settled/DELETEguard. Один app process, три настоящих UI login start/exchange с syntheticSDKprovider и текущим production API; это не внешний YandexOAuth.

| Состояние | Фактический результат |
| --- | --- |
| Full | profile_fixture, Александр/Тестов,23декабря1990,Мужской,profile@example.test,+79990000000 |
| Partial |23декабря без придуманного1990; полНеуказано; известные имя/фамилия/логин/контакты сохранены |
| Clear | датаНеуказано,телефонНеуказан; имя/фамилия/email сохранены, фото заменено нейтральным силуэтом без инициалов |

[Full main](actual/full-main.png), [full panel](actual/full-panel-top.png), [partial panel](actual/partial-panel-top.png), [clear main/fallback](actual/clear-main.png), [clear panel](actual/clear-panel-top.png). Рядом сохранены AX/environment/settledgeometry каждого состояния. Панель read-only, textFields/textViews=0; контакты предшествуют личным полям, privacy/source подписи присутствуют, редактора нет. Main содержит один account-trigger, сервисное меню без лишнего brand/publicprivacy пояснения, logout ниже документов. [Approved ready](reference-ready.png), [approved personal](reference-personal.png), [raw metrics/SHA](reference-metrics.json). Различие текста/фото fixture и примера макета не является дефектом.

На каждом stage nativegrabber закрыл панель; текущая строка и logout оставались достижимы. Logout очистил текущую UIповерхность и вернул onboarding; account-trigger и privateemail после выхода отсутствовали: [clear dismiss](actual/clear-after-native-dismiss.png), [signedout](actual/clear-signed-out-before-assert.png). Во время всего просмотра/выходов ResponseGate methodDELETE/path`/api/v1/me`/hold-before ни разу не был requested; реального удаления не выполнялось. В AX нет входа «Удалить аккаунт».

**Opt-in bitmap PASS12.207s** на том же R1: [лог первого запуска](smoke-independent.log), [actual](actual/optin-avatar-main.png), [API public URL proof](actual/avatar-api-public-proof.json). Existing `SOMEWHERE_NATIVE_AVATAR_FIXTURE=1` возвращает designuser публичный standardbitmap `https://avatars.yandex.net/get-yapic/0/0-0/islands-200`; он реально отображён вместо native серого fallback. Это не личный productionаккаунт и не доказательство cachepersistence между сессиями.

Первый serialattempt ошибочно ожидал сразу кнопку «Попробовать» послеlogout, тогда как реальная поверхность была onboarding с «Пропустить знакомство». [Первый лог](smoke-independent.log), [сохранённые actual/AX](attempt1/actual/full-signed-out-before-assert.ax.txt). Исправлены только QAожидание и лишний bottom100 reserve в revealhelper; затем повторён serialtest целиком, поскольку launch сбрасывает SDKstagecounter. Optinavatar не повторялся. App/source неизменны.

## Ограничения и release

Native logout остаётся authoritative local по текущему контракту. HTTPerror/logoutpending из webraw не воспроизводились и не объявлены nativepass. Межпользовательская APIprivacy, прежняя serverсессия при повторномlogin, cachepersistence, loading/error/retry, Back/service-return, narrow/large/landscape/reducedmotion остаются финальному кандидату; Help/About дизайн не проверялся. VoiceOver не читался и не включался. Полные suites/design/QA gates не запускались.

iOS27.0 Simulator `31262733-50DC-46A5-938E-4C462D70F109`, реальное окно/physical402×874, ru_RU, стандартныйL. Геометрия стабилизирована ≥0.7s, actual снимался доassert. App завершён, собственная fixture остановлена, lock освобождён, rootfixtures сохранены: [cleanup](cleanup.json). **Source/device RELEASED.** Продукт, эталоны, токены, cases, manifests, tasks и Git не менялись.
