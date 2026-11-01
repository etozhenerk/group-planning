# QA scheduler: причинный контроль и интеграция

01.11.2026, исполнитель sdd_server_audit. Это авторский отчёт, не независимый gate.

## Exact candidate

Первый peer-approved patch: `/tmp/somewhere-android-qa-dispatcher-fix/candidate.patch`,
SHA256 `4dcc874535f0430de930ee2e8291add3d641fa19683e6879006b412267b17ad5`.
Он применён в MAIN с сохранением locale-rule изменений. Runner all дополнен
двумя внутренними tests: 85 product + 2 internal, затем два persistence stages.

Дополнительный helper delta: `/tmp/somewhere-android-qa-dispatcher-author/scheduler-pump.delta.patch`,
SHA256 `7e4d7fd46f38c8686ed6efebdaeb3e06846fae24ea10b27f11bef6e50cbf5693`.
Только QaComposeRules.kt и новый QaCoroutineIdlingResource.kt в androidTestQa.
Ни production runtime, ни test bodies/assertions/таймауты не менялись.

## Выполненные controls

Raw находится в `/tmp/somewhere-android-qa-dispatcher-author`:

| Артефакт | Реальный результат |
| --- | --- |
| default/control-1 | FAIL: LaunchedEffect resumed на qa-network-callback, ожидался main; PID4470 |
| default/control-2 | FAIL: настоящий collectAsStateWithLifecycle collector на qa-network-state-flow, ожидался main; PID4555 |
| fixed/control-1 | 2 FAIL: простой Standard оставил initial tasks без pump; effect не подписался, StateFlow text 0:0 вместо 1:0; PID4738 |
| fixed-pump/control-1 | 2 PASS вместе: оба effect/collector/apply на main, актуальный текст и последующий независимый MutableState/SideEffect; PID4971 |

Каждый артефакт имеет source inventory, APK hashes/certificates, build log,
instrumentation.log и PID-filtered logcat. После каждого control QA остановлен,
device baseline settings совпадают. Default tests по одному в свежем PID;
positive два вместе. Старые FAIL не заменены новыми результатами.

Первый build был выполнен с обычным Android user home: compile PASS, install
отклонён из-за другого debug certificate. Uninstall/reset не выполнялись.
Затем использован прежний synthetic ANDROID_USER_HOME и certificate414f3f07…;
QA install -r сохранил пакет и данные. Key payload не читался и не печатался.

## Почему требуется pump

Pinned Compose UI Test 1.9.5, локальные неизменённые исходники в
`/tmp/somewhere-android-pinned-source`:

- ComposeUiTest.android.kt:421–426 принимает TestDispatcher, иначе создаёт
  UnconfinedTestDispatcher; MainTestClock использует его scheduler.
- ComposeIdlingResource.android.kt:60–79 продвигает кадры только при awaiters,
  snapshot changes или recomposer pending. Очередь начальных Standard effects
  не поднимает ни один из этих признаков: это воспроизведённый fixed FAIL.
- IdlingResource.kt: isIdleNow должен вызываться на main. Наш getter проверяет
  Looper и запускает только scheduler.runCurrent() текущего virtual time.
- IdlingResourceRegistry.jvm.kt:36 хранит insertion-ordered mutableSet;
  :113–119 опрашивает все resources в этом порядке.
- ComposeUiTest.android.kt:684–689 регистрирует штатный Compose resource только
  внутри runTest. QA factory регистрирует pump до него. Поэтому сначала текущие
  tasks возобновляются на main, затем штатный resource видит их snapshots/frames.

Pump не продвигает часы, не вызывает advanceUntilIdle, не добавляет таймер,
не ждёт HTTP и не меняет snapshot/state. Будущие задержки/кадры остаются под
штатным MainTestClock; autoAdvance=false motion tests сохраняют контроль времени.
Объект принадлежит одному rule, не создаёт подписок/jobs/фоновых ресурсов.

Шесть motion classes дали 12 PASS в первом адресном запуске с pump. Три live
метода того запуска не дошли до продукта: собственный helper передал config
path, отвергнутый штатным guarded regex. Также ошибочно выбранный all fixture
потребовал unrelated full-suite postconditions; его FAIL сохранён. Это дефект
авторского harness, не runtime. Повтор идёт со штатным config path и существующим
calendar scope (как official narrow runner), продуктовые expectations сохранены.
Он включает все десять исходных failed methods плюс положительные motion tests.

Независимый reviewer должен отдельно проверить этот delta. Полный87 пока не
запускается до адресного PASS. Production scopes статически проверены отдельно:
MainActivity setContent, lifecycleScope/viewModelScope, lifecycle collectors;
эти QA controls не объявлены воспроизведением production threading defect.
