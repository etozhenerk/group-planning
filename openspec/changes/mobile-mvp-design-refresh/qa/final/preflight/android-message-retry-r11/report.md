# Android: targeted preflight QA retry helper

Независимая read-only проверка: helper и три канонических метода прошли. Это preflight после QA-правки, не официальный R11 pass. Отрицательный R10 (98/99, process-death 2 NOT RUN) сохранён без изменения.

## Проверка helper

`MessageRetryUiAction.kt` расширяет фактический `ComposeTestRule`. Ограничение — 15 секунд. До действия допускается ожидание актуального unmerged узла, который displayed/enabled и имеет OnClick. Перед callback устанавливается `actionInvoked = true`; gate release находится внутри него, перед единственным `assertTrue(click())`. Если callback уже начат, AssertionError не повторяется. RuntimeException тоже не перехватывается. Очередь, черновик, сохранённая история, settings и серверные проверки не сняты. Повтора всего теста и раннего снятия gate нет.

Предыдущая компиляция с `ComposeContentTestRule` имела receiver mismatch; root исправил только тип на `ComposeTestRule`. Финальная root QA сборка прошла: `/private/tmp/mobile-android-r11-qa-build2.log`, 42 s. Продуктовый код в этой пачке не менялся.

## Фактический проход

Установлен точный замороженный product APK17f… из R10; root-built test APK содержит новый helper. Полные SHA в `binding.json`. Свежий отдельный стандартный loopback Go fixture на 53976, scope=persistence. Синтетические пользователи и сообщения; production-каналов нет. Приватный диагностический наблюдатель предыдущего прохода не установлен.

- `FeedUiTests.historySendRetryInformationAndSettingsFollowSharedDesign`: PASS, 19.347 s; исходный путь history/retry/recreate/confirmation/draft/Info/settings сохранён.
- `FeedPersistenceUiTests.prepareProcessDeath`: PASS, 4.095 s.
- Между этапами выполнен `am force-stop`; проверка отсутствия PID успешна, stdout пустой.
- `FeedPersistenceUiTests.restoreAfterProcessDeath`: PASS, 4.306 s; восстановлены pending и прежний черновик, retry подтверждён, очередь исчезла, черновик сохранён.
- Завершение свежего server fixture: `TestAndroidFixture PASS`, exit0; scope=persistence проверяет реально два POST, один непустой client key и один message ID. Raw ключи/config/certificate/APK в этот пакет не включены. Отдельный bodySHA этим отчётом не заявлен.

`feed-restored-confirmed.png` просмотрен: реальное сообщение подтверждено, в composer остаётся «И черновик тоже». Все capture metadata отмечают актуальный MainActivity/product host. Это не полный дизайн-проход и не заявка на закрытие UI-задач.

## Cleanup

Приложение force-stopped, собственный reverse 53976 и remote config удалены, fixture завершена с PASS. Source/Gradle/device освобождены для root commit и свежего официального R11 плана. Исходники/канонические тесты/кейсы/gates reviewer не менял.
