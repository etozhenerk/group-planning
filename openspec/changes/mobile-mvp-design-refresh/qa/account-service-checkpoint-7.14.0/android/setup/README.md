# Android профиль · подготовка checkpoint7.14

Только read-only подготовка: новый app runtime/build не запускались, verdict/pass
отсутствуют. Публикация7.14/кандидат ожидаются от исполнителя. Текущий manifest
account-service-android на момент чтения ещё7.13/paused; не считать его frozen7.14.

## Повторное использование

- Canonical `ProfileFieldsUiTests#profileFieldsAcrossThreeUiLogins` и
  `ProfileFieldsLoginSupport` проходят full→partial→clear через синтетический SDK
  result и реальные HTTP start/exchange/GET profile. Реальный Яндекс OAuth отдельно.
- `InvitationUiFixture`, `QaAppLocaleRule`, `ChatReadLiveApi`, `QaChatProbe`,
  существующие screenshot/capture helpers; не создавать отдельный сложный runner.
- Подтверждённый binary `/private/tmp/native-invitation-fixture-7.4-r2b/httpapi.test`,
  SHA140b015239bf1a35bce274171ef113add3e9cd0b4b7147986a6494c9cfbd41d7.
  Уже работающий собственный memory fixture конфигурируется через
  `/private/tmp/vibe-checkpoint713-config.json`; порт записан в предыдущем
  `vibe-checkpoint-7.13.0/android/r5/runtime.json`. Перед новым run привязать
  фактический origin/cert/binary; значения credentials в отчёт не копировать.
- Текущий установленный testAPK — canonical после VibeR5; после обновления
  тестовых селекторов нужен свежий canonical testAPK от исполнителя, не старый
  tempdriver. App устанавливается исключительно из frozen candidate.

## Нужные обновления селекторов исполнителем до handoff

Существующий ProfileFields test ищет поля сразу в профиле. Для принятого дизайна
после `home-profile` открыть «Данные аккаунта»; перед logout закрыть sheet Back.
Сохранить assertions full name, login, first/last, полной/неполной/очищенной даты,
unknown sex и отсутствующего телефона. Back должен сохранять фон/доступность
триггера. `AccountDeletionUiTests.profileKeepsLogoutAndHidesDeletionEntry` ждёт
exact «Яндекс ID»; новая подпись — «Вход через Яндекс ID». Другие старые тесты
serviceBack/help содержат устаревшее видимое «Назад»; их не запускать как новый
profile pass до адаптации, не выдавать failure locator за продуктовый дефект.

`QaChatProbe.requests` уже безопасно хранит method/path без credentials. При
проходе профиля можно проверить отсутствие `DELETE /api/v1/me`, editor и hidden
entry в unmerged semantics/UI dump. Сам `DELETE /me` для этого кейса не вызывать.

## Короткий runtime после frozen handoff

1. Проверить exact source/APK before binding прежним check-candidate.mjs;
   record device720×1600/density320/font1 и motion setting. Для animated sheet
   явно поставить1.0, сохранить/восстановить исходное значение. Settingnull не
   гарантирует `ValueAnimator.areAnimatorsEnabled=false`, см VibeR4 note.
2. Установить immutable app APK и свежий canonical testAPK. Использовать remote
   `/data/local/tmp/somewhere-android-ui-713841.json` с актуальным собственным
   config и reverse своего порта. Не сбрасывать пользовательские приложения.
3. Запустить один canonical three-login тест. Просмотреть actual ready/personal/
   missing и full/partial/clear API values: no invented year/sex/name/photo.
4. Быстрый агентский проход ready360,320/short: полное имя/фото или fallback,
   trigger→read-only sheet→Back, last logout, нет лишних provider/public blocks.
   Raw approved profile-r2 и navigation-r2; fake status62 заменяется реальной
   native safe area, footer — реальной системной/приложения навигацией.
5. Logout error: после реальной загрузки профиля можно временно удалить только
   собственный adb reverse для fixture. Выйти, capture; затем восстановить
   свой reverse. Нельзя блокировать сеть устройства/чужие API. Ожидается доступный
   профиль при ошибке; текущий SessionRepository.logout предварительно очищает
   local state — статический риск, до нового runtime не продуктовый verdict.
6. After binding, cleanup своих фото/данных/setting, release source/device.
   Указывать только фактически пройденный scope. Полная account-service матрица
   и design:ready/qa:ready — на общем кандидате после остальных экранов.

Команда готового теста после установки/конфигурации:

```sh
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell am instrument -w -r \
  -e fixturePath /data/local/tmp/somewhere-android-ui-713841.json \
  -e additionalTestOutputDir /data/user/0/dev.groupplanning.android.uitesthost/files/profile714 \
  -e class dev.groupplanning.android.ProfileFieldsUiTests#profileFieldsAcrossThreeUiLogins \
  dev.groupplanning.android.uitesthost.test/androidx.test.runner.AndroidJUnitRunner
```

## Реальные ограничения fixture

- full: display_name «Александр Тестов», login/profile_fixture, first/last,
  birthday1990-12-23, sexmale, email, phone и синтетический avatar URL.
- partial: birthday0000-12-23/sexnull; пропущенные login/first/last сохраняются.
- clear: birthdaynull/phone null/avatar empty; first_name пропущено, сохраняется.
- full avatar URL `https://avatars.yandex.net/get-yapic/fixture/portrait/islands-200`
  не является доказанным доступным bitmap. Сам этот тест прямо исключает avatar
  bytes. У существующего native-avatar opt-in есть публичный стандартный рисунок
  по `SOMEWHERE_NATIVE_AVATAR_FIXTURE=1`; это bitmap/fallback check, не настоящий
  аккаунт/портрет. Проверить загрузку явно; не объявлять photo pass по URL.
- Three-login UI не проверяет второго участника/публичные проекции. Это отдельный
  API/клиентский scope final; fixture HTTP tests уже имеют собственные assertions,
  их старый результат не переносится на новый UI-кандидат.
- Готового управляемого profile-loading/logout-error hook в прежнем binary нет.
  Короткий сетевой отказ возможен только на своём reverse; scoped blocked/partial
  при отсутствии наблюдаемого сценария. Не писать новый большой fault framework.
- VoiceOver/TalkBack сейчас не запускать. Крупный текст/семантические имена
  самостоятельны и не заменяют речевую приёмку.
