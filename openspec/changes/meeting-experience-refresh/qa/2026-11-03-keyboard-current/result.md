# 17.4 — текущие проверки клавиатуры

03.11.2026, основной агент, без новых субагентов по решению пользователя.

- iOS: три ChatKeyboardDismissalUITests PASS,109.731с, реальная экранная IME.
  Черновик/выделение, первое Send/плюс/шапка, отсутствие возврата клавиатуры
  после закрытия панели, поиск emoji, scroll и long press. Автоматическая
  минимизация клавиатуры восстановлена.
- Android emulator-5554/API36: composer-focus,9/9 PASS,56.989с. В промежуточной
  сводке указано6; фактический instrumentation.log содержит9. Помимо внешнего
  tap пройдены стабильность selection/typing и возврат из emoji-search.
  Собственный reverse и QA fixture очищены скриптом.
- Web:8/8 Chromium/mobile-WebKit PASS,28.459с; first-action, scroll/longpress,
  другие поля и Tab. Первые две команды не начали тесты из-за пути к
  Playwright/tsx; исправлен только PATH запуска, продукт не менялся.

Новые независимые/полные gates не заявлены. qa:ready --tasks17.4 отклоняет
старые acceptance plans: Stale catalog or unresolved coverage. design:ready
также не проходит: у параллельно создаваемого mobile-mvp-design-refresh ещё
нет design manifest. Чужой каталог и правила gate не менялись.
Сами17.1–17.3 уже закрыты;17.4 пока остаётся открытым из-за оставшейся формальной
и ручной приёмки. Физический mobile Safari не проверен.

Production/CI/релизы/Telegram не затрагивались.
