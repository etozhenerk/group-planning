# Общая пачка исправлений native · 07.11.2026

Это кандидат и авторский preflight, не независимая приёмка и не закрытие задач.
Исторические R9 отчёты и hashes сохранены. Продуктовые галочки открыты.

Исправлены масштабируемая ширина текста/аватара и конкуренция удержания чипа
реакции с меню сообщения в iOS. QA bindings обновлены по принятым info/settings:
обложка, Switch диагностики, review конфликта, отдельная форма ответа участника.
Убрано предположение о фиксированном числе участников общей fixture: проверяются
реальные уникальные user.id и состав organizer/going до и после ответа.
В iOS и Android добавлены опубликованные состояния метаданных About и скрытие
отсутствующего номера сборки. Production использует фактическую identity;
принудительные local/unavailable — только типизированные native QA fixtures.

## Что фактически выполнено

- Первый iOS author preflight:10 из12 прежних отрицательных UI-методов passed.
  Два оставшихся выявили ошибку helper-прокрутки и неверное чтение API в тесте;
  они исправлены. Общий первый command exit1, это не suite pass.
- Второй targeted preflight: DesignExperience large forms passed47.072s,
  Invitation three responses/reentry/withdrawal passed95.607s. XCUITest execute
  succeeded. Temporary runner выбрал2 метода при all-main fixture scope,
  поэтому fixture postassert полного feed flow закономерно не выполнен и
  общий command exit1. Это setup limitation, не pass полного ios-ui.
- NativeEmpty incoming-after-Share прошёл в первом повторе22.913s. Прежний
  общий timeout остаётся в истории; добавлен failure teardown для следующего
  полного прогона, assertion доставки сохранён.
- iOS strict swift-format, production clean simulator build и analyze passed.
- Android QA/instrumentation APK и formatApply passed52s/72tasks.
- agent:check и design:check67 passed; структурный check не заменяет UI gates.
- Новые unit-проверки метаданных ещё ожидают штатного прогона после freeze.

Независимые новые планы и доказательства: ios-r10/android-r10. Только после
реальных full suites, обязательного manual/design coverage и scoped gates
разрешено закрывать кодовые и приёмочные checkbox. Unit/build не заменяют их.
