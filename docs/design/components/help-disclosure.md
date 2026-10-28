# Вопросы и ответы

Одобрено пользователем28.10.2026: [макет](../../../openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-28-help-disclosure/index.html).

Вся строка вопроса — один button с expanded state. Справа плюс размером20,
штрихи14×2; при раскрытии вертикальный штрих поворачивается и исчезает,
оставляя минус. Вопрос14/550, line-height1.5; ответ14, line-height1.7.
Скругление16; inset mobile20, desktop22 по вертикали/24 по горизонтали.
Роли опубликованы в component.helpDisclosure и typography.helpQuestion/helpAnswer.

Высота раскрывается по содержимому за motion.card220ms, opacity за motion.fast150ms;
обратное движение симметрично. Reduce Motion меняет состояние сразу. Скрытый ответ
не читается скринридером; фокус остаётся на вопросе. Нет системного disclosure-marker,
unicode-стрелок и дополнительных кнопок. Тексты и ссылки помощи сохранены.
