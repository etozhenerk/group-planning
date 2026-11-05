Android «Мои встречи»7.5 — **needs-fixes, superseded checkpoint**. Frozen APK `1c829f08…`, source `f3546552…`;720×1600px/360×800dp, emulator-5554. Это короткий smoke, не финальная приёмка; gates не запускались.

Два собственных visual findings:

1. Календарь получил внешнюю скруглённую surface с border. Утверждённый calendar-r7 плоский: [actual](actual/failure-live.png), [raw reference](reference/calendar-ready.png).
2. Period/list-calendar controls находятся внутри scroll и после возврата из встречи уходят за фиксированную шапку. В raw toolbar находится вне scroll и остаётся доступным. [Actual с выбранным днём после Back](actual/failure-live.png), [действия](actual/failure-live.actions.json).

Фактически пройдены ready list, единственный toggle в исходном состоянии, реальное входящее сообщение→unread footer и selected day→встреча→system Back с сохранением дня. Первый timeout вызван QA locator: реальный API unread_count=1 и видимый footer подтверждены [API](api-unread.json)/[snapshot](selector-ready.png); исправлен только selector. Один targeted rerun остановился на отсутствующем в текущем viewport toggle — это связано со вторым finding.

После сообщения родителя о новой source-ревизии текущая R1-приёмка прекращена. Уже полученный tail лежит в `tail-historical/` и не подтверждает новую ревизию. Остальное не объявляется пройденным: полный list-calendar cycle, long/empty/past-empty и initial/refresh failure требуют учёта фактического tail или дальнейшей проверки. Новых R1 прогонов не запускал.

Устройство освобождено; настройки совпали с исходными, свои fixture/reverse/config очищены. Код/Git/manifests/tasks не менялись. Следующий проход — только изменённые controls/calendar на новом frozen APK.

Исторический tail до прекращения: `{"status": "failed", "error": "androidx.compose.ui.test.ComposeTimeoutException: Condition still not satisfied after 15000 ms"}`. Это запись старого артефакта, не current pass.
