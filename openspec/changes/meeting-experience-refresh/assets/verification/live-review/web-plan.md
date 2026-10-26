# План независимого live-ревью web

До source freeze captures/pass не выполняются. Используется отдельный Playwright Chromium BrowserContext на loopback test-only API, production dist; пользовательские браузеры и настройки доверия не меняются. Исходники приложений/тестов не редактируются.

## Окружение и происхождение

После нового design:context: свежий `npm run web:build`, затем runtime из `/tmp/somewhere-web-review-handoff.md` на свободном 8444. Bootstrap авторизации — только внешним harness через `/api/v1/auth/yandex/start` и локальный fake provider; production guard не меняется. Общая fixture: design-3 (Саша), 6 участников, встреча `deb00000-0000-4000-8000-000000000002`; member — отдельный контекст Лены. Для mutation-сценариев отдельные тестовые встречи, чтобы сохранять исходные данные reference-пары.

Каждый capture сохраняет sourceHash, hashes источников fixture, browser version, macOS version, locale ru-RU, timezone Europe/Moscow, viewport, text scale, CSS font stack и по возможности реальные font faces через Chrome DevTools Protocol. Снимки actual и raw reference получают один browser/runtime/viewport. Reference HTML читается без редактирования; отменённые footer/mobile Back учитываются по UX corrections. Raw credentials/cookies/CSRF в evidence не сохраняются.

## Последовательность

Для 320×844, 390×844, 768×1000, 1440×1000:

1. Список: weekday/weekend, 6 участников, no-cover; открытие чата и Back к прежней позиции. Отдельная длинная карточка и увеличение текста.
2. Plus menu: пять строк, повторный plus/Escape/наружный click, сохранённый composer и возврат фокуса; выбор каждого действия.
3. Date/place/task: open; focus и keyboard-навигация; close/reopen с черновиком; ошибка/повтор с тем же ключом; pending и блокировка повторного submit; access revoked; увеличенный текст; reduced motion. Software keyboard desktop Chromium не подменяет клавиатуру телефона — применимость фиксируется отдельно.
4. Photo/file: системный filechooser через testing API, preview, отмена/возврат, close/reopen, частичный отказ/повтор. Используются только известные fixture-изображения и синтетический текстовый файл, реальных пользовательских файлов нет.
5. Task details: открыть существующую задачу; проверить оболочку относительно актуального контракта; действие и retry на отдельной тестовой задаче.
6. Info: organizer/member, service links отсутствуют, settings возврат сохраняет контекст, сервисные ссылки доступны в profile.
7. Share: open, copy, cancel-return; Settings: open, keyboard, close/reopen, error-retry; Reaction people: open и close-return.

После каждой группы лично просматриваются actual/reference; автоматические assertions не являются итоговым визуальным вердиктом. Только пройденная тройка screenshot+reference+interaction может получить pass. Состояния, для которых отсутствует живой сценарий/средство проверки, получают blocked с конкретной причиной. Pixel regression и screenreader pass без их выполнения не заявляются.
