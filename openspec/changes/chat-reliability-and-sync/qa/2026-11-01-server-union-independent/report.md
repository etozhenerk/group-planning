# Независимая серверная квалификация current413

По предварительному union-плану36: **36 PASS,0 BLOCKED**; вся фича и все платформы не приняты. Серверный runtime, cases, каталог и задачи исполнитель не редактировал. Основной агент отдельно провёл criterion review и канонические scoped gates для целых пунктов.

## Фактический текущий проход

Один required backend-unit-integration после плана:274top-level PASS,31явный SKIP (SQL/долгоживущие fixture opt-in),race/count1. Внешние независимые HTTP/service probes:35top-level PASS,3явных SQLopt-in SKIP,121PASS сsubtests. SKIP не переименованы вSQLPASS. [Raw](feature/evidence/runtime.jsonl), [команда/время](feature/evidence/runtime-receipt.json).

API:82schemas/38fixtures;567реальныхHTTPответов соответствуютOpenAPI. Первый sandbox api:test завершился EPERM loopback доHTTP, исходныйfail сохранён/tmp; неизменённый разрешённыйloopbackповторPASS. Собственные независимые HTTPtranscripts:255bodies,252validatedschemas+3expectedclosed404. [Контракт](feature/evidence/actual-http-contract.json).

12meetingcasechecks: profileprivacy/absence,cutoff/legacy/concurrentreschedule,participantSummary,reactions,media/album/filecleanup/accessrevocation; fakeprovider и управляемое доменное время. Не realOAuth/UI. Каждый шаг в [meeting interaction](feature/evidence/meeting-interaction.json). Публичные поля иусловия permissions сверены с [Яндекс ID](https://yandex.ru/dev/id/doc/ru/user-information); реальныйgrant не проверялся.

Chat: восемь READ и old-card projection с конкретными per-stepactual в [первой части](feature/evidence/chat-interaction.json); остальные15в [продолжении](feature/evidence/chat-remaining-interaction.json). Свежие20current production clientowner/cache integrationrulesPASS дополняют through/cursor/storage-apply failure/oldprojection/20hints, без browser/IndexedDB/nativeUIclaim.

## Дифференциальная SQL-квалификация

С412до413 изменился только QA iOS RSVPfault route и добавился его regression. Все10compiled productionarchives побайтно совпали; [архивы/BuildID](feature/evidence/compiled-dependency-parity.json). Пересобранные из413Linuxbinaries побайтно равны реально исполненным ранее01.11:stockPG384028..., realtime1a780..., retry/page540528.... [ExactSHA иoriginalraw](feature/evidence/sql-differential-qualification.json).

Это квалификация неизменной реализации, **не новое SQLизмерение после плана**. Исходные даты cloudfull75.586s и chatprocess14:14:42–14:15:01Z сохранены. В original100k:activation2.931ms,unreadquery43.955ms,receipts20samplesp95=2.245ms. Ограниченные pages/retries/EXPLAIN, crashbefore/afterpublish,noNOTIFY,lease/rollback,account/meetingterminalhint,writerrollback/newEpoch происходили на собственныхmarkedcloudDB, которые уже удалены;productionPID/restartsне менялись. НовуюDB этот проход не создавал.

CAPABILITIES дополнительно квалифицирует прежние actual2Chromium на сохранённом253fileartifact:404/disabled→solelegacyfeed/send/retry,0readUI. Их даты и hashes остаютсяпрежними. CurrentHTTPproductionarchive побайтно тотже; это не свежийbrowserrun и не общий PASSтекущеговеба.

## Целые критерии и остаток

Основной агент принял meeting2.1–2.6/3.1–3.5 по12/12currentchecks. Chat3.3 и затем2.3/2.5/3.1/3.4/3.5 приняты по своимmappedcases иполнымисходнымкритериям; 1.5/2.1/2.2/2.6/3.6 получили currentqualification. Канонические gates сохраняет основной агент вmeeting-experience-refresh/qa/2026-11-01-sdd-reconciliation/.

TC-CHAT-SYNC-F6CFB5E9 step2 закрыт конкретным совместным actual GUI: [final proof](feature/evidence/f6-final-interaction.json), [UI report](feature/evidence/f6-joint/report.md). Настоящий StoreepochA→B, старыйcursor410, authorizedsnapshotB вокруг видимойстроки; durablepending/newdraftсохранены. Поздний historyresponse эпохиA действительно доставлен послеB (fulfill+requestfinished,failed=null), окно50/108..157 иякорь неизменны. Resetdelta0.6875px/0px, latedelta0px/0px. ПослеreleasePOST одинcanonicalсоstablekey. Снимки просмотрены независимым серверным ревьюером; код метода иraw проверены. ЭтоHISTORY DTO безepochполя, не параллельныйsyncDTO. Singleflight не обходился.

Первый2PASSGUIконтроль имелcatchflag/offlineнеоднозначность; он отдельно сохранён вinitial-ambiguousZIP и заfinaldiscardproof не принят. Исправлен только QAметод; приложение/ожидания/таймауты неизменны. Originalunion35/1 [сохранён](feature/run-before-F6-35-pass-1-blocked.json). Готовыеwhole-taskкандидатыдляrootcriterionreview:chat2.4/3.2/7.1/7.3. Whole7.2 остаётсяopen:hotmeeting/lockwaitquantitativebudgetне измерены.

Negative A91проверяет честностьнеподтверждённыхcrypto/backupclaims, не даёт PASSшифрованию/восстановлению. Условные native/webkeystore/quota/очисткаUI не выдаются за backend-проход. Текущаямодельчитаеттекстнасервере, E2EEнезаявлено.

## Окружение и очистка

Все свежиеAPI/protocolclients synthetic,fakeprovider,loopback; ownhttptestзакрыты,memorydiscarded. НиTelegram/релизов/stores/productionwrites, ниSQLrerun/устройств. Before/final413/413MATCH. [Финальныйотпечаток](feature/evidence/source-final.json). Format/gofmt/vet/build/dependencies/storage-demoPASS current413; [точныеcommandenvelopes](feature/evidence/static-checks-current413.json). AgentcheckPASS.

Совместный GUIfixture впоследствии нормально завершён владельцем: [final cleanup](feature/evidence/f6-joint/cleanup.json), exit0/нет listeners8537/8836; identity-only QAclock уничтожен вместе с ownprocess. Дополнительных прогонов не было.
