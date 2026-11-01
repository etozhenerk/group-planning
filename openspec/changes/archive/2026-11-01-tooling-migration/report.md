# Завершение технических изменений · 01.11.2026

Завершены и архивированы штатным OpenSpec CLI:

- cross-platform-design-system — 13/13 задач;
- functional-test-acceptance — 10/10 задач;
- independent-exploratory-testing — 4/4 задачи.

До перемещения получены status/archive/specs instructions и проверен корень
репозитория. Каждый change имел все planning artifacts done, все задачи done,
только ADDED delta и отсутствующие main specs. Артефактные правила учтены:
сценарии проверяемые, текущая незавершённая продуктовая работа не объявлена готовой.

Применены openspec-verify-change, openspec-sync-specs и openspec-archive-change.
Сначала вручную синхронизированы **6 основных specs, 24 requirements и 42 scenarios**,
с сохранением Purpose и всех блоков дословно. Основные файлы имеют канонические
title/Purpose/Requirements, без delta headers. После strict validation и
побайтового сравнения блоков выполнен CLI `archive <name> --skip-specs --yes --json`.
`specsUpdated=false` в его квитанции означает, что CLI не повторял уже выполненный
inline sync, а не отсутствие основных спецификаций.

Проверка реализации/сценариев находится в `advisory-verification.md`; сами
первичные отчёты сохранены внутри перемещённых changes. Все **48 файлов** этих
трёх корней сохранили исходные bytes. Полный old→new path/SHA256 inventory —
`migration.json`. Никакие исторические PASS/FAIL, планы или evidence не обновлены
под новый hash. Старые абсолютные пути и относительные ссылки в исторических
артефактах читаются с исходной базой из inventory: исходный change root заменяется
на destination. Ссылки за пределы change root относятся к прежнему repo root;
они не должны интерпретироваться как новый путь с лишним уровнем archive.

В живых registry удалены только три архивированных non-product/non-UI записи.
Шесть `excludedSources` теперь указывают на main specs с прежней причиной
инфраструктурного исключения. Все продуктовые case IDs, source blocks, шаги,
ожидания и automation mappings сохранены. Web-release-identity и его десять
кейсов не перемещались. Изменение catalog hash из-за registry/config ожидаемо;
исторические QA receipts не переписываются, будущая приёмка получает новый plan.

**release-version-policy оставлен активным с 13/13 отметками.** Его implementation
и историческая проверка есть, но capability web-release-identity содержит UI:
полного текущего qa:ready/design:ready для десяти кейсов пока нет. Advisory
readiness для этого изменения ограничен code/coherence и не разрешает подменить
приёмку UI. Этот перенос не закрывает ни один незавершённый продуктовый change.

Отдельная историческая граница: первичные `/tmp/exploratory-skill-evaluation`
учебные данные больше не доступны. Сохранены долговременный independent review,
инструкции, metadata guard и синтетические проверки tooling; отсутствующие
сырые материалы не восстановлены вымышленным содержимым.
