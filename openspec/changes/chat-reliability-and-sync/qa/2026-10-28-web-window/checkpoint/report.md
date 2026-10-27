# Web 4.4: checkpoint ограниченного окна

Реализовано ограниченное окно до 500 обычных server rows с отдельным удержанием
фокусной строки и локальной очереди. TanStack Virtual 3.14.23 (MIT) монтирует
до 200 обычных строк; focus/pending удерживаются отдельно. Stable key сохраняется
после ACK. История загружается около двух viewport, HTTP receive cursor независим
от окна истории, stale page/receive после eviction не возвращает удалённый диапазон.
Reset/around сохраняет entry ID + offset; позднее изменение высоты, локальная ошибка
history/retry и отправка из истории не прыгают к хвосту. Кнопка новых сообщений
считает чужие сообщения, включая страницу с membership invalidation, и явно
возвращает к хвосту.

Выбор библиотеки и воспроизводимый неуспех Virtuoso сохранены в соседнем
virtualization-spike.md. Исходные прототипы, JSON и PNG сохранены. В design,
proposal, task 1.4 и testing уточнён результат spike; checkbox не изменён.
Rollout уточнён по backend: глобальный read flag + sync key gate и совместимый
binary при rollback; старый binary без migration007 не считается ready.

Проверено на точном source/build из candidate.json, отдельно от main:

- `npm run web:check`: 153 unit, lint, stylelint, TypeScript, архитектурные проверки PASS.
- `npm run --workspace @somewhere/web build:demo` и `build`: PASS.
- `SOMEWHERE_CHAT_FIXTURE_BIN=/tmp/chat-realtime-browser-fix.test npm exec --workspace @somewhere/web -- playwright test --config playwright.chat.config.ts --workers 1 --reporter=json`: 22/22.
- Такой же runner с `playwright.chat-regression.config.ts` и grep `two tabs share|reaction toggle|failed reaction|touch hold|message retry after a lost response|an offline message`: 12/12.
- Такой же runner с `playwright.window.config.ts`: 4/4, Chromium и mobile WebKit.
- `npm run qa:test`: 12/12. `npm run agent:check`, `git diff --check`: PASS.

Window E2E создаёт 720 настоящих сообщений HTTP, проверяет bounded rows,
удержание DOM focus, resize, HTTP410 → around snapshot → catch-up, отправку
из истории, чужой счётчик и возврат к последнему сообщению. Второй сценарий
проверяет локальную ошибку history503 и retry с сохранением того же entry ID
и offset ≤2px после layout. Ошибки промежуточных прогонов сохранены; expectations
не смягчены. Исправлены capture старого virtual DOM в scroll-event и смещение
при изменении высоты history header. Unit отдельно проверяет stale receive после
trim окна и запоздалую страницу истории.

`qa:check` в этом snapshot не принят: сначала отсутствовал старый общий
meeting-experience-refresh QA plan; при чтении двух файлов из main проверка
правильно обнаружила устаревший catalog. Manifest/ссылки и прежняя приёмка не
переписаны. Root повторит gate в актуальном main. Установленная nested exact
зависимость приложения отличается от root версии зависимости Gravity; agent
check теперь учитывает workspace node_modules, как реальный npm resolution.

Ограничения: это checkpoint, не feature/design acceptance. Полный 10k сценарий
с first_unread относится к следующему read-state срезу. Физическая IME,
VoiceOver, реальные устройства и кадровые метрики здесь не проверены. В spike
CompositionEvent синтетический. Полный прежний E2E набор будет один раз после4.5.
Read-state UI в этом checkpoint не включён, task4.4/4.5 и независимые gates открыты.
Backend fixture exact d32deaa, sync/realtime=true, read_state=false; main и
пользовательские fixtures не изменены. SHA и каждый файл обоих dist сохранены
в candidate.json; raw check/build/E2E логи находятся рядом.
