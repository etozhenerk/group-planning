# Независимая backend-приёмка после возобновления · 28.10.2026

**Результат: 24/24 backend case проходят; обязательный backend-unit-integration
проходит.** Независимый исполнитель: `/root/backend_independent_resume`.
Это feature-проверка серверной части, не release receipt и не приёмка клиентов.
Код, ожидания, каталог, manifest, tasks и прежние отчёты исполнитель не менял.

## Кандидат и метод

Свежий [plan](plan.json) создан до выполнения проверок. В нём закреплены текущий
каталог, source hash и фактическое API-окружение. Исходный MAIN:
`0fb96472e5ed24c3eac004f5e69e7e8d211cd757`, включая уже внесённое исправление
удаления большой истории и test-only cross-provider fixture.

Production source SHA256:
`3a3816f7d71b858a5d5e98a7e510ecb6da4c9f57188db5a9b44247bb2da9d96f`.
Независимо сверены 214 production inputs и повторно вычислен aggregate;
проверены 390 original snapshot files и 13 дополнительных probes:
[source integrity](source-integrity.json), [candidate](candidate.json).
Пропущенных non-test Go/module/SQL/embedded-emoji файлов нет.

Запускался отдельный snapshot текущего продукта. Ранее подготовленные probes
и методика использованы без ослабления ожиданий; результаты, бинарники,
временные данные, времена и hashes получены заново. Локальный API использовал
production handlers, настоящие HTTP/WebSocket соединения и synthetic identity.
Яндекс OAuth этим проходом не проверяется. HTTPS fixture `127.0.0.1:57276`
закреплён в плане; probes открывали собственные изолированные loopback-порты.

Go 1.27.2, macOS 27.0.1 arm64, `GOMAXPROCS=1`, `GOFLAGS=-p=1`;
в обязательном suite принудительно задан `-count=1`. SQL — два заново собранных
Linux amd64 test binary на разрешённой ВМ 158.160.246.254, только отдельная
пустая БД `somewhere_integration`, без production данных и локальной БД/Docker.

## Свежие результаты

- Обязательный `backend-unit-integration`: `go test -race ./...`, exit 0;
  [run](run.json) содержит исходный suite log с SHA256.
- Независимые runtime probes: 24 верхнеуровневых теста, 37 pass с subtests;
  три локальных skip — SQL/process child helpers. SQL parent выполнен отдельно,
  child запускается им, локальные skip не выдаются за SQL pass.
- Дополнительный адресный проход штатных HTTP/service/memory tests:
  11 верхнеуровневых тестов, 26 pass с subtests. См.
  [runtime](runtime.jsonl), [supplement](supplement.jsonl) и receipts рядом.
- SQL: 16 верхнеуровневых tests и отдельный process restart test — pass.
  Bounded plans, read state, миграции, atomic journal/outbox, lease/retry,
  retention, copies, sparse uint64 и rollback проверены на свежей БД.
- Все 54 feed page p95 комбинации (1k/10k/100k × limit 1/50/100 × 6 queries)
  прошли: **0.321–2.803 ms**, бюджет 100 ms, по 20 измерений.
  Read-state 100k unread p95 — **57.456 ms**, budget 100 ms.
- Прежний дефект `QA-SQL-CLEANUP-100K-001` не воспроизведён: обычная очистка
  всех latency fixtures успешна. Отдельный regression удалил 100001 запись
  с разреженными sequence и MaxUint64: rollback сохранил данные; commit
  удалил целевую историю/reactions и сохранил другую встречу. 202 batches
  на rollback+commit, max_rows 1000, max_statement **10.479 ms**.
- SQL crash/restart: PID60753 exit73 после commit; API PID60758 прочитал delta1;
  PID60763 exit74 после publish; PID60768 без NOTIFY повторил тот же event
  и acknowledged/deleted=4. После account/meeting deletion новый PID60774
  доставил durable terminal hint, acknowledged=3. Старое имя и private state
  не вернулись. [Исходный SQL log](sql/sql-live.log), [receipt](sql/receipt.json).
- Controlled offline=300s + явное исчерпание broker history: 100 изменений
  без дублей/дыр, RTT150ms recovery **633.87775 ms**, бюджет 2 s.
  Snapshot/subscribe gap и HTTP catch-up после успешного broker recovery
  отдельно проверены. Это управляемое время, не пять минут wall-time.

Действия, expected/actual и точные свежие selectors для каждого из 24 case:
[interaction](interaction.json). Raw catalog records: [cases](raw-cases.json).
Новые дефекты в пределах этого набора не обнаружены. Старый failed report
сохранён с исходными hash; новый результат его не переписывает.

## Границы результата

Эти 24 backend case **не закрывают** capacity/commit→render p95/p99 из
validation-plan, общий пользовательский release, UI/анимации/скролл/иконки,
500 ms видимости, anchors, ограничения смонтированных строк, клиентский
outbox/IME/процессную смерть, реальный мобильный lifecycle, TLS/прокси production
или приложения на физических устройствах. Go protocol client не заменяет
Centrifuge SDK каждого frontend. Выключенные capabilities проверены на текущей
совместимой схеме; старый production binary и downgrade схемы не запускались.

Security case про неподтверждённый backup — свежая проверка честности
документации, **не новый restore drill**. Сервер читает текст; E2EE, disk/key
lifecycle и restore текущего кандидата этим прогоном не подтверждены.
[Security audit](security-audit.json) сохраняет hashes прочитанных источников
и отличает исторический age/mechanism evidence от текущей проверки.

## Очистка и gate

Перед созданием облачной БД проверено отсутствие одноимённой БД; own nonce
проверен перед удалением, `FORCE` не применялся. Собственная БД и каталог с
двумя бинарниками удалены, оба подтверждения есть в SQL receipt. Собственный
локальный fixture остановлен, приватный credential config удалён:
[local cleanup](local-cleanup.json). Другие reviewer/user процессы не тронуты.

`qa:ready` проверяет свежие source/catalog/evidence и все 24 результата;
исходный вывод сохранён в [gate](qa-ready.log). Task checkboxes, release receipt,
production release и миграции в production остаются обязанностью основного
исполнителя и этим отчётом не заменяются.
