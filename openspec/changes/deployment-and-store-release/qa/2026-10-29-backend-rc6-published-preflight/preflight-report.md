# Backend rc6: опубликованный кандидат и фактические блокеры

Это preflight, не успешная релизная приёмка. Production не изменялся. Новые тесты и приложение не запускались; старые pass не переносились.

## Проверенный комплект

[Component releases run 40860977733](https://github.com/etozhenerk/group-planning/actions/runs/40860977733) завершил Validate source, Build backend, Publish и Summary со статусом SUCCESS. [GitHub Release backend/v0.1.0-rc.6](https://github.com/etozhenerk/group-planning/releases/tag/backend/v0.1.0-rc.6), id 427749972, published 2026-10-29T10:57:11Z, не draft.

Полные исходные три файла скачаны по browser_download_url из публичного Release в `/tmp/somewhere-backend-rc6-published`. Не пересобирались. SHA256SUMS, размер архива и идентичность manifest проверены. Дополнительно strict `scripts/release/common.py:verify` и совпадение аннотированного tag commit/card с manifest — PASS. Подробности — `artifact-verification.json`.

- Commit: `46cb9f2281489ebf8430a31b8e09f9319ce62a60`, build 9.
- Archive: `4f13ad664a04b3a962a98fc3d943f2377dd03d6191fd8edc1dc4affc02d31cd5`, 24 037 515 bytes.
- Manifest: `8b3b2d66d788e2a06855ab2be28713fd7dcf99272f71e4433c76fae93336f425`.
- Manifest CI checks: release-tooling, go-format, go-vet, go-race, host-metrics, dependency boundaries, API contract, artifact build.

## QA preflight

Текущий checkout/catalog уже включает следующий клиентский commit e813f45e. `qa:plan` backend требует все пять profiles: api, web-desktop, web-mobile, ios-phone, android-phone. Он отклонил план до записи с `Candidate source differs from tested checkout`: current frontend/backend fixture inputs отличаются от commit опубликованного кандидата. Ошибка сохранена в `current-plan.log`; gate не обходился.

До указания root остановить дальнейшие checkout был создан один локальный изолированный checkout опубликованного 46cb: `/tmp/somewhere-backend-rc6-qa-checkout`. Там обычный `qa:plan` создал source-bound план с 1255 проверками и 10 обязательными suites. `source-plan.json` и пустой `source-run.json` сохранены. Его environments явно помечены PLAN ONLY/NOT RUN: кандидат не запущен, реальные клиентские окружения на нём не проверены. URL smwhere.ru — существующая цель, работающая на rc5, а не доказательство запуска rc6.

На текущем каталоге `qa:release-ready` этот план отклонил как `Stale catalog or unresolved coverage`. В source-matched checkout gate также не прошёл из-за полного отсутствия новых case/suite результатов. Полные ответы — `current-ready.log` и `source-ready.log`. Ни одного acceptance receipt не создано.

Следовательно, готов опубликованный проверенный по происхождению комплект; отсутствует полная функциональная приёмка exact artifact на действующем каталоге и пяти профилях. Это не блокер сборки и не признак необходимости SQL-миграции. Решение о допустимой выкатке с явно указанными ограничениями принимает root/владелец; данным отчётом разрешение не выдаётся.

## Воспроизводимые команды

```sh
# В каталоге опубликованного комплекта:
shasum -a 256 -c SHA256SUMS
# Source-bound план уже сохранён; не подменять им текущую приёмку:
npm run qa:release-ready -- \
  --plan /tmp/somewhere-backend-rc6-source-qa/plan.json \
  --run /tmp/somewhere-backend-rc6-source-qa/run.json \
  --artifact-dir /tmp/somewhere-backend-rc6-published \
  --receipt /tmp/somewhere-backend-rc6-acceptance.json
```

Штатный host deployer потребует действительный passed receipt и не принимает owner-exception как этот файл. Production backend остаётся rc5; схема 1–8 совпала по всем checksum с кандидатом, новых миграций для album export нет. Не удалять строки schema_migrations и не запускать down migration.
