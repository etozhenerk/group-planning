# Визуальная проверка web

Снимки зафиксированы при паузе 26.10.2026; новые прогоны после команды паузы
не запускались. 180 PNG и два JSON с измерениями уже были получены до паузы.

В actual тестовая плашка Demo высотой32px; она отсутствует в release.
Последние решения пользователя имеют приоритет над исходными reference:
футер только на desktop onboarding, нижняя панель только в списках и основном
профиле. Исходные HTML/CSS не изменялись.

Заполненный чат и profile-personal используют общий native design fixture.
В остальных сценах даты, числа участников и состояние тестовых данных могут
отличаться. Подробности и остаточные отличия — в
[отчёте](../../../web-verification.md).

| Сцена | 320 px | 390 px | 768 px | 1440 px |
| --- | --- | --- | --- | --- |
| about | [Приложение](about-320-actual.png) / [Макет](about-320-reference.png) | [Приложение](about-390-actual.png) / [Макет](about-390-reference.png) | [Приложение](about-768-actual.png) / [Макет](about-768-reference.png) | [Приложение](about-1440-actual.png) / [Макет](about-1440-reference.png) |
| action-date | [Приложение](action-date-320-actual.png) / [Макет](action-date-320-reference.png) | [Приложение](action-date-390-actual.png) / [Макет](action-date-390-reference.png) | [Приложение](action-date-768-actual.png) / [Макет](action-date-768-reference.png) | [Приложение](action-date-1440-actual.png) / [Макет](action-date-1440-reference.png) |
| action-place | [Приложение](action-place-320-actual.png) / [Макет](action-place-320-reference.png) | [Приложение](action-place-390-actual.png) / [Макет](action-place-390-reference.png) | [Приложение](action-place-768-actual.png) / [Макет](action-place-768-reference.png) | [Приложение](action-place-1440-actual.png) / [Макет](action-place-1440-reference.png) |
| action-task | [Приложение](action-task-320-actual.png) / [Макет](action-task-320-reference.png) | [Приложение](action-task-390-actual.png) / [Макет](action-task-390-reference.png) | [Приложение](action-task-768-actual.png) / [Макет](action-task-768-reference.png) | [Приложение](action-task-1440-actual.png) / [Макет](action-task-1440-reference.png) |
| album | [Приложение](album-320-actual.png) / [Макет](album-320-reference.png) | [Приложение](album-390-actual.png) / [Макет](album-390-reference.png) | [Приложение](album-768-actual.png) / [Макет](album-768-reference.png) | [Приложение](album-1440-actual.png) / [Макет](album-1440-reference.png) |
| album-grid | — | [Приложение](album-grid-390-actual.png) / [Макет](album-grid-390-reference.png) | — | [Приложение](album-grid-1440-actual.png) / [Макет](album-grid-1440-reference.png) |
| calendar | [Приложение](calendar-320-actual.png) / [Макет](calendar-320-reference.png) | [Приложение](calendar-390-actual.png) / [Макет](calendar-390-reference.png) | [Приложение](calendar-768-actual.png) / [Макет](calendar-768-reference.png) | [Приложение](calendar-1440-actual.png) / [Макет](calendar-1440-reference.png) |
| chat | [Приложение](chat-320-actual.png) / [Макет](chat-320-reference.png) | [Приложение](chat-390-actual.png) / [Макет](chat-390-reference.png) | [Приложение](chat-768-actual.png) / [Макет](chat-768-reference.png) | [Приложение](chat-1440-actual.png) / [Макет](chat-1440-reference.png) |
| chat-filled | — | [Приложение](chat-filled-390-actual.png) / [Макет](chat-filled-390-reference.png) | — | [Приложение](chat-filled-1440-actual.png) / [Макет](chat-filled-1440-reference.png) |
| cookies | [Приложение](cookies-320-actual.png) / [Макет](cookies-320-reference.png) | [Приложение](cookies-390-actual.png) / [Макет](cookies-390-reference.png) | [Приложение](cookies-768-actual.png) / [Макет](cookies-768-reference.png) | [Приложение](cookies-1440-actual.png) / [Макет](cookies-1440-reference.png) |
| create | [Приложение](create-320-actual.png) / [Макет](create-320-reference.png) | [Приложение](create-390-actual.png) / [Макет](create-390-reference.png) | [Приложение](create-768-actual.png) / [Макет](create-768-reference.png) | [Приложение](create-1440-actual.png) / [Макет](create-1440-reference.png) |
| emoji | [Приложение](emoji-320-actual.png) / [Макет](emoji-320-reference.png) | [Приложение](emoji-390-actual.png) / [Макет](emoji-390-reference.png) | [Приложение](emoji-768-actual.png) / [Макет](emoji-768-reference.png) | [Приложение](emoji-1440-actual.png) / [Макет](emoji-1440-reference.png) |
| help | [Приложение](help-320-actual.png) / [Макет](help-320-reference.png) | [Приложение](help-390-actual.png) / [Макет](help-390-reference.png) | [Приложение](help-768-actual.png) / [Макет](help-768-reference.png) | [Приложение](help-1440-actual.png) / [Макет](help-1440-reference.png) |
| invitations | [Приложение](invitations-320-actual.png) / [Макет](invitations-320-reference.png) | [Приложение](invitations-390-actual.png) / [Макет](invitations-390-reference.png) | [Приложение](invitations-768-actual.png) / [Макет](invitations-768-reference.png) | [Приложение](invitations-1440-actual.png) / [Макет](invitations-1440-reference.png) |
| list | [Приложение](list-320-actual.png) / [Макет](list-320-reference.png) | [Приложение](list-390-actual.png) / [Макет](list-390-reference.png) | [Приложение](list-768-actual.png) / [Макет](list-768-reference.png) | [Приложение](list-1440-actual.png) / [Макет](list-1440-reference.png) |
| memories-banner | [Приложение](memories-banner-320-actual.png) / [Макет](memories-banner-320-reference.png) | [Приложение](memories-banner-390-actual.png) / [Макет](memories-banner-390-reference.png) | [Приложение](memories-banner-768-actual.png) / [Макет](memories-banner-768-reference.png) | [Приложение](memories-banner-1440-actual.png) / [Макет](memories-banner-1440-reference.png) |
| menu | [Приложение](menu-320-actual.png) / [Макет](menu-320-reference.png) | [Приложение](menu-390-actual.png) / [Макет](menu-390-reference.png) | [Приложение](menu-768-actual.png) / [Макет](menu-768-reference.png) | [Приложение](menu-1440-actual.png) / [Макет](menu-1440-reference.png) |
| photo | — | [Приложение](photo-390-actual.png) / [Макет](photo-390-reference.png) | — | [Приложение](photo-1440-actual.png) / [Макет](photo-1440-reference.png) |
| privacy | [Приложение](privacy-320-actual.png) / [Макет](privacy-320-reference.png) | [Приложение](privacy-390-actual.png) / [Макет](privacy-390-reference.png) | [Приложение](privacy-768-actual.png) / [Макет](privacy-768-reference.png) | [Приложение](privacy-1440-actual.png) / [Макет](privacy-1440-reference.png) |
| profile | [Приложение](profile-320-actual.png) / [Макет](profile-320-reference.png) | [Приложение](profile-390-actual.png) / [Макет](profile-390-reference.png) | [Приложение](profile-768-actual.png) / [Макет](profile-768-reference.png) | [Приложение](profile-1440-actual.png) / [Макет](profile-1440-reference.png) |
| profile-personal | — | [Приложение](profile-personal-390-actual.png) / [Макет](profile-personal-390-reference.png) | — | [Приложение](profile-personal-1440-actual.png) / [Макет](profile-personal-1440-reference.png) |
| reactions | — | [Приложение](reactions-390-actual.png) / [Макет](reactions-390-reference.png) | — | [Приложение](reactions-1440-actual.png) / [Макет](reactions-1440-reference.png) |
| share | [Приложение](share-320-actual.png) / [Макет](share-320-reference.png) | [Приложение](share-390-actual.png) / [Макет](share-390-reference.png) | [Приложение](share-768-actual.png) / [Макет](share-768-reference.png) | [Приложение](share-1440-actual.png) / [Макет](share-1440-reference.png) |
| support | [Приложение](support-320-actual.png) / [Макет](support-320-reference.png) | [Приложение](support-390-actual.png) / [Макет](support-390-reference.png) | [Приложение](support-768-actual.png) / [Макет](support-768-reference.png) | [Приложение](support-1440-actual.png) / [Макет](support-1440-reference.png) |
| upload | — | [Приложение](upload-390-actual.png) / [Макет](upload-390-reference.png) | — | [Приложение](upload-1440-actual.png) / [Макет](upload-1440-reference.png) |
| upload-file | — | [Приложение](upload-file-390-actual.png) / [Макет](upload-file-390-reference.png) | — | [Приложение](upload-file-1440-actual.png) / [Макет](upload-file-1440-reference.png) |

Измерения профиля: [390 px](profile-metrics-390.json), [1440 px](profile-metrics-1440.json).
