# Receive cursor: model commit и RED → GREEN

Commit `15bf46c43fa2594f86f6feba1945cb26f7655e59`, ветка
`codex/chat-receive-cursor`, база `0dc1997`. Изменены только модель web-чата
и её регрессии. Основной checkout, frozen r8, пользовательский API 8445
и его dataset этой работой не менялись. Никакой UI-приёмки или готовности
всего `chat-reliability-and-sync` этот отчёт не заявляет.

## Что исправлено

`Conversation.receiveCursor` начинается с `0` и подтверждается только после
успешной цепочки GET. Initial остаётся запросом хвоста; после пустого initial
используется `after=0`. ACK, история `before` и `latestSequence` курсор не двигают.
Decimal uint64 остаётся строкой; сравнение использует BigInt. Ошибка второй
страницы или применения не подтверждает частичный результат; непродвигающийся
`has_more` не создаёт бесконечный цикл. Существующий access epoch/guard сохранён.

Отдельная регрессия настоящего QueryClient подтвердила дополнительную гонку:
ACK в `queueMicrotask` между возвратом reader и commit GET мог исчезнуть из cache.
`shareConversation` объединяет записи с актуальным cache в синхронном callback
`structuralSharing`, сохраняя receive cursor входящего GET. Проверка наблюдает
все обновления cache после ACK: запись не исчезает даже временно.

## Точные изменённые файлы

Все пути относительно корня worktree:

- `frontend/web/src/entities/meeting/model/types.ts`
- `frontend/web/src/entities/meeting/model/useConversation.ts`
- `frontend/web/src/entities/meeting/model/loadConversation.ts`
- `frontend/web/src/entities/meeting/model/shareConversation.ts`
- `frontend/web/src/entities/meeting/model/loadConversation.test.ts`
- `frontend/web/src/entities/meeting/model/conversationAccess.test.ts`
- `frontend/web/src/entities/meeting/model/tests/conversationFixture.ts`

`mapFeed.ts` и UI не изменены. Перед началом `useConversation.ts`, `types.ts`
и `mapFeed.ts` были побайтово одинаковы с оригинальным main. Новых dependencies нет;
локальный `node_modules` — некоммитившаяся ссылка на уже установленные зависимости.

## Сетевой результат

Оба прогона используют реальные GET/POST, тот же API fixture binary, отдельный
memory.Store и один Chromium worker на loopback 8444. Ответы не подменяются.

| Факт | RED: frozen r8 | GREEN: cursor candidate |
| --- | --- | --- |
| Initial | Получены 51…100 | Получены 51…100 |
| Порядок | Чужая 101 → собственный ACK 102 → первый incremental GET | Тот же |
| Первый запрос | `after_sequence=102`, пусто | `after_sequence=100`, записи 101/102 |
| Следующий запрос | `after_sequence=102`, пусто | `after_sequence=102`, пусто |
| DOM 100/101/102 | 1 / 0 / 1 | 1 / 1 / 1 |
| Правильные assertions | `1 failed`, exit 1 | `1 passed (4.4s)`, exit 0 |

RED: [network](../run02/network.jsonl), [actual](../run02/actual.json),
[raw failure](../run02/playwright.log).
GREEN: [network](runtime/run02/network.jsonl), [actual](runtime/run02/actual.json),
[raw pass](runtime/run02/playwright.log), [environment](runtime/run02/environment.json).

Точный demo SHA256 кандидата:
`9b69ffd7da111c4dd35996005569c220e097daae7e00dc34c27e283ee4f0f088`.
Он собран только в `.cache/web-demo` выделенного worktree.

Временный harness и assertions сохранены в `runtime/run02/harness/`. Единственное
отличие timing от RED — 50 мс browser-clock flush между fill и Enter: старый UI tree
хранит draft в QueryClient, а r8 уже использует локальное состояние. Проверка
отсутствия incremental GET до ACK сохранена. Серверные часы не меняются.
`runtime/run01` сохранён как ошибка предусловия: при замороженных таймерах
старый draft не успел примениться, POST не ушёл, cursor assertions не выполнялись.

## Engineering checks

- [Все unit/integration](engineering/final-unit.log): 26 файлов, **100/100**;
  в том числе 14 cursor/access tests.
- [Commit-gap GREEN](engineering/commit-gap-green.log): **14/14**.
  [Красный результат](engineering/commit-gap-red-r2.log) сохранён отдельно.
- [Scoped ESLint](engineering/final-scoped-lint.log),
  [scoped Prettier](engineering/final-scoped-format.log), TypeScript,
  [production build](engineering/final-production-build.log),
  [demo build](engineering/final-demo-build.log) — pass.
  Оба build включают TypeScript-check. CSS styles, полный Prettier и
  `git diff --check` перед commit также прошли.
- Полный `web:check` **не pass**: в неизменённом UI базы `0dc1997` есть
  [missing blank line в summaryTimeLabel.ts:18](engineering/web-check.log).
  Отдельный [architecture check](engineering/architecture.log) нашёл существующий
  `Dialog.tsx` на 104 содержательных строки при лимите 100. Эти файлы не правились
  ради изолированного model commit.

Сохранены первоначальные сбои harness/проверок. Неудачный `fetchQuery` test
предполагал обязательный rejected Promise при revoke; Tanstack `cancel(revert)`
может вернуть прежние data. Итоговая проверка требует два реальных transport вызова,
удаление cache, смену epoch и запрет старого lease — контракт не ослаблен.

## Границы результата

Runtime подтверждает первый сценарий 100/101/102. Прочие границы проверены
QueryClient/transport tests, а не объявлены прошедшими browser E2E. Полный UI suite
на старом worktree не запускался. Вся фича, остальные платформы, sync journal,
realtime, durable outbox и независимая feature-test/ready остаются вне этого commit.
Checkbox задач и automation status каталога не менялись.

Raw network записывает только synthetic feed/message payloads и URL/query;
headers/cookies/CSRF/auth tokens исключены, проверка полей секретов пройдена.
Trace/HAR выключены. Отдельный API остановлен после прогона. Подробнее —
[summary.json](summary.json) и [manifest](evidence-manifest.json).
