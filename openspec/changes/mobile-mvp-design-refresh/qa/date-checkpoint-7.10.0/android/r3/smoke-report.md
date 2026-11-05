# Android Date R3 — два визуальных исправления

**Observed-pass в заданном targeted scope**, новых замечаний нет. Не финальная приёмка экрана и не gate.

На exact frozen R3 APK `20aaa0e35c98c47cd76d3eb72891e3c6021dc2abde9f8ffcd3d61a0196dc2f64`, source кандидата `045da902c078d7b0af5daf82dd8500aa5fb66747462f1ad14d934a6d4012966a`, снят ровно один actual normal360×800dp/API36: [card360.png](card360.png), [card360.xml](card360.xml).

- Disabled «Проголосовать» без выбранной даты визуально приглушена по принятой коррекции .65; XML parent `enabled=false`. Ранее светлая кнопка выглядела активной.
- «Предложить дату» теперь accent, с левым + и regular текстом; композиция соответствует принятому raw nav-date/date-r1. Размеры18/8/15/padding0 подтверждены read-only исходником, скриншот подтверждает фактический вид, точная пиксельная регрессия не заявляется.

Сравнение с неизменным [raw reference R2](../r2/reference-card360.png), binding/hash: [review-binding.json](review-binding.json). Переиспользована прежняя reference-картинка, не прежний actual или pass. Карточка подготовлена реальным authenticated API. Только запуск и один кадр; dirty/unknown/layout/retry/голос не повторялись, runner не пересобирался. Голоса0, avatar fallback; прочие состояния вне scope. Финальные gates, VO/TalkBack и карты не запускались.

[Installed hash](installed-after.json) совпал. [Cleanup](cleanup.json): globals не менялись и совпали, QA app/собственный fixture остановлены, свои config/namespace/reverse удалены. Source/device RELEASED. Изменены только QA-файлы R3.
