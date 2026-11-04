# Независимая функциональная проверка Android launch

Промежуточный feature-проход 04.11.2026. Это не frozen-кандидат платформы из группы 13 и не приёмка релиза. Реализация, кейсы, задачи, manifest и инструменты не изменялись. Исполнитель проверки: `independent-android-launch-feature-reviewer`, отличный от implementer плана.

## Источники и кандидат

Проверены raw `TC-MOBILE-LAUNCH-COLD`, `TC-MOBILE-LAUNCH-RESUME`, `TC-MOBILE-LAUNCH-REDUCED` из `testing/cases/mobile-mvp-entry.yaml`, delta `specs/product-onboarding/spec.md` и `testing.md` изменения. До запуска `currentPlan` подтвердил актуальность каталога, sourceHash, полного списка expected и suites. Применена строгая схема `scripts/testing/schema.mjs`.

План: `run/plan.json`; каталог `f07c1805ac8a8b93d8e827a1d8ef86904d4f1e683428a3187cf85801d378bec3`; исходники `838656632f48e1a80a23ecf033ca34c5c48866a4ea1a6ce8bb8775b0b151c6e3`. QA host `dev.groupplanning.android.uitesthost`, версия `0.1.0(1)`, APK SHA256 `663484b591217485b9dc8a74b93ddb10e948e5d85346dac088913b36692c62f2`. Обычное пользовательское приложение не запускалось.

Устройство: существующий `emulator-5554`, Android 16/API 36; размеры 320×760 и 390×844 dp при density 320, fontScale 1.0, portrait. Язык приложения ru, системный en-US, timezone Europe/Moscow. Вход — тестовая авторизованная сессия scenario calendar, приглашение отсутствует. Собственный Go memory `TestAndroidFixture/calendar`, HTTPS loopback; credentials не включены в evidence.

## Действия и наблюдения

| Кейс | 320×760 | 390×844 | Фактический результат |
| --- | --- | --- | --- |
| COLD | passed | passed | force-stop → запуск QA host; графитовый системный этап без маскированной подписи → полная подпись приложения, неподвижное слово, один оборот, остановка, личные встречи |
| RESUME | passed | passed | восстановление задержано собственным TLS gate; после оборота знак останавливается; Home/возврат во время ожидания и после готовности, пересоздание Activity поворотом; сессия и список сохранены, вступление не повторяется |
| REDUCED | blocked | blocked | scales 0: полная статичная подпись, знак не вращается; обязательное чтение диктором не выполнялось |

Системный этап Android — однотонный графит. Полная подпись появляется в приложении без дополнительного вращающегося знака системной маски. На видео normal motion виден один оборот приблизительно за 1,2 с; контактные листы извлечены с шагом 100 мс. Они не заменяют исходные MP4. После оборота на задержанном экране нет нового вращения или процентов.

Живая семантика задержанной заставки: `somewhere, приложение загружается`. На обоих размерах общие границы подписи 564×112 px. В small знак `[38,747][144,853]` — 106×106 px, то есть 53×53 dp; текст начинается x=176, промежуток 32 px, то есть 16 dp. В standard подпись перемещается в центр более широкого экрана, её размер сохраняется. Текст целый, без обрезания. Runtime UI tree не раскрывает номинальный размер шрифта sp. Дополнительно сверены текущие LaunchWordmark/DesignTokens: 44 sp, 53 dp и 16 dp; при наблюдённых fontScale=1 и ширине контента 564 px (<640/<780 px) сжатие fit не требуется. Это подтверждение конфигурации вместе с живой геометрией; отдельный design-review всё ещё обязателен.

Для долгого восстановления использован отдельный временный loopback TCP relay, удерживающий только TLS-поток собственной fixture до общего девятисекундного gate. Payload не декодировался и не записывался. После снятия gate приложение действительно открыло личные встречи. Пересоздание Activity выполнено изменением orientation portrait→landscape→portrait при выключенном accelerometer_rotation. Возврат из фона проверен также после готовности с непрерывной записью: открывается тот же список без заставки.

Отключение движения: window_animation_scale, transition_animation_scale и animator_duration_scale установлены в 0; на видео заставка статична от появления до перехода. Семантическое имя отдельно наблюдалось в живом дереве обычного задержанного запуска. Оно не доказывает озвучивание. Диктор/TalkBack/VoiceOver в ручном проходе не включался и не засчитывался по ограничению текущей задачи; raw REDUCED целиком не получает pass.

## Доказательства и очистка

`run/evidence/interactions.json` содержит временную последовательность действий и фактические ответы ActivityManager. Для каждого размера сохранены PNG, UI XML, исходные видео cold/delayed/reduced/resume-ready и полученные из них контактные листы. SHA256 привязаны к каждой проверке в `run/run.json`.

`device-before.json` и `device-after.json` подтверждают восстановление wm size/density, fontScale, orientation и animation settings. Собственный reverse удалён; исходный список остальных reverse сохранён. QA host остановлен. Remote config и временный XML удалены, прежняя конфигурация QA host возвращена до запуска штатного suite. Штатный suite затем использует и очищает собственные fixture/config. Пользовательские AVD, приложения и стенды не сбрасывались и не останавливались.

## Обязательные suites и готовность

`android-unit` выполнен штатным `qa:run-suite`, exit 0; Gradle сообщил UP-TO-DATE для testDebugUnitTest. Это использование кеша штатного runner, не новый принудительный прогон unit assertions.

`android-ui` завершён штатным `qa:run-suite`, exit 1, scope all. JUnit: 98 tests, 4 failures, 0 errors, 0 skipped. Падения: EmojiSearchUiTests.searchTouchKeepsFocusWhenKeyboardResizesDock; InvitationUiTests.allResponsesControlPeopleAndChatAcrossReentry; InvitationUiTests.cutoffForegroundDateOnlyReturnAndStaleSubmission; PhotoPickerUiTests.systemPhotoPickerPublishesSelectedPhotoWithoutCaption. Точные стадии и ограничения снимков — `run/evidence/suite-failure/defects.md`; сохранены исходный JUnit, четыре per-test logcat, raw suite log и последние штатные кадры затронутых сценариев. Runner остановился на failed connectedQaAndroidTest и не выполнил отдельные persistence-стадии. Fixture cleanup также сообщил FAIL; его raw вывод сохранён в suite log. Сбои общего suite не классифицируются как launch-дефекты без соответствующего воспроизведения.

Полная функциональная готовность не подтверждена: два REDUCED blocked и android-ui failed. Checkbox и финальная приёмка платформы остаются открыты. Финальные проверки currentPlan/sourceHash и `qa:ready` сохраняются рядом после завершения диагностики.

## Дополнительная диагностика и финальная фиксация

На том же неизменённом APK отдельно выполнен только `EmojiSearchUiTests#searchTouchKeepsFocusWhenKeyboardResizesDock` через am instrument на собственной fixture calendar. Результат `OK (1 test)`, 11.503 s; исходный timeout в этом отдельном запуске не воспроизведён. В `run/evidence/emoji-diagnostic/` сохранены raw stdout, per-process logcat, внешние PNG с временем, product screenshots и MP4. Это диагностическое наблюдение на отдельной fixture; исходный общий android-ui suite остаётся failed. Причина исходного timeout не установлена.

Пересоздание Activity дополнительно записано непрерывно в `small/standard-recreation-continuous.mp4`: portrait→landscape→portrait сохраняет список, на кадрах заставка не появляется. Действия и время — `recreation-interactions.json`. Исходный системный rotation transition виден на записи и не считается движением знака заставки.

Финальная проверка `currentPlan` подтвердила исходные sourceHash/catalogHash и полноту expected/suites; APK SHA256 остался прежним. `qa:ready` выполнился и честно отклонил готовность: REDUCED blocked в обоих размерах и android-ui failed. Структурное состояние: expected 6, checked 6, manual passed 4, blocked 2; suites passed 1, failed 1. Результаты — `run/evidence/readiness.json` и `qa-ready.log`. `agent:check` passed. Полный `git diff --check` выполнен отдельно.

`cleanup-final.json` и `device-final.json` подтверждают точное восстановление исходного состояния wm/settings/reverse после всех проходов. Собственный Go fixture остановлен; QA host stopped; private QA fixture config удалён. Нормальное пользовательское приложение и другие reverse/AVD не затрагивались. Диктор/озвучивание не запускались.
