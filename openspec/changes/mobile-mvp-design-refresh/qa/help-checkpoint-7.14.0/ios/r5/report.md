# Help/support iOS7.14 — R5 server email error

Вердикт: **needs-fixes по видимости inline error**. Преобразование серверной ошибки и фокус подтверждены, script PASS24.629s; это не общий visual pass.

Frozen artifact `66f25034c6b42e9584f737c8fac875e18ba2c2a592e85806ce13c0f34ccf4830`, source `fc7f2d7b82c0660ac859f0ed2bf2c137fa62d2a014cb49ab800e202bf3f29a6a`, input `b6ada542052bb8dd5412e0354f315792dfcbc0f8a6f3446e3495958af0f7a5b7`. Все20 immutable/copy файлов проверены SHA; после исправления QA-данных mainApp снова подставлен тем же frozen: [binding](artifact-binding.json), [retry binding](corrected-precondition-binding.json).

## Реальный серверный case

Введены действующее описание и `a@@example.test`: фактическое значение проверено до submit. Existing ResponseGate только удержал **оригинальный HTTP422**, не подменял статус/JSON. До release receipt отсутствовал. После release показана человеческая строка «Проверьте адрес почты или оставьте поле пустым.», email имеет `Keyboard Focused`, description/email сохранены, raw `invalid` и SW-receipt не показаны. [Лог PASS24.629s](server-email-corrected.log), [driver](HelpCheckpoint714R5Tests.swift), [precondition](actual/corrected-email-precondition.json), [real422](actual/server-422-held.json), [proof](actual/server-field-error-proof.json).

Первый input273символа получил201: исходное ожидание422 для>254 было неверным (backend допускает до320). Это ошибка QA-precondition, не продукта. Исходные [лог](server-email-independent.log), [201 proof](attempt1/server-422-held.json), [driver](driver-first-attempt.swift) сохранены. Единственный исправленный повтор использовал недопустимый синтаксис `a@@example.test`.

## F1 — hint существует в AX, но закрыт footer

После server422 auto-focus отображает email, однако human inline полностью находится под закреплённой панелью. [Actual](actual/server-email-error-focus-before-assert.png), [AX](actual/server-email-error-focus-before-assert.ax.txt):

- Email y305.2–354.2, `Keyboard Focused`.
- Human hint y361.7–376, тогда как background footer начинается примерно y340; notice heading y356, retry y405–453.
- В PNG видны поле и общий notice, но человеческая подсказка у поля не видна. Нижняя часть самого field тоже пересекается с панелью.

Состояние снято после появления human-текста и ожидания capture-helper; отдельная серия стабильных geometry samples здесь не выполнялась, поэтому не утверждается невозможность ручного раскрытия. Тем не менее начальный результат autofocus не принят как видимый inline. Script проверял наличие/фокус, визуальное ревью обнаружило ограничение. Нужен actual с доступными полем/подсказкой выше footer.

Correction→201, description/screenshot server codes, keyboard trigger и businessматрица не повторялись. Только собственная memory/nil-notifier fixture, без реальной доставки; первый201 остаётся лишь изолированной памятью, очищенной при остановке. iOS27.0 Simulator402×874, стандартныйL. VoiceOver не читался/не включался, ReduceMotion не менялся.

App завершён, собственная fixture остановлена, keyboard preference восстановлен1, lock снят, rootfixtures сохранены: [cleanup](cleanup.json). **SOURCE/DEVICE RELEASED.** Продукт/cases/tokens/manifests/tasks/Git не менялись; final gates не запускались.
