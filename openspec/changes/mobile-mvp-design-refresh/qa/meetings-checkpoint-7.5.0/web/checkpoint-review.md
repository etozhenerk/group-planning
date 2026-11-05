# Мои встречи · независимый checkpoint7.5

Нужна одна правка перед следующим checkpoint: M1/P2 — пустой раздел «Прошедшие» использует upcoming-абзац и кнопку «Создать встречу». В утверждённом list-r3 здесь «Перейдите к предстоящим, чтобы посмотреть ближайшие планы.» без создания внутри empty-блока. Actual/reference: past-empty-actual.png, past-empty-reference.png. Место: HomeEmpty.tsx; проверить переиспользование в календаре.

Unread ограничен окружением:8891 возвращает sync=false/read_state=false/realtime=false и не возвращает unread_count. После двух реальных сообщений другого пользователя счётчик нельзя принять на этом стенде; это не записано как баг клиента. Нужен один targeted unread-проход на том же dist с read_state/realtime.

Проверены Chromium320/390 и WebKit390:ready/long без горизонтального overflow,периоды,offset659→659 после card→chat→Back,calendar day7→list→calendar,empty day,реальные Maybe и открытие ответа. Initial-error→Retry работает; refresh-error сохраняет6карточек. Desktop1100 — spot без нарушения базовой композиции. Source до/после совпал с frozen7.5.

Это короткий checkpoint:нет pass всему manifest,финальных gates/checkbox. Screens/actions/SHA и ограничения — checkpoint-review.json. Полные suites/123-state матрица/упаковки не выполнялись; код/manifests/tasks/Git не менялись.
