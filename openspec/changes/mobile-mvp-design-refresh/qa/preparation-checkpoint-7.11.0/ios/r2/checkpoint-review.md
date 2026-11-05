# Preparation iOS R2 — ограниченный delta checkpoint

Вердикт: **PARTIAL / BLOCKED по F1/F2 runtime**. Тексты формы проверены; детали/confirmation и итоговые spacing не приняты. По указанию исполнителя после текущего run повторов не делалось; source/device освобождены.

[Binding](artifact-binding.json): artifact `6bf340251d9a48498e43f9a2f2ad96fbdcfe3eb5d4216b769535ed502bac3e7a`, source `a44495616bd6d29af0b466776de5dfc88591ce25d44889b28a3915205e1ecf4e`, DS 7.11. Все 20 файлов frozen/copied host проверены по SHA.

- A **PASS 22.563 с**: normal 402, пустая отправка показывает «Напишите, что нужно сделать»; изменённый текст→dirty swipe показывает «Текст и адресат задачи не сохранятся.». [Empty](actual/normal-empty-copy.png), [dirty](actual/normal-dirty-copy.png). Это только проверка новых текстов, не повтор полного dirty stay/leave.
- B **blocked 47.196 с** до действий деталей. DirectAPI подготовил offered/accepted/cancelled/completed как [QA-предусловия](actual/api-seeded-states-only.json). `ChatSheetTestSupport.revealInConversation` достиг offered-title, но завершился strict assertion: нижний край 521 pt против composer boundary 514 pt. Последние 7 pt выходили за целиком допустимую область. [Failure AX](actual/blocked-entry.ax.txt), [журнал](smoke-independent.log), helper line 85. Это сбой подготовки UI-действия; продуктовый дефект навигации/зависание не заявлен.

Cancel-back, новые accept/complete labels, outline decline, confirmation title/consequence/footer, completed/cancelled card spacing текущим app runtime **не проверены**. Статическое наличие исправлений не заменяет actual; прежние pass/скриншоты не переносились. Нового runtime для обхода helper не запускалось.

[Driver](driver-independent.swift). iOS 27.0, стандартный текст L; A actual 402×874, B запрошен поддерживаемый QA UIWindow320×568 на physical screen402×874. B не дал целевого screenshot/context; это не отдельное физическое 320-устройство. VO, old unknown/eventflow, полные матрицы и gates исключены. Своя memory fixture остановлена, runner завершил приложение/освободил lock; настройки устройства не менялись. Код/cases/manifests/tasks/Git не менялись.
