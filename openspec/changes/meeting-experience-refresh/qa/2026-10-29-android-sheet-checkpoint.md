# Android: нижние панели и стабильность чата 4.0.0

Авторская реализация задачи 16.3 сохранена отдельным коммитом. Независимая
проверка начата; checkbox остаётся открытым, полного design/feature pass нет.

Исправлены общий ActionSheet без X, лишние запросы при закрытии черновиков,
двойной callback системного Back после dirty veto, высота списка прочитавших
и постоянный слот отложенного индикатора отправки. Первый local pending
сразу заменяет пустое приглашение, поэтому ACK не меняет геометрию ленты.
Удаление фото и закрытие fullscreen/popup сохраняют собственные кнопки.

Финальные авторские проверки: 7 целевых instrumentation-сценариев, 178 unit,
formatCheck, Debug/Release, lintDebug/lintRelease, Debug instrumentation — PASS.
Проверены loading/empty/error/short/long readers и пагинация; body swipe,
Back/backdrop/accessible dismiss, dirty/busy; отсутствие дополнительных
GET detail/feed/participants/sync; быстрый и медленный ACK с тем же UI key.
Реальные данные, production и обычное Android-приложение не использовались.

Источник: SHA256 `25a9126d617255a0188d72c5bade6b75bb2672d957b439367db35e1a6f8e3709`,
550 файлов; перед коммитом все файлы совпали с авторским inventory.
QA APK: `b2645c02f44a05132e481cd1b5a787184e91d6c02642c2d31b219b02e092d6e5`.
Полные артефакты/receipt/логи сохранены локально в
`/tmp/android-sheet4-20261028/final`; в Git включена только эта сводка.

Не проверены системные large text/reduced motion/landscape и полный live raw
проход; Mac заблокирован. Авторские screenshots и зелёные сборки не заменяют
независимую приёмку. На физический телефон эта версия не устанавливалась.

## Независимая проверка и исправление промежутков

Первый независимый проход нашёл сдвиг второй и третьей строк: ready-list
наследовал gap18 вместо опубликованного12. Сохранён
[исходный отчёт](2026-10-29-android-sheet-independent/report.md).
Исправлены только контейнер строк и проверка фактических промежутков в UI-тесте.
Повторная чистая сборка Debug/Release, оба Lint,178 unit, Debug/QA instrumentation
build прошли. Новый source550: `4a21b8c99e905e4640473a2f2d792da8af5da019d068e5ad7220f0b51e463865`;
QA APK: `a04f1bd6d2d85dfea839421df57d3ab7a5f4d2c3fa8cc80381959714b68cfc61`.

[Независимый повтор](2026-10-29-android-sheet-independent/followup-reader-spacing/report.md):
7 instrumentation PASS; отдельное измерение PNG подтвердило одинаковые центры
loading/ready, delta0/0/0px и gap12dp. Полная приёмка остаётся открытой:
live raw, полная матрица панелей, крупный текст/landscape и normal/reduced motion
не проверены. Подробные локальные artifacts/receipt находятся в
`/tmp/android-sheet4-reader-spacing-20261029/`; старый кандидат не перезаписан.
