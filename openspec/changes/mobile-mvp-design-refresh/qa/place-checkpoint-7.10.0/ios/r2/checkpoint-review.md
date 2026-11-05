# Place iOS R2 — targeted repeat

Вердикт: **PASS в согласованном объёме исправлений**. Финальные gates/pixel regression не запускались.

[Binding](artifact-binding.json): artifact `f8044e49989950469a6010c6d98588717e631e56a3de30ccf71d31bbd6e2b156`, source `d59f5f5209518551691be4a1b418405a08d15c84e7a1669b335fbd6766020fa0`. Все 20 файлов frozen/copied host проверены по SHA.

- Active footer содержит одно «Место пока прежнее»; подпись/счётчик раздельно, как в active raw. Ballot теперь 14 pt; один реальный голос подтверждён API, выделение OwnMessage/OwnText видно. [До голоса](actual/normal-active-card.png), [после](actual/normal-confirmed-selected-card.png), [API](actual/confirmed-selected-vote.json). Опрос создан прямым API только как QA-предусловие, UI create/unknown/dirty не повторялись.
- Empty hint точный: «Укажите новое место», расположен у поля. [Actual](actual/empty-hint.png).
- Готовый TestIOSFixture case `place-rejected` дал readonly без нового result flow: [серверное предусловие](actual/existing-readonly-fixture-precondition.json) подтверждает rejected/can_vote=false. На320 видны приглушённые единые «За · 0»/«Против · 0», кнопок голосования нет. [Actual](actual/320-readonly-rejected.png). Верх карточки частично вне viewport; полная result-композиция не принималась заново.

Метод A PASS **19.010 с**, B PASS **9.209 с**: [журнал](smoke-independent.log), [driver](driver-independent.swift). AX active buttons147×46pt, native target≥44 выполнен; raw140×48px. 48pt/pixel-exact совпадение не заявляется.

References сняты с clock **2026-11-05T10:00:00Z**: [active](reference-poll-clock.png), [readonly rejected](reference-rejected-clock.png), [clock metadata](reference-clock.json). Active space-between корректен; readonly единая строка — отдельное состояние. Ошибка первоначального R1 сравнения с истёкшим SPAN отражена в исправленном R1-отчёте; его старые raw-файлы сохранены.

iOS27.0, обычный текст L; actual402×874 и QA UIWindow320×568 на physical screen402×874 подтверждены context. Старые pass не переносились. VoiceOver/карты/полные matrices/suites/gates исключены. Своя memory fixture остановлена, приложение/lock освобождены, настройки устройства не менялись. Код/cases/manifests/tasks/Git не менялись; новых app runtime после двух методов нет.
