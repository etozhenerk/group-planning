# Verification Report: deployment-and-store-release

03.11.2026, основной агент, навык openspec-verify-change. Это документальная
сверка8.3: она не объявляет незавершённые проверки успешными и не разрешает выпуск.
Прочитаны обе delta capabilities, proposal/design/tasks и перечисленные результаты.

## Summary

| Dimension | Результат |
| --- | --- |
| Completeness | Сопоставлены18 ADDED requirements и33 сценария; REMOVED/RENAMED нет. После закрытия самой сверки10/39 tasks выполнены,29 остаются открытыми. |
| Correctness | Реализация/доказательства найдены для компонентов ниже; недостающие части каждого целого требования перечислены явно. Новый live cloud/OAuth/physical/store/TG прогон не выполнялся. |
| Coherence | Go/API и клиентские UI разделены; версии/секреты вынесены в конфигурацию. Найдено устаревшее историческое описание design.md, см. WARNING. |

Точные названия всех33 сценариев и SHA specs — [requirements.json](requirements.json).
«Частично» означает незавершённое целое требование, а не PASS.

## Service operations: все13 требований

| Требование | Реализация/имеющееся доказательство | Остаток целого критерия |
| --- | --- | --- |
| Расширение стартового диска без потери данных | infra/yandex/main.tf, deployment-verification.md, backup.py | Не подтверждён полный resize раздела/ФС с backup и проверкой БД; запрет replacement сохранён. |
| Постоянный защищённый адрес | domain-https-verification.md, qa/2026-11-01-public-web-path/report.md | HTTPS/deep links проверены ранее; реальный OAuth/invite return остаётся4.2/8.1. |
| Сохранность подтверждённых операций | backend/docs/postgres.md, server-open-task-audit | SQL/atomicity/components приняты; полный live restart/deadline/failure14.4 не закрыт. |
| Проверяемое восстановление | qa/2026-11-01-backup-restore/report.md, infra/host/backup.py/pull-backup.py | Копия восстановлена отдельно; whole-VM RPO/RTO и весь прикладной набор не подтверждены. |
| Совместимый управляемый выпуск | infra/host/deploy-release.py, scripts/release/build.py, docs/releases.md | Механизм версий/readiness/rollback есть; вся предыдущая mobile-матрица не проверена, выпуск исключён. |
| Контроль состояния и расходов | cost-estimate.md, infra/yandex/services.tf, native-notifications-verification.md | Пороги/конфигурации есть; доставка50/80/100 и новые внешние платежи не подтверждены; Telegram исключён. |
| Наблюдаемая нагрузка и отказ мониторинга | monitoring-live-verification.md, infra/yandex/probe.tf | Панели/UA/probe есть; полный failure набор и overhead/global cardinality остаются3.5/3.8. |
| Качество API и классификация трафика | qa/2026-11-01-http-metrics/integration.md, observability-plan.md | Локальный exporter принят; текущие cloud panels, low sample/no-data и global≤500 не приняты целиком. |
| Вместимость подтверждается измерением | design.md, postgres-verification.md | Нет полного PostgreSQL staircase5/10/20/50+60min и7/30-дневных окон. Плановые RPS не названы пределом. |
| Управляемое изменение размещения PostgreSQL | infra/host/operations-journal.md, templates/managed-postgresql-change.md, qa/2026-11-01-maintenance-runbook/independent-review.md | Регламент/триггеры/7дней/сохранение новых записей проверены в8.4; реальный перенос сейчас не требуется и не выполнялся. |
| Дополнительные изображения в уведомлениях | design.md, infra/yandex/telegram.tf | Опциональное расширение не условие MVP. Live Telegram/429/fallback исключены текущим поручением. |
| Бизнес-показатели без персональных данных | business-metrics.md, monitoring-live-verification.md, infra/host/test_business_metrics.py | Постоянный login counter/агрегаты и экспорт приняты ранее в3.10; нового live-прогона03.11 нет. |
| Подтверждённая доступность площадки | deployment-verification.md, infra/yandex/main.tf | Историческое создание в зоне d подтверждено; текущая квота/новое выделение не проверялись, будущая готовность не обещана. |

server-open-task-audit —
`openspec/changes/meeting-experience-refresh/qa/2026-11-02-server-open-task-audit/report.md`.
Остальные короткие отчётные пути в таблице относятся к этому изменению.
Прежние результаты имеют исходные даты; они не переименованы в новые запуски.

## Client distribution: все5 требований

| Требование | Найденная реализация | Остаток / исключение |
| --- | --- | --- |
| Проверяемая сборка для распространения | scripts/release/build.py, iOS Config/Release.xcconfig, Android app/build.gradle.kts | Store/device artifact, подпись/обновление/TestFlight не доказаны simulator build; выпуск исключён. |
| Совместимый вход после установки | SDK-настройки и инструкции клиентов | Локальная SDK-проверка не доказывает OAuth с фактической подписью магазинного артефакта. |
| Раздельный допуск магазинов | docs/releases.md и отдельные группы5/6/7 tasks | Apple Program подтверждена пользователем; новая Team/ASC не проверены. Play/RuStore доступа нет; review не выполнялся. |
| Выполненные условия публичного выпуска | account-deletion/tasks.md, meeting-experience-refresh/tasks.md, design.md | Account-deletion14/14 завершён, но UI удаления намеренно скрыт. Это не store-путь; privacy/moderation/Apple4.8 остаются отдельным допуском. |
| Управляемое обновление | docs/releases.md, deploy-release.py | Runbook различает mobile distribution/backend rollback; фактическая остановка распространения и следующая подписанная версия не проверены. |

## Готовность платформ

- Backend: постоянные адаптеры/SQL/sync/read компоненты приняты ранее; аудит
  не закрывает14.4, lock wait, полную нагрузку и disaster restore.
- Web: текущие231 unit и адресные Chromium/WebKit PASS. Это не production
  cookie/OAuth smoke4.2 и не новый release gate.
- iOS:215 unit, чистые simulator Debug/Release/analyze и адресные UI PASS.
  Физический iPhone/новая Team/ASC/device archive не проверены.
- Android:197 unit/Debug/Release/Lint ранее03.11 и свежие QA UI PASS.
  Фактические store-signing/устройство/публикация не проверены.

## CRITICAL — до архивирования

29 оставшихся задач включают незавершённые live/store/runtime условия выше.
Релизы и Telegram исключены пользователем, а не объявлены выполненными.
Срок7дней пилота/availability30дней не заменяется несколькими часами тестов.

## WARNING

design.md/Open Questions сохраняет ранние формулировки «домен ещё купить»,
«адаптер предстоит реализовать», «Monium — проект», тогда как последующие
датированные отчёты фиксируют реализацию. Перед следующим инфраструктурным
изменением сверить эту историческую часть с фактической топологией; не удалять
старые доказательства. Новых решений о БД/очереди и новых тарифных выводов нет.

## Final Assessment

Сверка8.3 завершена с перечисленными непроверенными условиями и предупреждением.
Изменение не готово к архивированию. Новый production/store/whole-client PASS
не заявлен. agent:check, OpenSpec strict и diff-check выполнены при фиксации.
