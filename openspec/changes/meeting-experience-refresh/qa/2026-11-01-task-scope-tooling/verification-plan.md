# План исправления task gate

Исправить checkpoint manifest/CLI так, чтобы готовность выбранных задач
выводилась из всех case/platform/environment checks их неизменённого плана
и ВСЕХ обязательных suites. Готовность всего feature/release этим не меняется.
Результаты вне scope, source/catalog hashes, время, evidence и независимость
проверяются прежним validator; pending unrelated показываются отдельно.

Регрессии до закрытия:
- passed task + pending other: task ready, whole run not ready;
- missing dependency case/environment/platform блокирует target;
- failed/missing required suite блокирует target;
- unknown/exempt task и unknown/empty expected scope отвергаются;
- release нельзя проверить scoped; unchanged full/release validation;
- checkpoint closed-task mapping обязателен, complete/review требуют full;
- stale source/evidence/time остаются rejected.
Не изменять CI/workflow, runners, catalog, plan hashes/timestamps или продукт.
