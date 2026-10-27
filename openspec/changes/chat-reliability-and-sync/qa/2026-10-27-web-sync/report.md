# Web chat: изолированный кандидат, 27.10.2026

Статус: реализация и автоматические проверки среза 4.2–4.3, с основами 4.1/4.4.
Это не feature/design/release acceptance. Checkbox не закрыты; независимый
reviewer ещё не запускался. Main, пользовательские стенды и production не менялись.

## Кандидат

- Worktree `chat-web-sync`, ветка `codex/chat-web-sync`; backend checkout base6aac61e.
- Baseline commits `8a70cbd`, `079f541`, `ad7597e` фиксируют main web/DS/raw и
  native generated2.3.0. Переносить только итоговый implementation commit поверх
  последнего baseline `ad7597e`, без baseline commits.
- [candidate.json](candidate.json) содержит все source/demo/production hashes.
  Web source aggregate `51a0170e38421cbd15824f06a126a86ddb7624fa60e551c6a521e866181331d7`.
  Demo aggregate `75ee972081cde3a8d2aad29eb1d4c16df76ada48861ae03d57f9add603a749f8`.
- Реальный API — отдельный memory fixture из backend commit
  `d32deaa07093e50c138089f77f989e7cacc8e43a`, binary sha256
  `723913f7047f26ffcb549cfdd628d30f68949153f7405a0b0049607c12a6d6cf`.
  API исходники этой worktree не были подменены. Порт тестов8458; TLS/fake OAuth.
- JS SDK закреплён `centrifuge@5.8.0`; зависимости установлены в отдельной копии,
  без writable symlink на main node_modules.

## Поведение

IndexedDB сохраняет draft/selection и несколько intents до очистки поля/POST.
Стабильный client_request_id используется при retry; ACK сверяет meeting/actor/
body/id. Транзакционная lease сериализует отправку между вкладками. BroadcastChannel,
access generation и persisted epochs останавливают старую работу; logout очищает
очередь и закрывает composer второй вкладки. Ошибка storage сохраняет поле.
Pending/accepted остаются в одной строке timeline с actor/client_request_id key.
Restore запрещён при непустом новом draft и дополнительно проверяет это в transaction.

Sync state содержит отдельные opaque change cursor, decimal resource versions,
receive cursor и window identity. Snapshot → subscribe ACK → HTTP catch-up выполняется
настоящим SDK; SDK offset не становится HTTP cursor. Страницы применяются до
фиксированного through; cursor сохраняется после projections. 410/epoch/invalidation
перечитывают snapshot. Актуальные карточки отменяют старый HTTP; stale revisions
не затирают новые. Reactions применяются из current projection без отдельного polling.

Adapter использует cookie/exact Origin без query/auth payload. Каждый SDK connect
имеет authoritative /me preflight и account/access check; terminal401 останавливает
retry. Healthy WS не вызывает idle GET. Устойчивый отказ после10с включает один
fallback3/6/12/30с с jitter; subscribe+catch-up отключают его. Background/offline
останавливают owner/outbox, foreground сначала сверяет HTTP. Capabilities404/false
сохраняют legacy path. Read_state остаётся false, read/receipt UI не добавлялся.

## Выполненные проверки

- Full `npm run web:check`: typecheck, eslint, styles, FSD, format, 36 файлов/143 теста PASS.
- Полный Vitest JSON повторён на frozen sources:143/143 PASS.
- `build:demo` и production `web:build`: PASS; прежнее предупреждение о крупном chunk.
- Chromium + mobile WebKit402×874, workers1:22/22 PASS, 0skipped/0flaky, без retries.
  Проверены actual IndexedDB reload/несколько offline intents/lost ACK/quota,
  logout второй вкладки/один POST owner/retry same key/restore нового draft;
  mounted row не заменяется на ACK. Реальные SDK cookie connects с undefined/{}
  проходят, snapshot gap закрывается, idle13.5с без GET, reconnect HTTP catch-up,
  terminal auth без нового WS, sustained failure получает сообщение через fallback.
- `agent:check` PASS; `qa:test`12/12 PASS; `design:test`30/30 PASS ранее в этой ветке.
- `git diff --check` PASS перед commit.

[raw](raw/) и [evidence.json](evidence.json) сохраняют результаты и SHA.
Предыдущий live run20/22 сохранён: он выявил race, когда callback IndexedDB возвращал
очищенный новый draft. Исправление ждёт завершения собственных writes и сверяет
revision; повтор22/22 на обоих browsers подтвердил исправление. Failed traces лежат
в `/tmp/web-sync-e2e-run3-results`, не добавлены в Git: network trace может содержать
временные fixture credentials. Финальный JSON и screenshots их не содержат.

## Открытые границы и gates

- Независимые feature-test/design-review и qa:ready не выполнены. Существующие cases
  получили только partial web refs; полный case не объявляется automated.
- `qa:check` этой baseline worktree: отсутствует старший meeting-experience-refresh
  testing-manifest; `qa:plan` блокируют прежние source hashes TC-FEED-1BFACA40 и
  TC-LIST-74A5E939. Root подтвердил исправленный main каталог373/gaps[], интеграция
  и повтор gates остаются у root; baseline ради зелёного gate не изменялся.
- `design:check` блокируют старые native implementations base6aac против актуальной
  DS2.3. Web literals не добавлены, inventory не расширялся. `design:ready` не даёт pass
  без независимого отчёта. Context hash сохранён в raw/design-context.log.
- DS2.4 публикация локальная, без новых токенов. Raw outbox имеет только source
  preflight. Не выполнялся обход запрещённого file:// просмотра; visual acceptance
  не заявляется. Main уточнение iOS keyboard/Escape нужно сохранить при интеграции
  authority/UX hashes, как согласовано с root.
- Полное bounded/virtualized window, around/anchor preservation на reset, long-history
  profiling и read-state/readers UI не завершены (4.4–4.5). Текущий reset берёт новый хвост.
- Текущий snapshot DTO допускает null read state/first_unread при выключенном flag.
  Будущий additive DTO согласован с backend агентом; read_state=true нельзя включать
  до отдельного client patch и его проверки.
- Весь legacy web E2E набор не запускался; физический Safari не проверялся.
  Crash во время lease и отказ удаления IndexedDB при logout требуют отдельного
  fault прохода. Проверенные normal logout и two-tab результаты их не заменяют.
