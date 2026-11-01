# Независимый web transport · исходный949d · 01.11.2026

**NEEDS FIXES для whole chat4.3:** подтверждён protocol mismatch fallback.
Проверяющий `/root/sdd_clients_audit`, исполнитель `/root`; source949d,
artifactc3d07e, catalog84856. [Source after](source-after-freeze-before-fallback-fix.json)
сохраняет1033 inputs без изменений. Продукт, кейсы, CI и облако ревьюер не менял.

## Подтверждённый дефект

`protocol.md:90–91` и TC-CHAT-SYNC-60FCAA1D требуют после10s устойчивого
отказа realtime при работающем HTTP расписание3→6→12→30s с jitter.
Production `createChatUpdates.ts` безусловно сбрасывает attempt после HTTP success;
формула exponential cap дополнительно вводит24s четвёртым шагом.

Независимый deterministic production-module контроль при random=0.5:

| Условие | Реальные интервалы после grace | Ожидание |
| --- | --- | --- |
| HTTP работает, realtime недоступен |3/3/3/3/3s |3/6/12/30s |
| HTTP тоже ошибается |3/6/12/24/30s |3/6/12/30s |

[Raw timer](timer.log): **2 FAIL/1 PASS**. Контроль healthy90s и burst20 hints
прошёл: один запрос в работе, актуальное20 применено, idle polling отсутствует.
Фактические времена и интервалы — в evidence/fallback-*.json. Exact test/config
сохранены в harness.zip. Ни контракт, ни таймаут/assertions не ослаблялись.

Минимальная рекомендация исполнителю: явные3/6/12/30, сброс attempt после
здоровой подписки; успешный legacy HTTP mode сохраняет прежний частый refresh.
После исправления нужны новые exact-source checks; данный FAIL остаётся историей.
Самостоятельного runtime patch ревьюер не делал.

## Новые прошедшие actual проверки

- [Recovery budget](recovery-budget.log),2/2: browser clock продвинут на5min
  offline,100 изменений сохранены настоящим API другого участника. На возврате
  HTTP roundtrip не меньше150ms, WebSocket по75ms на направление. Все100 изменений
  получены, последнее видно; elapsed797.069ms desktop и793.258ms mobile, ≤2s.
  Это controlled client time/RTT profile, не5min wall-time или физическая сеть;
  host/server clocks не менялись. Отдельный короткий разрыв того же SDK дал
  настоящий `recovered=true`; после него всё равно выполнен HTTP catch-up,
  canonical row одна. Протокольный ответ recovered не подменялся.
- [Background/expiry](background.log),4/4: test-context visibility hidden/visible,
 60s controlled hidden; owner sync/read/retry не выполняются. При разрешённом
  foreground видны auth200→sync200→тот же pending POST, новый draft сохранён.
  Отдельно одобренный identity-only clock control+7200s даёт настоящий401;
  после foreground private UI/IndexedDB очищены, поздние read/storage callbacks
  не восстанавливают данные, новых POST/SDK reconnect нет. Системное время и
  clock приложения не менялись; это не утверждение о native OS background.
- [Настоящий epoch reset с pending и viewport](../2026-11-01-web-epoch-independent/report.md):
 2/2 corrected PASS, поздний HISTORY реально доставлен послеB, окно не расширилось.
  Исходный ambiguous catch-control сохранён отдельно, не повышен до fence PASS.

Ширины1440/390, bundled Chromium156.0.8078.4 headless, ru-RU/Europe/Moscow;
тот же immutable253-file demo и собственный8537 memory fixture. Epoch/expiry
используют одобренный QA-only binarye91e5868; private control token в отчёт не входит.
Временные routes/contexts закрыты finally, fixture ещё нужен до согласованного cleanup.

Эти результаты дополняют current217/282+1skip/38/10/4 suites, выполненные после
всех32 исходных feature plans; повтор полного suite здесь не делался. Они не
закрывают ошибочный fallback case или всю4.3. Остальные raw criteria привязываются
к собственным evidence и не получают PASS автоматически от соседних проверок.
