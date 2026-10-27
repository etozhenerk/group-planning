# Независимая backend-приёмка c789

Кандидат `c789772bce4e3af45e47ade9a68cd10b7d9dee0c`. Вердикт: **не готово**. 15 passed, 2 failed, 7 not_run (частично пройдены, оставшиеся действия перечислены). Это feature-план; готовность whole change/release не заявляется.

Проверяющий не менял приложение, требования, кейсы, план или suite. Исходники извлечены git archive в `/tmp/chat-backend-final-independent-c789`; `source-integrity.json` подтверждает неизменность всех исходных файлов. Добавлены только собственные test probes. Go1.27.2, race/count1, GOMAXPROCS1, GOFLAGS=-p=1. HTTPS fixtures сsynthetic OAuth, memory.Store; WS loopback. Клиентские UI и real OAuth не проверялись.

## Блокирующее наблюдение

QA-PLAN-SHAPE-001: TestFeedBoundedQueryPlansIntegration/1000/{entry,intent} rejects Bitmap Heap Scan with child Bitmap Index Scan; actual rows1 loops1 removed0,0.022ms. Required SQL test failed. No evidence of unbounded product scan; verifier needs reviewed correction and fresh run, keeping row/time budgets.

Фактический SQL на существующем проектном хосте: binary SHA256`ac308f714c93bf886f20d8be18792ead19c47a7ced70578d904436126c1fb58b`; nonce-marked isolated `somewhere_integration`; production не затрагивался. SQLrun exit1, temporary DB и directory удалены (receipt). Все chat SQL checks прошли; unread p95=28.335ms, receipts p95=1.569ms при100k/20samples. Feed p95 не измерялся: EXPLAIN single execution не distribution.

Первоначальный upload был отклонён auto-review из-за неподтверждённой доверенности назначения/разрешения. Root собрал read-only destination-proof и прямую авторизацию, повтор разрешён и фактически выполнен. Активного permission blocker нет.

## Ход и ограничения доказательств

`interaction.json` содержит по каждому case действия, expected/actual, raw logs и оставшийся scope. Финальный `run.json` записывает эти же факты. Passed относится только к backend-обязанностям; клиентский merge/visibility/storage не переносится из backend-тестов. Предыдущие verdicts не использовались.

Начальный HTTPprobe упёрся в sandbox bind запрет; разрешённый loopback повтор прошёл. Первый supporting aggregate встретил duplicate declaration: существующий independent probe уже был в candidate; удалён только мой дополнительный дубликат изtmp, final-probes passed39 top-level tests. Первый mixed probe использовал boundedStore для SetReaction (эта немигрированная операция вне bounded read-scope); исправлен только probe fixture на обычныйStore, r2 прошёл. Исторические логи не переписаны; эти два harness issues не обозначены product failures.

После конкретного SQL verifier finding root поручил завершить текущий отчёт и освободить слот для исправления проверки и нового кандидата/прохода. Поэтому incomplete cases имеют not_run, а не выдуманный pass/blocked по доступу.

## Кейсы

|Case|Статус|Actual / оставшийсяscope|
|---|---|---|
|TC-CHAT-READ-STATE-068DA926|passed|150 во всех ответах, projection_version не меняется, sync пуст, list unread0, canonical receipt1; fault откатил marker/journal/outbox. |
|TC-CHAT-READ-STATE-99A5AEEE|passed|422 для недопустимых значений,403 после revoke/outsider,401 после удаления; MaxUint64 допустим только для реально существующей записи в отдельном sparse fixture. |
|TC-CHAT-READ-STATE-284DD6EE|passed|Unread2→1→0; first_unread первый→второй→пусто; poll/system/reaction/own не увеличили count. |
|TC-CHAT-READ-STATE-8A47BDBD|passed|10k baseline10003 actual0 unread0 согласно observed commit; receipt0. Legacy first authorized read initializes once безjournal/hints; unauthorized/continuation не создают stream; оба access barriers403. |
|TC-CHAT-READ-STATE-5869F951|passed|Count остался1 после join, вырос2 только после PUT; baseline/actual разделены. |
|TC-CHAT-READ-STATE-51E51F41|passed|Actual сохранён, unread98, first_unread у первой новой записи, list98; reactivation repeated не сбрасывает значения. |
|TC-CHAT-READ-STATE-EC05E2CA|passed|103→101, removed IDs отсутствуют; HTTP saved cursor после deletion исключает C и count2→1; bounded receipt query проходит. |
|TC-CHAT-READ-STATE-E32551D3|passed|Empty count0;403 для неавтора/outsider/mixedforeign,100 accepted/101422, uppercase canonicalcount1, mixedcase duplicate422. |
|TC-CHAT-PAGE-BOUNDS|failed|QA-PLAN-SHAPE-001: TestFeedBoundedQueryPlansIntegration/1000/{entry,intent} rejects Bitmap Heap Scan with child Bitmap Index Scan; actual rows1 loops1 removed0,0.022ms. Required SQL test failed. No evidence of unbounded product scan; verifier needs reviewed correction and fresh run, keeping row/time budgets. SQL shape verifier failure не маскируется. PAGE дополнительно требует page p95 distribution (нынешнийfeed test только EXPLAIN; unread/receipts p95 отдельно20samples). LOOKUP нужен завершённый photo/file/legacy-captionless independent coverage после исправления verifier.|
|TC-CHAT-SECURITY-791FF479|passed|ЗапрещённыеOrigin403, ambiguous credential401, connect spoof101, foreign subscription103; cookie/native connect успешны; read mutation безCSRF403. |
|TC-CHAT-SECURITY-0E0CB54C|not_run|Соединения закрылись3503; отдельный полный reconnect/lateHTTP после обоих вариантов не завершён. Повторное подключение после expiry/revoke и явный late callback protocol-probe. Прогон остановлен после concrete SQL verifier finding по поручению root; отсутствие доказательств не pass.|
|TC-CHAT-SECURITY-1DC708F2|not_run|Meeting unsubscribe2003 безpublication, recovery103; terminal personal доставлен; revoked read/send403. Нужен единый задержанный HTTP sync между hint и завершением ответа с воспроизводимым барьером. Выполненные независимые части сохранены; полныйcase не принят.|
|TC-CHAT-SECURITY-6DD0CC09|passed|В guest проекции нет MyOptionIDs/votes/voters; послеclose votes присутствуют. Journal/hints безтекста/имени/invitation, unread учитывает только сообщения. |
|TC-CHAT-SECURITY-A91C53BB|passed|security.md явно отделяет подтверждённый age job от неподтверждённых disk/key lifecycle. Этот QA не выполнял restore текущего кандидата и не заявляет backup/E2EE pass. |
|TC-CHAT-SECURITY-BDBF283F|not_run|Исполненные checks не нашли message text/cursor/private read fields вlogs, журнал не копирует text/name/token. Независимый полный capture timeout/reconnect/storage-sync fault diagnostics с synthetic credential markers ещё нужен. Native/web storage вне backend-плана и не подтверждено здесь.|
|TC-CHAT-SECURITY-A3B3BFE7|not_run|Выполненные memory/SQL проверки проходят, удалённыеIDs/names не возвращены, terminal pending survives. Единый сценарий active subscriptions + удалениеM + фактический restart API/dispatcher наSQL не выполнен; fresh pool не выдаётся за process restart.|
|TC-CHAT-SYNC-5EFD24A6|passed|Стараякарточка закрыта/итог доступен; journal replay current RemovedAccountName и historyinvalidated. Client stale-merge исключён из backend verdict. |
|TC-CHAT-SYNC-BC07BEB1|not_run|HTTP bounded catchup подтверждён; совмещённый protocol scenario и RTT150ms timing не измерены. Нужен protocol-client пробелsubscribe, 5min controlledoffline/100changes и зарегистрированный RTT150ms recovery benchmark.|
|TC-CHAT-SYNC-AA76CADB|not_run|Части прошли: stableevent duplicate, rollback безmessage/change/hints, SQLreopen state, recoverable queuebound. Не выполнен фактический отдельный процесс API/dispatcher наSQL с faultbarriers доpublish/послеpublish и lostNOTIFY; freshpool недостаточно для полногоcase.|
|TC-CHAT-SYNC-F6CFB5E9|passed|HTTP400 invalid_sync_cursor и410 sync_reset_required сrequest_id; fresh snapshot возвращает entries. Revoked service403 доparse; retention не удаляет историю. |
|TC-CHAT-SYNC-14D92D7D|passed|HTTP31d повтор201 тотжеID/sequence, changedbody409; service ownactor samekey отдельная запись, revokedrepeat403. Client ACK-validation внеbackend. |
|TC-CHAT-IDEMPOTENCY-LOOKUP|failed|QA-PLAN-SHAPE-001: TestFeedBoundedQueryPlansIntegration/1000/{entry,intent} rejects Bitmap Heap Scan with child Bitmap Index Scan; actual rows1 loops1 removed0,0.022ms. Required SQL test failed. No evidence of unbounded product scan; verifier needs reviewed correction and fresh run, keeping row/time budgets. SQL shape verifier failure не маскируется. PAGE дополнительно требует page p95 distribution (нынешнийfeed test только EXPLAIN; unread/receipts p95 отдельно20samples). LOOKUP нужен завершённый photo/file/legacy-captionless independent coverage после исправления verifier.|
|TC-CHAT-SYNC-THROUGH|passed|100/5 заканчиваетсянаT, повторlastpage samecursor/count5, следующийцикл ровноT+1. Backend выдаёт воспроизводимыйcursor; atomicclientmerge не заявляется. |
|TC-CHAT-CAPABILITIES|not_run|ВыполненныеHTTP/service проверки проходят; точный rollback artifact не запускался. Schema-exact oldwriter compatibility и новыйepoch после периода безjournal требуют отдельного текущего runtime доказательства. Документационное пояснение не runtimepass.|

## Очистка

Собственные httptest servers закрыты через cleanup. Root-ownedfixture57321 не менялся и не останавливался. SQLDB/tempdir удалены guard-скриптом. Локальный archive snapshot/testbinary оставлены вtmp для воспроизведения; это syntheticfixture и исходники, credentials туда не копировались. Конфигурацияfixture0600 читалась только для структуры (значения не печатались/не сохранялись вGit).

## Gates

`qa:ready` выполнен после записи всех24checks: exit1, Functional acceptance incomplete (2failed+7not_run). `agent:check` passed; `git diff --check` для каталога приёмки passed. Suite backend-unit-integration вrun.json сохранён без изменений; его cache status не использован как независимый ручнойpass.
