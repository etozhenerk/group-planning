# Независимая проверка web receive cursor — 27.10.2026

Проверяющий: `/root/cursor_integration_review`. Основной regression 100/101/102
прошёл в работающем Chromium и в QueryClient tests. В дополнительных проверках
модели найдены две ошибки на границах history/cache/session. Полного feature-pass,
`qa:ready`, закрытия task 4.1 или дизайн-приёмки этот отчёт не даёт.

## Проверенный кандидат и окружение

- Грязное интеграционное дерево `main`, HEAD `6e69ae85755e7e8c5bc51854befabd9f21c46504`.
  Точные SHA исходников: [source/source-files.json](source/source-files.json).
- Runtime: заранее собранный `.cache/qa/chat-correction-2.1.0/web-r9-demo`.
  SHA256 index.html `3293f370b21c16c4f414cb955708205216a31e63646e566584a8964401164a20`;
  все файлы зафиксированы в [runtime/build-files.json](runtime/build-files.json).
- Отдельный TLS memory fixture `https://127.0.0.1:8444`, бинарник
  `.cache/qa/2026-10-27-telegram-chat-1.4.1-r3/httpapi.test`, SHA256
  `07655833e97c7ef9fdc678605b5e9e1a22106202cd82a5827a1ee322570bd9b7`.
  Это прежний совместимый API, не runtime-приёмка нового bounded backend candidate.
- macOS 27.0.1, Node 22.22.3, Playwright 1.64.1, Chromium Desktop Chrome,
  ru-RU/Europe/Moscow, один worker, без retries/trace/HAR. Только профили fixture.
- Сервер 8444 завершён, listener отсутствует. Демо 8445, Android 52531,
  iOS 61441 и `.cache/web-demo` не менялись. Продукт, кейсы, tasks и manifest
  ревьюер не редактировал.

Подробности: [environment.json](environment.json). Сборка получена от основного
агента, её хеши проверены независимо; другая формула общего хеша сборки из брифа
не подменяет сохранённый per-file manifest.

## Фактические результаты

| Проверка | Результат | Доказательства |
| --- | --- | --- |
| Живой ACK102 до GET при receive100, чужое101, две GET-страницы | passed, запросы after100 → after101 → after102; 100/101/102 по одному элементу | [raw](runtime/playwright.json), [actual](runtime/actual.json), [interaction/network](runtime/network.jsonl), [UI](runtime/baseline-ui.png) |
| Штатные owner/access tests | 17/17 passed | [raw](source/existing-tests.json) |
| Дополнительный независимый model/QueryClient probe | 5/7 passed, 2 failed | [тесты](source/independent.test.ts), [raw](source/independent-tests.json) |

Живой путь: A вошёл через fixture-provider, создал M; B вошёл отдельно и ответил
«Приду». Тест подготовил серверный хвост100, открыл реальный экран A и остановил
browser clock. B записал101, A отправил102 из редактора через Enter. ACK102 был
отображён до первого incremental GET. Затем clock продолжил polling, а transport
только заменил `limit` у incremental GET на1: ответы и авторство остались реальным
Go API. Клиент получил101/102, следующий polling использовал after102. Проверены
server-authoritative GET after100 и ровно одна DOM-строка каждого сообщения.

Штатные тесты покрыли independent receiveCursor, ACK до/во время GET и между
loader return/cache commit, initial empty=0, initial has_more как историю,
повтор страницы, before, empty after, ошибку второй страницы/merge, uint64 до
18446744073709551615, nonadvancing has_more, late response/access revoke.
Дополнительные passing probes подтвердили cancel второй страницы с сохранением
ACK и прежнего cursor, retry от100, пустую has_more страницу без partial commit,
конкурентный history merge, поздний receive после resetSession при переходе A→X,
отзыв M без повреждения другой встречи N.

## F1 — потеря признака исчерпанной истории при cache commit (P3)

Доказано тестом `history exhaustion arriving between loader return and cache
commit stays exhausted` в [independent.test.ts](source/independent.test.ts).

1. В cache есть sequence100, receiveCursor100, hasOlder=true.
2. Incremental GET возвращает101. `loadConversation` уже построил результат
   с hasOlder=true, но QueryClient ещё не записал его.
3. На этой microtask-границе history cache update добавляет90 и hasOlder=false.
   Probe использует тот же вид `setQueryData` update, который выполняет
   `loadOlderConversation`, с управляемым положением microtask.
4. QueryClient commit вызывает `shareConversation`.

Ожидание: entries90/100/101, cursor101, hasOlder=false. Факт: entries и cursor
правильны, но hasOlder снова true. `shareConversation.ts:13` объединяет только
entries, остальные поля берёт из устаревшего incoming. `loadConversation.ts:54`
снимал hasOlder раньше этой записи. Следствие — лишняя повторная загрузка уже
исчерпанной истории; потеря сообщений или продвижение cursor не наблюдались.

Исправить reconciliation metadata истории на границе commit, сохранив свежий
результат before. Это детерминированное модельное воспроизведение; полный живой
UI-путь такой тесной microtask-гонки отдельно не воспроизводился.

## F2 — повторное использование epoch после resetSession (P2, lease boundary)

Доказано тестом `old history response is discarded if a new session for the same
user has already loaded M` в [independent.test.ts](source/independent.test.ts).

1. A/M/epoch0 содержит100. Запустить `loadOlderConversation` и удержать ответ
   before100 с90/99.
2. Выполнить реальные `resetSession(client)` и `resetAccess()`.
3. Имитировать загрузку новой сессии того же A: новая запись A/M/epoch0
   содержит200 и hasOlder=true.
4. Отпустить удержанный before старой сессии с hasMore=false.

Ожидание: новая запись остаётся [200], hasOlder=true. Факт: [90,99,200],
hasOlder=false; stale response успешно принят. `access.ts:115–116` очищает
состояния до исходного epoch0, старый guarded response снова проходит сравнение.
`loadOlderConversation.ts:72–83` не находится в отменяемом QueryClient fetch и
после guarded пишет в совпавший ключ новой сессии.

Нужна монотонная session/access generation или иной lease, который не совпадает
с предыдущим после reset; перед history commit следует проверять текущую generation.
Доказан риск владельца/cache при повторном использовании user/meeting/epoch в одном
JS runtime. Между A и X утечки не наблюдалось, обычный OAuth с полным navigation
не проверялся на эту гонку и может уничтожить старый runtime. Поэтому этот отчёт
не утверждает воспроизведённую межаккаунтную утечку или эксплуатацию через UI.

## Границы и воспроизводимость

- TC-CHAT-SYNC-2D68FE69: совместимый GET-feed cursor-срез подтверждён.
- TC-CHAT-SECURITY-92CE8303: только receive/history lease-поднабор; callbacks
  outbox/read/storage полного кейса не проверены. F2 остаётся открытым.
- TC-CHAT-SYNC-THROUGH и обновление старых карточек/projection versions не
  реализуются этим GET-feed патчем и не принимались. Fixed journal through,
  realtime, durable outbox, unread/read-state, SQL/cloud, iOS/Android, WebKit,
  физический Safari и design-review не проверялись.
- Независимый ранний source run01 сохранён. Три его дополнительных failures
  происходили из неверного ожидания harness: TanStack cancel для query с прежними
  данными может разрешить promise прежним значением. Проверки исправлены на
  состояние cache, исходники продукта не менялись. F2 остался failure, F1 добавлен
  в окончательный run. [Первый raw](source/independent-tests-run01.json),
  [исходный harness](source/independent-run01.test.ts.txt).
- Начальный запуск Playwright в sandbox не смог bind8444; после разрешённого
  выполнения вне sandbox прогон прошёл. Test fixture печатал TLS unknown-certificate
  при browser probes; реальные requests/assertions прошли с ignoreHTTPSErrors.

Команды из корня:

```sh
npm run test --workspace @somewhere/web -- src/entities/meeting/model/loadConversation.test.ts src/entities/meeting/model/conversationAccess.test.ts src/entities/meeting/model/access.test.ts --reporter=json --outputFile=/tmp/cursor-existing.json
npx --no-install vitest run --config openspec/changes/chat-reliability-and-sync/qa/2026-10-27-cursor-independent/source/vitest.config.ts --reporter=json --outputFile=/tmp/cursor-independent.json
npx --no-install playwright test --config openspec/changes/chat-reliability-and-sync/qa/2026-10-27-cursor-independent/runtime/harness/playwright.config.ts
```

Для нового runtime-прогона сначала изменить outputDir/evidence, чтобы не
перезаписать этот исторический результат. Оба дефекта переданы исполнителю,
исправления и новая независимая проверка должны иметь новый evidence-каталог.
