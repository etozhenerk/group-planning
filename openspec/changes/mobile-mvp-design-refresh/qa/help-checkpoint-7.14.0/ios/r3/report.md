# Help/support iOS7.14 — узкий R3 privacy/focus trigger

Вердикт: **needs-fixes**. Старый фокус после pop очищается, но новый явный фокус оставляет CTA под native Done. Trigger-run FAILED52.557s; повторов больше нет, source/device освобождены.

Frozen artifact `908d06cd33aded1fd2ea838a56354a8b21667f75e19fae2fc8368aeacff0fadc`, source `2db27dc1aaec0d60a73d9c32ce47a1c2808f78518355bc0e8820200fdb1ed6ff`, input `f4b3827a3d8e2d39144e664f401ab95727afd41c05ba13009e83f7eef058fee5`. Все20 immutable/copy файлов проверены SHA; после единственного QA precondition-retry mainApp снова подставлен из frozen: [binding](artifact-binding.json), [retry binding](margin-retry-binding.json).

## Фактический результат

Реально выбран файл, введён текст, message сфокусирован; поле прокручено до policy при всё ещё открытой IME. Policy→Back **без Done**: клавиатура и Done отсутствуют, текст/файл сохранены, policy-end остаётся достижим. Затем поле раскрыто и явно tapped снова — native Done перекрывает кнопку отправки.

|402×874, native AX|До policy, фокус|После Back|После нового фокуса|
| --- | --- | --- | --- |
|Scroll height|372|748|488|
|Submit|y388,h48|y764,h48|y504,h48|
|Done|y504,h36|отсутствует|y504,h36|
|Keyboard|y590,h226|отсутствует|y590,h226|
|Submit hittable|true|true|false|

Кнопка y504–552 пересекается с Done x305.67–381,y504–540. В отличие от состояния до policy потеряно116pt avoidance. Это устойчивое перекрытие: **17samples за8s имеют одинаковые frames**, а helper не получает settled из-за requireHittable=true; проблема не в продолжающейся анимации. [Refocus summary](refocus-summary.json), [полный geometry record](actual/refocused-footer.geometry.json).

[До policy](actual/focused-before-policy.png), [AX](actual/focused-before-policy.ax.txt), [после pop](actual/after-policy-pop-before-assert.png), [facts/retention/0Done](actual/trigger-geometry.json), [дефект actual](actual/refocused-footer-before-assert.png), [дефект AX](actual/refocused-footer-before-assert.ax.txt), [лог](trigger-margin-retry.log), [driver](HelpCheckpoint714R3Tests.swift). Manual Done taps=0 во всём trigger-тесте. Полное business A/B, receipt, large/reduced и матрица не повторялись; attachment icon отдельно не принимался.

## QA precondition и cleanup

Первый запуск остановился до picker: центральный bounded scroll попадал в nested TextEditor, внешняя форма не прокручивалась. [Первый лог](trigger-independent.log), [driver](driver-first-attempt.swift). В единственном precondition-retry файл выбирался до ввода, прежний bounded алгоритм использовал реальные margin-swipes x12 вне TextEditor; скрытых тапов/инъекций app state не было. Это не исправление продукта.

Только прежняя isolated memory/nil-notifier fixture; без support POST/реальной доставки. iOS27.0 Simulator402×874, стандартныйL. VoiceOver не читался/не включался, ReduceMotion не менялся. Собственная fixture остановлена, app уже отсутствовал при terminate, keyboard preference восстановлен1, lock снят, rootfixtures сохранены: [cleanup](cleanup.json). **SOURCE/DEVICE RELEASED**, новых runtime/build до handoff не будет. Product/cases/tokens/manifests/tasks/Git не менялись; final gates не запускались.
