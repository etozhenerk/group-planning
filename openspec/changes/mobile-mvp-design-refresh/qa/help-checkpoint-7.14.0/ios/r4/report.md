# Help/support iOS7.14 — узкий R4 trigger

Вердикт: **PASS только исправленного privacy/refocus trigger на402×874**. R3 overlap не воспроизведён. Один fresh test **PASS48.545s**,0Doneтапов: [лог](trigger-independent.log), [исполненный driver](ExecutedTrigger.swift).

Frozen artifact `e53d7abd69af01a63ef3c9899aad504a6f24c975bef09a2641656a05f7ab8363`, source `22c5a013e7008e032431fd439c9f898098f3a8ed20226f41f1336d50a56e04d9`, input `9b74e0468396255b3c5d6658e07f92803e47036808d8b7a71919e655e29e9fcc`. Все20 immutable/copy файлов проверены SHA: [binding](artifact-binding.json). Готовый compiled R3 trigger переиспользован без rebuild; его bounded gesture по левому marginx12 остаётся тем же пользовательским действием вне TextEditor. Префиксыr3 в внутренних screenshot-файлах не означают старый pass: в R4 скопированы только файлы, полученные после [run start](run-start.json), и screenshots текущего лога.

Выбран файл доIME, введено сообщение, сфокусирован message, policy достигнута при открытой клавиатуре. Policy→Back очистил старый фокус/IME; message/file сохранены, конец формы остаётся достижим. Затем явный tapmessage снова открыл клавиатуру; CTA полностью доступен выше Done и keyboard.

|Native geometry|До policy|После Back|После нового фокуса|
| --- | --- | --- | --- |
|Scroll height|362|748|362|
|Submit|y378,h48|y764,h48|y378,h48|
|Done|y504,h36|нет|y504,h36|
|Keyboard|y590,h226|нет|y590,h226|
|CTA hittable|true|true|true|

CTA bottom426 на78pt выше Done и на164pt выше keyboard. Naturalbody943.3 сохраняется во всех3поверхностях. Геометрия и hittable стабильны до capture, без Done workaround: [до](actual/focused-before-policy.png), [после pop](actual/after-policy-pop-before-assert.png), [refocus](actual/refocused-footer-before-assert.png), [trigger facts](actual/trigger-geometry.json), [refocus facts](actual/refocus-geometry.json), [settled anchors](actual/refocused-footer.geometry.json). AX/environment рядом.

Business A/B, receipt, full matrix, large/reduced, прочие attachments/emptyicon состояния и final gates не повторялись. Только isolated memory/nil notifier и QA Photos; без supportPOST/реальной доставки. iOS27.0 Simulator402×874, стандартныйL. VoiceOver не читался/не включался, ReduceMotion не менялся.

App завершён, собственная fixture остановлена, keyboard preference восстановлен1, lock снят, rootfixtures сохранены: [cleanup](cleanup.json). **SOURCE/DEVICE RELEASED.** Продукт/cases/tokens/manifests/tasks/Git не менялись; старые pass не переносились.
