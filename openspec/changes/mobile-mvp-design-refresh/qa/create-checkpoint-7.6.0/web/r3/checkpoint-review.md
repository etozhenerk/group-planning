# Create web 7.6.0 r3 — только C3 на320

Остаточный C3 исправлен; новых дефектов в этом узком проходе нет. В empty и validation Date x20,width133,right153; Time input x168 — зазор15px против ref14.72px. Центры выровнены, Date height50, font16/padding-inline8/gap4 соответствуют ref; overflow отсутствует. Кнопка не выходит за колонку и не касается Time. Разница ширины0.28px допустима как округление layout.

Один sanity: Date открывается, Escape закрывает popup и возвращает focus на Date. Два fresh actual screenshot: `empty-320-actual.png`, `validation-320-actual.png`; raw ref geometry снята заново в том же320×760 и сохранена в `targeted-probes.json`.

Frozen candidate: source `33b5d8a452ad21ce1b6e4097a0fc27189d528c83952d0aceecf481805df23130`, artifact `05d3bdfdd005eb18e07ca1a7969c008905560a4be4092c82018be9740e818edc`, стенд8895. Source до/после совпал с кандидатом;261 disk files совпали, два живых entry assets совпали (`live-binding.json`). Driver ошибок не получил. SHA сохранены в `evidence-sha256.json`.

Это targeted checkpoint только320 empty/validation и одного popup sanity.390, короткий popup, PNG, desktop, create/retry/dirty/OAuth/RSVP, suites и gates не повторялись. Прежние pass на новый hash не перенесены; финальная приёмка manifest/задачи не заявлена. App/manifests/tasks/Git не менялись.
