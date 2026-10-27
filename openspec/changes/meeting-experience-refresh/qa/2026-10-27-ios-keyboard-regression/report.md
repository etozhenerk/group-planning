# iOS Escape: открытая регрессия

Независимое замечание IOS-DS23-ESCAPE-001 подтверждено на run08. Попытки исправления run10 (keyboardShortcut), run11 (scene commands), run12/13 (явный SwiftUI focus), run14/15 (UIKit key command bridge) не прошли прежние проверки Escape. Неуспешные реализации не приняты; текущие MessageComposer/ReactionPickerOverlay возвращены к точному исходнику run08. Регрессионные ComposerKeyboardUITests сохранены.

Run09 использовал неверный fixture ID; его ошибки являются ошибкой harness. Run13–15 дополнительно подтвердили доставку Left Arrow и вставку в середину строки: `ab` → Left → `X` = `aXb`. Все три Escape-сценария остаются failing. Run15 повторён на неизменённом коде с Capture Keyboard=on; это не устранило сбой.

Ни feature-test, ни design-review pass не заявляется. Нужна дальнейшая диагностика маршрута Escape на живом QA приложении; зависимость от hardware focus/перехватчика пока не установлена. Логи содержат точные xcresult paths и остаются evidence.
