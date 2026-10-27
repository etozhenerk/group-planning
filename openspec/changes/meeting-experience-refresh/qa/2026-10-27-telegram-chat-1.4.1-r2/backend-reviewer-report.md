# Независимая функциональная проверка API · r2

Результат: **14 passed, 2 blocked, 0 failed** из 16 backend-пар текущего плана. Это независимые ручные API-пары с воспроизводимыми executable HTTP-действиями, не повышение automation статуса.

План: `b6858d722d87becaa58b273effe6aa3bfa4b899e25f8b5ce9ff1efc280fc2c58`. Общий source hash до/после: `d22e90bda6696076f61e6fa9ac7b1cb539a69a204f02f779774f862e60ec6f38`. Backend: `795189a0aa41e4ae332d3aaec4adcec0b4f9331b3323d07af9fa76537697b807`. Commit: `6e69ae85755e7e8c5bc51854befabd9f21c46504`; рабочее дерево содержит согласованные незакоммиченные изменения; исходники проверяющий не менял.

Среда: go version go1.27.2 darwin/arm64, macOS 27.0.1; отдельные TLS loopback fixtures с memory.Store, явными UTC-часами и синтетическими профилями. URL динамические, действуют только во время httptest; никакие live UI fixtures не затронуты.

Свежий run03: 2026-10-27T14:37:15.170867+00:00–2026-10-27T14:37:20.380723+00:00, exit 0. GOMAXPROCS=2, -p 1, -race, -count=1: 13 групп; 268 фактических JSON-ответов проверены по текущему OpenAPI, ещё 4 закрытых/несуществующих маршрута дали ожидаемые 404. Полный backend suite родителя не повторялся.

## Результаты

| Case | Статус |
| --- | --- |
| TC-API-PROFILE-PRIVACY | passed |
| TC-API-RSVP-CUTOFF | passed |
| TC-API-RSVP-LEGACY | passed |
| TC-API-PARTICIPANT-SUMMARY | passed |
| TC-API-REACTION-IDEMPOTENCY | passed |
| TC-API-MEDIA-LIMITS | passed |
| TC-API-MEDIA-PUBLICATION | passed |
| TC-API-MEDIA-ACCESS | passed |
| TC-API-ALBUM-PAGINATION | passed |
| TC-API-SUPPORT-ACCEPTANCE | passed |
| TC-API-MEDIA-DURABILITY | blocked |
| TC-API-SUPPORT-DURABILITY | blocked |
| TC-SUPPORT-2B1C9FBF | passed |
| TC-PROFILE-4F3DAAFE | passed |
| TC-PROFILE-3E5EFE8D | passed |
| TC-PROFILE-F319B092 | passed |

## Ограничения

Нет согласованного изолированного постоянного окружения для этапа 7.2, подтверждённых migration/GRANT/backup, квот и проверенного отката. Задание запрещает БД/Docker/deploy; memory/file fixture не удовлетворяет предусловию. Миграция, рестарт постоянного адаптера, восстановление backup и откат не выполнялись.

Нет постоянного support adapter/очереди, утверждённых сроков хранения/очистки и отдельного разрешённого тестового канала этапа 8.9. backend/docs/support.md прямо фиксирует memory queue и HTTP 503 в PostgreSQL-режиме. Реальная отправка запрещена заданием; рестарт постоянной очереди и retention не проверены.

Реальный Яндекс OAuth, старые мобильные бинарники, постоянная БД/очередь, backup/restore, облако и реальные уведомления этим прогоном не проверены. Fake-provider использует настоящий декодер Yandex; Telegram adapter использует закрытый mock transport. Эти границы предусмотрены raw backend-кейсами.

## Доказательства и история запуска

[Проверки для объединения](backend-reviewer-checks.json) имеют SHA256 evidence. [Разбор каждого action/expected/actual](backend-reviewer-evidence/case-review.json) связывает все шаги с текущими tests/HTTP transcripts. Go JSONL и snapshots verifier сохранены в backend-reviewer-evidence/run03; контракт — openapi-run03.json/log.

run01 сохранил отказ sandbox на loopback bind до первого HTTP-действия. Тот же runner с разрешённым loopback прошёл run02. После добавления явного чтения feed/album для отвергнутой публикации выполнен свежий run03; прежние результаты и snapshots сохранены. Из двух публичных cover-response evidence удалены только тела с синтетическим invitation capability URL после контрактной проверки, оригинальные SHA256 остались (privacy-filter.json).

Продукт, кейсы, эталоны, tasks, manifest и общий run.json не редактировались. Overlay создаёт виртуальные test-файлы и не меняет hashed input tree. Все собственные данные очищены; secret/private config из .cache не читались. Финальные npm run agent:check, git diff --check, проверка схемы checks и сверка всех SHA256 evidence прошли.
