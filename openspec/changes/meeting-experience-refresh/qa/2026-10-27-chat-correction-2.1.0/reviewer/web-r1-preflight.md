# Web r1 · 2.1.0 · независимый preflight

27.10.2026, ревьюер `/root/chat_correction_review`. Статус **blocked** до
доступа к IAB. Работающее приложение в этом прогоне ещё не просмотрено,
никаких pass и результатов motion пока нет. Предыдущая evidence 2.0.0 сохранена.

## Точный кандидат

- Review URL: `https://127.0.0.1:8445`. По handoff координатора сервер PID22076
  продолжает работать, его dataset нужно сохранить. Ревьюер сервер не
  перезапускал и данные не сбрасывал. E2E исполнителя работает отдельно на8444.
- Receipt: `executor-logs/web-r1/web-artifacts.json` текущего QA-каталога.
- Независимо пересчитаны все253 файла `.cache/web-demo`; список и SHA-256 каждого
  файла совпали с receipt. Aggregate
  `ac820176279e1e446f4419dfddb7cb43416f83604cda0a18475f0d996c5e10de`.
  Детали: `web-r1-disk-verification.json`.
- Это **disk verification**. Фактически загруженные браузером resources ещё не
  получены; совпадение каталога не принимается за проверку served/loaded assets.
- Начальный design inputHash
  `8fe994121f75ca19647cd749b91fd85fa0bb6bfc1483f7d592007d99cd78fddf`.
  Native исходники продолжают меняться; общий inputHash не считается frozen.
  Матрица manifest сохранена: 1146 сочетаний screen/platform/state.
- Публикация `design-publication-2026-10-27-inline-cards-2.1.0.md` прочитана:
  это дополнительные token-роли прежнего принятого raw, без изменения raw.

## Доступ и проверки

1. `cua.createBrowserTab('2', reviewURL)` → `Browser is not available: 2`.
2. `cua.getState()` → `apps:[]`, `browsers:[]`; native error сообщает,
   что Mac locked и automatic unlock не удался.
3. Проверен предусмотренный IAB entry point `createBrowserTab('iab', reviewURL)`
   → `Browser is not available: iab`.

Координатор уведомлён. Далее Mac/browser не поллятся; обход блокировки или
другой runner не используется. Сессии/пароли/токены не читались и не выводились.

`design:context` завершился0, сохранён `design-context-web-start.log`.
`design:check` завершился1. stdout — `design-check-web-start.log`, stderr:
`Resolved legacy literals remain in the inventory; run npm run design:prune`.
Ревьюер inventory не меняет. Этот результат технический, не визуальный вердикт.

## Порядок продолжения после восстановления доступа

1. Открыть именно переданный кандидат, получить реально загруженные resource URLs
   и сверить их байты/hashes с receipt; зафиксировать runtime/viewport/locale/fonts.
2. Desktop768/1440: плюс → дата/место/задача/preview, modal над тем же чатом,
   close/Escape, draft/scroll/focus; проверить poll/task композицию по свежему raw.
3. Mobile320/390, low-height/landscape: caret/placeholder, emoji selection,
   русский поиск/повтор/keyboard-return, full picker bounds, peoplefilter.
4. Bubble hold, chip hold против tap, отмена движением, keyboard contextmenu.
   Обособленно получить временные свидетельства enter/exit/pressed/selected,
   normal и reduced motion; статичный кадр для длительности не годится.
5. Дата: минимум2, третий/удаление среднего, пять настроек, calendar return,
   deadline без weekday/equal-height/large-text, reopen/invalid/retry/secondactor
   в доступной изолированной среде. Непокрытое оставить blocked, кейсы не сокращать.

Никакие native pass, прежние screenshots, тесты исполнителя или чтение кода
не подставляются вместо live проверки текущего web-кандидата.
