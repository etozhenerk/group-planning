# iOS Info 7.8 r3 — только остаток F3

**PASS в переданном узком объёме.** Единственный normal402 сценарий прошёл14.736s,0failures. Это не финальные gates и не перенос результатов F1/F2.

Frozen artifact `b3d4082d2c287bfed4c3a22ebb453c88f9c0130dd3990e61cb547846e3630ffd`, source `ccfd074aa13686b8f1a2c1b0f86c0b6aa85ade478b41b45bdec54de514897a94`; [SHA binding](artifact-binding.json). Reviewer `/root/rsvp_web_feature_r2`, 05.11.2026; iOS27.0, simulator31262733-50DC-46A5-938E-4C462D70F109, normal UIWindow402×874.

[Actual](actual/company-heading-counter-arrow.png), [AX](actual/company-heading-counter-arrow.ax.txt), [геометрия](actual/company-geometry.json): literal «Кто придёт»; счётчик6 находится у правого края строки, его maxX374.796 совпадает с правым краем компании; центры heading/counter согласованы. Меньший спокойный counter соответствует13/regular/muted по опубликованной роли и визуальному сравнению. Действие показывает «Все ответы · 6 →». Сверено с published nav-info и normalized Info.

[Action log](smoke-independent.log), [driver](driver.swift). Cover/RSVP/320/roster/share/settings и прочие flows не повторялись. VO и gates не запускались. Код/Git/tasks/manifests не менялись. Собственная memory-fixture остановлена, app завершено, lock освобождён; настройки устройства не менялись, simulator свободен.
