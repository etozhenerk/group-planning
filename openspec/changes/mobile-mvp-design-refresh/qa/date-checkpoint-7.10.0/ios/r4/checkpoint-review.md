# Date iOS R4 — один320 layout

Вердикт: **PASS в согласованном узком объёме**. Оставшееся замечание narrow deadline устранено.

[Точный binding](artifact-binding.json): artifact `afb00eea380cd51e8d6f4b4e5c6c260b51189c60e1840fca0669b3704509dde1`, source `e49c76a9e3abb6ddc3b7069487a5f53a8c8edb2d3fe82735c519ca7c1fcde252`. Все20 файлов frozen и подставленного mainApp проверены по SHA. Уже собранный proof-only runner переиспользован без rebuild; [provenance](runner-reuse.json).

В [actual](actual/320-compact-deadline.png) дата показана одной строкой «6.11», время22:58. [Обе кнопки134×46pt](actual/320-deadline-metrics.json), одинаковый minY398.7; подписи также на одной линии. Доступное значение даты сохранило полное «6 ноября»: [AX](actual/320-compact-deadline.ax.txt). Helper и закреплённое действие видны, переполнения даты нет.

Выполнен только `testNarrowProofOnly`, PASS19.000с: [журнал](layout-proof-only.log). Context подтверждает настоящий QA UIWindow320×568 на том же physical screen402×874, iOS27.0, обычный размер текста L. Префикс класса/снимка R3 — имя неизменённого runner, текущий mainApp и actual относятся к R4.

Карточка/actions/API seed/dirty/unknown/создание/голосование и старые сценарии не повторялись; старые pass не переносились. VoiceOver и настройки клавиатуры не читались/не менялись. Финальные suites/gates не запускались. Собственная memory fixture остановлена, приложение завершено runner, lock освобождён; source/device свободны. Код/cases/manifests/tasks/Git не менялись.
