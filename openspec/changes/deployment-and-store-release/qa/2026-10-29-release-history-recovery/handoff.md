# Передача независимому reviewer

Область автора — только этот каталог. Основные результаты: [report.md](report.md),
[ledger.json](ledger.json), [origin-tags.json](origin-tags.json) и неизменённый
снимок root [production-observation.json](production-observation.json).

Проверить шесть `confirmedUnpublishedDeploymentForRecovery=true`: backend
rc4/rc5 и web rc3/rc7/rc8/rc11. Для каждой записи сверить локальный tag object OID,
commit, JSON-карточку с manifest, ancestry в origin/main, фактические bytes
исходной тройки файлов и свидетельства активации. Все 19 найденных каталогов
проверены автором; root отдельно сообщил strict verifier pass для этих шести.
В частности, три копии backend rc5 совпадают целиком.

Не переносить owner-exception в activation или QA pass. Web rc4 остаётся
unknown; rc5/rc6 rejected без найденной активации; rc9/rc10 не включены по
указанному root факту never activated и repo-отчётам rejection. Legacy теги
без карточки и отсутствующие локальные bundles rc1 сохранены отдельно.

Новый снимок root подтверждает current web11/backend5 и девять сохранённых
manifest, включая все шесть recovery. Его hashes — hashes manifest и заявленные
архивные hashes, не новое вычисление bytes архивов на ВМ. Схема БД в этом снимке
не запрашивалась. Исторические источники не заменены новым наблюдением.

Проверить границы плана: атомарный импорт ровно шести исходных тегов без rebuild
и последующее создание Releases с original assets/честной пометкой истории.
Это только план root до review; публикаций и нового workflow автор не выполнял.
Для будущих релизов каждый тег идёт отдельно штатным workflow.

Авторские проверки: SHA-256/размер/состав 19 каталогов, tag/card/commit matching,
metadata unchanged, `agent:check`, `git diff --check`. Нового CI, полной приёмки,
воспроизводимости и production rollback pass нет. Секреты, env и ключи не
читались; ВМ и original receipts не менялись. Автор передаёт результат и
останавливает работу до review.
