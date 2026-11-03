# Android: прочитанность и возврат TalkBack

6.4 проверен основным агентом на emulator-5554/API 36, font_scale 1.8.
Финальный readers-a11y PASS 7.654 с: настоящий TLS API, автор и два других
аккаунта, error→retry→empty, серверные markers→«Прочитали 2» и оба имени.
Viewport error/empty сохраняется в пределах 1 dp; закрытие сохраняет Y строки
в пределах 2 dp. Visibility 500 мс, overlay/background, coalescing/server max
покрыты ChatReadingTests в текущих 197 unit; controller/repository не изменялись.

При включённом TalkBack фокус получен подписью счётчика, активирована её
реальная кнопка-родитель. Фокус перемещён к имени; настоящий ACTION_DISMISS
закрывает панель, findFocus(FOCUS_ACCESSIBILITY) возвращает исходную строку.
Финальный actual показывает рамку на нужном bubble. Речь TTS и физический
жест пользователя не выдаются за проверенные; использованы платформенные действия.

Исправлен реальный дефект возврата, сохранённый в before/: input focus сам
не возвращал TalkBack к сообщению. Теперь прежний focus снимается при открытии;
возврат ждёт основного окна/кадра и на API 34+ запрашивает accessibility focus
только у узла собственного View. Предыдущие API сохраняют FocusRequester-путь;
их TalkBack-поведение и физический телефон этим прогоном не подтверждены.
QA также учитывает lazy-окно, раздельные AX-узлы подписи/кнопки, Compose-часы
при async HTTP и поздний запрос уведомлений TalkBack. Непрошедшие итерации
не объявлены PASS. Настройки возвращены: font 1.0, services=null, enabled=0.

6.5: docs/chat-sync.md и README обновлены, UI сопоставлен с UX v1/контрактом.
После финального production-изменения check.sh PASS: format, чистые Debug/Release,
оба Lint, 197 unit без ошибок/skips и обе instrumentation-сборки.
Журнал: /tmp/somewhere-20261103-android-readers-check.log. Общие gates, старые ОС,
физическое устройство и release не объявляются пройденными.
