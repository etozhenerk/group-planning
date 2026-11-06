# Android помощь/обращение · QA подготовка7.14

Только read-only prep. Новый UI runtime/build не запускались, verdict/pass нет.
После frozen handoff — короткий независимый screen checkpoint, не полная матрица.
Продукт, кейсы, токены и canonical tests ревьюером не менялись.

## Готовая обвязка и изоляция

Использовать прежние InvitationUiFixture/QaAppLocaleRule/ChatReadLiveApi,
QaChatProbe и screenshot/capture/ADB helper. Тот же verified native fixture
binary140b015239bf1a35bce274171ef113add3e9cd0b4b7147986a6494c9cfbd41d7;
конфигурация только вprivate/tmp, remote `/data/local/tmp/somewhere-android-ui-713841.json`.
Фактический порт/сертификат привязать при run, значения credentials не логировать.

Android fixture использует `fixtureSupport() = support.New(memory.NewSupport(),
nil,time.Now)`, без notifier/Telegram. Разрешена отправка только в этот изолированный
memory mock; production origin и реальные каналы поддержки не использовать.
Flags прежние: SOMEWHERE_ANDROID_FIXTURE=1, SOMEWHERE_ANDROID_FIXTURE_SCOPE=calendar,
SOMEWHERE_ANDROID_CHAT_REALTIME=1, SOMEWHERE_ANDROID_CHAT_READ_STATE=1,
SOMEWHERE_ANDROID_FIXTURE_CONFIG=<private tmp path>. DB/Docker не нужны.

Не отключать реальные rate limits ради pass. Перед большим числом принятых
обращений — свежий собственный memory fixture/учёт числа POST: default quota5;
повторы одного ключа должны сохранять тот же receipt. Boundary создаёт2 новых
обращения, Keyboard ещё1, recreation ещё1; не размножать их повторно без причины.

## Точные существующие canonical tests

Отдельных HelpDisclosureUiTests/SupportFormUiTests нет. Готовы:

- AccountDeletionUiTests#helpDisclosureKeepsStateAndBackReturnsToProfile:
  первый FAQ initially open, toggle, recreation, Back. Не покрывает само по себе
  FAQ→обращение→Back с сохранением scroll; это короткий ручной scope.
- SupportBoundaryUiTests#nineAfterTrimAndThreeThousandAndOneCodePointsNeverReachTheApi:
  9/3001 Unicode codepoints, сохранение ввода,0POST.
- SupportBoundaryUiTests#tenAndThreeThousandCodePointsGetDistinctRealReceiptsOnCleanForms:
  10/3000, реальные accepted/id/reference, отдельные POST/чистые формы.
- SupportServiceUiTests#systemScreenshotCancelSelectionAndRemovalPreserveDescription:
  своя MAGENTA PNG128×128 через настоящий picker, отмена, декодированныеbytes,
  удаление и сохранение текста. Cleanup только созданной картинки.
- SupportKeyboardUiTests#donePreservesNewlinesAndShortMessageExplainsItsLimit:
  Enter/newline, Done/Back/IME,9→10, реальный receipt.
- ExperienceUiTests#profileSupportDraftAndNavigationSurviveRecreation:
  прежний дополнительный draft/recreate путь; не запускать дублирующе без нужды.
- Unit SupportDescriptionIssueTests: trim/emoji/10–3000. Это не ручная приёмка.

## Селекторы/новый путь, которые обновляет исполнитель до handoff

- Old exact «Яндекс ID» заменить текущим profile trigger/«Вход через Яндекс ID».
- В Boundary.selectContext `hasAnyAncestor(isPopup())` относится к старому
  DropdownMenu; новый section-sheet должен иметь свой tag/ancestor. API keys,
  kind=idea и screen=meeting_chat assertions сохранить.
- Видимого «Назад»/brand на внутренних экранах больше нет. FAQ/SupportService
  Back и SupportKeyboard.assertHeaderBelowStatusBar должны использовать общий
  PageBack и actual bounds ниже status bar, не искать удалённую надпись/бренд.
- Receipt raw: «Обращение принято», отдельные «Номер обращения» и настоящийreference,
  «К помощи». Старые «Спасибо, что рассказали», support_another и combined
  support_reference не соответствуют новой композиции. Сохранять checks DTO/id/
  accepted/postCount; label locators обновить под отображаемый реальный номер.
- Новый чистый путь: receipt→К помощи→Написать в поддержку. BoundarycleanForms
  не должен требовать отсутствующий «Отправить ещё одно». После результата
  «К помощи» находится help, а не сразу profile/service-page absent.
- Не менять граничные9/10/3000/3001, screenshotbytes, postCount, real receipts
  ради адаптации UI. Обновлять только устаревшие locators/утверждённый новый путь.

## Короткий ручной scope после реализации

Section-sheet содержит ровно8 исходных keys:
meetings /calendar /invitation /meeting_chat /profile /memories /sign_in /other.
Проверить исходныйselected mark, Back/handle cancel без изменения, явный выбор
chat и возврат фокуса к trigger. Сохранить message/email/свойфайл и formscroll.
Hardware стрелки/Home/End двигают фокус без применения; Enter/Space выбирают,
не отправляют родительскую форму. Android Home test = KEYCODE_MOVE_HOME122,
End=KEYCODE_MOVE_END123, не системный KEYCODE_HOME3.

Проверить FAQ whole-row disclosure/без растяжения текста, samequestionfocus,
scroll/open state при FAQ→support→Back. Normal и reduced motion — явно
зафиксированные настройки; null setting не равен доказанному animations-off.

При overflow: footer прилегает к трём краям, только верхние углы, тень вверх,
остаётся на месте при реальном scroll; последнее поле достижимо вышеfooter/IME.
На высоком viewport безoverflow действие в потоке без stickybackground/shadow.
Нельзя принять conditionalsticky лишь по styleflag/screenshot: сравнить bounds
body/footer до/после реальной прокрутки. Переиспользовать5554, без новыхAVD.

Ошибки: поля/firstfocus/Done, file rejection, busy protection, retained unknown
body/key/retry и подтверждённый serverreceipt. Отмена picker после уже выбранного
файла — отдельный manual/final gap существующего filetest; он отменяет до выбора.
Никаких сообщений реальной поддержке.

## Lost ACK ограничение

Готового Android support commit→lostACK hook в прежнем native binary/QaResponseGate
не найдено. Обычный outage только собственного reverse проверяет networkerror,
но не доказывает servercommit→lostreply/idempotency. По поручению root поиск новой
обвязки остановлен; root рассмотрит минимальный existing QA interceptor послеUI.
Новый framework/runner не создаётся. Unknown case без реального evidence — gap,
не pass. Старые iOS ResponseGate/HTTP unit результаты не подменяют Android runtime.

## Команды после handoff

Исполнитель даёт immutable app APK + свежий canonical testAPK, exact source/
artifact/designInput hashes. Before/after проверка прежним check-candidate.mjs;
после run actual/ref/actions, cleanup settings и release source/device.
Один кейс запускается обычным готовым runner, например:

```sh
/Users/misha/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell am instrument -w -r \
  -e fixturePath /data/local/tmp/somewhere-android-ui-713841.json \
  -e additionalTestOutputDir /data/user/0/dev.groupplanning.android.uitesthost/files/help714-boundary \
  -e class dev.groupplanning.android.SupportBoundaryUiTests#nineAfterTrimAndThreeThousandAndOneCodePointsNeverReachTheApi \
  dev.groupplanning.android.uitesthost.test/androidx.test.runner.AndroidJUnitRunner
```

До frozen кандидата эту команду не запускать. VoiceOver/TalkBack не включать;
семантическое/клавиатурное управление проверяются отдельно. Полные gates позже.
