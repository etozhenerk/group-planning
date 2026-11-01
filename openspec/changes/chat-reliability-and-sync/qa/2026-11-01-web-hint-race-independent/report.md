# Независимая гонка hint/coalesce · исходный0502 · 01.11.2026

**FAIL: потеря обновления.** Проверяющий `/root/sdd_clients_audit`, исполнитель
`/root`. Root предложил проверить границу, но не предписывал вердикт; контроль
реального production createChatUpdates выполнен независимо, приложение не менялось.

SourceHash `0502df4668c2d687c87d1259a1701fbe949d0446dc4ba39b0ccfcd2385c171c9`,
bundle428787b74873d1a914e403428f7f879fd2f6bf02b034f26ca3c783c16d7eeb2d,
catalog84856. [Source-after](source-after-frozen.json):1033 inputs,0 различий
перед разрешением авторского исправления. Этот checkpoint остаётся историей.

## Воспроизведение

1. Subscribe ready начинает GET версии1 и удерживает его завершение.
2. Приходит hint версии2 в моментt=0; coalesce назначен на100ms.
3. Первый GET успешно завершается в50ms, до coalesce.
4. Проверяется состояние после1000ms: `calls=1`, `applied=1`, `remote=2`.
   Второй GET не произошёл. Ожидались2 вызова и применённая версия2.

Причина: healthy-success вызывает clearTimers, который отменяет pending
coalesce, пока dirty ещё не установлен таймером. Здоровый канал затем не
опросит HTTP самостоятельно, поэтому hint потерян.

Независимый [raw](hint-race.log), [timeline](hint-race.json), JSON результата
и exact test/config в harness.zip: **1 FAIL**. Это не timeout окружения.
Ревьюер передал минимальную рекомендацию; исполнитель отдельно выбирает fix.
Нужны обе границы раннего<100ms и позднего>100ms GET, stop/terminal cleanup.

## Незавершённая квалификация

32 свежих плана существовали до действий; technical profiles содержат фактический
Chromium156.0.8078.4/headless и backend413, без прежнего native metadata deviation.
Own8537 проверял тот же253-file artifact. [Live20](live20.log):20/20 PASS,
включая явный legacy disabled-capability cursor setup; timer6/6 PASS подтверждает
исправление прежнего fallback3/6/12/30, legacy3s, jitter и healthy/restart/stop.
Этот новый отдельный hint FAIL делает whole chat4.3 неприемлемым.

По поручению root адресно остановлен только собственный Playwright runner66813
через SIGINT. [Обязательный web-check](web-check.log):219 PASS. [Base E2E](web-e2e.log)
успел118 PASS,1 SKIP,1 interrupted,163 not-run; полный suite не завершён и не PASS.
Chat/read/window suites ещё не запускались. Orchestrator прекратился после
ненулевого exit и ничего зависимого не запустил. Служебное failed в partial run
означает interrupted suite, а не118 успешных тестов, объявленных полной приёмкой.
Fixture8444 штатно очищен; private trace сохранён только в/tmp, не опубликован.

Предшествующий8503 check-only FAIL был одной пропущенной пустой строкой ESLint.
После неё новый0502 bundle побайтово совпал; старые8503 raw не переписаны.
Первоначальные8503 cursor2 FAIL вызваны неверно настроенным legacy capability
предусловием, и сохранены отдельно. После явного QA setup без изменения assertions
текущий0502 live20 прошёл; это не подмена текущего runtime hint FAIL.

Checkbox/current canonical acceptance в этом checkpoint не менялись ревьюером.
Дальнейшая квалификация выполняется новым планом после настоящего fix и freeze.
