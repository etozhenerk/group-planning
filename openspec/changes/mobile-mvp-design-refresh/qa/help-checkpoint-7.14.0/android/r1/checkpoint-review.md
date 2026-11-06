# Android help/support R1: остановлен до функционального прохода

Frozen source/APK проверены до и после: binding-before.json, binding-after.json.
Устройство emulator-5554,720×1600,density320,font1, animator explicit1.0.
Изолированный memory fixture127.0.0.1:64284 с nil notifier. Production не затронут.

**Needs-fixes.** Три canonical SupportBoundaryUiTests остановились до формы:
на профиле отсутствует согласованное «Сообщить о проблеме», вместо него
отображается «Поддержка». Доказательства: boundary.log,
profile-support-regression.xml/png. Первоначальная классификация как устаревший
locator скорректирована: root подтвердил случайное изменение общего ресурса
support_title. Правильный canonical locator сохраняется. Lost ACK/границы не
прошли и не оцениваются как pass.

Короткий ручной путь: home→profile→«Помощь»→«Написать в поддержку».
Actual: help-ready.png/xml, support-ready.png/xml, actions.json. Виден раскрытый
первый FAQ, нативная кнопка Back, чистая форма с темой «Вопрос», sticky footer.
Ревьюер просмотрел actual формы. Полноценная actual/reference сверка и остальные
взаимодействия отложены на R2 после batch fixes; screenshot-only pass не выдан.

После release подготовлен help-reference.png из опубликованного normalized frame
через прежний узкий локальный сервер (360×708,Android48 target,dpr2). Сравнение
actual help с reference выявило отсутствие ArrowUpRight18 в contact action;
передано root для batch. Отличающийся перенос FAQ не объявлен дефектом: Android
использует системный sans-serif по docs/design/platforms.md, reference — web
stack. Нужные проверке overflow/крупный текст остаются на frozen R2.

AccountDeletionUiTests FAQ заканчивается старым text locator «Назад»; исполнитель
заменит его текущим content description, сохранив disclosure/recreation assertions.
Источник/приложение/тесты ревьюер не менял. Процесс остановлен, animator setting
возвращён к исходному null. Source/device освобождены. Общие gates не запускались.
