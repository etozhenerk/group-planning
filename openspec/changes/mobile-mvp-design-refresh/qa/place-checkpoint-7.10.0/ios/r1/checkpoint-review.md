# Предложение места iOS R1 — короткий checkpoint

Вердикт: **needs-fixes по повтору footer и типографике карточки**. Оба согласованных функциональных метода прошли; это не финальные gates.

[Точный binding](artifact-binding.json): artifact `94aecd3dc38f1a7e171130ab666e11328134c061b58e7cde0c483b4bb56cb0a8`, source `98c9ccd6f8fdf42da1c42d206a89c1e288cb0a8c5f79e6eb62ed1b2738c9285b`. Все 20 файлов frozen/copied host проверены по SHA. Authority: approved nav-place, normalized place (manual input, без карты), UX place-r4 с последним исключением карты. Локально отрендерены [форма](reference-form.png) и [карточка](reference-poll.png); часы прототипа уже после его deadline, поэтому закрытый footer reference не выдаётся за текущий open runtime.

## Batch findings

1. **Повтор статуса в open-card.** [Actual 320](actual/320-created-card.png) содержит «До 6 ноября, 23:24 · место пока прежнее», затем ещё «Место пока прежнее». `PlacePollCopy.status` сохраняет прежний suffix, а `PlacePollFooter.swift:13` добавляет отдельный текст. В approved footer пояснение о прежнем месте одно.
2. **Ballot: только типографика, не active-композиция.** Уточнение после фиксации raw clock `2026-11-05T10:00:00Z`: активный control — BUTTON, 14 px, `justify-content: space-between`, label и count раздельные. [Корректный active reference](reference-active-clock-correction.png), [metrics](reference-active-clock-correction.json). Разделение подписи и числа в native корректно; прежнее замечание к нему отозвано. Остаётся 13 pt в `PlacePollBallot.swift` против 14 px raw. Исходный [SPAN metrics](reference-ballot-metrics.json) и [первый reference](reference-poll.png) сохранены как снимки истёкшего readonly preview; их нельзя использовать как expected активного состояния. Native44pt target не классифицировался как дефект.
3. Небольшое отличие copy пустого поля: native «Введите новое место: от 1 до 500 символов» вместо raw «Укажите новое место». [Actual](actual/required-inline-focus.png), `PlacePollFormOwner.swift:28`. Inline placement и фокус работают.

## Фактический проход

- Normal 402: current-place comparison, обязательное новое место, пояснение, deadline+пояс/TZ+note; пустая отправка→inline/focus, прежнее место→inline, исправление убирает ошибку. Dirty swipe→подтверждение в той же панели→stay сохраняет ввод→leave возвращает в чат; [API не изменился](actual/dirty-leave-no-place-change.json). Метод A PASS **47.423 с**.
- 320: ручное новое место/пояснение; date/time читаемы, действие достижимо. [Deadline actual](actual/320-deadline-footer.png). Реальный POST committed в собственной memory fixture, gate `unavailable` заменил уже полученный HTTP ответ 503. [Unknown](actual/unknown-frozen.png) блокирует поле и сохраняет черновик. Повтор вернул тот же poll/revision/place/explanation/deadline; в feed ровно один `place_poll_created`. [Сравнение](actual/retry-comparison.json), [commit](actual/unknown-server-commit.json), [retry](actual/retry-same-poll-revision.json). Затем реальный «За» подтверждён [API](actual/confirmed-vote.json), а [meeting.place остался прежним](actual/no-early-place-change.json). Метод B PASS **32.451 с**. [Карточка после голоса](actual/320-confirmed-vote.png).

[Журнал](smoke-independent.log), [driver](driver-independent.swift). Real API/TLS и изолированные fixture-аккаунты; OAuth не проверялся. NativeWindow/context: 402×874 и реальный QA UIWindow320×568 на том же physical screen402×874, iOS 27.0, текст L. Закрытые result-state, Large Text и дополнительные матрицы не запускались; по ним новый pass не заявлен. VoiceOver/карты исключены.

Собственная fixture остановлена, runner завершил приложение и освободил lock; AutomaticMinimization восстановлен в 1 по trap output. Код/cases/manifests/tasks/Git не менялись. После batch новых runtime не запускалось.
