# Независимая проверка sync/archive трёх tooling changes

01.11.2026. Reviewer `/root/sdd_chat_audit`, отдельно от исполнителя миграции. Проверено рабочее дерево MAIN относительно исходных файлов Git HEAD `ba9adb74`; запись reviewer — только этот файл. Исходные status/rules, migration inventory, архивы, specs, registry, catalog и продукт не редактировались.

**PASS для выполненного sync/archive указанных трёх технических изменений.** Потери файлов, изменения требований/ожиданий, исключения продуктовых кейсов или выдачи исторической UI QA за новую не обнаружено. Этот вывод не принимает незавершённые продуктовые changes и не разрешает archive release-version-policy без его текущей приёмки.

## Сохранность перемещения

Пересчитаны SHA256 всех фактически перемещённых файлов; проверены точные множества относительных путей, отсутствие старых active roots и соответствие hashes также исходным bytes из Git, а не только записи автора.

| Change | Файлов | Before ledger = Git original = current archive |
| --- | --- | --- |
| cross-platform-design-system |11| PASS, включая `.openspec.yaml`, specs, tasks, pilot и отчёты |
| functional-test-acceptance |29| PASS, включая PNG/raw logs, планы, run/previous runs и independent review |
| independent-exploratory-testing |8| PASS, включая schema metadata, specs и независимые результаты |
| Всего |48| Ни одного missing/extra/changed файла |

`migration-before.json` и `migration.json` семантически равны; каждый old→new mapping указывает на фактический архив `2026-11-01-<name>`. Все 48 checksum assertions выполнены независимо. Исторические PASS/FAIL/blocked, source/evidence hashes и пути внутри raw отчётов не переписаны. Объяснение resolver в ledger report сохраняет прежнюю базу путей; прямые старые relative links могут требовать этой карты, это не подменено заявлением об автоматическом переписывании ссылок. Отсутствующие учебные `/tmp/exploratory-skill-evaluation` материалы не восстановлены вымышленными данными.

## Дословный sync в main specs

Для каждого файла сравнены **весь блок Purpose** и **все bytes от первого `### Requirement:` до конца**. Во всех шести случаях main равен точному преобразованию исходного delta: только `# Spec Delta` заменён на `# <capability> Specification`, а `## ADDED Requirements` — на `## Requirements`. Purpose, нормативные условия, сценарии и порядок полностью сохранены; MODIFIED/REMOVED/RENAMED не было. SHA256 каждого main совпал с inventory. Новые main не содержат delta headers или перенесённого runtime context/guidance.

| Main capability | Requirements | Scenarios | Purpose и requirement bytes |
| --- | --- | --- | --- |
| design-review |5|9| verbatim |
| design-system |4|8| verbatim |
| functional-acceptance |4|5| verbatim |
| release-test-acceptance |3|5| verbatim |
| test-catalog |3|5| verbatim |
| exploratory-testing |5|10| verbatim |
| Всего |24|42| Все шесть main canonical |

## Catalog и registry

Независимо построено ожидаемое новое JSON из Git baseline и разрешённого old→new mapping; actual JSON совпадает с ним полностью.

- `testing/config.json`: удалены только три имени из `nonProductChanges`; все остальные поля прежние, кроме ровно шести `excludedSources.path`, переведённых на соответствующие main specs. Причины исключений остались дословно прежними. `sources`, profiles, runners, inputs, manifests, прочие exclusions и legacy entries не изменены.
- Шесть исключений относятся к правилам design/tooling/testing, а не к продуктовым сценариям. На их новых путях находятся те же дословные требования. Не исключены web-release-identity или иные пользовательские sources.
- `design-system/registry.json`: удалены только три архивированных `nonUiChanges`; manifests и legacy changes сохранены. Удаление disposition не выдано за `design:ready`.
- Все **24 файла `testing/cases` побайтно совпали с Git baseline**, поэтому сохранены не только ID, но и source blocks, шаги, expected, уровни, платформы и automation mapping. Дополнительно текущий `readCatalog` вернул **415 кейсов /415 уникальных ID /0 gaps**.
- Текущий catalog hash `84856bf42ba9493c4f47f9152522aa73cd69705d3e968815a9e12a45bcc11b2e` изменился законно из-за config/source disposition. Ни один исторический receipt/plan не обновлялся под него; будущие runs обязаны получить новый план и собственную актуальную приёмку.

## Status, rules и границы разрешения

Прочитаны первичные три `*-status.json`, три `*-archive-instructions.json`, три `*-specs-instructions.json` и CLI archive receipts из ledger. Status: root nearest/repo-local — этот репозиторий, schema `spec-driven`, proposal/specs/design/tasks все done, concrete spec paths совпадают с шестью исходниками. В перемещённых tasks независимо посчитано13/13,10/10 и4/4, open0.

Specs rule «Используй проверяемые сценарии; не описывай запланированную функцию как уже реализованную» не нарушено: sync не добавил новых утверждений. Archive guidance сначала проверять реализацию поддерживается сохранённым advisory и первичными verification/independent reports. Требования current qa:ready/design:ready для продуктовых/UI tasks не превращены в structural PASS: здесь архивируется инструментарий процесса, а product pilot и незавершённые экраны остаются историческими/открытыми. Особенно cross-platform-design-system сохраняет исходную границу «эквивалентные палитры/инструменты, paused UI не закрывается».

В receipts `specsUpdated=false` ожидаемо: inline sync уже выполнил точный перенос, CLI archive не повторял его. Наличие main и отсутствие потери содержимого подтверждены непосредственным сравнением, а не одним этим флагом.

**release-version-policy остаётся active13/13**, old root существует, web-release-identity остаётся product source с исходными10cases. Ни `openspec/specs/web-release-identity/spec.md`, ни main release-version-policy сейчас не созданы. Полного current functional/design gate для этих десяти кейсов этот review не подтверждает. Верхнее уточнение в advisory и ledger report это явно сохраняют; owner exception/legacy status не стали QA PASS.

## Зафиксированный scope

- `migration.json` SHA256: `cd95d4234e44922815fb480a35578ac5d0c8a03303889e16fc9557f70c60fc9d`.
- `testing/config.json` SHA256: `53e610a889bdd9814d5e57026a0164a3ad7bdf7eb884672e971dd12b2658268b`.
- `design-system/registry.json` SHA256: `48a387ec22a2d2c45b0f8800c3a883797bb5c93dff64cbe2fd0c76752163bc0e`.
- Детальные six-main/48-file hashes — исходный неизменённый inventory, проверенный независимо; промежуточный расчёт сохранён в `/tmp/somewhere-tooling-migration-independent-check.json`.

Крупные suite, UI/client builds, приложение, cloud и публикация не запускались. Проверены actual files, Git baseline, JSON dispositions и реальный catalog loader; это не новая runtime/visual qualification. При изменении проверенных байтов требуется пересмотреть затронутую часть, а не переносить этот PASS автоматически.

После записи отчёта `npm run agent:check` прошёл: OpenSpec structurally valid / Agent setup OK; log `/tmp/somewhere-tooling-migration-independent-agent-check.log`. Scoped `git diff --check` также прошёл.
