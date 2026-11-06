# Web QA setup — vibe/account-service/final

Это QA tooling, не product pass. App/эталоны/manifests/tasks не меняет. `scope.json` содержит короткий план, `case-inputs.json` —76 применимых web кейсов с исходными steps, `source-inventory.json` —27 хешированных входов подготовки. Снимок входов не заменяет fresh context следующего frozen candidate.

Основа: tests/helpers.ts, helpers/albumExport.ts, trustedTouchGesture.ts,51-album-stack-cycle,52-album-touch,59/60-album-download(-access),49-service-navigation; raw vibe-r3 gesture/motion drivers. Synthetic color squares из старого seed заменены реальными friends/boardgame/dinner PNG из approved vibe-r3. API seed — только подготовка своего memory-fixture, не acceptance upload/create.

`harness.mjs`: frozen/source guard; disk aggregate/live entry binding с учётом backendHTML metadata; Chromium/WebKit/locale/TZ; isolated login/CSRF/API/photo seed; screenshot/computed; pointer/CDPtouch; scoped known/lostACK fault; ZIP Store/CRC/name/SHA integrity. Никаких production URL. `run-prepared.mjs` выполняет базовую часть прохода; remaining-steps.json явно оставляет upload/save/privacy/desktop/manual spot непройденными. Для полноценного короткого checkpoint агент продолжает реальные действия, как сохранено в ../r1/remaining.mjs и spot-final.mjs. Не ставить общий pass только по базовому driver.

Из корня:

```sh
node openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/web/setup/run-prepared.mjs --plan
QA_FROZEN=1 QA_CANDIDATE=<exact-candidate.json> QA_BASE_URL=https://127.0.0.1:9132 QA_OUT_DIR=<assigned-QA-dir> QA_REFERENCE_URL='http://127.0.0.1:9130/openspec/changes/mobile-mvp-design-refresh/preparation/references/vibe/frame.html?platform=web&state=ready' node openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/web/setup/run-prepared.mjs
```

Нужны от root: frozen-source сообщение, точный candidate/dist/hash и scope delta/финального набора; для следующего account-service — его frozen publication/candidate. Runtime не строит приложение. Во время freeze делается только read actual/authority и запись assigned QA. При hash change остановить старую проверку.

Свои сервисы: reference9130, R1app9131, R2app9132. PID/log записаны отдельно в `reference-process.json`, `app-process.json`, `app-9132-process.json`; это наши процессы, чужие не останавливать. R1 immutable dist и отдельные реальные наблюдения сохранены. При новой ревизии запускать отдельный origin/store либо явно остановить свой старый процесс; не подменять dist под работающей приёмкой.

```sh
node openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/web/setup/start-owned.mjs reference
QA_PORT=9133 QA_FROZEN=1 QA_CANDIDATE=<candidate> QA_BASE_URL=https://127.0.0.1:9133 QA_OUT_DIR=<assigned-QA-dir> node openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/web/setup/start-owned.mjs app
node openspec/changes/mobile-mvp-design-refresh/qa/vibe-checkpoint-7.13.0/web/setup/stop-owned.mjs <exact-owned-process-record.json>
```

Проверено при реальном R1 checkpoint: Chromium+WebKit launch,3photo API seed, pointerrollback/cycle/touchcancel, chooser/partial/failed-onlyretry, nativeZIP+CRC/SHA, outsiderprivacy403 и desktop. Это подтверждает запуск инструментов; продуктовые результаты относятся только к соответствующим report/hash. Первую ошибку старого inputlabel и ранние loading screenshots сохранили; текущий driver ожидает loaded image и idle/resetfalse, использует «Файлы для альбома».

Account-service: новый отдельный проход profile full/missing/photo fallback, privacy-only-public identity, logout-last/no-delete-editor, FAQ state/focus/scroll, same-panel support-section Back/cancel, Aboutmetadata/no duplicate links, privacy/Cookie reader and return. Реальные сообщения поддержки не отправлять; только изолированный fixture при явно согласованном scope. Final: новый общий exact candidate и полный согласованный case/profile mapping; эти checkpoints не заменяют design:ready/qa:ready/release receipts.
