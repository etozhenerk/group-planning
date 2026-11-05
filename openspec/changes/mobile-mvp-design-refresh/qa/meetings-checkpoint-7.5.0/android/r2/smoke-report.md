Android «Мои встречи» R2 — **targeted checkpoint пройден**, не финальная приёмка.

Frozen APK `a4e51166…`, source `744ae954…`; установленный APK повторно совпал по SHA. Только собственный memory fixture и emulator-5554,360×800dp + короткая проверка320×640dp.

- Controls/list-calendar toggle остаются на месте после реальной прокрутки и meeting→system Back. Единственный toggle: bounds `[584,388,680,484]px` до/после; выбранный день сохранён. [Действия](actual/result.json), [после Back](actual/controls-after-back.png).
- Календарь плоский, внешние rounded surface/border отсутствуют. [Actual360](actual/calendar-flat-360.png), [fresh raw360](reference/calendar-360.png).
- Выделение36×36dp на обеих ширинах; смещение центра0.5px/0px, точка8×8px=4dp. [Измерение actual](geometry-proof.json), [actual320](actual/calendar-flat-320.png), [fresh raw320](reference/calendar-320.png).

Старые proofs не переносились. Raw использует7ноября, API fixture14ноября: в обоих случаях суббота с одной встречей, роль/геометрия сравнимы. R1 tail, unread/ошибки/empty/long, полная матрица и gates в этом проходе не повторялись. Других изменённых мест не принимал.

Устройство восстановлено, свои fixture/reverse/config очищены; код/Git/manifests/tasks не менялись. Можно переходить к следующему экрану в режиме checkpoint; финальная приёмка остаётся позже.
