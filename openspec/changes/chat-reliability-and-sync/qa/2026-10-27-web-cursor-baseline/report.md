# Web receive-cursor: красный runtime baseline

27.10.2026 воспроизведена гонка `100 / 101 / 102` из задачи 1.1 и первого
шага `TC-CHAT-SYNC-2D68FE69`. Это автотест работающего продукта на frozen r8,
а не независимая UI-приёмка и не pass всего кейса или изменения.

## Окружение

- Frozen web r8, DS 2.1.0, SHA256
  `afc51d4c8af20352216d826fe7383b333149670c0cac7bce47ee0502a9f942f6`.
- Существующий snapshot `.cache/qa/chat-correction-2.1.0/web-r8-demo`;
  сборка и продуктовые исходники не менялись.
- Отдельный `TestBrowserFixture` из существующего бинарника, memory.Store,
  `https://127.0.0.1:8444`, новые тестовые аккаунты Саша/Лена и встреча.
  Пользовательский сервер 8445 и его dataset не затрагивались.
- Playwright Chromium, headless, один worker. Точные версии ОС, дистрибутива
  браузера, fixture hash и настройки — в [environment.json](run02/environment.json).
- Управляемые браузерные таймеры останавливают polling после начального рендера.
  После ACK выпускаются два интервала. Серверные часы не меняются.
  GET/POST выполняются реально; route только пишет журнал и передаёт исходный ответ.

## Наблюдаемый порядок

| Порядок в raw log | Действие | Факт |
| --- | --- | --- |
| 2–4 | Initial GET и применение | Сервер вернул 51…100, строка 100 появилась в DOM |
| 5 | Лена отправила сообщение через API | Commit sequence=101, HTTP 201 |
| 6–8 | Саша отправил через composer | ACK sequence=102, HTTP 201; 102 в DOM; incremental GET ещё не было |
| 9–10 | Первый catch-up | `after_sequence=102`, HTTP 200, `entries=[]` |
| 11–12 | Второй catch-up | Снова `after_sequence=102`, HTTP 200, `entries=[]` |
| 13 | Контрольный запрос к тому же серверу | `after_sequence=100` вернул 101 и 102 с разными авторами |

Итоговый DOM: 100 — один экземпляр, 101 — **ноль**, 102 — один.
Правильные assertions ожидают следующий cursor `100` и присутствие 101;
оба упали. Playwright завершился `1 failed`, exit code 1. Ошибку не помечали
ожидаемым `test.fail` и не ослабляли проверку до текущего поведения.

Сетевая последовательность согласуется с текущей причиной в модели:
`useConversation` вычисляет `after` из последней display entry, а `useSendMessage`
добавляет ACK в тот же cache. ACK 102 тем самым пропускает ещё не полученную 101.

## Доказательства

- [Raw network JSONL](run02/network.jsonl): реальные URL/query, HTTP status и feed/message
  response bodies; без headers, cookies, CSRF и auth токенов. Поля секретов проверены.
- [Actual](run02/actual.json): запросы курсора и число строк в DOM.
- [Raw failing assertions](run02/playwright.log).
- [UI в момент ошибки](run02/baseline-ui.png): вспомогательный кадр, не visual pass.
- [Сохранённый временный regression](run02/harness/cursor-race.spec.ts),
  [fixture helper](run02/harness/fixture.ts), [config](run02/harness/playwright.config.ts).
- [Hash manifest](evidence-manifest.json).

`run01` сохранён отдельно: часы остановили до загрузки initial query, поэтому
упало предусловие harness до продуктового сценария. Это не доказательство cursor
race. Исправление только порядка остановки таймеров дало наблюдаемый `run02`.
В журнале fixture есть TLS handshake warnings от локального self-signed TLS;
все участвующие API-запросы завершились ожидаемыми HTTP 200/201.

## Воспроизведение

Из корня проекта, со свободным loopback port и новым output directory:

```sh
CURSOR_BASELINE_PORT=8444 \
CURSOR_BASELINE_OUTPUT="$PWD/openspec/changes/chat-reliability-and-sync/qa/2026-10-27-web-cursor-baseline/replay-new" \
npx --no-install playwright test \
  --config openspec/changes/chat-reliability-and-sync/qa/2026-10-27-web-cursor-baseline/run02/harness/playwright.config.ts
```

Config запускает только существующий fixture binary с frozen snapshot и завершает
его после прогона. Если 8444 занят, передать другой свободный loopback port;
origin для API/CSRF и browser baseURL выводится из него. 8445 не использовать.
Trace/HAR отключены, чтобы не сохранять auth headers.

## Границы

Проверен первый порядок 100/101/102. Multipage, empty initial, `before`, uint64
выше 2^53, ошибка применения и stale access lease этим прогоном не проверены.
Исправление cursor, полный engineering suite и независимая приёмка впереди.
Checkbox 1.1/4.1 не изменялся. Temporary harness прошёл строгий TypeScript-check;
продуктовые suites и сборки повторно не запускались.
