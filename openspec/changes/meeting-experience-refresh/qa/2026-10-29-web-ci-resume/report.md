# Исправление фактических падений Web CI — 29 октября 2026

## Scope и статус

Авторский прогон, не независимая приёмка. Заморожены шесть файлов web; список и SHA256 находятся в `receipt.json`. Единственное изменение runtime — обработка перенаправленного click от label в `useInputModality`. Сервер, дизайн, жесты и длительности анимаций не менялись. Commit/push/deploy выполняет основной агент.

Исходный CI: run40775239408, source6d6c496e, Tests job123122717054. Сохранены публичные annotations. В Linux были четыре падения базового набора и одно chat; локальные зелёные результаты ниже не заменяют новый Linux CI.

## Разбор и изменения

### 38 — переподключение

Старый тест выключал сеть через браузерную эмуляцию, отправлял сообщение и включал её за11–12мс. На Chromium событие WebSocket close приходило уже после online; ожидание гарантированного закрытия конкретного сокета в offline также неработоспособно в этом браузерном стенде (предыдущая отвергнутая попытка:6FAIL Chromium,6PASS WebKit). Эти данные сохранены в соседнем `2026-10-29-web-reconnect-ci-paused`; они не объявлены исправлением приложения.

Новый тест разрывает реальное соединение между настоящим SDK Centrifuge5.8.0 и Go API через pass-through `routeWebSocket.connectToServer`. До разрыва подтверждён subscribe ACK. Новые соединения временно удерживаются, сообщение сохраняется через API и отсутствует в UI. После восстановления обязательны: новое соединение, настоящий subscribe ACK, успешный HTTP GET sync с cursor и `entry_upsert` именно созданной записи, одно принятое сообщение. При terminal401 дальнейшие соединения прекращаются. Таймаут ожидания нового соединения остаётся5с.

Отдельный тест сохраняет browser offline/online events, HTTP catch-up и terminal401 revalidation. Поддельных ACK/данных SDK нет. Этот короткий тест не закрывает весь нормативный сценарий5мин/100изменений/RTT150мс.

### 51 — наблюдение анимации

Linux WebKit успел записать две rAF-пробы; требование «больше двух кадров» зависит от частоты отрисовки runner. Тест теперь получает настоящую CSSAnimation при начале reset и проверяет её в точках0/50/99% реального timeline: положительная длительность, промежуточная прозрачность, scale1 и постоянные размеры. Затем продолжает анимацию и ждёт завершения reset перед клавиатурным действием. Перелистывание в обе стороны, цикл, клавиатура, single-photo drag и reduced-motion остаются. Управляемый timeline не является доказательством визуальной плавности на устройстве.

### 53 — реальная ошибка фокуса WebKit

WebKit пересылает pointer click с label на radio как trusted click с detail0. Общий обработчик ошибочно считал его виртуальным клавиатурным вводом, поэтому появлялась рамка. Теперь на время текущей label activation хранится её конкретный control; только соответствующий forwarded click не меняет modality. Маркер очищается при новом вводе, после события и при cleanup. Другие trusted detail0, клавиатура, настоящий focus и editable-стили сохранены.

Тест явно фокусирует уже выбранное радио: macOS WebKit может оставить его размытым после клика, скрывая исходную ошибку. На старом bundle это даёт2/2 ожидаемых FAIL (390/1440, solid вместо none). После исправления проверены mouse label, trusted touch tap, Arrow/Space/Tab, selected color, ввод, file-picker cancel, modal return и viewer return. Реальная AT virtual activation без keydown не проверялась.

### 52 — открытый Linux CI дефект

Исходный Linux Chromium оставил fullscreen видимым после `close.tap()`. Локально тот же строгий путь проходит:8/8 при CPU×6 и ещё три финальных повтора без throttling. Причина пока не доказана. Runtime и ожидание tap→closed не изменены. К failure evidence добавлены click, координаты, pointerId, timestamp и aria-label кнопки. Следующий Linux CI должен сохранить trace/screenshot; нельзя называть этот дефект закрытым по локальному PASS.

## Проверки

| Прогон | Результат |
| --- | --- |
| Старый bundle, усиленный53 WebKit390/1440 | 2 ожидаемых FAIL; trace и screenshot сохранены |
| Новый38 transport + online, оба браузера ×5 | 20 PASS |
| Полный chat-suite | 38 PASS |
| Финальные51/52/53, оба движка ×3 | 51 PASS |
| 52 Chromium CPU×6 | 8 PASS, сбой CI не воспроизведён |
| `npm run check` | typecheck/lint/styles/architecture/format PASS;185unit PASS |
| `build:demo`, frozen bundle | PASS;253 файла |
| `git diff --check` для web | PASS |

В промежуточном варианте51 два падения относились к нажатию Arrow до завершения reset после управляемого timeline. Добавлено ожидание реального `data-resetting=false`; финальные51PASS относятся к этой версии. Первые запуски check выявили TypeScript-формальности нового evidence и запрет sandbox на IPC tsx; они исправлены/повторены штатной командой. Логи последнего полного check сохранены.

## Окружение и передача

macOS27.0.1 arm64, Node22.22.3, Go1.27.2, Playwright1.64.1; Chromium156.0.8078.4, WebKit27.2. Реальный mobile Safari не проверен. Пользовательский сервер8445 не затрагивался.

Frozen demo: `/tmp/somewhere-web-ci-resume-final-20261029`. Его253 SHA256 совпали побайтно с bundle всех финальных авторских прогонов (`sameBytesAsAuthorTestedBundle=true`). Исходный baseline: `/tmp/somewhere-web-ci47-demo-823d93d3`.

Отдельный memory fixture для независимого reviewer: `https://127.0.0.1:8466/`, Go API MAIN HEADff0a20aa, штатный `scripts/browser-server.ts`, собственные синтетические данные. Проверяющий может поднять тот же bundle на собственном порту. Основные автоматические команды: базовый config для51/52/53; `playwright.chat.config.ts` для38/полного chat. `SOMEWHERE_BROWSER_DIST` указывает на frozen bundle.

Кейсы: task15.1 в `meeting-experience-refresh/testing-manifest.json`; `TC-MEDIA-WEB-FORM-FOCUS` (`testing/cases/meeting-media.yaml`), `TC-VIBE-D2414F1E` (`meeting-memories.yaml`). Chat — нормативное восстановление в `chat-reliability-and-sync/protocol.md` и частичное покрытие `TC-CHAT-SYNC-BC07BEB1` (`testing/cases/chat-sync.yaml`). Полный gate этих кейсов этим отчётом не закрывается.

Остаются независимая проверка, новый Linux CI и диагностика52 при повторном падении. Никаких skip, увеличения таймаутов или ослабления >1 reconnect не добавлено.
