# Composer grow: independent iteration 1

Reviewer `/root/sdd_chat_audit`, 01.11.2026. Работающий frozen demo8492, собственная UI-созданная встреча `faa7c24f-2a35-4cbc-b0d8-3e8254efa9ff`, synthetic Саша. CUA native Chrome156.0.8078.74, macOS27.0.1(26A434). IAB отсутствует (`browsers=[]`, Browser is not available:iab). DevTools Responsive UI задаёт 1440×900,390×900,320×900; масштаб Fit to window. Это responsive viewport с native mouse/keyboard, не настоящий телефон/OS IME/touch. Целевые CSSpx напрямую nativeAX не предоставляет; числовые размеры поля не выдумывались.

Первоначальный design inputHash `51fa5751505acc44cada7a2643db642363d56bf13c8ac4587599f4715c41af8c` совпал с независимым source-after. `design:check` PASS. Source991inputs/runtime253files сохранены в `source-after-iteration1.json`, оба designcontext сохранены отдельно. Продукт/тесты/ожидания/токены не редактировались; авторские результаты до живых действий не читались. Нужные suites выполняет root, reviewer их не дублировал.

## Фактические действия

- Создана из UI отдельная встреча на30ноября; войти как Саша через fake-provider. Это не настоящий OAuth.
- Desktop1440: вставлены две строки,20строк; видимый рост и предел; Cmd+Up показывает начало, прежний конец содержит20юстроку. После замены коротким текстом поле уменьшается. Сохранённое XX переживает blur истории, emoji первым click заменяет именно XX. Первый Send создаёт одну видимую canonicalстроку QA-GROW-DESKTOP-SINGLE и очищает поле. Плюс первым click, Taskформа/Escape возвращают фокус плюсу. Tab из textarea → emoji; Return открывает popup, Escape возвращает focusemoji. Reload восстанавливает многострочный draft.
- Resize1440→390→320 сохраняет весь draft; XX остаётся видимо выделенным после смены ширины. Перенос пересчитывает высоту. Исходный пример «Черновик независимой проверки\nвторая строка» полностью виден: три визуальные строки390,четыре320.
- Mobile320:20строк ограничены полем; wheel вверх внутри textarea выводит01/02 вместо20 при неизменной области composer. Короткий двухстрочный текст уменьшает поле. XX → outsidehistory → плюс первым click → задача → ввод в другое поле → очистка/Escape → emoji → 😀 заменяет XX. Явный возврат клавиатурной кнопкой фокусирует textarea. Первый Send создаёт одну canonical QA-GROW-320-SINGLE, поле уменьшается; одна строка и пустое состояние проверены.
- Mobile390: multiline/XX → outsidebackground → emoji первым click → явный search «пицца» → 🍕 заменяет XX → явный возврат → Send создаёт одну QA-GROW-390-SINGLE и уменьшает поле. Плюс/Task/Escape сохраняют отдельный multiline draft и возвращают focusplus.
- Свежий approved raw8798 открыт отдельно, независимо снят1440/390/320 и20строк/max/scroll/shrink. После resize raw требует настоящего input для своего старого autoresize handler; сравнивался кадр после ввода текста. `reference/*after-input*` отражает это предусловие. По поведению grow/max/внутреннего scroll текущая реализация соответствует принятому raw; full pixel regression не выполнялась.

Журнал46actual captures — `interactions-iteration1.json`; referenceжурнал — `reference-interactions.json`. PNG+AX sidecars в actual/reference. Имена отражают действие, а не автоматический verdict.

## Ограничения и остановка freeze

Визуально и действиями исходный P2-WEB-COMPOSER-GROW больше не воспроизводится. Но iteration1 **не финальная приёмка**: root сообщил о ResizeObserver loop в полном WebKit suite при resize и снял sourcefreeze для узкого requestAnimationFrame исправления. Первоначальные hashes и evidence не переносятся на новый source. После GO нужен новый context/sourcefreeze и адресный reflow/focus/criticalactions повтор.

Физическая mobileOS IME/реальный touch longpress не проверены. NativeAX/page mouse context menu не подменяет touch. Самостоятельного заявления о полномTC-CHAT-OUTSIDE-KEYBOARD/qa:ready/design:ready или121screens нет.

Ошибки инструментального ввода сохранены, не продуктовые дефекты: typeText потерял буквы URL, plaintext наHTTPSпорт дал400; exact paste HTTPS затем открыл продукт без TLS interstitial, предупреждение не обходилось. Первые AXclick внутри масштабированного Responsive не попадали вtextarea; далее использованы screenкоординаты. Desktop native key `BackSpace` вызывал системное контекстное меню; `Delete` реально удалил выделение и shrink подтверждён в desktop-delete-shrink. Предварительные файлы desktop-two-lines/desktop-two-lines-actual/desktop-cleared-confirmed/desktop-empty-left-click не являются доказательством соответствующих успешных состояний. Screenshot-only и названия файлов не засчитаны в PASS.

Собственные synthetic сообщения/встреча остаются только в root memoryfixture до его штатного завершения; чужие данные/процессы не менялись. NativeChrome вкладки открыты для адресного повторного прохода.
