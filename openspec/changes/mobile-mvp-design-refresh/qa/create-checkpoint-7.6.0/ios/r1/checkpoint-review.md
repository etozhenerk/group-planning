# iOS Create7.6r1 — короткий независимый checkpoint

**Verdict: needs-fixes по дизайну; проверенные основные действия работают. Это не финальная приёмка/gate.**

Frozen source `eb570f3a3b2d17c44e2b982d9334e7a6de524110419b29dadb785a9bbfc42b1d`, bundle `158c3fa2630eb1d59ee11b9733fcf3d05a6bc69ed401073ab57af25064f98f4d`. Все файлы проверены до установки и после каждой подстановки frozen host; [binding](artifact-binding.json), [targeted binding](targeted-artifact-binding.json). Независимый reviewer: `/root/rsvp_web_feature_r2`; 05.11.2026, iOS27.0, simulator31262733-50DC-46A5-938E-4C462D70F109.

Проверено относительно approved-designs/create normalized + ux.md/global corrections: [reference](reference-normal.png). Форма402×874, короткое реальное QA UIWindow320×568 на том же физическом402×874; [метрики](viewport-metrics.json). Это не физический320device. VoiceOver не читался/не включался.

- PASS29.104s: пустая отправка → inline title/date hints и клавиатурный фокус; исправление названия убирает hint; повтор без даты показывает date hint; dirty Back → «Продолжить редактирование» сохраняет текст; дата без времени → чат. [focused](actual/normal-required-focused.png), [dirty](actual/dirty-return-dialog.png), [ready](actual/normal-date-only-ready.png), [chat](actual/normal-created-chat.png). Реальный GET подтверждает ровно1встречу, `starts_on=2026-11-05`, `starts_at=null`: [API](date-only-api-proof.json).
- PASS21.018s: fixture lost-create сначала реально создаёт встречу, затем теряет подтверждение. Данные disabled, «Не удалось подтвердить создание»/«Повторить отправку», повтор → чат, ровно1карточка/1APImeeting. [unknown](actual/unknown-response-retry.png), [chat](actual/unknown-recovered-chat.png), [single](actual/unknown-single-created-card.png), [API](lost-ack-api-proof.json).
- PASS limited spot320normal: верх/низ формы, кнопка≥48pt доступна, validation/keyboard и исправление текста. [top](actual/short-normal-top.png), [bottom](actual/short-normal-bottom.png), [keyboard](actual/short-normal-required-keyboard.png).

Замечания одним пакетом:

1. **Обложка:** используется плоский общий compact-row, вместо принятой карточки с padding14/preview86. [actual402](actual/normal-empty.png) / [reference](reference-normal.png). Автор уже сообщил, что исправляет это общим create-specific вариантом.
2. **Дата/время320normal:** невыбранные значения обрезаются «Выбрать д…»/«Указать в…», хотя у эталона помещаются читаемые значения. [actual](actual/short-normal-required-keyboard.png); AX сохраняет полные labels, но это не устраняет визуальное усечение.
3. **Пояснение времени:** под датой/временем отсутствует принятая строка «Время можно уточнить позже · Москва». [actual402](actual/normal-empty.png) / [reference](reference-normal.png). Само создание без времени подтвержденоAPI, замечание про пояснение/часовой пояс.
4. **Вход при320×568+accessibility5:** Create spot blocked ещё на пустом списке. После6swipeUp кнопка «Создать встречу» остаётся y499.3…587, нижняя навигация начинаетсяy508.7; tap не открывает форму. [actual entry](actual/short-accessibility5-entry.png), [AX](actual/short-accessibility5-entry.ax.txt). Один targeted повтор с reveal и any-element ожиданием подтвердил тот же entry. Это finding списка/входа, не доказанный дефект самой Create формы наAX5. Комбинацию не объявляем прошедшей.

[Первый action log](smoke-independent.log):2methods passed, C остановился наAX5 entry после успешно пройденной320normal части. [Единственный targeted log](smoke-independent-targeted.log) сохраняет повтор entry; исходный failure не скрыт. [QA driver](CreateCheckpoint76Tests.swift) — версия targeted; [build logs](build-independent-final.log).

Known precommit server rejection/retry не выполнен: доступная fixture имеет lost-create after-commit, gate умеет offline/503 after-response, что нельзя выдавать за известный отказ до записи. Full suites/gates, карты, OAuth, RSVP и другие экраны не запускались. Исходники/tasks/manifests/Git не менялись. Только собственные memory-данные; собственная fixture остановлена, QA app завершено, launch-only text size/QA viewport не меняли настройки устройства, lock освобождён, simulator доступен.
