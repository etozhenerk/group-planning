# Web emoji motion 2.2.0 · 27.10.2026

Исполнитель `/root/web_cursor_motion`. Реализовано опубликованное дополнение 2.2.0;
композиция desktop popup и mobile dock сохранена. Это проверка исполнителя,
не независимый feature/design pass; gates и checkbox не закрывались.

## Кандидат и реализация

- Изолированная demo-сборка `.cache/qa/chat-correction-2.2.0/web-r10-demo`.
  SHA256 index.html `38eec08d1a97400fbd3de00da85e3a0685097f3251b0cdd5f34556afe0fab182`.
  [Per-file manifest](build-files.json), SHA256 manifest
  `80de0364d8d40f1a8a8e5f8397e2debb7acf566372d4648536d8b00f0e1c6a04`.
- [Исходники](source-files-r10.json); `useEmojiPresence` удерживает DOM выхода;
  `animateEmojiPanel` меняет mobile height/opacity и desktop opacity по ролям
  180/150 ms. Отмена сохраняет текущий кадр и блокирует прежний completion.
- Закрытие сразу применяет `inert`, `aria-hidden`, `pointer-events:none`.
  Reduce Motion не создаёт анимацию; возврат фокуса выполняется в layout phase.
  Border/safe area лежат внутри обрезаемой mobile-поверхности, поэтому внешний
  контейнер сворачивается до нуля. EmojiDock реакций не получает composer inset.
- API: существующий совместимый fixture binary
  `.cache/qa/2026-10-27-telegram-chat-1.4.1-r3/httpapi.test` на 8444.
  Memory fixture с синтетическими Сашей/Леной, ru-RU/Europe/Moscow.
  Пользовательский 8445, native 52531/61441 и immutable r9 не менялись.

## Проверки

TypeScript/demo build passed: [log](build-demo.log). Полный web:check с
119/119 tests после runtime-кода прошёл: [log](../../../chat-reliability-and-sync/qa/2026-10-27-cursor-fixes/web-check-run02.log).
После проверки скорректирован только harness; финальные проверки нового AddMenu
будут сохранены отдельным прогоном/кандидатом.

Targeted Playwright Chromium + WebKit, один worker, без retries, 14/14 passed:
[raw JSON](playwright-run03.json), [log](playwright-run03.log),
[screenshots/results](results-run03), [config](playwright.config.ts).

- 390 и 1440: промежуточные height/opacity (mobile) и opacity (desktop), точные
  durations 180/150; desktop keyframes не содержат height.
- Выход удерживает DOM, исключает hit testing/AX, Escape возвращает opener.
- Rapid reopen начинается с текущей opacity/height; старое завершение не удаляет
  открытую панель. Текст и selection 3–5 сохранены, keyboard toggle возвращает input.
- Reduce Motion: 0 animations, мгновенный выход, корректный фокус после поиска.
- Прежние E2E: повторная вставка/удаление, Back/Escape, compact 320×760,
  390×430 и 844×390, composer/send, anchor истории и хвоста при open/close.

Для покадровой проверки MutationObserver останавливает только animations
`data-emoji-panel`; тест задаёт currentTime 0/90/75 и завершает их вручную.
Он проверяет настоящий browser layout/WAAPI, а не скорость на физическом устройстве.
Screenshots промежуточных кадров и JSON samples находятся в raw attachments.

## Сохранённые неуспешные прогоны

[run01](playwright-run01.json): 10 pass / 4 fail.
Два старых WebKit layout assertions снимали input и dock/кнопку последовательно,
в разные кадры движения. Теперь окончательная геометрия проверяется после
`data-motion=open`; промежуточное положение composer проверяет отдельный motion test.
Два Chromium rapid assertions читали ещё closing после асинхронной React Router
навигации и перематывали старую анимацию в 0. [run02](playwright-run02.json):
12 pass / 2 fail с диагностикой, доказывающей `motion=closing`, duration=150
в ошибочно названном reopened sample. Ожидание `opening` исправляет harness;
продуктовый motion-код между этими прогонами не менялся. Старые raw/screenshots сохранены.

## Ограничения

Физический Safari/IME/VoiceOver, native, полный каталог и независимое сравнение
с дизайном здесь не проверялись. WebKit emulation не заменяет физический iPhone.
Новая анимация меню «+» 2.3 не входит в r10; её реализация/кандидат проверяются отдельно.
