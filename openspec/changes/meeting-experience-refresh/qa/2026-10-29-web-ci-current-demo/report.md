# Локальный повтор падающих CI-наборов

Проверка выполнялась на текущем MAIN `138aa335cca4d68895394ca623f43c3ff73f6ed6`. `frontend/web` идентичен release source 823d93d3. Demo собран штатным `build:demo` в отдельный временный каталог; сервер — текущий Go memory fixture через штатный `browser-server.ts`. Production OAuth adapter не применялся, тесты и runtime не менялись.

| Набор | Команда | Результат |
| --- | --- | --- |
| Base | `playwright test --config playwright.config.ts` | 262 PASS, 1 SKIP, exit 0, 11.0 мин |
| Chat | `playwright test --config playwright.chat.config.ts` | 36 PASS, exit 0, 2.4 мин |

Штатный SKIP относится только к 08-cross-platform: fixture нативных приложений не задан. Исходные тесты 17 и 47 прошли без адаптаций. Сценарии сетевых ошибок реакций, свайпов вайбов, возврата фокуса, busy/dirty-панелей и отложенного индикатора отправки также завершились успешно.

Среда: macOS 27.0.1 arm64, Node 22.22.3, Go 1.27.2, Playwright 1.64.1, Chromium 156.0.8078.4 и WebKit 27.2. GitHub CI использует Ubuntu 24.04; его падения base/chat локально не воспроизведены. Эти результаты не означают, что CI исправлен. Основной агент включает штатный GitHub reporter для получения конкретных assertions следующего запуска через Checks API.

Два временных сервера принадлежат только этим проверкам (8444/8458) и завершились вместе с Playwright. Пользовательский `.cache/web-demo`, опубликованный rc11 и production не изменялись. Подробные команды, хеши demo и конфигурации — `environment.json`; логи и скриншоты сохранены рядом.
