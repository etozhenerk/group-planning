# Place web7.10 r1 — ручное место, короткий checkpoint

Два finding для одного пакета. Карты явно исключены; их отсутствие не является gap. Это checkpoint, не финальная приёмка/gate.

1. **P1-nav/P2 · Dirty browser Back→Leave пропускает исходный chat.** В независимом адресном наблюдении выход из формы возвращает `/meetings`, хотя форма открыта из конкретного chat. Proof: `leave-probe.json`, `leave-observed-actual.png`. Причина согласуется с double-pop: `useDraftExit.leave()` вызывает `discard()` → action.close/navigate(-1), затем `blocker.proceed()` продолжает исходный Back. Очистку draft и завершение уже ожидающей навигации следует разделить, не выполнять два возврата. Escape→Stay сохраняет оба текста/один Dialog. Первая общая попытка последующего goto остановилась на незавершённой навигации; это привело к отдельному наблюдению, а не объявлено самостоятельным багом.
2. **P2-vote/P2 · Vote buttons не соответствуют active raw.** Actual13px/line19.5,height44,radius10; approved active BUTTON14/21,height48,radius12. Label/count остаются отдельными частями строки. Proof: `card-comparison-active.json`, `card-reference-active.png`, `created-card-actual.png`. В active reference зафиксирован только `referencePage.clock=2026-11-05T10:00Z`; app/Go clock не менялись. Default raw уже истёк и показывает SPAN, поэтому исходный expired comparison сохранён отдельно и не использован как active button reference.

## Живой smoke

- Actual/ref390/320: текущая точка сравнения, обязательное manual TEXTAREA, optional explanation, deadline/TZ/note, без карты. Empty и same-place с внешними пробелами блокируются до POST (0), получают inline invalid/describedBy/focus. Correction принимает multiline place. Desktop1100 сохранён старым control/copy spot; это не полный historical diff.
- Dirty Stay сохраняет place и explanation в одном Dialog. Browser Back→Leave имеет описанный nav defect; последующее открытие в новом QA-контексте пустое, но это не доказательство корректного возврата в исходный chat.
- Known429 сохраняет введённое; штатный retry реально создаёт poll, после commit намеренно теряется ACK. Unknown блокирует поле/закрытие. Повтор использует тот же body/key; в feed ровно одна запись с poll id.
- Настоящая card содержит API author Катя, правильные proposed/previous place и explanation. Fixture avatar_url отсутствует: корректный silhouette, фото из макета не подставлялось. Один UI vote «За» подтверждён API:1/0, my_vote=for. GET meeting сразу после create и после vote сохраняет исходное «Кафе „Соседи“, Покровка,8»; ранней смены места нет. Moscow local07.11 19:30 сохранён как16:30Z.

Успешное продолжение: `checkpoint-probes-followup.json`,14наблюдений/errors=[]. Дополнительные адресные proof — leave/card comparison. Источник: approved idplace, `assets/navigation-r2/nav-place/frame.html`, SHA `b9519dde810993fa88c253bcbc6e7bdee1cd2e42c9d296364de79f60ffdcd757`; normalized manual reference `preparation/references/place/frame.html`.

Лимиты: нет карты/геолокации, окончания по часам/worker-race/ties, full catalog/matrix, native IME/VO/WebKit и финальных gates. Known/lostACK инъекции выполнены только вокруг настоящего local API commit. Непроверенные URL-photo/broken-avatar не приняты.

Frozen source `9375c74b86d27e43271f2dcae3e341aa4ce5c39b8f6e572f09d52975b3b4ebed`, artifact `b74eb8820855ea1f3310e14ebcd75947b5c5987cfc2352c17f69a42c27e4f500`,8908. Source before/after=candidate;261 disk/38 live assets совпали (`artifact-binding.json`). SHA — `evidence-sha256.json`. App/manifests/tasks/Git не менялись, архивов нет. Source освобождён, runtime завершён.
