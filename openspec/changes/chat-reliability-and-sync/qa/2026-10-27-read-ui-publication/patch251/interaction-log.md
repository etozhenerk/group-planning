# Raw-контекст прочитанности2.5.1

Parent-проход во встроенном браузере, tab11, существующий HTTP8786. Это подготовка reference, не независимый design-review приложения.

- Workbench390×844: state=context-zero показал тот же reaction popup с нижней строкой «Кто прочитал», выделением исходного собственного bubble, без постоянного zero receipt.
- Нажатие строки: после exit меню открыт readers bottom sheet «Прочитали» / «Пока никто не прочитал». Нажатие крестика вернуло AX focus к исходному bubble, без перестройки ленты.
- Workbench1280×800: то же меню; строка открыла центрированный readers dialog. Desktop Escape закрыл его и вернул focus к bubble. Это web-клавиатура, не заявленная проверка iPhone.
- Снимки состояний сохранены рядом. Motion использует прежние180/150ms и Reduce Motion; этим статическим evidence не подтверждены frame budget и нативные жесты.

Новый raw использует существующий reactionPicker. Добавлен только footer-action; старый2.5.0 snapshot и hashes находятся в assets/revisions/2026-10-27-chat-read-state/history/2.5.0. Новых токенов нет. Manifest всех клиентов получил явные context-zero/transition/focus-return состояния и версию2.5.1. Независимая приёмка приложения остаётся открытой.

После уточнения returnTarget повторён desktop путь: Enter на own bubble → меню → readers → Escape возвращает bubble; затем receipt → readers → крестик возвращает именно receipt. Уточнена роль separator: color.borderStrong, соответствующая raw --border; значения не изменены.
