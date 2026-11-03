# Web 4.6 — сверка UX и владельцев

03.11.2026, основной агент, последовательно по поручению пользователя.
UX v1 сопоставлен с актуальным chat-actions и meeting-experience-refresh:
лента/окно — entities/meeting и FeedTimeline, outbox — features/send-message,
stream hints/catch-up — createChatUpdates, приватность — access epoch.
README и docs/chat-state.md описывают фактические адаптеры и владельцев.

Живой CUA на TLS memory API 8466: desktop 1280×720, mobile 390×844.
В desktop плюс открывает меню, дата — модальное окно поверх прежнего чата.
В mobile задача открывается нижней панелью без видимого крестика; закрытие
свайпом за handle возвращает тот же чат и прежний неотправленный черновик.
Фокус возвращается к плюсу. Нет нижней навигации и футера на экране чата.
Панель и поля находятся внутри viewport. Отправки/production/TG не выполнялись.

Проверки уже исполнены на неизменённом коде чата, повторно не запускались:
- 03.11 web:check — 230 unit, TypeScript, ESLint, FSD/AST, CSS, Prettier PASS;
  `/tmp/somewhere-85-web-check-retry.log`. Текущая QA Vite-сборка PASS,
  `/tmp/somewhere-85-release-identity-build.log`.
- 02.11 полный browser-набор 282 PASS, один cross-platform SKIP, chat 38,
  read 10, window 4 PASS: meeting-experience-refresh/qa/
  2026-11-02-web-final-viewport-independent/acceptance/suites.
  Включены 18-loading-logout, 27-mobile-scroll (visualViewport/offset/zoom,
  отсутствие второго scroll), 61-composer-outside-focus (touch/черновик/selection).
- 03.11 адресный IME Enter — 2/2 Chromium и mobile WebKit PASS,
  `/tmp/somewhere-45-ime.json`; окно/prepend/reset/ACK — исходный результат
  ../2026-11-02-sequential-web-window/result.md, якорь ≤2 px.

После этого production web менял только target ссылки PolicyContent.module.css
в 3b818444; chat/viewport/skeleton/outbox не менялись. Задержка заглушки
реализована DelayedSkeleton, первое открытие и локальная догрузка не заменяют
показанную ленту; эти состояния входят в перечисленные browser-тесты.

Это завершение конкретной сверки 4.6, не whole-client приёмка 7.6:
физический Safari, настоящая OS IME/клавиатура телефона, frame/memory,
общие design:ready/qa:ready и независимость не объявлены PASS.
