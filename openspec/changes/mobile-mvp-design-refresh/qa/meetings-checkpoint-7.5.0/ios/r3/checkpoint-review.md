# iOS meetings r3 — повтор трёх исправлений

**Targeted visual checkpoint: passed.** Один независимый сценарий,23,479с; три состояния просмотрены заново. Точный новый bundle `c64aa6a188b651984709329b229b20fbd48784ec72cbee9dceea76b4b1e0a4ae` проверен и подставлен после сборки runner ([binding](artifact-binding.json), [действия](smoke-independent.log)).

- Narrow320: заголовок/создание и периоды больше не складываются в вертикальные группы, один toggle доступен. [Снимок](actual/narrow-header-periods.png), [фактические metrics](actual/narrow-header-periods.environment.json).
- Calendar: лишней внешней surface/border нет; выделение компактное по опубликованной36pt форме, цифра и нижняя точка не перекрываются; область кнопки по AX44pt по высоте. Выбран день с реальной встречей. [Снимок](actual/flat-calendar-selected-dots.png), [AX](actual/flat-calendar-selected-dots.ax.txt). Сверено с неизменённым calendar-r7.
- Refresh: виден текст «Не удалось обновить встречи», карточки сохранены, toolbar не сместился; повтор убирает ошибку. [Снимок](actual/refresh-caption-fixed-toolbar.png).

Результаты прежнего R1 не переносились. Объём только эти три исправления, без повторения функциональной матрицы, больших шрифтов, full suites или финальных gates. PhysicalScreen402×874, narrow — настоящий QA UIWindow320×568 на том же симуляторе iOS27.0. VoiceOver не запускался. Product code/manifests/tasks/Git не менялись. Своя fixture остановлена, QA app завершён, lock освобождён; устройство свободно.
