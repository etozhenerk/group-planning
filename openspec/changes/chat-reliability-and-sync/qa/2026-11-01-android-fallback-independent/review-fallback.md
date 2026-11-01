# Независимое чтение и причинный контроль Android fallback

Исполнитель /root/sdd_server_audit не автор этой fallback-дельты. Авторство прежних FeedVMrestore/authcleanup/ChatViewport/QAhelpers не присваивается независимой приёмке этих частей.

В принятом protocol.md:91 после10s устойчивого отказа realtime при работающемHTTP должны идти3→6→12→30s сjitter. Старая формула min(wait×2,30000) давала3→6→12→24→30. Новый шаг wait<12000?wait×2:30000 исправляет только этот интервал. Jitter по-прежнему применяется однократно к независимой базовой задержке; lifecycle/сигналы/права/Singleflight этим diff не меняются.

Текущий расширенный ChatLifecycleTests наблюдает actual mock-transport request counts за1ms ДО каждого deadline и в сам deadline3/6/12/30/30; пятьDisconnected не создают пятьтаймеров. После Subscribed+HTTPcatchup60s безidlepolling. Это не статический snapshot массива констант.

Независимый причинный контроль: из currentFeedSync одной заменой восстановлена old53ab формула. SHA3d363f9ab467455ebd7e3ec8e2a8c9fbbee98bd2256fe5b38d65894b53d8be9a точно совпал с сохранённым r3source-before. В отдельной/tmpкопии текущие assertions наoldruntime дают1FAIL: expected10/actual11 настроке121 (лишний запрос24s до нового30s deadline). [OriginalXML](evidence/old-control-junit/TEST-dev.groupplanning.android.feed.ChatLifecycleTests.xml) иlog сохранены, MAIN не менялся. На currentruntime тотже регрессионный casePASS и общийactualunit194/194/0skip изcleancheck.sh.

Первый UIbootstrap не запустил ни одного producttest: старое описание изолированногоdebughome далоcert414f, тогда как принятыйr3/installedQAhost имеет7829. ИсходныйFAIL сохранён вbootstrap-0-tests. Новые ключи/uninstall/cleardata не использовались. Две QApackage задачи пересобраны за6s ссуществующимdefaultdebugstore7829. Publiccert сверён ДОповтора. Все492/85неподписныхZIPmembers побайтно равны прежнемуnew-code APK; unit/DebugReleaseLint не повторялись радиподписи.

Fresh broad279 plan создан до currentunit. Correct-key retryplan создан до новыхUIactions сточнымиAPKhash; cachedrequiredunitwrapper явно отделён отactual194check. 279 — границапокрытия, не279ручныхPASS. ФинальныйUIрезультат будет вreportпосле завершения единственного реальногоall87+2. Новыеprofile/onboarding/manualdesignflows по поручению пользователя сегодня не начинаются.
