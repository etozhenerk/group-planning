# Внешний QA-контроль границы epoch

Только внешний Go-overlay, ни один backend/runtime файл в MAIN не менялся. Binary SHA e91e58687719007636f63423a85a973372b20dd220d5f6c0eb390818ac70f59f; source inventory отдельно от413candidateinputs. Первый epoch-only вариант сохранён/tmp/epoch-only-v1. Root независимо прочитал реальнуюStore.Update/transaction реализацию и оба отдельных delta; функциональный UIрезультат этим code-review не объявлен.

Внешний дополнительный файл memory вводит только QAметод: существующий stream, oldepochguard, реальный clone+lock+commitStore.Update, замена одногоEpoch. История,markers,journal,outbox,counters не меняются. Callbackfixture route доступен только с privateheadernonce на loopback, не входит в cmd/server/обычную сборку. Regression проверяет wrongheader404/wrongepoch409, actualsignedoldcursor410, новый authorized aroundsnapshot и прежниеentries/sequence, anonymous401.1/1racePASS до и после clockdelta.

Отдельный identityclock — atomic2h offset толькоidentity.New.Now. OS/meeting clocks прежние. Это реальное истечение по identityauth, а не HTTPподмена401. Control.py печатает толькоstatus/action; nonce не вGit/evidence. Создаётся заново в own0600/tmp файле при воспроизведении; не братьproductioncredentials.

Liveowner sdd_clients_audit использует отдельный ownfixture8538 и exactcurrentwebartifact. Оба existingfeatureplans созданы до действий. UIflow: oldhistoryresponse захвачен вepochA, actualStore→B, oldcursor410, realauthorizedsnapshotB сaround, durablepending+реальныйanchor≤2, позднийoldhistorydiscard поwindowguard. FeedDTO не содержитepoch; это старыйhistoryrequest, не параллельныйsyncDTO. Singleflight не обходится.

НикакойSQL/облака/Telegram/production;fixture останавливает толькоегоliveowner. ПодробныйactualUIрезультат будет отдельным последующим evidence, до него F6step2 остаётсяBLOCKED.
