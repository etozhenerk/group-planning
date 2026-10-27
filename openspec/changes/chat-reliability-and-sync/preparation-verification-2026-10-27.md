# Проверка подготовки технического этапа

27.10.2026. Применены openspec-update-change и test-spec. Область работы —
план, требования и каталог приёмки chat-reliability-and-sync; код приложений,
продуктовые тесты, runners, UI 2.1.0 manifests/reports и production не менялись.

## Подготовлено

- Разрешённый технический объём записан в proposal/design/tasks/protocol;
  E2EE не объявлено решением пользователя, отдельное crypto-решение сохранено.
- Первый срез: web receive cursor, bounded memory/SQL Reader и адресные text/media
  retries с сохранением доступа, precision, отмены и snapshot consistency.
- testing.md, checkpoint manifest и mapping всех 43 задач: 40 продуктовых,
  3 обоснованных исключения для read-only инфраструктурного отчёта,
  локальной упаковки и сверки SDD. Все checkbox остаются открытыми.
- 50 кейсов: 46 стабильных ID сохранены, 4 добавлены. Уровни — 4 unit,
  32 integration, 14 E2E; статусы planned/manual, health unknown, без pass.
- Кейсы event-feed только этого change перенесены в chat-reliability-feed.yaml.
  Сравнение JSON до/после подтвердило неизменность всех 323 чужих кейсов.
  config меняет только регистрацию этого manifest и его legacy disposition;
  source entries четырёх specs уже существовали. Чужие изменения сохранены.

## Проверки подготовки

| Проверка | Результат |
| --- | --- |
| npm run qa:check | PASS: 373 cases, gaps=[]; не функциональная приёмка |
| npm run qa:test | PASS: 12/12 тестов QA tooling |
| npm run agent:check | PASS: OpenSpec/инструкции/ссылки |
| npm run --silent openspec -- validate chat-reliability-and-sync --strict | PASS |
| git diff --check для затронутых файлов | PASS |
| Mapping task/case/platform и сравнение чужих cases/config | PASS |

Исторический planning-verification.md от 25.10.2026 не переписан. Будущие
qa/acceptance/plan.json и run.json не созданы: ещё нет наблюдаемого окружения
и независимого прогона этой реализации. Новые планы строятся на финальном
каталоге; глобальный catalog hash не позволяет переносить прежние результаты.

## Не проверено

Web ACK race пока статически обоснована, runtime-воспроизведение предстоит.
Основной агент отдельно подтвердил два существующих Go feed invariants за
0.349s; это не baseline новых портов, SQL, производительности или web.

Не запускались новые Reader/sync/read/outbox tests, SDK spike, SQL migrations,
cloud EXPLAIN, realtime faults, latency/memory/frame и новые клиентские UI.
Для SQL нужны существующая изолированная somewhere_integration и тестовые
DDL/runtime доступы. Для SDK — публичные packages/toolchains и pin после spike.
Физические устройства и новый read UI-контракт проверяются отдельно;
недоступное остаётся blocked, а не пропущенным pass. Local DB/Docker и
production не требуются для первого web/memory среза и здесь не запускались.

Следующий шаг — openspec-apply-change в уже разрешённом объёме, начиная с
1.1/4.1 и параллельно 1.5/2.1/2.2. Новые UI-состояния сохраняют + modal/sheet,
native long press и текущие inline-карточки, требуют собственной публикации
контрактов и независимой приёмки; UI 2.1.0 не переоценивается этим отчётом.
