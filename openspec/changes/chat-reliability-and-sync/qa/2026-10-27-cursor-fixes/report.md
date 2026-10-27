# Исправления границ history/cache/session в web · 27.10.2026

Исполнитель: `/root/web_cursor_motion`. Исправлены F1/F2 из независимого
[отчёта](../2026-10-27-cursor-independent/report.md). Это отчёт реализации;
независимый feature-test, полный security-кейс и закрытие 4.1 не заявляются.

## Изменения

- При финальном QueryClient commit `shareConversation` объединяет записи и
  сохраняет исчерпание истории: `hasOlder=false` не возвращается в `true`
  из запоздалого GET в той же lease.
- `access` выделяет монотонные поколения для RSVP, deny и reset. Новая сессия
  того же пользователя не повторяет прежний приватный query key/lease.
- `loadOlderConversation` повторно проверяет lease после `guarded`, перед cache
  commit. Это также закрывает microtask-границу между guarded return и записью.
- Прежние тесты получают текущую lease вместо предположения `epoch=0`.
  Добавлены постоянные integration regressions в
  [conversation-races.test.ts](../../../../../frontend/web/scripts/conversation-races.test.ts).
  Файл находится вне product FSD layers: он связывает реальные session/meeting
  модули без добавления cross-slice зависимости в приложение.

## Проверки

| Прогон | Результат | Raw |
| --- | --- | --- |
| Новые regressions до исправления | 5 failed: exhaustion, same/other user late before, return/commit gap, reuse after RSVP/reset | [JSON](regressions-before.json), [log](regressions-before.log) |
| Новые + прежние owner/access после исправления | 22/22 passed | [JSON](regressions-after.json), [log](regressions-after.log) |
| Полный web:check после model + emoji motion 2.2 | 119/119 passed; TypeScript, ESLint, CSS, FSD, Prettier passed | [log](web-check-run02.log) |

Первый web:check упёрся в sandbox EPERM на tsx IPC; исходный
[log](web-check-run01.log) сохранён. Повтор вне sandbox с
`VITEST_MAX_WORKERS=1` прошёл. Синтетические transport fixtures не затрагивают
API 8445 или настоящие данные. Первая версия нового теста до перемещения в
`scripts/` отражена историческим путём в before JSON; assertions сохранены.
Точные hashes изменённых исходников: [source-files.json](source-files.json).

## Границы

TC-CHAT-SYNC-2D68FE69 и TC-CHAT-SECURITY-92CE8303 покрыты только совместимым
receive/history lease-поднабором. Новый journal/through, SDK/realtime, read state,
durable outbox, все callbacks storage/read, native и физические устройства этим
срезом не проверены. Автор не выдаёт собственную проверку за независимую приёмку.
Immutable r9 и пользовательский memory API сохранены. Ни commit, ни push не выполнялись.
