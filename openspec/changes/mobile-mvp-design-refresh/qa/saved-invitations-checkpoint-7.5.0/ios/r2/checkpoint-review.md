# iOS Saved R2 — только исправленный footer

**Targeted checkpoint: passed.** Один новый сценарий normal/accessibility5/narrow, без повторения маршрутов ответов или полного smoke. Точный bundle `7e6df1b7c701796efd2040d5f67e5d8a02e763a3b034a883d0ff1255d41fbf87` проверен ([binding](artifact-binding.json), [действия](smoke-independent.log)).

Измеренный зазор между нижней границей автора и верхней границей footer: **8pt при accessibility5**, **45,33pt normal** и **45,33pt narrow**. Во всех трёх состояниях footer виден и доступен, пересечения больше нет. [Все metrics](actual/footer-metrics.json), [large actual](actual/footer-accessibility5.png), [large AX](actual/footer-accessibility5.ax.txt), [normal](actual/footer-normal.png), [narrow](actual/footer-narrow.png).

Старый pass не переносился. Только этот visual fix и краткое сохранение normal/narrow-композиции; VO, полные suites, gates и архивы не запускались. Repo code/manifests/tasks/Git не менялись. Своя fixture остановлена, QA app завершён, simulator lock освобождён; устройство свободно.
