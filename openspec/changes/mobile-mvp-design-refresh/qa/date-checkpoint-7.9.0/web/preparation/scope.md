# Подготовка короткого date checkpoint

Runtime/сборка не запускались. Драйвер требует явные `DATE_RUN_FROZEN_CHECKPOINT=1`, `DATE_CANDIDATE_FILE` и `DATE_BASE_URL`; до передачи frozen-кандидата не выполняется.

Основание: approved id `date` → `assets/navigation-r2/nav-date/frame.html`, SHA `d7cad22cc2b714c4c7b929544fbc64b61bbc31e238a2312bba1592a0c08487a2`; normalized `preparation/references/date/frame.html`. UX date-r1:2–20 вариантов, пять параметров, обязательные дата/время окончания/TZ, same-Dialog dirty/known/unknown, настоящая карточка. Тестовая основа: `TC-CHAT-DATE-FORM` в testing/cases/chat-composition.yaml и действующие date-poll правила docs/product/mvp-gathering.md.

Planned isolated setup: browser fixture Катя/Олег, API meeting/membership. Начальный день через7дней, второй через8; deadline через2дня19:30 Europe/Moscow. Это setup, не Create/OAuth/RSVP acceptance. Пять toggles проверяются по UI и переданным settings; anonymous/hidden не подменяются друг другом.

Короткие блоки:

1.390/320: actual/ref форма, footer/scroll, поля16, все5 переключателей; add/remove, duplicate на конкретном варианте, обязательность deadline date/time/TZ.
2. Dirty Escape/Back → Stay/Leave в одном Dialog, draft сохраняется/сбрасывается.
3. Known429 → штатный retry; реальный create201 + lost ACK → locked/blocked-close → retry с тем же body/key → ровно одна server card/poll.
4. По доступности fixture: actual card/vote и privacy API+DOM. Anonymous: counts видны, people отсутствуют; hidden: до завершения отсутствуют counts/people. Два разных privacy состояния можно seed через API в изолированных встречах, без повторения полной матрицы формы.

Границы: без full catalog/matrix/gates, VO, настоящего native IME, deadline worker/time-travel, всех majority/tie/organizer-resolution вариантов. Browser fixture содержит DatePollWorker, API create/vote доступны в memory; это прочитано в fixture-коде, ещё не подтверждено runtime. Недоступные ветви будут limit/blocked, не pass.

После frozen: сверить source/artifact до/после, получить actual сначала и передать реальные findings до короткого отчёта/binding. Prepared driver — tooling, не evidence/pass.
