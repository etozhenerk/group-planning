# Независимая проверка iOS · клавиатура вне composer

**Адресный XCUITest: 4 passed, 0 failed на неизменном артефакте.** Проверены фон/история/шапка, сохранение многострочного черновика и выделения, первые Send/плюс/emoji, возврат из формы без IME, явный refocus, поиск emoji/поле формы, scroll и long press. Настоящая экранная клавиатура подтверждена свежими screenshots и кадрами видео.

Все 508 исходников и 66 файлов артефакта совпадают с author inventories до и после. design inputHash остался `70d23b247c66c02460ba6f6859b71d4df37013b28e59d1b1684ec01603905449`.

Визуальный scoped отчёт: 6 pass, `sheet-return-no-ime` blocked — assertion log подтверждает поведение, но нет отдельного actual кадра возврата. Полный design gate не подтверждён. Pixel regression не выполнялась; raw и actual имеют разную синтетическую историю, сравнение композиционное по платформенному контракту.

Отдельный ad-hoc ручной проход, физический iPhone, VoiceOver, accessibility XXL и Reduce Motion=true не выполнены. Обычная категория L/масштаб1.0 и reducedMotion=false зафиксированы. В xcresult есть предупреждение `Invalid frame dimension (negative or non-finite).`; воспроизводимого визуального дефекта в выбранных состояниях не наблюдалось.

`AutomaticMinimizationEnabled` восстановлен в true, обратное чтение **1**. `ReduceMotionEnabled` не менялся, чтение **0**. Обычное приложение и физический телефон не затронуты; собственные fixture процессы завершены.

Подробные действия, включая выбранные кадры видео и отличие automated/manual, — [interaction-review.md](interaction-review.md). Статусы состояний — [design-review.json](design-review.json), окружение — [environments.json](environments.json), результаты — [functional-result.json](functional-result.json). Raw результаты XCUITest находятся в двух xcresult; сводки сохранены рядом.

Проверки отчёта: `design:inspect-report` — structure valid, currentAcceptance=false; `npm run agent:check` и `git diff --check` прошли. Полные локальные артефакты не удалены; их SHA256 в local-artifacts.json.
