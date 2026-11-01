# Read-only SDD audit: chat-reliability-and-sync

01.11.2026. Checkout `/Users/misha/Documents/Codex/projects/group-planning`, main HEAD `3d3723b7` (web rc15/backend rc6, outside-keyboard handlers из 17fb80e8). Все 43 checkbox открыты. Прочитаны AGENTS/startup docs, change artifacts, четыре delta-spec, testing/manifest, отчёты и выбранный код. Новые тесты/QA/UI/cloud/CI не запускались. Репозиторий не редактировался, untracked evidence сохранены.

`done-with-evidence` означает выполненное самостоятельное действие, а не перенос исторического feature PASS на текущий hash. `implementation-done-acceptance-missing` означает присутствующую реализацию при незавершённой текущей независимой приёмке. `real-work` — конкретное отсутствующее действие/измерение либо подтверждённая ошибка. Ни одна исходная задача целиком не superseded/external-blocked; отдельные устаревшие отчёты superseded, физические устройства непроверены.

**Можно закрывать непродуктовый read-only аудит 1.3. Историческое действие 1.1 выполнено, но его нынешний product mapping/gate остаётся непройденным. Остальные исходные whole-task checkbox закрывать по прежним hashes нельзя.** Backend и все3 клиента существенно реализованы; отсутствие текущего gate не означает отсутствие кода.

`testing-manifest.json` ссылается на `qa/2026-10-28-backend-fixture-final/{plan.json,run-fresh.json}`, source 631d726c/catalog 1110fd0c. Последний абзац tasks.md явно повторно открывает 2.1–3.6 после support persistence. Rc6/rc15 и новые source/catalog/design входы этим plan не приняты. Owner exception выпуска не QA PASS.

## Evidence index

Все пути от `/Users/misha/Documents/Codex/projects/group-planning/`. В E1–E14 префикс `C/` означает `openspec/changes/chat-reliability-and-sync/`; в D1–D3 `M/` означает `openspec/changes/meeting-experience-refresh/`.

- E1: `C/qa/2026-10-27-web-cursor-baseline/report.md`; рядом `run02/network.jsonl`, `run02/actual.json`, `run02/playwright.log`, `run02/harness/cursor-race.spec.ts`; green `green-candidate-15bf46c/report.md`.
- E2: `C/qa/2026-10-27-sdk-spike/report.md`; рядом versions.json, maven-licenses.json, npm-licenses.json, go-module-licenses.json, swift-source-lock.json, evidence/{js-result.json,java-result.json,swift-result.json}.
- E3: `C/qa/2026-10-27-runtime-topology/report.md`; рядом probe.json/local-evidence.json; выводы опубликованы в `C/security.md`.
- E4: `C/qa/2026-10-28-web-window/virtualization-spike.md`; рядом tanstack-spike/{results.json,anchor-results.json}, virtuoso-spike/results.json, regression/report.md, checkpoint/report.md.
- E5: `C/qa/2026-10-27-bounded-storage-sql/run02/report.md`; независимый `C/qa/2026-10-27-bounded-storage-review/report.md`.
- E6: `C/qa/2026-10-28-backend-fixture-final/report.md`; рядом plan.json/run-fresh.json/interaction.json/clean-copy-verification.json/sql/receipt.json. Исторический24/24 feature PASS source 631d.
- E7: `C/qa/2026-10-28-capacity/report.md`; hot-run03.json/hot-run03-proof.json/distributed-run01.json/memory-diagnosis/report.md рядом.
- E8: `C/qa/2026-10-28-web-outbox-owner/report.md`; candidate03-result-summary.json/candidate03-files.json рядом.
- E9: `C/qa/2026-10-28-web-read/report.md`; final/{candidate.json,results.json,integration.json} рядом.
- E10: `C/qa/2026-10-27-ios-runtime/report.md`; candidate.json/runbook.md рядом; `C/qa/2026-10-27-ios-storage-contract/report.md`.
- E11: `C/qa/2026-10-27-android/core/engineering-summary.md`, core/device-run01/report.md, `C/qa/2026-10-27-android/read-state/checkpoint.md`.
- E12: `C/qa/2026-10-28-native-suite-fixes/report.md`; ios/final-artifacts.json/android/final-artifacts.json рядом; первый полный независимый `C/qa/2026-10-28-ios-full-independent/final/triage.md`.
- E13: `C/qa/2026-10-28-web-resume/report.md`; cross-run10/summary.json, ios-final-source-parity.json, cross-final-web.json рядом.
- E14: `C/qa/2026-10-28-web-independent-resume/status.md`; recheck/remaining-findings.json явно historical.
- D1: `M/qa/2026-10-29-ios-current-live/report.md`; source-after-check.json/design-scoped-review.json/evidence-hashes.json рядом.
- D2: `M/qa/2026-10-29-web-ci-current-demo/report.md`; environment.json рядом. Исторический Base262PASS+1SKIP/Chat36PASS.
- D3: `M/qa/2026-10-29-keyboard-outside-web-independent/defect.md`; design-review.json/interactions.json/freeze-verification.json/actual/reference рядом. Android narrow `M/qa/2026-10-29-keyboard-outside-android-independent/functional-result.json`.
- D4: `openspec/changes/deployment-and-store-release/qa/2026-10-29-web-rc15-tagged-deployment/report.md`; owner-exception.json/owner-decision.json/published-manifest.json рядом. Backend `openspec/changes/deployment-and-store-release/qa/2026-10-29-tagged-release-rc6-rc13/backend-owner-exception.json`.

## Матрица 43 ID

| ID | Статус | Evidence и остающаяся работа |
|---|---|---|
|1.1|done-with-evidence|E1: frozen r8 реально воспроизведён, сеть/DOM/red assertions/regression сохранены; green companion существует. Исторический baseline завершён. Нынешний TC-CHAT-SYNC-2D68FE69 и qa:ready этим не приняты; при текущем mapping whole checkbox не закрывать без gate/разделения ниже.|
|1.2|implementation-done-acceptance-missing|E2 pins/licenses/auth/recovery всех 3 SDK; E9/E10/E11 app integration. Host spike не native runtime. Нет актуального полного four-platform mapped gate. Ранний SwiftPM limitation позже устранён E10.|
|1.3|done-with-evidence|E3+security.md: один API/MemoryBroker, backup age job, роли SQL, unknown disk encryption/key lifecycle честно записаны. Требование проверить существующие свидетельства выполнено; оно не требует создавать шифрование. Manifest уже exempt.|
|1.4|real-work|E4 доказывает TanStack против Virtuoso/focus/prepend/resize/anchor обоих браузеров. Нет полного сопоставимого native lazy baseline с текущими карточками/long text/keyboard/focus/anchor≤2 и выбранными параметрами.|
|1.5|real-work|E5/E6 SQL1k/10k/100k/plans/bounded rows/lookup есть. E5 явно исключает полный baseline старой реализации. Новые оптимизированные замеры нельзя задним числом назвать старым memory+SQL baseline.|
|1.6|real-work|Не найден полный UI baseline scroll/frame/memory/anchor/dynamic heights трёх платформ на опубликованных карточках. E7 heap серверный. Нужны device/build traces и10k проход.|
|2.1|implementation-done-acceptance-missing|Reader page/around/text intent/media lookup/copy/rollback есть, E5/E6 memory/SQL/access/uint64/lostACK/legacy. Current independent source/catalog gate отсутствует.|
|2.2|implementation-done-acceptance-missing|SQL reader/migrations/indexes есть; E5/E6 реальные isolated SQL EXPLAIN1k/10k/100k. Требуется актуальная независимая приёмка, без локальной БД/Docker.|
|2.3|implementation-done-acceptance-missing|Epoch/journal/atomic outbox memory+SQL; E6 commit/rollback/parity/no-op. Current gate отсутствует.|
|2.4|implementation-done-acceptance-missing|Snapshot/sync/through/invalidation/reset есть в backend/internal/meetings/chat_sync.go; E6 race/pages/expiry. Нужен current run.|
|2.5|implementation-done-acceptance-missing|Delete/anonymize/retention/terminal delivery есть; E6 SQL100001 sparse/maxuint64/отдельные процессы. Cleanup defect исправлялся, current gate не пройден.|
|2.6|implementation-done-acceptance-missing|OpenAPI/fixtures/backend README и E6 API/Go/legacy проверки есть. Нужны текущие обязательные suite+case gate.|
|3.1|implementation-done-acceptance-missing|Centrifuge cookie/Origin/native header/auth/limits/expiry/revoke есть; E6 actual SDK/HTTP safety. Current gate отсутствует.|
|3.2|implementation-done-acceptance-missing|Dispatcher retry/mock/durableSQL есть; E6 crash/restart/terminal/outbox, E7 memorycapacity. Нужен current independent fault mapping.|
|3.3|implementation-done-acceptance-missing|Отдельные baseline/actual markers/max/validation есть; E6 atomic/two positions/no false receipts. Current gate отсутствует.|
|3.4|implementation-done-acceptance-missing|Unread/first unread/receipts/readers есть; E6 100k unread p9539.396ms+permissions/membership/delete. Current gate отсутствует.|
|3.5|implementation-done-acceptance-missing|Private invalidation/receipts_changed/coalesce/no-op есть, E6 protocol PASS. Нужен нынешний backend gate; клиентский no-loop проверяется отдельно.|
|3.6|implementation-done-acceptance-missing|Contract/fixtures/flags/recovery/rollback/metrics docs есть, backend README/docs/chat-read-state.md. E6 uncached/API исторически PASS. Current gate отсутствует.|
|4.1|implementation-done-acceptance-missing|ReceiveCursor/sync projection owner есть, E1/E9 historical regression. Код frontend/web/src/entities/meeting/model/loadConversation.ts и entities/meeting/model/loadChat.ts + useChatUpdates.ts. Ранние F1/F2 не текущая доказанная leak без recheck. Current mapped gate отсутствует.|
|4.2|implementation-done-acceptance-missing|IndexedDB queue/WebLocks+lease/stable rows/quota/logout/collision/restore есть; E8 real red→42/42+18/18/unit172. Нужен current independent acceptance.|
|4.3|implementation-done-acceptance-missing|SDK/snapshot/catchup/reset/fallback/generation/cleanup есть; E9 SDK22/22/E13 cross. Новые handlers/source/catalog требуют актуального live gate.|
|4.4|implementation-done-acceptance-missing|Bounded/TanStack/around/autoload/anchor есть; E4/E9 window4/4/10k around/500server/200mounted. Поздние anchor fixes46cb9f22/15b6dbd3 требуют свежей приёмки. Frame/memory отдельно7.9.|
|4.5|implementation-done-acceptance-missing|500ms visibility/read/badge/divider/readers есть; E9 read6/6 двумя cookie actors. Many/pagination/accessibility/physical/full design прямо не приняты. Нужны текущие qa/design gates.|
|4.6|real-work|D3 подтверждает P2-WEB-COMPOSER-GROW: multiline composer не растёт, draft скрыт относительно raw. Плюс текущий полный independent feature/design/IME/skeleton gate отсутствует. Авторские211unit+outside6/6 и rc15 не заменяют его.|
|5.1|implementation-done-acceptance-missing|FeedOwner/ChatRepository AESGCM/Keychain/atomicfile/multiintent/cursors/ranges есть; E10 unit164/relaunch/lostACK, E12 latefixes. Hardware protectionKey skipped на simulator. Current full gate отсутствует.|
|5.2|implementation-done-acceptance-missing|SwiftCentrifuge exact remote/MainActor/lifecycle/recovery/fallback есть; E10 live subscription/background/revoke/draft. Нужен current fake+sim independent набор.|
|5.3|implementation-done-acceptance-missing|Bounded500/unread/nativeanchor есть; E12 stale anchor fix+≤2pt targeted PASS, E13 photo longpress/scroll fix. Full current cards/keyboard/rotation/ACK/anchor gate не пройден.|
|5.4|implementation-done-acceptance-missing|ReadOwner/ReadersOwner/badges есть; E10 API counterpart, D1 stable loading→empty. D1 не покрывает error/many/pagination/large text/VoiceOver/current context.|
|5.5|implementation-done-acceptance-missing|docs/chat-runtime.md и format/unit/UI/builds E10/E12 есть; D1 current scoped13PASS. Outside handler/current design требуют current full clean checks+independent gates; physicaliPhone отдельно.|
|6.1|implementation-done-acceptance-missing|Repo/Outbox Keystore/AtomicFile/noBackup/multiintent stableID есть; E11 JVM145+13real instrumentation, E12 JVM157. Нужен current independent queue/processdeath/storage/account набор.|
|6.2|implementation-done-acceptance-missing|JavaSDK0.8/Flow/lifecycle/snapshot/catchup/reset/fallback есть; E11 realTLS+live, E12 noidle12s/background/revoke. Full current mapping не принят.|
|6.3|implementation-done-acceptance-missing|Bounded500/LazyColumn/around/autoload/anchor есть; E12 dateheader inset fix, critical2/2≤3px на density3 (не превышает2dp). Нужен current full reverse/IME/resize/ACK/notailjump gate.|
|6.4|implementation-done-acceptance-missing|ReadController/ReadersSheet/badge/divider/500ms/focus есть; E11/E12 scopedlive/geometry. Current two-device/many/error/TalkBack/fontscale не приняты; narrow outside D3 не заменяет full.|
|6.5|implementation-done-acceptance-missing|docs/chat-sync.md и wrapper/format/Debug/Release/Lint/JVM157 E12. Нет current complete independent feature/design gate/physicaldevice result.|
|7.1|implementation-done-acceptance-missing|E6 backend24fault cases memory+isolatedSQL+17SQLtop-level/process restart PASS исторически. Source/catalog изменились; нужен exact current independent run.|
|7.2|real-work|E6 feed/unread≤100ms, E7 memory100clients hot/distributed15min+burst. Сам E7 оставляет7.2 открытым: SQLload/hotmeeting/lockwait/baselinecomparison не выполнены полностью. POST→catchup не render.|
|7.3|implementation-done-acceptance-missing|E3 honestsecurity/E6 auth/legacy/flags/reset исторически, rollback docs есть. Current candidate security/oldclient/rollbackepoch gate отсутствует.|
|7.4|real-work|E6/E8/E10/E12 historical source/artifact receipts и D4 publishedrc6/rc15 есть. Нет актуального независимого набора всех 4/local reproducibility/final enable+rollback instructions в конечном контексте. Store/deploy здесь не требуются.|
|7.5|real-work|Нет итогового current verification report/coherence4spec+UX/eventfeed reconciliation соседних изменений. Нужны current verify/strictvalidation/agentcheck/diffcheck; stale checkpoint не итоговый PASS.|
|7.6|real-work|E8/E9/D2 historicalgreen/E13 oldcrossPASS/D3 narrow currentoutside. Нет full current mapped independent Chromium/WebKit+qa/design gates; composer bug подтверждён. PhysicalSafari отдельно непроверен.|
|7.7|real-work|E12 сохраняет прошлый полный independent nativeFAILED; targetedauthor/D1 scoped13PASS не полный130cases current run. Нужны owner/storage/transport/full live matrix/gates, simulator/physical отдельно.|
|7.8|real-work|E11/E12 scoped checks не новый full independent Android suite; старый fullfailed сохраняется. Нужен current repo/storage/transport/full live mapping/gates, emulator/physical отдельно.|
|7.9|real-work|Нет общей commit→SQL→dispatch→HTTP→merge→render трассы3клиентов; E7 p95431ms/p99450ms — POST→HTTPcatchup/memory. Нет full offline5min100changes→UI≤2s/10k stablememory/framep95≤16.7ms/device/baseline1.6 comparison.|

## Подтверждённые ошибки и история

**P2-WEB-COMPOSER-GROW, D3**: SendMessage textarea rows=1/minmaxheight без autosize (`frontend/web/src/features/send-message/ui/SendMessage/{SendMessage.tsx,SendMessage.module.css}`). Независимо29.10: height46.5px desktop/44px mobile против scrollHeight69/87/109, часть multiline draft скрыта относительно raw. Текст/selection не теряются, внутренний scroll возможен. Outside handler не доказан причиной. Текущий main сохраняет этот textarea код; исправления autosize не найдено. Относится4.6/7.6, ownerapproved release не QA PASS.

Ранние cursorF1/F2 (`C/qa/2026-10-27-cursor-independent/report.md`) далее исправлялись (`C/qa/2026-10-27-cursor-fixes/report.md`); не объявлять нынешней leak. SQLCLEANUP100K исправлен и E6 исторически подтверждён. Старые clipping/category findings E14 historical; не переносить fail автоматически. Старый iOS negative/nonfiniteframe warning не доказывает нынешнюю ошибку: D1 четыре scoped warningfree bundles, полный путь ещё непроверен. Старый release-gap-audit про SQLsupport503 superseded новым adapter; SQLmedia имеет последующий `C/qa/2026-10-28-postgres-media-independent/report.md`, отсутствие проверки нельзя выводить из старого аудита.

## Честное разделение реализации и приёмки

Сохранить исходный ID как незакрытый parent со всем scope. Например4.2a «реализовать очередь/WebLocks/stablekeys» (код+E8),4.2b «исходные cases на currentartifact независимо, qa:ready»,4.2c «связанные UIstates designreview/designready». Parent4.2 закрывается лишь послеb/c. Implementation-only milestone не выдаётся за принятое поведение. Продуктовые case/platform mappings и знаменатели сохранить на acceptance/parent; классификацию подпунктов делать test-spec, без blanketexempt исходных продуктовых требований.

1.1: историческое «воспроизвести frozenr8, сохранитьred/regression» doneE1; актуальный regression с тем жеTC-CHAT-SYNC-2D68FE69 остаётся4.1/7.6 и/или отдельным acceptance-подпунктом. Это не основание объявить весь currentcasePASS. 1.3 уже корректно exempt; закрыть с E3+security.md, сохранив неизвестное неизвестным.

5.5/6.5/7.6–7.8: отдельно автопроверки, независимый browser/simulator/emulator runtime и physicaldevice. Только после фактической проверки доступности можно конкретный physicalподпункт назвать externalblocked. Историческое «не проверено» само не доказывает внешнюю блокировку сейчас. Не прятать доступную работу и bug за blocked целой платформы.

1.4–1.6/7.2/7.9: отдельные measurementrows baseline/after, memory/SQL, serverlatency/commitrender, platform/device/frame/anchor. E6/E7 сохранить historical; не переименовывать текущими и не подменять измерения сборкой/PNG/чтением кода.

Planning update выполнять openspec-update-change+test-spec с coherent tasks/manifest/testing/specs/UX. Этот аудит ничего в проекте не изменял.
