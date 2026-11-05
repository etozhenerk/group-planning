# iOS Saved r4 — только narrow/AX navigation

**Targeted checkpoint: passed**,15,394с. Точный новый bundle6486387dc76dc96a2cabebf5e8d26356e58228b2708e9fc8484f2bcdc4523fbd проверен ([binding](artifact-binding.json)); старый pass не переносился.

В одновременном QA UIWindow320×568/accessibility5 подпись нижней вкладки **«Приглашения» целиком в одну строку**. Выбранная вкладка корректна, тап «Встречи» и возврат в приглашения прошли. Footer карточки достижим после scroll, не перекрыт нижней навигацией: y369,34/h74; navigation y511. [Снимок подписи](actual/narrow-accessibility5-selected-saved.png), [достижимый footer](actual/narrow-accessibility5-footer-reachable.png), [metrics](actual/navigation-metrics.json), [действия](smoke-independent.log).

Только эта проверка, без трёх RSVP-маршрутов/матрицы/VO/gates/архивов. PhysicalScreen402×874, то же устройство iOS27.0. Своя fixture остановлена, QA app завершён, lock освобождён; глобальные настройки/ориентация не менялись. Устройство свободно. Repo code/Git не менялись.
