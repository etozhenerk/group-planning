# Read-only SDD-аудит серверной части и выпусков

Дата: 01.11.2026. Checkout: `/Users/misha/Documents/Codex/projects/group-planning`, HEAD `3d3723b7`. Код, Git, CI, облако, production и документы проекта не менялись. Прочитаны AGENTS/startup docs, tasks и исходные отчёты; выполнены `git status`, OpenSpec list, чтение кода и Git history. Новые live-проверки и продуктовые приёмки не проводились. Ниже перечислены **все 39 открытых checkbox** в порученной области (32 deployment + 4 gathering14 + 3 остальных).

Все пути ниже относительно checkout. `done-with-evidence` относится к точному критерию задачи, а не к готовности MVP. Отчёты 25–26.10 не считаются текущей приёмкой rc15/rc6. Владелец принял web5.0.0 и разрешил выпуск rc15; owner exception не QA PASS и не release receipt.

## Точные ссылки на основные доказательства

- E1 — [смета](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/cost-estimate.md:54>): старт/рост, ресурсы и допущения; A/B/C и ставки — строки 79–190; внешние платежи — с229. Проверены и пересчитаны в [planning verification](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/planning-verification.md:19>).
- E2 — [design](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/design.md:169>): цели/API/задачи/RPO/RTO/окна, измерения по операциям/модулям и нагрузочная методика; managed-триггеры с215, процедура переноса с494. Разделение 14.1 (задать цели) и14.4 (измерить) явно в [ADR0003](</Users/misha/Documents/Codex/projects/group-planning/docs/architecture/0003-modular-monolith.md:164>).
- E3 — [storage-design](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/storage-design.md:8>): PostgreSQL16/pgx5.11, собственная SQL-очередь против River/Message Queue, модель/транзакции/миграции/конфигурация/acceptance. Решение перенесено в [gathering design](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/gathering-activity-feed/design.md:611>) и [architecture decisions](</Users/misha/Documents/Codex/projects/group-planning/docs/architecture/decisions.md:114>).
- E4 — [postgres verification](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/postgres-verification.md:15>): реальная изолированная PostgreSQL, concurrency/lease/receipts/rollback/restart/restore; ограничения с41; реальный OAuth/web и restart с85.
- E5 — [deployment verification](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/deployment-verification.md:36>): SA/SG/Lockbox, закрытые порты, backup/S3, 4панели, budget и тесты. С56 прямо: payload приложения не загружен; с113 явные непринятые проверки.
- E6 — [monitoring live](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/monitoring-live-verification.md:59>): реальная private probe/timer/метрики; с94 отказовые учения, алерты и фактическое billed usage не приняты. 470custom рядов с54; добавлять API без сокращения нельзя.
- E7 — [native notifications](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/native-notifications-verification.md:112>): последний записанный blocker — provider mute, Alarm→OK без доставки. Важно: срок мьюта в отчёте **до01.11.2026 02:00 МСК**, поэтому его текущая активность неизвестна; дата окончания не доказывает восстановление. Новых проверок нет.
- E8 — [bot live](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/telegram-monitoring-bot/live-verification.md:61>): реально закрытая RC3-функция и Lockbox, но Telegram transport failure/async PermissionDenied; локальная отправка не доказывает облачную; remaining blockers с84. Финальный раздел прямо сохраняет собственную3.1 открытой после выбора штатного бота.
- E9 — [release-policy implementation](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/release-version-policy/implementation.md:33>): agent:check/strict/diff-check и локальные артефактные проверки выполнены; production/store границы с74. [Старое verification](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/release-version-policy/verification.md:40>) держит6.2 исключительно из-за ещё не сохранённого общего web-пакета. `git log` показывает сохранение `ServiceFooter`, `AboutContent`, `shared/config/version.ts`, `tests/31-release-identity.spec.ts` в **daeefe5d** (main), инфраструктура в6189f73; дальнейшие коммиты уже публиковали web. Это устранённый Git-blocker, не требование полной приёмки соседнего редизайна.
- E10 — [component verification](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/component-releases/verification.md:34>): unsigned iOS/test-key Android и отсутствие реальных подписей; [first releases](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/component-releases/first-releases.md:90>) не заявляет mobile store-релиз.
- E11 — [rc15 deployment](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/qa/2026-10-29-web-rc15-tagged-deployment/report.md:1>) и [rc6/rc13](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/qa/2026-10-29-tagged-release-rc6-rc13/report.md:1>): tagged published artifacts/activation/smoke, полная приёмка отдельно. Backend8 migrations unchanged.
- E12 — [store dependencies](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/store-release.md:85>): удаление аккаунта, moderation, Apple4.8. [Account tasks](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/account-deletion/tasks.md:1>) ещё не завершают клиентскую приёмку; specs согласованной модерации/альтернативного Apple-входа в активных changes отсутствуют.
- C1 — [database.go](</Users/misha/Documents/Codex/projects/group-planning/backend/internal/storage/postgres/database.go:20>): DSN pgx/TLS и bounded pool; [postgres docs](</Users/misha/Documents/Codex/projects/group-planning/backend/docs/postgres.md:20>) и перенос/rollback после записей с80. Адресная смена/TLS live не проверены.
- C2 — [deploy-release.py](</Users/misha/Documents/Codex/projects/group-planning/infra/host/deploy-release.py:111>): реальное systemd/symlink activation и отказ unsafe rollback; наличие кода не заменяет репетицию возврата в временном окружении.
- C3 — [host backup docs](</Users/misha/Documents/Codex/projects/group-planning/infra/host/README.md:85>): автоматический ежедневный экспорт на независимый узел прямо не включён; [metrics](</Users/misha/Documents/Codex/projects/group-planning/infra/monitoring/metrics.md:83>) и [observability-plan](</Users/misha/Documents/Codex/projects/group-planning/openspec/changes/deployment-and-store-release/observability-plan.md:3>) обозначают API instrumentation планом.

## Deployment-and-store-release: открытые задачи

| ID | Категория | Основание / оставшийся точный критерий |
|---|---|---|
|1.1|real-work|Таблица в E2:58 — распределение областей, а не сверка фактической авторизации/приёмки14.1–14.5 с владельцами и результатами. Нужна сверка; приёмка14.5 отсутствует.|
|1.3|real-work|Решение/смета перенесены (E1–E3), но достижимость RPO/RTO/API/worker не измерена; реальные Apple/Google платежи не подтверждены. Не закрывать по плановым ставкам.|
|1.5|real-work|E12: deletion specs есть, приёмка клиентов открыта; согласованных moderation/Apple4.8 решений и проверок нет.|
|2.1|implementation-done-acceptance-missing|Адаптеры и миграции есть (E4,C1), но задача явно требует полный отчёт14.4; он отсутствует.|
|2.3|implementation-done-acceptance-missing|Пакеты/SHA/systemd/установка есть (E10,E11,C2), но живой возврат предыдущего совместимого backend+web в временном окружении не доказан. Локальное переключение web fixtures изE9 не проверяет systemd/backend.|
|2.5|implementation-done-acceptance-missing|DSN/TLS/CA/роль/пул и будущая процедура реализованы (E3,C1,E2:494); нет live смены адреса/TLS и полного reconnect/retry сценария без смены API. Не требуется выполнить managed migration.|
|3.3|real-work|SA/SG/адресные права есть (E5), внешние порты закрыты. Для приложения Lockbox payload/fetch и отказ чужой учётной записи не приняты; OAuth вE4 передан в защищённый env напрямую. Успех Lockbox у отдельного бота не доказывает этот критерий.|
|3.4|real-work|Backups/retention/S3/synthetic restore есть; независимый ежедневный экспорт отсутствует(C3), полного прикладного restore актуального внешнего backup/RPO/RTO нет(E4,E6).|
|3.5|real-work|UA/PG/панели есть(E5,E6); OTel/logs, complete worker/API signals, retention и полный overhead не приняты/не подключены.|
|3.6|real-work|ACTIVE3950/50/80/100 зафиксированы(E5:84); forecast/подтверждённая доставка и сверка реальных начислений/остаточных ресурсов не доказаны. Исторический provider mute(E7) требует актуализации.|
|3.7|external-blocked|Последний зафиксированный live-блокер — provider mute(E7). Это исторический blocker с истёкшей плановой датой: сначала перечитать состояние, затем Alarm/OK/No data + fault drills/доставка. Полный набор отказов и anti-storm тоже не принят.|
|3.8|implementation-done-acceptance-missing|Private minute probe с limits работает поE6; выключенная VM/agent, DNS/TLS, отказ самой probe и actual billed usage не проверены, алерты freshness/success не подключены.|
|3.9|real-work|API/worker OK/Bad/4xx/429/inflight/histogram/UA instrumentation остаётся планом(C3). Метрики probe не заменяют middleware и API histograms.|
|4.1|implementation-done-acceptance-missing|Same-origin dist + deep links/OG/server invite реализованы и частично провереныE4; для текущего rc15/rc6 E11 только smoke, полной актуальной матрицы routes/HTML нет.|
|4.2|implementation-done-acceptance-missing|Реальный OAuth/web/check/build/E2E есть исторически(E4), но нет полного целевого cookie/CSRF/cancel/inviteReturn/message matrix на нынешнем кандидате.|
|5.1|external-blocked|Действующее платное Apple membership/team/роль/ASC и валюта/дата оплаты не подтверждены(E10,store-release:7).|
|5.2|external-blocked|Release scripts/origin/version/unsigned archive есть(E10), реальных distribution identity/profile и валидированного signed device archive нет.|
|5.3|external-blocked|Нет signed candidate/ASC/TestFlight beta approval и физических установок/обновлений(E10).|
|5.4|real-work|Store privacy/support URLs/анкеты/реальные store screenshots/reviewer access остаются preparation поstore-release:7; опубликованная сервисная справка не полный store dossier.|
|5.5|external-blocked|Нет Apple approval/public release/install; ещё1.5,5.1–5.4. Поручение выпустить web не разрешает отметить store approval.|
|6.1|external-blocked|Play Console active account/оплата/verification не подтверждены; задача требует действий/подтверждений владельца(E10).|
|6.2|external-blocked|Скрипт принимает signing; только одноразовый тестовый ключ(E10), нет store key backup/Play Signing/Yandex real fingerprints.|
|6.3|external-blocked|Локальные Android checks не проверяют internal track/install/update/real release auth; нужен6.1–6.2(E10).|
|6.4|real-work|Нет полного Play listing/Data safety/reviewer setup; удаление должно быть реально принято(E12), не только ссылка наchange.|
|6.5|external-blocked|Нет closed test12x14days и решенияGoogle production access. Это не устраняется локальным кодом.|
|6.6|external-blocked|Нет production access/review/store URL/установки и rollout control.|
|7.1|external-blocked|RuStore account + настоящий согласованный ключ и store dossier отсутствуют(E10,store-release:71).|
|7.2|external-blocked|Нет moderation approval/RuStore publication/install/update/Yandex signature verification.|
|8.1|implementation-done-acceptance-missing|Реальные три клиента/профили/старые поддерживаемые builds + API/DB/worker restart/end-to-end deadline matrix не приняты(E4).|
|8.2|real-work|RPS/7дней budget/30дней availability — цели и методика(E1,E2), не результаты; нет подходящего полного load/observation отчёта.|
|8.3|real-work|Полная capability verification сейчас выявит незавершённость; нет финального полного отчёта по каждой платформе/магазинам. Локальные structural checks не закрывают критерий.|
|8.4|real-work|Владелец/ритм/триггеры/миграционный runbook описаны(E2:215,494), но журнала времени/инцидентов, разбора примеров триггеров и шаблона новогоchange с проверкой нет.|

## Gathering-activity-feed, группа14

|ID|Категория|Основание / точный критерий|
|---|---|---|
|14.1|done-with-evidence|Это оценка/цели/план измерений: E1 содержит старт/рост/API/очередь/файлы/traffic/backups/monitoring и расчёт, E2 — SLO/окна/операции/модули, E1planning — исходная проверка арифметики/публичных ставок. ADR0003:164 прямо оставляет фактические исходные показатели14.4. Не расширять14.1 требованием уже пройденной нагрузки/достигнутогоRPO. Нужна короткая связка этих источников в отчёте родителя; смета датирована24.10, перед новой покупкой обновляется вdeployment1.3.|
|14.2|done-with-evidence|Пользовательский выборA/PostgreSQL/5000, сравнениеRiver/SQL/MQ, версии, SQL-модель, transactions/migrations/plan зафиксированыE2/E3 **до** адаптеров; ссылка и выбранная SQL-очередь уже внесены вgathering design:611 иtasks. Deployment1.4 уже закрыт именно по этому критерию. Новые cloud drills не нужны для принятия проектирования.|
|14.4|real-work|Частичное функциональное real-DB подтверждениеE4 не покрывает load/fault baselineADR0003, актуальные внешние backup/RPO/RTO, полный мониторинг и сигнализацию(E5–E7,C3).|
|14.5|implementation-done-acceptance-missing|Нет финальной real-Yandex трёхклиентной матрицы/совместимости + фактическогоresource/budget comparison(E4,E11). Store publication не добавляю к исходному критерию14.5.|

14.3 уже [x], не переоткрывалась этим аудитом. Существование SQLадаптера подтвержденоC1, `backend/internal/storage/postgres/{meetings,identity,transitions,migrations}.go` и8SQLмиграциями; это не pass14.4.

## Остальные открытые задачи

|Change / ID|Категория|Основание|
|---|---|---|
|telegram-monitoring-bot3.1|external-blocked|E8: реквизиты уже получены, private functionRC3 развёрнута, но asyncPermissionDenied/Telegram egress timeout, Monium chain/Alarm/OK/No data/VM/DB/self-failure не приняты. ВыборштатногоYandexбота **не superseded**: финальный разделE8 прямо сохраняет task открытой. Текущая доступность внешнего канала не перепроверялась.|
|component-releases4.1|external-blocked|Задача объединяет реальные Android/iOSstore релизы и bot delivery; ни mobile signing/store, ни cloud delivery нет(E8,E10). Частичные backend/web/monitoringRC закрывают только4.2.|
|release-version-policy6.2|done-with-evidence|E9 фиксирует нужныеagent:check/strict/diff проверки; единственный заявленныйblocker(общийwebпакет ещё не вmain) снятGitкоммитомdaeefe5d, поляversion/test tracked вmain. Можно закрыть после текущих финальныхпроверок родителя и обновления устаревшегоverification/implementation, сохранив границыhistoricalfixture vsproduction/store. Приёмка полногоweb5.0.0 для этого инфраструктурногоcheckbox не требуется.|

## Реально закрываемые пункты без расширения критериев

**gathering14.1, gathering14.2, release-version-policy6.2.** Это планирование/проектирование и финализация сохранённой реализации release-policy. Приложить вышеназванные ссылки/commit и текущие structural/diff checks. Не закрывать ни одного новогоdeploymentcheckbox, bot3.1 или component4.1 по этому аудиту. Новых `superseded` нет: историческое восстановление ручныхтегов отменено отдельно, но не отменяет критерииdeployment2.3. Старые successfultests не переносить в новыйQAreceipt.
