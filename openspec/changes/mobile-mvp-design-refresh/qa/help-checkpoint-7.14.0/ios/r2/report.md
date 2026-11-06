# Help/support iOS7.14 — targeted R2

Вердикт: **needs-fixes: F1 keyboard/footer после privacy pop**. Исправленные notice/FAQ-return и остальные выполненные targeted действия прошли с явным Done; этот обход не устраняет F1. Без final gates/матрицы/checkbox.

Frozen artifact `5eb16b76c16e49c70fc49607e955680dea9f6448043fee47bbd4d542d0a101cc`, source `702bf591896dd39a8fb7edc97199a3e28273c0726e223adda2a99037de46e33f`, input `dfd5558b07bb64f9664ebb7b74906978774b79a6aa56c906175036c31cd2e499`. Все20 файлов immutable/copy проверены SHA, после единственного QA retry повторно подставлен тот же app: [binding](artifact-binding.json), [retry binding](done-retry-binding.json). Использован актуальный [canonical bounded-scroll helper](ChatSheetTestSupport.swift), не старые fullswipes. [Raw binding](reference-binding.json): approved normalized reference не менялся; переносились только ожидаемые reference, не pass.

## F1 — после возврата из политики теряется keyboard avoidance

В A: ввести сообщение, выбрать реальный скриншот, открыть policy, вернуться при сохранённом фокусе TextEditor. Текст/файл сохранены, но footer-submit оказывается за клавиатурой и не может быть раскрыт прокруткой, потому что закреплён вне scroll. До policy фокус/клавиатура уже были и footer оставался выше них.

| Native AX geometry | До policy | После Back |
| --- | --- | --- |
| Window |402×874|402×874|
| Natural body height |943.3|943.3|
| support-scroll |0,0,402,406|0,0,402,748|
| Submit |20,422,362,48|20,764,362,48|
| Done |y504,h36|y504,h36|
| Keyboard |y590,h226|y590,h226|

Содержимое не выросло; scroll/footer потеряли **342pt** avoidance. Footerstart, выводимый из submit−padding16:406→748; базовая высота92. [До: actual](attempt1/actual/selected-file-before-privacy.png), [до AX](attempt1/actual/selected-file-before-privacy.ax.txt), [после actual перед assert](attempt1/actual/privacy-return-draft-file-before-assert.png), [после AX](attempt1/actual/privacy-return-draft-file-before-assert.ax.txt), [geometry](overlap-geometry.json). [Прямой screen capture сохранённого перекрытия](after-privacy-footer-keyboard-overlap.png) сделан позже на той же неизменной поверхности, перед остановкой зависшего QA teardown. Успешный путь с Done не заменяет этот дефект. Root/body используют GeometryReader/VStack; notification override в frozen R2 отсутствует.

## Выполненный targeted retry с явным Done

Один разрешённый retry, [лог](done-retry.log), [driver](HelpCheckpoint714R2Tests.swift):

- **A PASS48.115s**: реальный single-file picker→скриншот, policy→Back сохраняет message/file; затем доступное native «Готово» закрывает клавиатуру и открывает доступ к submit. Реальный server receipt `SW-8B972C549AA8`; «К помощи» возвращает в **тот же** FAQ: первый collapsed, третий expanded; contactY706.667 до/после, scrollDelta0. [Privacy return](actual/privacy-return-draft-file-before-assert.png), [после Done](actual/privacy-return-after-explicit-done-before-assert.png), [receipt](actual/accepted-with-file.png), [FAQ](actual/success-same-faq-return-before-assert.png), [facts](actual/same-faq-return.json).
- **B PASS29.397s**: invalidemail «непочта»→inlineerror и **Keyboard Focused** на email, без POST к gate; поле исправлено, реальный201 намеренно заменён503. Unknown показывает точный raw helper «Текст и скриншот сохранены. Повторите отправку.», прежний повтор причины отсутствует, input frozen, retry доступен. [Email/focus](actual/email-error-focus-before-assert.png), [AX](actual/email-error-focus-before-assert.ax.txt), [исправленный notice](actual/corrected-unknown-notice-before-assert.png), [proof](actual/email-notice-proof.json). Полный unknown-retry заново не выполнялся; невидимая key/receipt equality не объявляется ручным pass.

Первый A закономерно остановился на неhittable submit за клавиатурой; failure-record hook завис в teardown. Остановлен только свой xcodebuildPID90552, [исходный лог](smoke-independent.log) и [driver/actual](attempt1/HelpCheckpoint714R2Tests.swift) сохранены. Для retry удалён этот QA hook, добавлен явный Done; продукт immutable. Скрытой серии прогонов не было.

## Границы и release

Принудительно замедленное reading/guard, dirty-exit, полный B/C, narrow/large/reduced, остальные поля/файловые границы/реальный внешний OAuth и final suites/gates не проверялись. Статический reading guard добавлен в source, но его промежуточный UIstate не выдаётся за runtime pass. Только isolated memory+nil notifier и QA Photos, без реальных сообщений. iOS27.0 Simulator402×874; VoiceOver не читался/не включался.

Собственная fixture остановлена, app завершён тестами, keyboard preference восстановлен1, ReduceMotion не менялся в R2, lock снят, rootfixtures сохранены: [cleanup](cleanup.json). **Source/device RELEASED**, новых runtime/build до handoff не будет. Продукт/кейсы/токены/manifests/tasks/Git не менялись.
