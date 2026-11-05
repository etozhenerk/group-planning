# Chat web7.7 r2 — targeted K2/K3/K4

Блокирующий K3 исправлен, retry/restore работают. Основная композиция K2 и покрытие K4 исправлены. Новых существенных функциональных дефектов нет; остаются два небольших визуальных остатка ниже. Это checkpoint, не финальный gate.

Frozen source `e534b88b22f6db046c024757c257091687a33d1b1f51d3d3bbb500afb977a406`, artifact `9eaf47338ee8ab0ce09da1747014a7ebb8cf344c3f9e063a40b1b110fc0a12bf`,8898. Source до/после обоих проходов совпал с кандидатом;261 disk и38 live assets совпали (`artifact-binding.json`).

## Подтверждено

- K3: Enter на rejected icon открывает меню; pointer-click также открывает меню в restore-пути. Retry использовал тот же key, получил201; в настоящем feed ровно один ACK id/client_request_id/text этой попытки. `retry-proof-derived.json` содержит доказательство с SHA исходного полного ответа. Restore при занятом composer disabled и сохраняет «Свежий черновик»; после очистки возвращает исходный текст в поле и удаляет rejected row.
- K2:320/390 input navigation background/radius14, Plus border/radius14/target44, row padding-inline12/gap8. На320 input x64,w192 и на390 x64,w262 — совпадают с ref. Vertical inset декоративного Phone отдельно не копируется.
- K4: dim x0,y101.5,w390,h678.5,bottom780 ровно до composer top780; пустая область короткой истории тоже затемнена. Selected row z2 над dim1, bubble сохраняет surface. Quick menu визуально pill. В probe `quickRadius=0` относится к внешнему wrapper, а не к самой pill; это не finding. WebKit один menu open/Escape close sanity прошёл.

## Небольшие визуальные остатки

1. **K2-border · P3:** input-box border остаётся `1px solid transparent`; ref использует line `rgba(255,255,255,.07)`. Background/radius/layout уже исправлены. Computed proof: actions в composer320/composer390, `checkpoint-probes-followup.json`; screenshots `composer{320,390}-{actual,reference}.png`.
2. **K3-icon · P3:** actual по-прежнему outline TriangleAlert; approved ref — заполненный круг с `!`. Trigger32 + pseudo inset6 дают корректный target44, поэтому target не является дефектом. Actual SVG сохранён в rejected-menu action; ref — `reference-error-icon.json`. Screenshot `rejected-menu-actual.png`.

Первый targeted driver после успешного retry остановился на неверном QA GET `/messages`405; продолжение использовало правильный `/feed`. Начальный helper также проверял `entry.text`, тогда как feed хранит `entry.payload.text`; исходный ответ сохранён, правильный count1 выведен без повторного UI/запросов в `retry-proof-derived.json`. Это ошибки QA tooling, не продукта. Продолжение:10 наблюдений, errors=[] (`checkpoint-probes-followup.json`).

Read/OAuth/info/settings/Create acceptance, прежние successful flows, desktop, полная матрица/suites/gates не повторялись. Login/meeting/membership использованы только как isolated fixture setup. App/manifests/tasks/Git не менялись; diff-check чистый. SHA originals/report/drivers — `evidence-sha256.json`; архивов нет.
