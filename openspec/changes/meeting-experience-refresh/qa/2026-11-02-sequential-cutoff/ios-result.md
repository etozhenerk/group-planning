# Проверка 5.2 — iOS

Локальный штатный API fixture, Xcode 27.1 / iPhone 18 Pro simulator, iOS 27.0. `InvitationUITests/testCutoffForegroundDateOnlyReturnAndStaleSubmission` — PASS, 55.204 с; ios.log и ios-actual/manifest.json.

В одном реальном XCUITest проверены: дата без времени допускает вступление; текущий участник сохраняет чат после переноса начала внутрь часа; после отказа повторное вступление недоступно; Home → изменение времени встречи сервером → activate обновляет приглашение; достижение границы на открытом экране отключает «Приду»; выбранный до изменения даты ответ при сохранении отклоняется сервером, приватного чата нет, данные приглашения сохранены. Снимки результата извлечены и просмотрены.

Миллисекундная inclusive-граница и current-going исключение уже проходят в ExperienceTests.invitationCutoffIsInclusiveAndKeepsCurrentParticipants (существующий r7 unit-результат). Production/iPhone не использованы. Клавиатурная настройка восстановлена в 1. Общие незавершённые design/QA gates других состояний не объявлены PASS.
