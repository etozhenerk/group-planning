# iOS «Мои встречи»7.5 — короткий checkpoint

**Design: needs-fixes. Функциональный направленный smoke:4/4 passed после исправления двух QA-предусловий.** Точный новый bundle150c663058f530f11175002232414195771dcfb715cc8280f8e526a806bb88b4 подставлен после build runner и проверен ([binding](artifact-binding.json)). Это не финальная приёмка/gates.

Пройдены ready, один toggle с целевым именем/стабильной позицией, calendar selection→чат→Back, длинная реальная встреча, empty/past-empty, первичный503/retry, refresh503 с сохранением карточек/retry, accessibility5 и один QA UIWindow320×568. [Первый короткий проход C/D](smoke-independent.log), [единственный уточняющий повтор A/B](smoke-ab-retry.log).

Непрочитанное проверено фактически: два настоящих сообщения другим участником, GET списка вернул unread_count=2 ([API proof](unread-precondition.json)); видны footer «2 непрочитанных» и полное accessible name ([actual](actual/ready-unread-footer.png), [AX](actual/ready-unread-footer.ax.txt)). Первый снимок с тем же именем не имел новых unread и сохранён в attempt1, ему pass не приписан.

Остались визуальные расхождения:

1. Вокруг календаря появилась дополнительная округлая surface/border и отступы. Принятый calendar-r7 плоский, без этой внешней поверхности. [Actual](actual/calendar-selected-day.png), [raw reference](../../design-6.2.0/meetings-web-r1/reference/calendar-ready-w390.png), ux.md § calendar-r7.
2. Ошибка **обновления** подписана «Не удалось загрузить встречи», тогда как list-r3/UX задаёт «Не удалось обновить встречи». Карточки сохраняются и повтор работает. [Actual](actual/refresh-error-keeps-cards.png), ux.md § list-r3.
3. При обычном тексте в QA-window320×568 заголовок/создание и периоды переходят в вертикальные группы; принятый narrow list-r3 сохраняет одну строку периодов и общий ряд шапки. Управление достижимо, но композиция отличается. [Actual](actual/narrow-window.png), [raw narrow reference](../../design-6.2.0/meetings-web-r1/reference/list-ready-w320.png), [metrics](actual/narrow-window.environment.json).

Первый A нажал частично перекрытую нижней навигацией карточку: после полного доскролла chat/back прошёл ([proof](actual/calendar-chat-back.png)). Первый B получил422 timezone_mismatch из-за UTC timestamp с Europe/Moscow в QA payload; валидный UTC payload прошёл. Продукт/контракт не менялись. Исходные попытки сохранены.

iOS27.0, physicalScreen402×874; narrow — реальный QA UIWindow320×568 на том же устройстве. Fixture отдельная memory, READ_STATE+REALTIME включены. VoiceOver, полные unit/UI и gates не запускались. Repo code/manifests/tasks/Git не менялись. Своя fixture остановлена, QA app завершён, lock освобождён; устройство свободно.
