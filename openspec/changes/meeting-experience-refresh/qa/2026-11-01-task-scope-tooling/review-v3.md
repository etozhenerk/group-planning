# Независимое ревью task scope и platform acceptance · final snapshot · 01.11.2026

**В проверенном snapshot блокирующих замечаний не осталось. Независимые синтетические контроли:16/16 PASS.** Это ревью инструмента, не функциональная приёмка приложения или автоматический PASS задач. Использовать следует canonical зарегистрированные testing manifests с фактическими current evidence.

Scope: `scripts/testing/{task-scope,results,manifests,cli,schema,acceptance.test}.mjs`, `testing/README.md`, `openspec/specs/functional-acceptance/spec.md`. SHA каждого из8 файлов до/после совпал: `/tmp/somewhere-task-scope-independent-v3/source-{before,after}.json`; копия source в `candidate-v3/`. Product/runtime/catalog/CI и исходники инструмента ревьюер не менял. iOS full-r7 продолжался независимо на своём simulator.

Исходные результаты сохранены: v1 —4 RED (`/tmp/somewhere-task-scope-independent.md` и одноимённый каталог); v2 —15 PASS/1 RED (`/tmp/somewhere-task-scope-independent-v2/negative-controls-16.log`). Они не заменены новой зелёной историей. Final runner/control source и полный TAP: `/tmp/somewhere-task-scope-independent-v3/{negative-controls.mjs,negative-controls.log}`. Авторские22 tests отдельно не присвоены независимому reviewer.

Подтверждены исправления всех найденных проблем:

- Task-only ready ограничен checkpoint/paused; review/complete требуют полный исходный scope.
- Повторные task IDs, mapped/exempt конфликт и неполная классификация отклоняются. Optional acceptance проверяет distinct и принадлежность platform к task даже в полностью открытом checkpoint, не требуя открыть его ещё несуществующие планы.
- Failed/missing required suites не удаляются вместе с outsideScope даже при одинаковых текстовых labels suite/check. Обычный required suite failure, false pass и неизвестный scope остаются отказом.
- Все mapped case×platform×environment/mode checks входят в scope; missing platform/case/environment отвергается. У каждой platform binding читаются собственные current plan/run; fallback исходного manifest сохранён.
- Негативы wrong-platform plan, failed platform suite и подменённый run.planHash отвергнуты. Две платформы могут пройти по двум независимым исходным plans без стирания результатов другой платформы.
- CLI multi-plan grouping работает без явного plan/run. Явные plan/run принимаются только для единственной совпадающей group; иной путь и grouped explicit binding отвергаются. Частичный release/receipt запрещён, global ready по-прежнему отвергает чужой not_run.
- Unrelated failed/not_run checks остаются outsideScope и wholeReady=false. Даже unrelated passed check с автором-исполнителем либо испорченным evidence hash отвергает весь scoped run. Существующие source/catalog/plan/time/command/evidence validators не обходятся.

Код `inspectTasks` даёт `ready:true` только после проверки каждой group; в checkpoint scoped checks ограничены mapping, но **каждый required suite исходного плана** остаётся обязательным. В full phase `requiredChecks` не передаётся, что сохраняет whole-plan readiness. Планы, timestamps, статусы и raw результаты не переписываются.

Неблокирующая граница provenance: CLI принимает supplied manifest, сверяя его структуру и bindings; принадлежность пути config registry отдельно не проверяется. Перед checkbox canonical `checkManifests` проверяет именно зарегистрированный mapping. Не выдавать advisory команду над временной копией за принятие canonical task; отдельная registry-path защита CLI была бы полезным усилением. Это не обход canonical checkbox gate и не препятствие использованию нынешних зарегистрированных manifests.

Правильный вывод для account4.2 после фактического case/design: task-scoped ready может быть true, остальные14 manual checks full-r7 остаются outsideScope, wholeReady=false. Такой вывод не означает готовность всех15 cases, всего iOS, release или archive изменения.
