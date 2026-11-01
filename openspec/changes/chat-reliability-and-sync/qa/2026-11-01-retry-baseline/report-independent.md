# Независимый серверный baseline chat1.5

01.11.2026. Исполнитель/reviewer `/root/sdd_server_audit` не писал проверяемый
storage/service backend. Runtime, catalog, CI и production не менялись.

**Вердикт: quantitative criterion task1.5 выполнен.** Новый feature plan
PAGE/LOOKUP создан до действий, свежий required backend-unit-integration выполнен
через qa:run-suite после plan с GOFLAGS=-count=1. qa:ready: 2/2, pending[].
Checkbox оставлен родителю. Это не приёмка capacity7.2 и client budgets7.9.

| Измерение | Memory p95, мс | Изолированный PostgreSQL16 p95, мс |
| --- | --- | --- |
| 54 конфигурации страниц ×20 | 0.000–0.046 | 0.304–2.794 |
| 18 конфигураций настоящих service retry ×20 | 0.260–13.606 | 0.739–2.617 |

Страницы: 1k/10k/100k × limits1/50/100 × initial/after-zero/empty-tail/
before-first/before-tail/around. Всего2160 page samples. Memory проверяет точные
размеры, ASC/contiguous sequence, hasMore/tail/anchor; SQL probe проверяет bounds,
order, empty edges, budget100ms. Memory page время округлено до микросекунд:
0.000 означает измерение меньше одного микросекундного деления, а не нулевую цену.

Повторы: ещё720 фактических вызовов Service.SendMessage/PublishMediaWithCaption
на text/photo/file до и после31d receipt expiry. Ровно один feed lookup и одна
возвращённая запись; fullFeed запрещён; исходная identity/attachments сохранены.
Измерение включает application/transaction/lookup/decode. Memory transaction
copy влияет на наблюдаемое время; его нельзя объявлять константной ценой всего
service path. Новые SQL raw18EXPLAIN проверяют физический budget1; stock21 page
plan checks проверяют индекс и физические bounds1/51. Это feed rows/bounds,
не счётчик всех metadata reads базы.

Ранее независимые функциональные PAGE/LOOKUP действия на том же source412
сохранены с исходными timestamps в `independent-feature/evidence/prior-functional-case-results.json`.
Они не объявлены повторно исполненными сегодня позже. Этот plan дополняет их
новыми количественными действиями; свежий required suite также проверил текущие
границы/copies/rollback/rights. Старый root AUTHOR_ONLY не повышен сам по себе:
новые memory и SQL процессы исполнились отдельно.

## Ресурс и очистка

Binary SHA256 `54052818b390b3308d56d452b21dbe345025fdbbb3e1779c48af6671b70a5ac0`.
Новая пустая somewhere_integration имела marker
`somewhere_sdd_retry_independent_20261101_63d4698eb0bb` и nonsuper owner
somewhere_migrator. Три узких SQL top-level tests завершились PASS, exit0,
75.14s вместе с SSH/upload/prechecks/cleanup. Полный stockPG не запускался.
Name/owner/marker проверены перед actions и DROP; remaining0. Собственный
загруженный executable удалён после проверки SHA. Production health/ready200,
backend PID88760/caddy3465 и NRestarts0 до/после совпали. Backend/contracts412/412
hashes неизменны.

Первая попытка загрузки была отклонена auto-review как недостаточно явно
разрешённый export производного приватного кода; процесс не стартовал. Затем
пользователь явно разрешил именно `/tmp/somewhere-sdd-retry-independent/retry-page.test`
на свою VM158.160.246.254, synthetic ownDB и cleanup. После этого повторён только
разрешённый export. Авторизация/граница отражены в resource plan; другие данные
и исходники не передавались.

## Evidence

- `independent-feature/plan.json`, `run.json`, `qa-ready.log` — formal gate.
- `independent-feature/evidence/{memory,sql}.log` — raw actual runs, планы/замеры.
- `independent-feature/evidence/interaction.json` — конкретные actions/команды;
  `summary.json` — счётчики, ranges, cleanup/source parity.
- `independent-feature/evidence/{resource-plan,sql-exit,binary-cleanup,source-before}.json`.
- `independent-feature/evidence/required-suite.log` и `suites/` — свежий count1 suite.
- `independent-feature/evidence/overlay.json`, `retry_baseline_test.go`,
  `memory_page_latency_test.go` — внешний QA code, backend files не редактировались.

Физические клиенты, реальный OAuth, end-to-end latency, горячая встреча/lock wait
и Telegram здесь не проверялись и не заявлены PASS.
