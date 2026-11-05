# Info web7.8 r2 — только компания

Основной I1 исправлен на390/320: heading16/600/text, chips36/radius12/padding6-10-6-6/border0, group gap6; +N36/radius12/navigation+line, «Все ответы»32/padding-top2. Цвета chips и текста соответствуют approved info/nav-info. Небольшие остатки **P3**:

- **I1-count:** число справа от heading наследует16/600/line18.4/text#f5f4f1. Ref counter13/400/line14.95/muted#b9b9c2; сам headingref16/600. Это видно на обоих actual.
- **I1-all-arrow:** у ref строка «Все ответы ·9» содержит правый указатель→; actual «Все ответы ·6» без указателя. Геометрия/текст/действие строки работают.

Изолированный fixture:5 приходящих и1maybe, поэтому видны3 имени/+2/«Все ответы ·6». На390 и320 реально раскрыты все6строк, сворачивание возвращает focus opener/aria-expanded=false. Последняя строка доступна над footer (bottom678.14 <764 на390;594.14 <680 на320). Horizontal overflow нет. Avatar fallback сохранён; различие имён/чисел с демо не является finding.

Exact actual/ref computed и действия: `targeted-probes.json`,6наблюдений/errors=[]. Два actual и два ref: `company{390,320}-{actual,reference}.png`. Источник прежний approved id info → `assets/navigation-r2/nav-info/frame.html`, normalized `preparation/references/info/frame.html?platform=web&state=organizer`.

Frozen source `f89dad1fdd4fe31f12a85901fbd951d81b3b112dd63aade0fd3608d48440f9f7`, artifact `d577c916477f495a76c7c64b14e23140c30bbb3a66dc8a73b2197947fdcca7c4`,8901. Source before/after=candidate;261 disk/38 live assets совпали (`artifact-binding.json`). SHA сохранены в `evidence-sha256.json`.

Только изменённый блок компании; остальные успешные пути r1, прочие платформы и gates не повторялись. App/manifests/tasks/Git не менялись. Это checkpoint, не финальная приёмка. Кандидат освобождён.
