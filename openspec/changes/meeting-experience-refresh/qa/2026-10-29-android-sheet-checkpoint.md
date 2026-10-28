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
